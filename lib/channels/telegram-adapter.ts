/**
 * Telegram Channel Adapter
 *
 * Normalizes Telegram webhook payloads into unified ChannelMessage format
 * and sends responses back via the Telegram Bot API.
 */

import { ChannelAdapter, ChannelMessage, ChannelAttachment, ChannelType } from "./types";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Maximum message length for Telegram messages.
 * Telegram allows up to 4096 characters per message.
 */
const MAX_MESSAGE_LENGTH = 4096;

export class TelegramAdapter implements ChannelAdapter {
  /**
   * Normalize a Telegram webhook update into a unified ChannelMessage.
   * Handles text messages, photos, documents, and voice messages.
   *
   * @param rawPayload - The raw Telegram Update object from the webhook
   * @returns A normalized ChannelMessage
   */
  normalizeMessage(rawPayload: any): ChannelMessage {
    const message = rawPayload.message || rawPayload.callback_query?.message;

    if (!message) {
      throw new Error("No message found in Telegram update payload");
    }

    const chatId = String(message.chat.id);
    const messageId = String(message.message_id);
    const text = message.text || message.caption || "";
    const timestamp = new Date(message.date * 1000);

    // Extract attachments
    const attachments: ChannelAttachment[] = [];

    if (message.photo && message.photo.length > 0) {
      // Telegram sends multiple sizes; take the largest
      const largestPhoto = message.photo[message.photo.length - 1];
      attachments.push({
        type: "image",
        fileId: largestPhoto.file_id,
        mimeType: "image/jpeg",
      });
    }

    if (message.document) {
      attachments.push({
        type: "document",
        fileId: message.document.file_id,
        fileName: message.document.file_name,
        mimeType: message.document.mime_type,
        sizeBytes: message.document.file_size,
      });
    }

    if (message.voice) {
      attachments.push({
        type: "audio",
        fileId: message.voice.file_id,
        mimeType: message.voice.mime_type || "audio/ogg",
        sizeBytes: message.voice.file_size,
      });
    }

    if (message.video) {
      attachments.push({
        type: "video",
        fileId: message.video.file_id,
        mimeType: message.video.mime_type,
        sizeBytes: message.video.file_size,
      });
    }

    // Check for reply context
    const replyToMessageId = message.reply_to_message
      ? String(message.reply_to_message.message_id)
      : undefined;

    return {
      channelType: "telegram",
      channelUserId: chatId,
      channelMessageId: messageId,
      text,
      attachments: attachments.length > 0 ? attachments : undefined,
      replyToMessageId,
      rawPayload,
      timestamp,
    };
  }

  /**
   * Send a response message via Telegram.
   * Automatically splits long messages and handles Markdown parse failures.
   *
   * @param channelUserId - The Telegram chat ID to send to
   * @param message - The text content to send
   * @param options - Optional: parseMode, replyToMessageId, replyMarkup
   */
  async sendResponse(
    channelUserId: string,
    message: string,
    options?: Record<string, any>
  ): Promise<void> {
    if (!TELEGRAM_BOT_TOKEN) {
      console.error("[TelegramAdapter] TELEGRAM_BOT_TOKEN not configured");
      return;
    }

    // Split long messages
    const chunks = splitMessage(message, MAX_MESSAGE_LENGTH);

    for (const chunk of chunks) {
      await this.sendSingleMessage(channelUserId, chunk, options);
    }
  }

  /**
   * Return the channel type identifier.
   */
  getChannelType(): ChannelType {
    return "telegram";
  }

  /**
   * Send a single message via Telegram API.
   * Retries without Markdown parse mode if parsing fails.
   */
  private async sendSingleMessage(
    chatId: string,
    text: string,
    options?: Record<string, any>
  ): Promise<boolean> {
    try {
      const parseMode = options?.parseMode || "Markdown";

      const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
          reply_to_message_id: options?.replyToMessageId,
          reply_markup: options?.replyMarkup,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        // Retry without parse mode if Markdown parsing failed
        if (result.description?.includes("can't parse")) {
          console.warn("[TelegramAdapter] Markdown parse failed, retrying as plain text");
          return this.sendSingleMessage(chatId, text, {
            ...options,
            parseMode: undefined,
          });
        }
        console.error("[TelegramAdapter] Send error:", result);
        return false;
      }

      return true;
    } catch (error) {
      console.error("[TelegramAdapter] Send error:", error);
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
