/**
 * Discord Channel Adapter
 *
 * Normalizes Discord webhook/interaction payloads into unified ChannelMessage format
 * and sends responses back via the Discord REST API (no discord.js needed).
 *
 * Discord messages come in two forms:
 * 1. Gateway events (bot messages) - standard message objects
 * 2. Interactions (slash commands, buttons) - interaction objects
 */

import { ChannelAdapter, ChannelMessage, ChannelAttachment, ChannelType } from "./types";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_API_BASE = "https://discord.com/api/v10";

/**
 * Maximum message length for Discord messages.
 * Discord allows up to 2000 characters per message.
 */
const MAX_MESSAGE_LENGTH = 2000;

export class DiscordAdapter implements ChannelAdapter {
  /**
   * Normalize a Discord webhook payload into a unified ChannelMessage.
   * Handles standard messages, interactions, and message components.
   *
   * @param rawPayload - The raw Discord message or interaction object
   * @returns A normalized ChannelMessage
   */
  normalizeMessage(rawPayload: any): ChannelMessage {
    // Determine if this is an interaction or a standard message
    const isInteraction = rawPayload.type !== undefined && rawPayload.data !== undefined;

    if (isInteraction) {
      return this.normalizeInteraction(rawPayload);
    }

    return this.normalizeGatewayMessage(rawPayload);
  }

  /**
   * Normalize a standard Discord gateway message.
   */
  private normalizeGatewayMessage(rawPayload: any): ChannelMessage {
    const authorId = rawPayload.author?.id || "";
    const channelId = rawPayload.channel_id || "";
    const messageId = rawPayload.id || "";
    const text = rawPayload.content || "";
    const timestamp = rawPayload.timestamp
      ? new Date(rawPayload.timestamp)
      : new Date();

    // Extract attachments
    const attachments: ChannelAttachment[] = [];

    if (rawPayload.attachments && Array.isArray(rawPayload.attachments)) {
      for (const attachment of rawPayload.attachments) {
        let type: ChannelAttachment["type"] = "other";
        const contentType = attachment.content_type || "";

        if (contentType.startsWith("image/")) type = "image";
        else if (contentType.startsWith("video/")) type = "video";
        else if (contentType.startsWith("audio/")) type = "audio";
        else type = "document";

        attachments.push({
          type,
          url: attachment.url,
          fileId: attachment.id,
          fileName: attachment.filename,
          mimeType: contentType,
          sizeBytes: attachment.size,
        });
      }
    }

    // Check for reply context (referenced message)
    const replyToMessageId = rawPayload.referenced_message
      ? rawPayload.referenced_message.id
      : undefined;

    return {
      channelType: "discord",
      // Combine author ID and channel ID for unique identification
      channelUserId: `${authorId}:${channelId}`,
      channelMessageId: messageId,
      text,
      attachments: attachments.length > 0 ? attachments : undefined,
      replyToMessageId,
      rawPayload,
      timestamp,
    };
  }

  /**
   * Normalize a Discord interaction (slash command, button, etc.).
   */
  private normalizeInteraction(rawPayload: any): ChannelMessage {
    const userId = rawPayload.member?.user?.id || rawPayload.user?.id || "";
    const channelId = rawPayload.channel_id || rawPayload.channel?.id || "";
    const interactionId = rawPayload.id || "";

    // For slash commands, extract the command text
    let text = "";
    if (rawPayload.data?.name) {
      text = `/${rawPayload.data.name}`;
      // Add options as text
      if (rawPayload.data.options && Array.isArray(rawPayload.data.options)) {
        const optionParts = rawPayload.data.options.map(
          (opt: any) => `${opt.name}:${opt.value}`
        );
        text += ` ${optionParts.join(" ")}`;
      }
    }

    // For message components (buttons, selects)
    if (rawPayload.data?.custom_id) {
      text = rawPayload.data.custom_id;
    }

    return {
      channelType: "discord",
      channelUserId: `${userId}:${channelId}`,
      channelMessageId: interactionId,
      text,
      rawPayload,
      timestamp: new Date(),
    };
  }

  /**
   * Send a response message via the Discord REST API.
   * Automatically splits long messages to stay within the 2000 character limit.
   *
   * @param channelUserId - Format: "discordUserId:channelId"
   * @param message - The text content to send
   * @param options - Optional: replyToMessageId, interactionToken (for deferred responses)
   */
  async sendResponse(
    channelUserId: string,
    message: string,
    options?: Record<string, any>
  ): Promise<void> {
    if (!DISCORD_BOT_TOKEN) {
      console.error("[DiscordAdapter] DISCORD_BOT_TOKEN not configured");
      return;
    }

    // Parse the composite channel user ID
    const [, channelId] = channelUserId.split(":");

    if (!channelId) {
      console.error("[DiscordAdapter] Invalid channelUserId format, expected 'userId:channelId'");
      return;
    }

    // If this is an interaction response, use the interaction endpoint
    if (options?.interactionId && options?.interactionToken) {
      await this.sendInteractionResponse(
        options.interactionId,
        options.interactionToken,
        message
      );
      return;
    }

    // Split long messages
    const chunks = splitMessage(message, MAX_MESSAGE_LENGTH);

    for (const chunk of chunks) {
      await this.sendChannelMessage(channelId, chunk, options);
    }
  }

  /**
   * Return the channel type identifier.
   */
  getChannelType(): ChannelType {
    return "discord";
  }

  /**
   * Send a message to a Discord channel via the REST API.
   */
  private async sendChannelMessage(
    channelId: string,
    text: string,
    options?: Record<string, any>
  ): Promise<boolean> {
    try {
      const body: Record<string, any> = { content: text };

      // Add reply reference if provided
      if (options?.replyToMessageId) {
        body.message_reference = {
          message_id: options.replyToMessageId,
        };
      }

      const response = await fetch(
        `${DISCORD_API_BASE}/channels/${channelId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("[DiscordAdapter] Send error:", response.status, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("[DiscordAdapter] Send error:", error);
      return false;
    }
  }

  /**
   * Send a response to a Discord interaction (slash command, button click).
   * Used for deferred or follow-up responses.
   */
  private async sendInteractionResponse(
    interactionId: string,
    interactionToken: string,
    text: string
  ): Promise<boolean> {
    try {
      // Send a follow-up message (interaction callback type 4 is CHANNEL_MESSAGE_WITH_SOURCE)
      const response = await fetch(
        `${DISCORD_API_BASE}/webhooks/${process.env.DISCORD_APP_ID}/${interactionToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: text }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("[DiscordAdapter] Interaction response error:", response.status, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("[DiscordAdapter] Interaction response error:", error);
      return false;
    }
  }
}

/**
 * Split a message into chunks that fit within the max length.
 * Tries to split at paragraph boundaries, then sentence boundaries.
 */
function splitMessage(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Try to find a paragraph break within the limit
    let splitIndex = remaining.lastIndexOf("\n\n", maxLength);

    // Fall back to a newline
    if (splitIndex === -1 || splitIndex < maxLength * 0.5) {
      splitIndex = remaining.lastIndexOf("\n", maxLength);
    }

    // Fall back to a space
    if (splitIndex === -1 || splitIndex < maxLength * 0.5) {
      splitIndex = remaining.lastIndexOf(" ", maxLength);
    }

    // Hard split as last resort
    if (splitIndex === -1 || splitIndex < maxLength * 0.3) {
      splitIndex = maxLength;
    }

    chunks.push(remaining.substring(0, splitIndex));
    remaining = remaining.substring(splitIndex).trimStart();
  }

  return chunks;
}
