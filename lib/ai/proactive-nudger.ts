/**
 * Proactive Nudger
 * Decides what to surface to the user and sends via their preferred channel
 * Supports Telegram, WhatsApp, and in-app notifications
 */

import { createAdminClient } from "@/lib/supabase/server";
import {
  findForgottenCommitments,
  suggestProactiveOutreach,
  NudgeOpportunity,
} from "./commitment-extractor";
import { generateProactiveInsights, ProactiveInsight } from "./proactive-insights";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Telegram config
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// WhatsApp config (Twilio)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM; // e.g., "whatsapp:+14155238886"

export type NudgeChannel = "telegram" | "whatsapp" | "in_app" | "email";

export interface NudgeConfig {
  userId: string;
  organizationId: string;
  preferredChannel: NudgeChannel;
  telegramChatId?: string;
  whatsappNumber?: string;
  email?: string;
  quietHoursStart?: number; // 0-23
  quietHoursEnd?: number; // 0-23
  nudgeFrequency: "aggressive" | "balanced" | "minimal";
  autoActThreshold: number; // 0-1, confidence above which AI acts without asking
}

export interface SentNudge {
  id: string;
  channel: NudgeChannel;
  content: string;
  sentAt: string;
  acknowledged: boolean;
}

/**
 * Main function: Generate and send proactive nudges for a user
 */
export async function runProactiveNudger(config: NudgeConfig): Promise<SentNudge[]> {
  const supabase = createAdminClient();
  const sentNudges: SentNudge[] = [];

  // Check quiet hours
  if (isQuietHours(config.quietHoursStart, config.quietHoursEnd)) {
    console.log(`Skipping nudges for user ${config.userId} - quiet hours`);
    return [];
  }

  // Gather all potential nudges
  const [commitmentNudges, outreachNudges, insights] = await Promise.all([
    findForgottenCommitments(config.userId, config.organizationId),
    suggestProactiveOutreach(config.userId, config.organizationId),
    generateProactiveInsights(
      supabase,
      config.userId,
      config.organizationId
    ),
  ]);

  // Convert insights to nudge format
  const insightNudges: NudgeOpportunity[] = insights
    .filter((i) => i.priority === "high" || i.priority === "medium")
    .slice(0, 3)
    .map((insight) => ({
      type: "pattern_detected" as const,
      title: insight.title,
      description: insight.description,
      suggestedAction: insight.action?.label || "View details",
      urgency: insight.priority === "high" ? "today" as const : "this_week" as const,
      data: { insightId: insight.id, actionHref: insight.action?.href },
    }));

  // Combine and prioritize
  const allNudges = [...commitmentNudges, ...outreachNudges, ...insightNudges];
  const prioritizedNudges = prioritizeNudges(allNudges, config.nudgeFrequency);

  // Check for recent nudges to avoid spam
  const recentNudges = await getRecentNudges(config.userId, 4); // Last 4 hours
  const nudgesToSend = filterRecentlySent(prioritizedNudges, recentNudges);

  if (nudgesToSend.length === 0) {
    console.log(`No new nudges to send for user ${config.userId}`);
    return [];
  }

  // Format nudges for the channel
  const formattedMessage = await formatNudgesForChannel(
    nudgesToSend,
    config.preferredChannel,
    config.autoActThreshold
  );

  // Send via appropriate channel
  let sent = false;
  let nudgeId = crypto.randomUUID();

  switch (config.preferredChannel) {
    case "telegram":
      if (config.telegramChatId && TELEGRAM_BOT_TOKEN) {
        sent = await sendTelegramMessage(config.telegramChatId, formattedMessage);
      }
      break;
    case "whatsapp":
      if (config.whatsappNumber && TWILIO_ACCOUNT_SID) {
        sent = await sendWhatsAppMessage(config.whatsappNumber, formattedMessage);
      }
      break;
    case "in_app":
      sent = await createInAppNotification(config.userId, nudgesToSend);
      break;
  }

  if (sent) {
    // Log the nudge
    await supabase.from("proactive_nudges").insert({
      id: nudgeId,
      user_id: config.userId,
      organization_id: config.organizationId,
      channel: config.preferredChannel,
      nudge_content: formattedMessage,
      nudge_data: nudgesToSend,
      sent_at: new Date().toISOString(),
      acknowledged: false,
    });

    sentNudges.push({
      id: nudgeId,
      channel: config.preferredChannel,
      content: formattedMessage,
      sentAt: new Date().toISOString(),
      acknowledged: false,
    });
  }

  return sentNudges;
}

/**
 * Prioritize nudges based on urgency and user preferences
 */
function prioritizeNudges(
  nudges: NudgeOpportunity[],
  frequency: "aggressive" | "balanced" | "minimal"
): NudgeOpportunity[] {
  const urgencyOrder = { immediate: 0, today: 1, this_week: 2, whenever: 3 };
  const sorted = nudges.sort(
    (a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
  );

  // Limit based on frequency preference
  const limits = {
    aggressive: 5,
    balanced: 3,
    minimal: 1,
  };

  return sorted.slice(0, limits[frequency]);
}

/**
 * Filter out nudges that were recently sent
 */
function filterRecentlySent(
  nudges: NudgeOpportunity[],
  recentNudges: any[]
): NudgeOpportunity[] {
  const recentTitles = new Set(
    recentNudges.flatMap((n) =>
      (n.nudge_data || []).map((d: any) => d.title?.toLowerCase())
    )
  );

  return nudges.filter((n) => !recentTitles.has(n.title.toLowerCase()));
}

/**
 * Get recent nudges to avoid spam
 */
async function getRecentNudges(userId: string, hoursBack: number): Promise<any[]> {
  const supabase = createAdminClient();
  const since = new Date();
  since.setHours(since.getHours() - hoursBack);

  const { data } = await supabase
    .from("proactive_nudges")
    .select("*")
    .eq("user_id", userId)
    .gte("sent_at", since.toISOString());

  return data || [];
}

/**
 * Check if current time is within quiet hours
 */
function isQuietHours(start?: number, end?: number): boolean {
  if (start === undefined || end === undefined) return false;

  const now = new Date();
  const hour = now.getHours();

  if (start <= end) {
    // Same-day range (e.g., 9 to 17 = work hours, or 22 to 23)
    // Quiet if hour is within this range
    return hour >= start && hour < end;
  } else {
    // Overnight range (e.g., 22 to 7 = sleep hours)
    // Quiet if hour >= start OR hour < end
    return hour >= start || hour < end;
  }
}

/**
 * Format nudges into a message for the specific channel
 */
async function formatNudgesForChannel(
  nudges: NudgeOpportunity[],
  channel: NudgeChannel,
  autoActThreshold: number
): Promise<string> {
  // Use AI to craft a natural, conversational message
  const nudgeList = nudges
    .map((n, i) => `${i + 1}. [${n.urgency.toUpperCase()}] ${n.title}\n   ${n.description}\n   Suggested: ${n.suggestedAction}`)
    .join("\n\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant sending proactive nudges to Lorenzo.
Write a brief, friendly message that:
- Feels personal, not robotic
- Groups related items naturally
- Uses emojis sparingly (1-2 max)
- Ends with a question or call to action
- Is appropriate for ${channel === "telegram" ? "Telegram" : channel === "whatsapp" ? "WhatsApp" : "a notification"}
- Keeps it under 300 characters for mobile readability

Do NOT use bullet points or numbered lists. Write conversationally.`,
        },
        {
          role: "user",
          content: `Format these nudges into a friendly message:\n\n${nudgeList}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return response.choices[0]?.message?.content || formatFallbackMessage(nudges);
  } catch (error) {
    console.error("Error formatting nudge message:", error);
    return formatFallbackMessage(nudges);
  }
}

/**
 * Fallback message format if AI fails
 */
function formatFallbackMessage(nudges: NudgeOpportunity[]): string {
  if (nudges.length === 1) {
    return `Hey! Quick reminder: ${nudges[0].title}. ${nudges[0].suggestedAction}`;
  }
  return `Hey! Got ${nudges.length} things for you:\n${nudges.map((n) => `• ${n.title}`).join("\n")}\n\nWant me to help with any of these?`;
}

/**
 * Send message via Telegram
 */
async function sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("Telegram bot token not configured");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );

    const result = await response.json();
    if (!result.ok) {
      console.error("Telegram send error:", result);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Telegram send error:", error);
    return false;
  }
}

/**
 * Send message via WhatsApp (Twilio)
 */
async function sendWhatsAppMessage(toNumber: string, message: string): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    console.error("Twilio WhatsApp not configured");
    return false;
  }

  try {
    const formattedTo = toNumber.startsWith("whatsapp:")
      ? toNumber
      : `whatsapp:${toNumber}`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          To: formattedTo,
          From: TWILIO_WHATSAPP_FROM,
          Body: message,
        }),
      }
    );

    const result = await response.json();
    if (result.error_code) {
      console.error("WhatsApp send error:", result);
      return false;
    }
    return true;
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return false;
  }
}

/**
 * Create in-app notification
 */
async function createInAppNotification(
  userId: string,
  nudges: NudgeOpportunity[]
): Promise<boolean> {
  const supabase = createAdminClient();

  try {
    for (const nudge of nudges) {
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "proactive_nudge",
        title: nudge.title,
        message: nudge.description,
        action_url: nudge.data?.actionHref || "/dashboard",
        priority: nudge.urgency === "immediate" ? "high" : "normal",
        read: false,
      });
    }
    return true;
  } catch (error) {
    console.error("In-app notification error:", error);
    return false;
  }
}

/**
 * Get user's nudge configuration
 */
export async function getUserNudgeConfig(userId: string): Promise<NudgeConfig | null> {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      id,
      organization_id,
      telegram_chat_id,
      whatsapp_number,
      email,
      notification_preferences
    `)
    .eq("id", userId)
    .single();

  if (!profile) return null;

  const prefs = profile.notification_preferences || {};

  return {
    userId: profile.id,
    organizationId: profile.organization_id,
    preferredChannel: prefs.preferred_channel || "telegram",
    telegramChatId: profile.telegram_chat_id,
    whatsappNumber: profile.whatsapp_number,
    email: profile.email,
    quietHoursStart: prefs.quiet_hours_start,
    quietHoursEnd: prefs.quiet_hours_end,
    nudgeFrequency: prefs.nudge_frequency || "balanced",
    autoActThreshold: prefs.auto_act_threshold || 0.9,
  };
}

/**
 * Process a user response to a nudge
 */
export async function handleNudgeResponse(
  nudgeId: string,
  userId: string,
  response: string
): Promise<{ action: string; result: any }> {
  const supabase = createAdminClient();

  // Mark nudge as acknowledged
  await supabase
    .from("proactive_nudges")
    .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
    .eq("id", nudgeId);

  // Get the nudge data
  const { data: nudge } = await supabase
    .from("proactive_nudges")
    .select("*")
    .eq("id", nudgeId)
    .single();

  if (!nudge) {
    return { action: "not_found", result: null };
  }

  // Use AI to interpret response and take action
  const nudgeData = nudge.nudge_data as NudgeOpportunity[];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are interpreting a user's response to a proactive nudge.

The nudge contained these items:
${JSON.stringify(nudgeData, null, 2)}

Based on the user's response, determine:
1. Which item(s) they're responding to
2. What action they want (complete, reschedule, ignore, draft_message, etc.)
3. Any additional context

Return JSON:
{
  "understood": true/false,
  "itemIndex": 0-based index or -1 for all,
  "action": "complete|reschedule|ignore|draft|ask_clarification",
  "details": "any additional details extracted"
}`,
        },
        {
          role: "user",
          content: response,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const interpretation = JSON.parse(
      completion.choices[0]?.message?.content || "{}"
    );

    // Execute the interpreted action
    if (interpretation.action === "complete" && interpretation.itemIndex >= 0) {
      const item = nudgeData[interpretation.itemIndex];
      if (item?.data?.taskId) {
        await supabase
          .from("tasks")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", item.data.taskId);
        return { action: "completed_task", result: { taskId: item.data.taskId } };
      }
    }

    if (interpretation.action === "draft" && interpretation.itemIndex >= 0) {
      const item = nudgeData[interpretation.itemIndex];
      // Return that we should draft a message
      return {
        action: "draft_requested",
        result: {
          contactId: item?.data?.contactId,
          contactName: item?.data?.contactName,
        },
      };
    }

    return { action: interpretation.action, result: interpretation };
  } catch (error) {
    console.error("Error interpreting nudge response:", error);
    return { action: "error", result: null };
  }
}
