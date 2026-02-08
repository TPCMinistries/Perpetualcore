/**
 * WhatsApp Channel Adapter
 *
 * Normalizes WhatsApp (Twilio) webhook payloads into unified ChannelMessage format
 * and sends responses back via the Twilio API.
 */

import { ChannelAdapter, ChannelMessage, ChannelAttachment, ChannelType } from "./types";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;

/**
 * Maximum message length for WhatsApp messages.
 * WhatsApp allows up to 1600 characters per message for best rendering.
 */
const MAX_MESSAGE_LENGTH = 1600;

export class WhatsAppAdapter implements ChannelAdapter {
  /**
   * Normalize a Twilio WhatsApp webhook payload into a unified ChannelMessage.
   * Handles text messages, media messages (images, documents, audio).
   *
   * @param rawPayload - The raw form data from Twilio's webhook (parsed to object)
   * @returns A normalized ChannelMessage
   */
  normalizeMessage(rawPayload: any): ChannelMessage {
    const from = rawPayload.From || rawPayload.from || "";
    const messageSid = rawPayload.MessageSid || rawPayload.messageSid || "";
    const body = rawPayload.Body || rawPayload.body || "";
    const timestamp = new Date();

    // Extract the phone number from the WhatsApp format ("whatsapp:+1234567890")
    const phoneNumber = from.replace("whatsapp:", "");

    // Extract media attachments
    const attachments: ChannelAttachment[] = [];
    const numMedia = parseInt(rawPayload.NumMedia || "0", 10);

    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = rawPayload[`MediaUrl${i}`];
      const mediaContentType = rawPayload[`MediaContentType${i}`] || "";

      let type: ChannelAttachment["type"] = "other";
      if (mediaContentType.startsWith("image/")) type = "image";
      else if (mediaContentType.startsWith("video/")) type = "video";
      else if (mediaContentType.startsWith("audio/")) type = "audio";
      else type = "document";

      attachments.push({
        type,
        url: mediaUrl,
        mimeType: mediaContentType,
      });
    }

    return {
      channelType: "whatsapp",
      channelUserId: phoneNumber,
      channelMessageId: messageSid,
      text: body,
      attachments: attachments.length > 0 ? attachments : undefined,
      rawPayload,
      timestamp,
    };
  }

  /**
   * Send a response message via WhatsApp using Twilio.
   * Automatically splits long messages to stay within limits.
   *
   * @param channelUserId - The recipient's phone number (e.g., "+1234567890")
   * @param message - The text content to send
   * @param options - Optional: mediaUrl for sending media
   */
  async sendResponse(
    channelUserId: string,
    message: string,
    options?: Record<string, any>
  ): Promise<void> {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
      console.error("[WhatsAppAdapter] Twilio WhatsApp not configured");
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
    return "whatsapp";
  }

  /**
   * Send a single message via Twilio WhatsApp API.
   */
  private async sendSingleMessage(
    toNumber: string,
    text: string,
    options?: Record<string, any>
  ): Promise<boolean> {
    try {
      const formattedTo = toNumber.startsWith("whatsapp:")
        ? toNumber
        : `whatsapp:${toNumber}`;

      const body: Record<string, string> = {
        To: formattedTo,
        From: TWILIO_WHATSAPP_FROM!,
        Body: text,
      };

      // Include media URL if provided
      if (options?.mediaUrl) {
        body.MediaUrl = options.mediaUrl;
      }

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
              `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
            ).toString("base64")}`,
          },
          body: new URLSearchParams(body),
        }
      );

      const result = await response.json();

      if (result.error_code) {
        console.error("[WhatsAppAdapter] Send error:", result);
        return false;
      }

      return true;
    } catch (error) {
      console.error("[WhatsAppAdapter] Send error:", error);
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

    // Try paragraph break
    let splitIndex = remaining.lastIndexOf("\n\n", maxLength);

    // Fall back to newline
    if (splitIndex === -1 || splitIndex < maxLength * 0.5) {
      splitIndex = remaining.lastIndexOf("\n", maxLength);
    }

    // Fall back to space
    if (splitIndex === -1 || splitIndex < maxLength * 0.5) {
      splitIndex = remaining.lastIndexOf(" ", maxLength);
    }

    // Hard split
    if (splitIndex === -1 || splitIndex < maxLength * 0.3) {
      splitIndex = maxLength;
    }

    chunks.push(remaining.substring(0, splitIndex));
    remaining = remaining.substring(splitIndex).trimStart();
  }

  return chunks;
}
