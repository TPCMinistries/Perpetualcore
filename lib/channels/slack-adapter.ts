/**
 * Slack Channel Adapter
 *
 * Normalizes Slack event payloads into unified ChannelMessage format
 * and sends responses back via the Slack Web API.
 */

import { ChannelAdapter, ChannelMessage, ChannelAttachment, ChannelType } from "./types";
import { getSlackCredentials, createSlackClient } from "@/lib/slack/client";
import { createAdminClient } from "@/lib/supabase/server";

export class SlackAdapter implements ChannelAdapter {
  /**
   * Normalize a Slack event payload into a unified ChannelMessage.
   * Handles message events including threads, files, and reactions.
   *
   * @param rawPayload - The raw Slack event callback payload
   * @returns A normalized ChannelMessage
   */
  normalizeMessage(rawPayload: any): ChannelMessage {
    const event = rawPayload.event || rawPayload;

    if (!event || !event.type) {
      throw new Error("No event found in Slack payload");
    }

    const slackUserId = event.user || event.bot_id || "";
    const channelId = event.channel || "";
    const messageTs = event.ts || "";
    const text = event.text || "";
    const timestamp = event.ts ? new Date(parseFloat(event.ts) * 1000) : new Date();

    // Extract file attachments
    const attachments: ChannelAttachment[] = [];

    if (event.files && Array.isArray(event.files)) {
      for (const file of event.files) {
        let type: ChannelAttachment["type"] = "other";
        if (file.mimetype?.startsWith("image/")) type = "image";
        else if (file.mimetype?.startsWith("video/")) type = "video";
        else if (file.mimetype?.startsWith("audio/")) type = "audio";
        else type = "document";

        attachments.push({
          type,
          url: file.url_private || file.url_private_download,
          fileId: file.id,
          fileName: file.name,
          mimeType: file.mimetype,
          sizeBytes: file.size,
        });
      }
    }

    // Thread context
    const replyToMessageId = event.thread_ts && event.thread_ts !== event.ts
      ? event.thread_ts
      : undefined;

    return {
      channelType: "slack",
      // Combine user and channel for unique identification
      channelUserId: `${slackUserId}:${channelId}`,
      channelMessageId: messageTs,
      text,
      attachments: attachments.length > 0 ? attachments : undefined,
      replyToMessageId,
      rawPayload,
      timestamp,
    };
  }

  /**
   * Send a response message via Slack.
   * Uses the user's OAuth token to post messages.
   * Supports threading (reply_to) and rich blocks.
   *
   * @param channelUserId - Format: "slackUserId:channelId"
   * @param message - The text content to send
   * @param options - Optional: thread_ts, blocks, userId (Perpetual Core user ID)
   */
  async sendResponse(
    channelUserId: string,
    message: string,
    options?: Record<string, any>
  ): Promise<void> {
    // Parse the composite channel user ID
    const [slackUserId, channelId] = channelUserId.split(":");

    if (!channelId) {
      console.error("[SlackAdapter] Invalid channelUserId format, expected 'userId:channelId'");
      return;
    }

    // Look up the Perpetual Core user to get their Slack credentials
    const userId = options?.userId;
    if (!userId) {
      // Try to find user by Slack user ID
      const supabase = createAdminClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("slack_user_id", slackUserId)
        .single();

      if (!profile) {
        console.error("[SlackAdapter] Cannot find user for Slack user:", slackUserId);
        return;
      }

      const credentials = await getSlackCredentials(profile.id);
      if (!credentials) {
        console.error("[SlackAdapter] No Slack credentials for user:", profile.id);
        return;
      }

      const client = createSlackClient(credentials.accessToken);
      await this.postMessage(client, channelId, message, options);
      return;
    }

    const credentials = await getSlackCredentials(userId);
    if (!credentials) {
      console.error("[SlackAdapter] No Slack credentials for user:", userId);
      return;
    }

    const client = createSlackClient(credentials.accessToken);
    await this.postMessage(client, channelId, message, options);
  }

  /**
   * Return the channel type identifier.
   */
  getChannelType(): ChannelType {
    return "slack";
  }

  /**
   * Post a message to Slack using the Web API client.
   */
  private async postMessage(
    client: any,
    channel: string,
    text: string,
    options?: Record<string, any>
  ): Promise<void> {
    try {
      await client.chat.postMessage({
        channel,
        text,
        thread_ts: options?.thread_ts,
        blocks: options?.blocks,
        unfurl_links: false,
      });
    } catch (error) {
      console.error("[SlackAdapter] Failed to post message:", error);
      throw error;
    }
  }
}
