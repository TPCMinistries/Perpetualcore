/**
 * Commitment Extractor
 * Analyzes conversations to extract commitments, follow-ups, and actionable items
 * Creates tasks automatically and surfaces nudges when things are forgotten
 */

import { createAdminClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface ExtractedCommitment {
  type: "task" | "follow_up" | "meeting" | "reminder" | "promise";
  description: string;
  deadline?: string; // ISO date or relative like "next week"
  priority: "high" | "medium" | "low";
  relatedPerson?: string;
  relatedProject?: string;
  confidence: number;
  originalText: string;
}

export interface NudgeOpportunity {
  type: "forgotten_commitment" | "overdue_follow_up" | "draft_ready" | "pattern_detected";
  title: string;
  description: string;
  suggestedAction: string;
  urgency: "immediate" | "today" | "this_week" | "whenever";
  data: Record<string, any>;
}

/**
 * Extract commitments from a conversation
 */
export async function extractCommitmentsFromConversation(
  conversationId: string,
  userId: string,
  organizationId: string
): Promise<ExtractedCommitment[]> {
  const supabase = createAdminClient();

  // Get conversation messages
  const { data: messages, error } = await supabase
    .from("messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error || !messages || messages.length === 0) {
    return [];
  }

  // Format conversation for analysis
  const conversationText = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at identifying commitments and action items from conversations.

Analyze the conversation and extract any:
1. TASKS - Things the user said they will do ("I'll send that email", "I need to finish the report")
2. FOLLOW-UPS - People or things to check back on ("remind me to call John", "let's revisit this next week")
3. MEETINGS - Mentioned meetings or appointments to schedule
4. REMINDERS - Time-sensitive things to remember
5. PROMISES - Commitments made to others ("I told Sarah I'd review her proposal")

For each item, determine:
- A clear description of what needs to be done
- Any mentioned deadline (explicit or implied)
- Priority based on urgency/importance cues
- Related person if mentioned
- Related project if mentioned
- Your confidence (0.0-1.0) that this is a real commitment

Only extract genuine commitments, not hypotheticals or past completed items.

Return JSON:
{
  "commitments": [
    {
      "type": "task|follow_up|meeting|reminder|promise",
      "description": "Clear actionable description",
      "deadline": "ISO date or relative time or null",
      "priority": "high|medium|low",
      "relatedPerson": "name or null",
      "relatedProject": "project name or null",
      "confidence": 0.85,
      "originalText": "exact quote from conversation"
    }
  ]
}`,
        },
        {
          role: "user",
          content: conversationText,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    const commitments: ExtractedCommitment[] = parsed.commitments || [];

    // Store high-confidence commitments as tasks
    for (const commitment of commitments) {
      if (commitment.confidence >= 0.7) {
        await createTaskFromCommitment(
          commitment,
          userId,
          organizationId,
          conversationId
        );
      }
    }

    // Log extraction for learning
    await supabase.from("commitment_extractions").insert({
      conversation_id: conversationId,
      user_id: userId,
      organization_id: organizationId,
      commitments_found: commitments.length,
      commitments_data: commitments,
      created_at: new Date().toISOString(),
    });

    return commitments;
  } catch (error) {
    console.error("Error extracting commitments:", error);
    return [];
  }
}

/**
 * Create a task from an extracted commitment
 */
async function createTaskFromCommitment(
  commitment: ExtractedCommitment,
  userId: string,
  organizationId: string,
  conversationId: string
): Promise<void> {
  const supabase = createAdminClient();

  // Parse deadline
  let dueDate: string | null = null;
  if (commitment.deadline) {
    dueDate = parseDeadline(commitment.deadline);
  }

  // Check for duplicates (similar task in last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: existing } = await supabase
    .from("tasks")
    .select("id, title")
    .eq("user_id", userId)
    .gte("created_at", weekAgo.toISOString())
    .ilike("title", `%${commitment.description.substring(0, 30)}%`)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log("Skipping duplicate task:", commitment.description);
    return;
  }

  // Create the task
  const { error } = await supabase.from("tasks").insert({
    user_id: userId,
    organization_id: organizationId,
    title: commitment.description,
    description: `Auto-created from conversation.\n\nOriginal: "${commitment.originalText}"`,
    status: "pending",
    priority: commitment.priority,
    due_date: dueDate,
    source: "ai_extracted",
    source_reference: conversationId,
    metadata: {
      commitment_type: commitment.type,
      related_person: commitment.relatedPerson,
      related_project: commitment.relatedProject,
      extraction_confidence: commitment.confidence,
    },
  });

  if (error) {
    console.error("Error creating task from commitment:", error);
  }
}

/**
 * Parse natural language deadlines into ISO dates
 */
function parseDeadline(deadline: string): string | null {
  const now = new Date();
  const lower = deadline.toLowerCase();

  if (lower.includes("today")) {
    return now.toISOString();
  }
  if (lower.includes("tomorrow")) {
    now.setDate(now.getDate() + 1);
    return now.toISOString();
  }
  if (lower.includes("next week")) {
    now.setDate(now.getDate() + 7);
    return now.toISOString();
  }
  if (lower.includes("end of week") || lower.includes("this week")) {
    const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7;
    now.setDate(now.getDate() + daysUntilFriday);
    return now.toISOString();
  }
  if (lower.includes("next month")) {
    now.setMonth(now.getMonth() + 1);
    return now.toISOString();
  }

  // Try to parse as ISO date
  const parsed = new Date(deadline);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return null;
}

/**
 * Analyze recent conversations for forgotten commitments
 */
export async function findForgottenCommitments(
  userId: string,
  organizationId: string
): Promise<NudgeOpportunity[]> {
  const supabase = createAdminClient();
  const nudges: NudgeOpportunity[] = [];

  // Get tasks created from AI extraction that are overdue or due soon
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: overdueExtracted } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("source", "ai_extracted")
    .eq("status", "pending")
    .lt("due_date", now.toISOString())
    .limit(5);

  if (overdueExtracted && overdueExtracted.length > 0) {
    for (const task of overdueExtracted) {
      nudges.push({
        type: "forgotten_commitment",
        title: `Overdue: ${task.title}`,
        description: `You mentioned this ${getTimeAgo(task.created_at)} but it's now overdue.`,
        suggestedAction: "Would you like me to reschedule this or mark it complete?",
        urgency: "today",
        data: {
          taskId: task.id,
          originalCommitment: task.metadata?.commitment_type,
          relatedPerson: task.metadata?.related_person,
        },
      });
    }
  }

  // Check for follow-ups that haven't happened
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: pendingFollowUps } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .contains("metadata", { commitment_type: "follow_up" })
    .lt("created_at", weekAgo.toISOString())
    .limit(3);

  if (pendingFollowUps && pendingFollowUps.length > 0) {
    for (const followUp of pendingFollowUps) {
      const person = followUp.metadata?.related_person;
      nudges.push({
        type: "overdue_follow_up",
        title: person
          ? `Follow up with ${person}?`
          : `Pending follow-up: ${followUp.title}`,
        description: `You wanted to follow up on this ${getTimeAgo(followUp.created_at)}.`,
        suggestedAction: person
          ? `Want me to draft a message to ${person}?`
          : "Should I help you complete this?",
        urgency: "this_week",
        data: {
          taskId: followUp.id,
          relatedPerson: person,
        },
      });
    }
  }

  return nudges;
}

/**
 * Analyze user's communication patterns to suggest proactive outreach
 */
export async function suggestProactiveOutreach(
  userId: string,
  organizationId: string
): Promise<NudgeOpportunity[]> {
  const supabase = createAdminClient();
  const nudges: NudgeOpportunity[] = [];

  // Find contacts not reached in 30+ days that user frequently contacts
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: coldContacts } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email, last_contacted_at, contact_frequency")
    .eq("organization_id", organizationId)
    .lt("last_contacted_at", thirtyDaysAgo.toISOString())
    .gt("contact_frequency", 2) // Has been contacted multiple times
    .order("last_contacted_at", { ascending: true })
    .limit(5);

  if (coldContacts && coldContacts.length > 0) {
    for (const contact of coldContacts) {
      const name = `${contact.first_name} ${contact.last_name}`.trim();
      const daysSince = Math.floor(
        (Date.now() - new Date(contact.last_contacted_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      nudges.push({
        type: "overdue_follow_up",
        title: `Reconnect with ${name}?`,
        description: `It's been ${daysSince} days since you last connected.`,
        suggestedAction: "Want me to draft a quick check-in message?",
        urgency: "this_week",
        data: {
          contactId: contact.id,
          contactName: name,
          contactEmail: contact.email,
          daysSinceContact: daysSince,
        },
      });
    }
  }

  return nudges;
}

/**
 * Helper to format time ago
 */
function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "earlier today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "about a week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}
