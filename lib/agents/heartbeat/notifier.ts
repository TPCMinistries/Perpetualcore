/**
 * Heartbeat Notifier
 *
 * Sends heartbeat insights to the user via their preferred channel.
 * Uses the channel hub adapters for delivery and logs to proactive_nudges table.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { getAdapter } from "@/lib/channels/index";
import { formatResponseForChannel } from "@/lib/channels/response-formatter";
import { HeartbeatInsight } from "./types";
import { ChannelType } from "@/lib/channels/types";

/**
 * Send heartbeat insights to the user via their preferred notification channel.
 *
 * 1. Load user's preferred channel and channel-specific ID
 * 2. Format insights for the channel
 * 3. Send via the channel adapter
 * 4. Log to proactive_nudges table
 *
 * @param userId - The user to notify
 * @param insights - The generated heartbeat insights
 * @param heartbeatRunId - The ID of the heartbeat run (for logging)
 * @returns True if the notification was sent successfully
 */
export async function notifyUser(
  userId: string,
  insights: HeartbeatInsight[],
  heartbeatRunId: string
): Promise<{ sent: boolean; channel: string }> {
  const supabase = createAdminClient();

  try {
    // Load user's notification preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "id, organization_id, telegram_chat_id, whatsapp_number, slack_user_id, slack_channel_id, email, notification_preferences"
      )
      .eq("id", userId)
      .single();

    if (!profile) {
      console.error("[HeartbeatNotifier] Profile not found for user:", userId);
      return { sent: false, channel: "none" };
    }

    const prefs = profile.notification_preferences || {};
    const preferredChannel: string =
      prefs.preferred_channel || "in_app";

    // Format the message
    const formattedMessage = formatInsightsMessage(insights);

    // Send via appropriate channel
    let sent = false;
    let actualChannel = preferredChannel;

    switch (preferredChannel) {
      case "telegram":
        if (profile.telegram_chat_id) {
          sent = await sendViaChannel(
            "telegram",
            profile.telegram_chat_id,
            formattedMessage
          );
        }
        break;

      case "slack":
        if (profile.slack_channel_id || profile.slack_user_id) {
          const channelId = profile.slack_channel_id || profile.slack_user_id;
          sent = await sendViaChannel(
            "slack",
            `${profile.slack_user_id || ""}:${channelId}`,
            formattedMessage,
            { userId }
          );
        }
        break;

      case "whatsapp":
        if (profile.whatsapp_number) {
          sent = await sendViaChannel(
            "whatsapp",
            profile.whatsapp_number,
            formattedMessage
          );
        }
        break;

      case "in_app":
      default:
        // Create in-app notifications
        sent = await createInAppNotifications(userId, insights);
        actualChannel = "in_app";
        break;
    }

    // If the preferred channel failed, fall back to in-app
    if (!sent && preferredChannel !== "in_app") {
      console.warn(
        `[HeartbeatNotifier] ${preferredChannel} failed, falling back to in-app`
      );
      sent = await createInAppNotifications(userId, insights);
      actualChannel = "in_app";
    }

    // Log the notification to proactive_nudges table
    if (sent) {
      await supabase.from("proactive_nudges").insert({
        id: crypto.randomUUID(),
        user_id: userId,
        organization_id: profile.organization_id || userId,
        channel: actualChannel,
        nudge_content: formattedMessage,
        nudge_data: insights.map((i) => ({
          type: "heartbeat_insight",
          title: i.message,
          description: i.suggestedAction,
          urgency: i.urgency,
          data: { heartbeatRunId, category: i.category },
        })),
        sent_at: new Date().toISOString(),
        acknowledged: false,
      });
    }

    return { sent, channel: actualChannel };
  } catch (error: any) {
    console.error("[HeartbeatNotifier] Error notifying user:", error);
    return { sent: false, channel: "error" };
  }
}

/**
 * Send a message via a specific channel adapter.
 */
async function sendViaChannel(
  channelType: ChannelType,
  channelUserId: string,
  message: string,
  options?: Record<string, any>
): Promise<boolean> {
  try {
    const adapter = getAdapter(channelType);

    // Format for the channel
    const formatted = formatResponseForChannel(
      { text: message },
      channelType
    );

    await adapter.sendResponse(channelUserId, formatted.text, options);
    return true;
  } catch (error) {
    console.error(
      `[HeartbeatNotifier] Failed to send via ${channelType}:`,
      error
    );
    return false;
  }
}

/**
 * Create in-app notifications for each insight.
 */
async function createInAppNotifications(
  userId: string,
  insights: HeartbeatInsight[]
): Promise<boolean> {
  const supabase = createAdminClient();

  try {
    const notifications = insights.map((insight) => ({
      user_id: userId,
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
    return true;
  } catch (error) {
    console.error("[HeartbeatNotifier] In-app notification error:", error);
    return false;
  }
}

/**
 * Format heartbeat insights into a single notification message.
 */
function formatInsightsMessage(insights: HeartbeatInsight[]): string {
  if (insights.length === 0) {
    return "Your daily heartbeat: All clear! No urgent items need attention.";
  }

  const urgencyEmoji: Record<string, string> = {
    critical: "[!!!]",
    high: "[!!]",
    medium: "[!]",
    low: "",
  };

  const header = "Your Perpetual Core Heartbeat\n\n";

  const insightLines = insights.map((insight, index) => {
    const emoji = urgencyEmoji[insight.urgency] || "";
    return `${index + 1}. ${emoji} ${insight.message}\n   -> ${insight.suggestedAction}`;
  });

  const footer =
    "\n\nReply to take action on any of these items, or visit your dashboard for details.";

  return header + insightLines.join("\n\n") + footer;
}
