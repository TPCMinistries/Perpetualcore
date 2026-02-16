/**
 * Agent Inbox Processor
 *
 * Main processing engine for the agent inbox system. Queries pending items,
 * routes them to the appropriate handler based on payload type, and manages
 * retries and status updates.
 *
 * All operations use createAdminClient() since this runs in cron/background context.
 */

import { createAdminClient } from "@/lib/supabase/server";
import {
  AgentInboxItem,
  InboxProcessResult,
  InboxSource,
  QueueItemOptions,
} from "./types";

/** Maximum items to process per invocation to stay within serverless limits */
const MAX_BATCH_SIZE = 20;

/** Retry delay multiplier (exponential backoff): retryCount * BASE_RETRY_DELAY_MINUTES */
const BASE_RETRY_DELAY_MINUTES = 5;

/**
 * Process pending inbox items for all users (or a specific user).
 *
 * Queries the `agent_inbox` table for items that are:
 * - status = 'pending'
 * - scheduled_for <= NOW()
 *
 * Processes them in priority order (urgent > high > normal > low), then by scheduled_for ASC.
 *
 * @param userId - Optional: only process items for this specific user
 * @returns Array of processing results
 */
export async function processInbox(
  userId?: string
): Promise<InboxProcessResult[]> {
  const supabase = createAdminClient();
  const results: InboxProcessResult[] = [];

  // Build query for pending items that are due
  let query = supabase
    .from("agent_inbox")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("priority", { ascending: false }) // urgent (4) first
    .order("scheduled_for", { ascending: true })
    .limit(MAX_BATCH_SIZE);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data: items, error } = await query;

  if (error) {
    console.error("[InboxProcessor] Error fetching inbox items:", error);
    return results;
  }

  if (!items || items.length === 0) {
    return results;
  }

  console.log(
    `[InboxProcessor] Processing ${items.length} pending inbox items`
  );

  // Process each item sequentially to avoid overwhelming downstream services
  for (const item of items as AgentInboxItem[]) {
    try {
      // Mark as processing
      await supabase
        .from("agent_inbox")
        .update({ status: "processing" })
        .eq("id", item.id);

      // Process the item
      const result = await processItem(item);
      results.push(result);

      if (result.success) {
        // Mark as completed
        await supabase
          .from("agent_inbox")
          .update({
            status: "completed",
            processed_at: new Date().toISOString(),
            error_message: null,
          })
          .eq("id", item.id);
      } else {
        // Handle failure with retry logic
        await handleItemFailure(item, result.error || "Unknown error");
        results.push(result);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unexpected processing error";
      console.error(
        `[InboxProcessor] Error processing item ${item.id}:`,
        errorMessage
      );

      await handleItemFailure(item, errorMessage);
      results.push({
        itemId: item.id,
        success: false,
        error: errorMessage,
      });
    }
  }

  console.log(
    `[InboxProcessor] Processed ${results.length} items: ${results.filter((r) => r.success).length} succeeded, ${results.filter((r) => !r.success).length} failed`
  );

  return results;
}

/**
 * Process a single inbox item by routing to the appropriate handler.
 *
 * Routes based on payload.type:
 * - "send_message" -> Send via channel adapter
 * - "generate_briefing" -> Generate and deliver daily briefing
 * - "follow_up_reminder" -> Send follow-up reminder via preferred channel
 * - "email_summary" -> Summarize recent emails and deliver
 * - "custom_action" -> Execute via agent executor
 * - "proactive_nudge" -> Generate and send proactive nudge
 * - "heartbeat_results" -> Deliver heartbeat insights
 *
 * @param item - The inbox item to process
 * @returns Processing result
 */
export async function processItem(
  item: AgentInboxItem
): Promise<InboxProcessResult> {
  const payloadType = item.payload?.type as string;

  if (!payloadType) {
    return {
      itemId: item.id,
      success: false,
      error: "Missing payload.type field",
    };
  }

  console.log(
    `[InboxProcessor] Processing item ${item.id} (type: ${payloadType}, source: ${item.source})`
  );

  switch (payloadType) {
    case "send_message":
      return handleSendMessage(item);

    case "generate_briefing":
      return handleGenerateBriefing(item);

    case "follow_up_reminder":
      return handleFollowUpReminder(item);

    case "email_summary":
      return handleEmailSummary(item);

    case "custom_action":
      return handleCustomAction(item);

    case "proactive_nudge":
      return handleProactiveNudge(item);

    case "heartbeat_results":
      return handleHeartbeatResults(item);

    default:
      return {
        itemId: item.id,
        success: false,
        error: `Unknown payload type: ${payloadType}`,
      };
  }
}

/**
 * Queue a new item into the agent inbox.
 *
 * @param userId - The user this item belongs to
 * @param source - Where this item originated from
 * @param payload - The work payload (must include a `type` field)
 * @param options - Optional priority, scheduling, and retry config
 * @returns The created item's ID
 */
export async function queueItem(
  userId: string,
  source: InboxSource,
  payload: Record<string, unknown>,
  options?: QueueItemOptions
): Promise<string> {
  const supabase = createAdminClient();
  const id = crypto.randomUUID();

  const { error } = await supabase.from("agent_inbox").insert({
    id,
    user_id: userId,
    source,
    priority: options?.priority || "normal",
    payload,
    status: "pending",
    scheduled_for: options?.scheduledFor?.toISOString() || new Date().toISOString(),
    max_retries: options?.maxRetries ?? 3,
    retry_count: 0,
  });

  if (error) {
    console.error("[InboxProcessor] Error queuing item:", error);
    throw new Error(`Failed to queue inbox item: ${error.message}`);
  }

  console.log(
    `[InboxProcessor] Queued item ${id} for user ${userId} (type: ${payload.type}, source: ${source})`
  );

  return id;
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * Handle "send_message" type — sends a message via the channel hub.
 */
async function handleSendMessage(
  item: AgentInboxItem
): Promise<InboxProcessResult> {
  try {
    const { getAdapter } = await import("@/lib/channels/index");
    const { formatResponseForChannel } = await import(
      "@/lib/channels/response-formatter"
    );

    const { channel, channel_user_id, message } = item.payload as {
      channel: string;
      channel_user_id: string;
      message: string;
      [key: string]: unknown;
    };

    if (!channel || !channel_user_id || !message) {
      return {
        itemId: item.id,
        success: false,
        error: "Missing required fields: channel, channel_user_id, message",
      };
    }

    const adapter = getAdapter(channel as "telegram" | "slack" | "whatsapp" | "discord" | "email");
    const formatted = formatResponseForChannel({ text: message }, channel as "telegram" | "slack" | "whatsapp" | "discord" | "email");
    await adapter.sendResponse(channel_user_id, formatted.text);

    return { itemId: item.id, success: true, result: { channel, sent: true } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Send failed";
    return { itemId: item.id, success: false, error: message };
  }
}

/**
 * Handle "generate_briefing" type — generates and delivers a daily briefing.
 */
async function handleGenerateBriefing(
  item: AgentInboxItem
): Promise<InboxProcessResult> {
  try {
    const { processAllDailyDigestAgents } = await import(
      "@/lib/agents/daily-digest"
    );

    // Run daily digest for this specific user by calling the general processor
    // The daily-digest agent handles per-user filtering internally
    const result = await processAllDailyDigestAgents();

    return {
      itemId: item.id,
      success: true,
      result: {
        digestsGenerated: result.digestsGenerated,
        totalProcessed: result.totalProcessed,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Briefing generation failed";
    return { itemId: item.id, success: false, error: message };
  }
}

/**
 * Handle "follow_up_reminder" type — sends a follow-up reminder via preferred channel.
 */
async function handleFollowUpReminder(
  item: AgentInboxItem
): Promise<InboxProcessResult> {
  try {
    const supabase = createAdminClient();

    const { contact_name, days_overdue, context } = item.payload as {
      contact_name?: string;
      days_overdue?: number;
      context?: string;
      [key: string]: unknown;
    };

    // Load user profile for notification preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "id, email, telegram_chat_id, notification_preferences"
      )
      .eq("id", item.user_id)
      .single();

    if (!profile) {
      return { itemId: item.id, success: false, error: "User profile not found" };
    }

    const reminderMessage = contact_name
      ? `Follow-up Reminder: You haven't followed up with ${contact_name} in ${days_overdue || "several"} days.${context ? `\n\nContext: ${context}` : ""}\n\nReply to take action or visit your dashboard.`
      : `Follow-up Reminder: You have overdue follow-ups that need attention.\n\nVisit your contacts dashboard to review.`;

    // Send via preferred channel using in-app notification as reliable fallback
    await supabase.from("notifications").insert({
      user_id: item.user_id,
      type: "follow_up_reminder",
      title: contact_name
        ? `Follow up with ${contact_name}`
        : "Overdue follow-ups",
      message: reminderMessage,
      action_url: "/dashboard/contacts",
      priority: "normal",
      read: false,
    });

    // Also try preferred external channel
    if (profile.telegram_chat_id) {
      try {
        const { getAdapter } = await import("@/lib/channels/index");
        const adapter = getAdapter("telegram");
        await adapter.sendResponse(profile.telegram_chat_id, reminderMessage);
      } catch {
        // Fall through — in-app notification already created
      }
    }

    return {
      itemId: item.id,
      success: true,
      result: { contact_name, reminded: true },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Reminder failed";
    return { itemId: item.id, success: false, error: message };
  }
}

/**
 * Handle "email_summary" type — summarize recent emails.
 */
async function handleEmailSummary(
  item: AgentInboxItem
): Promise<InboxProcessResult> {
  try {
    const { processAllEmailMonitorAgents } = await import(
      "@/lib/agents/email-monitor"
    );

    const result = await processAllEmailMonitorAgents();

    return {
      itemId: item.id,
      success: true,
      result: {
        totalAgents: result.totalAgents,
        totalProcessed: result.totalProcessed,
        totalCreated: result.totalCreated,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Email summary failed";
    return { itemId: item.id, success: false, error: message };
  }
}

/**
 * Handle "custom_action" type — execute via the agent plan executor.
 */
async function handleCustomAction(
  item: AgentInboxItem
): Promise<InboxProcessResult> {
  try {
    const { createAndStartPlan } = await import("@/lib/agents/executor");

    const { goal, steps_hint, urgency } = item.payload as {
      goal?: string;
      steps_hint?: string[];
      urgency?: "low" | "normal" | "high";
      [key: string]: unknown;
    };

    if (!goal) {
      return {
        itemId: item.id,
        success: false,
        error: "Missing required field: goal",
      };
    }

    const plan = await createAndStartPlan(
      { goal, steps_hint, urgency },
      {
        userId: item.user_id,
        organizationId: item.user_id,
        conversationId: `inbox_${item.id}`,
      }
    );

    return {
      itemId: item.id,
      success: true,
      result: { planId: plan.id, planStatus: plan.status },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Custom action failed";
    return { itemId: item.id, success: false, error: message };
  }
}

/**
 * Handle "proactive_nudge" type — generate and send a nudge.
 */
async function handleProactiveNudge(
  item: AgentInboxItem
): Promise<InboxProcessResult> {
  try {
    const { getUserNudgeConfig, runProactiveNudger } = await import(
      "@/lib/ai/proactive-nudger"
    );

    const config = await getUserNudgeConfig(item.user_id);
    if (!config) {
      return {
        itemId: item.id,
        success: true,
        result: { skipped: true, reason: "no_nudge_config" },
      };
    }

    const sentNudges = await runProactiveNudger(config);

    return {
      itemId: item.id,
      success: true,
      result: { nudgesSent: sentNudges.length },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Nudge failed";
    return { itemId: item.id, success: false, error: message };
  }
}

/**
 * Handle "heartbeat_results" type — deliver heartbeat insights to user.
 */
async function handleHeartbeatResults(
  item: AgentInboxItem
): Promise<InboxProcessResult> {
  try {
    const supabase = createAdminClient();

    const { results, insights } = item.payload as {
      results?: unknown[];
      insights?: Array<{
        category: string;
        message: string;
        urgency: string;
        suggestedAction: string;
      }>;
      [key: string]: unknown;
    };

    if (!insights || insights.length === 0) {
      return {
        itemId: item.id,
        success: true,
        result: { skipped: true, reason: "no_insights" },
      };
    }

    // Create in-app notifications for each insight
    const notifications = insights.map((insight) => ({
      user_id: item.user_id,
      type: "heartbeat_insight",
      title: `[${insight.category}] ${insight.message.substring(0, 100)}`,
      message: insight.suggestedAction,
      action_url: "/dashboard",
      priority:
        insight.urgency === "critical" || insight.urgency === "high"
          ? "high"
          : "normal",
      read: false,
    }));

    await supabase.from("notifications").insert(notifications);

    return {
      itemId: item.id,
      success: true,
      result: { notificationsCreated: notifications.length },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Heartbeat delivery failed";
    return { itemId: item.id, success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Retry Logic
// ---------------------------------------------------------------------------

/**
 * Handle a failed inbox item — retry or mark as permanently failed.
 */
async function handleItemFailure(
  item: AgentInboxItem,
  errorMessage: string
): Promise<void> {
  const supabase = createAdminClient();
  const newRetryCount = (item.retry_count || 0) + 1;

  if (newRetryCount < item.max_retries) {
    // Schedule retry with exponential backoff
    const delayMinutes = newRetryCount * BASE_RETRY_DELAY_MINUTES;
    const nextAttempt = new Date(
      Date.now() + delayMinutes * 60 * 1000
    ).toISOString();

    await supabase
      .from("agent_inbox")
      .update({
        status: "pending",
        retry_count: newRetryCount,
        error_message: errorMessage,
        scheduled_for: nextAttempt,
      })
      .eq("id", item.id);

    console.log(
      `[InboxProcessor] Item ${item.id} retry ${newRetryCount}/${item.max_retries} scheduled for ${nextAttempt}`
    );
  } else {
    // Max retries exceeded — mark as permanently failed
    await supabase
      .from("agent_inbox")
      .update({
        status: "failed",
        retry_count: newRetryCount,
        error_message: errorMessage,
        processed_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    console.log(
      `[InboxProcessor] Item ${item.id} permanently failed after ${newRetryCount} attempts: ${errorMessage}`
    );
  }
}
