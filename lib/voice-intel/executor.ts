// Voice Intelligence - Action Executor
// Routes approved actions to the appropriate delivery handler (email, etc.)

import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/index";
import {
  buildProphecyDeliveryEmail,
  buildMeetingFollowUpEmail,
  buildDelegationEmail,
} from "@/lib/voice-intel/email-templates";
import type {
  VoiceIntelAction,
  VoiceIntelClassification,
  PropheticWord,
} from "@/lib/voice-intel/types";

// ============================================================
// Types
// ============================================================

export interface ExecutionResult {
  success: boolean;
  handler: string;
  details?: Record<string, unknown>;
  error?: string;
}

interface VoiceMemoRow {
  id: string;
  title: string | null;
  transcript_text: string | null;
  source: string;
  created_at: string;
}

// ============================================================
// Main Executor
// ============================================================

export async function executeAction(
  actionId: string,
  userId: string
): Promise<ExecutionResult> {
  const supabase = createAdminClient();

  // 1. Fetch the action
  const { data: action, error: actionErr } = await supabase
    .from("voice_intel_actions")
    .select("*")
    .eq("id", actionId)
    .eq("user_id", userId)
    .single();

  if (actionErr || !action) {
    return { success: false, handler: "none", error: "Action not found" };
  }

  // 2. Fetch linked classification (if exists)
  let classification: VoiceIntelClassification | null = null;
  if (action.classification_id) {
    const { data } = await supabase
      .from("voice_intel_classifications")
      .select("*")
      .eq("id", action.classification_id)
      .single();
    classification = data as VoiceIntelClassification | null;
  }

  // 3. Fetch source voice memo (if exists)
  let memo: VoiceMemoRow | null = null;
  if (action.voice_memo_id) {
    const { data } = await supabase
      .from("voice_memos")
      .select("id, title, transcript_text, source, created_at")
      .eq("id", action.voice_memo_id)
      .single();
    memo = data as VoiceMemoRow | null;
  }

  // 4. Route to handler
  let result: ExecutionResult;

  const isProphetic =
    classification?.has_prophetic_content ||
    (action.description && /prophec|prophetic/i.test(action.description));

  if (isProphetic) {
    result = await handleProphecyDelivery(action, classification, memo, userId);
  } else if (action.action_type === "Delegate") {
    result = await handleDelegation(action, classification, memo);
  } else if (action.action_type === "Deliver") {
    result = await handleMeetingFollowUp(action, classification, memo);
  } else {
    result = handleGenericDelivery(action);
  }

  // 5. Update action status
  const now = new Date().toISOString();
  await supabase
    .from("voice_intel_actions")
    .update({
      status: "completed",
      completed_at: now,
      delivery_payload: {
        ...(action.delivery_payload || {}),
        execution_result: result,
        executed_at: now,
      },
      updated_at: now,
    })
    .eq("id", actionId);

  return result;
}

// ============================================================
// Handlers
// ============================================================

async function handleProphecyDelivery(
  action: VoiceIntelAction,
  classification: VoiceIntelClassification | null,
  memo: VoiceMemoRow | null,
  userId: string
): Promise<ExecutionResult> {
  const supabase = createAdminClient();
  const propheticWords: PropheticWord[] = classification?.prophetic_words || [];

  if (propheticWords.length === 0) {
    return {
      success: true,
      handler: "prophecy_delivery",
      details: { emailsSent: 0, note: "No prophetic words found in classification" },
    };
  }

  let emailsSent = 0;
  const errors: string[] = [];

  for (const word of propheticWords) {
    if (!word.recipient) continue;

    // Look up recipient in voice_intel_context to find email
    const { data: contexts } = await supabase
      .from("voice_intel_context")
      .select("name, metadata")
      .eq("user_id", userId)
      .eq("context_type", "person")
      .or(`name.ilike.%${word.recipient}%`)
      .limit(1);

    const recipientCtx = contexts?.[0];
    const recipientEmail =
      (recipientCtx?.metadata as Record<string, unknown>)?.email as string | undefined;

    if (!recipientEmail) {
      errors.push(`No email found for recipient: ${word.recipient}`);
      continue;
    }

    const spokenDate = memo?.created_at
      ? new Date(memo.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

    const emailData = buildProphecyDeliveryEmail({
      recipientName: recipientCtx?.name || word.recipient,
      recipientEmail,
      propheticWord: word.content,
      spokenBy: "Lorenzo Daughtry-Chambers",
      spokenDate,
      audioClipUrl: (action.delivery_payload?.audio_clip_url as string) || undefined,
      memoTitle: memo?.title || undefined,
    });

    const result = await sendEmail(emailData.to, emailData.subject, emailData.html);
    if (result.success) {
      emailsSent++;
    } else {
      errors.push(`Failed to send to ${word.recipient}: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    handler: "prophecy_delivery",
    details: {
      emailsSent,
      totalWords: propheticWords.length,
      ...(errors.length > 0 ? { errors } : {}),
    },
  };
}

async function handleDelegation(
  action: VoiceIntelAction,
  classification: VoiceIntelClassification | null,
  memo: VoiceMemoRow | null
): Promise<ExecutionResult> {
  const supabase = createAdminClient();
  const relatedPeople = action.related_people || [];

  if (relatedPeople.length === 0) {
    return {
      success: true,
      handler: "delegation",
      details: { emailsSent: 0, note: "No related people to delegate to" },
    };
  }

  let emailsSent = 0;
  const errors: string[] = [];

  for (const personName of relatedPeople) {
    // Look up person in voice_intel_context
    const { data: contexts } = await supabase
      .from("voice_intel_context")
      .select("name, metadata")
      .eq("context_type", "person")
      .or(`name.ilike.%${personName}%`)
      .limit(1);

    const personCtx = contexts?.[0];
    const email =
      (personCtx?.metadata as Record<string, unknown>)?.email as string | undefined;

    if (!email) {
      errors.push(`No email found for: ${personName}`);
      continue;
    }

    const emailData = buildDelegationEmail({
      recipientName: personCtx?.name || personName,
      recipientEmail: email,
      taskTitle: action.title,
      taskDescription: action.description || "",
      delegatedBy: "Lorenzo Daughtry-Chambers",
      dueDate: (action.delivery_payload?.due_date as string) || undefined,
      context: classification?.brain_summary || undefined,
      relatedEntity: action.related_entity || undefined,
    });

    const result = await sendEmail(emailData.to, emailData.subject, emailData.html);
    if (result.success) {
      emailsSent++;
    } else {
      errors.push(`Failed to send to ${personName}: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    handler: "delegation",
    details: {
      emailsSent,
      totalPeople: relatedPeople.length,
      ...(errors.length > 0 ? { errors } : {}),
    },
  };
}

async function handleMeetingFollowUp(
  action: VoiceIntelAction,
  classification: VoiceIntelClassification | null,
  memo: VoiceMemoRow | null
): Promise<ExecutionResult> {
  const supabase = createAdminClient();
  const relatedPeople = action.related_people || [];

  if (relatedPeople.length === 0) {
    return {
      success: true,
      handler: "meeting_follow_up",
      details: { emailsSent: 0, note: "No related people for follow-up" },
    };
  }

  // Build action items from classification
  const actionItems: { title: string; assignee?: string }[] =
    classification?.action_items?.map((ai) => ({
      title: ai.title,
      assignee: ai.related_people?.[0],
    })) || [];

  const meetingDate = memo?.created_at
    ? new Date(memo.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  let emailsSent = 0;
  const errors: string[] = [];

  for (const personName of relatedPeople) {
    const { data: contexts } = await supabase
      .from("voice_intel_context")
      .select("name, metadata")
      .eq("context_type", "person")
      .or(`name.ilike.%${personName}%`)
      .limit(1);

    const personCtx = contexts?.[0];
    const email =
      (personCtx?.metadata as Record<string, unknown>)?.email as string | undefined;

    if (!email) {
      errors.push(`No email found for: ${personName}`);
      continue;
    }

    const emailData = buildMeetingFollowUpEmail({
      recipientName: personCtx?.name || personName,
      recipientEmail: email,
      meetingSummary: classification?.brain_summary || action.description || "",
      actionItems,
      attendees: relatedPeople,
      meetingDate,
      memoTitle: memo?.title || undefined,
    });

    const result = await sendEmail(emailData.to, emailData.subject, emailData.html);
    if (result.success) {
      emailsSent++;
    } else {
      errors.push(`Failed to send to ${personName}: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    handler: "meeting_follow_up",
    details: {
      emailsSent,
      totalPeople: relatedPeople.length,
      ...(errors.length > 0 ? { errors } : {}),
    },
  };
}

function handleGenericDelivery(action: VoiceIntelAction): ExecutionResult {
  console.log(
    `[voice-intel] Generic delivery for action ${action.id}: ${action.title}`
  );
  return {
    success: true,
    handler: "generic",
    details: {
      note: "Informational action — no external delivery required",
      actionType: action.action_type,
    },
  };
}
