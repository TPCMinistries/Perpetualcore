/**
 * Channel Hub Type Definitions
 *
 * Unified types for multi-channel message processing.
 * Supports Telegram, Slack, WhatsApp, Discord, and Email channels.
 */

/** Supported channel types */
export type ChannelType = "telegram" | "slack" | "whatsapp" | "discord" | "email";

/**
 * Unified message format that normalizes incoming messages
 * from any supported channel into a consistent structure.
 */
export interface ChannelMessage {
  /** The originating channel type */
  channelType: ChannelType;
  /** The user's ID on the channel (e.g., Telegram chat_id, Slack user_id) */
  channelUserId: string;
  /** The message ID on the channel */
  channelMessageId: string;
  /** The text content of the message */
  text: string;
  /** Optional file or media attachments */
  attachments?: ChannelAttachment[];
  /** If this message is a reply, the original message ID */
  replyToMessageId?: string;
  /** The raw, unprocessed webhook payload from the channel */
  rawPayload: any;
  /** When the message was sent */
  timestamp: Date;
}

/**
 * Represents a file or media attachment from any channel.
 */
export interface ChannelAttachment {
  /** Attachment type: image, document, audio, video, or other */
  type: "image" | "document" | "audio" | "video" | "other";
  /** URL or file ID for retrieving the attachment */
  url?: string;
  fileId?: string;
  /** Original filename if available */
  fileName?: string;
  /** MIME type if available */
  mimeType?: string;
  /** File size in bytes if available */
  sizeBytes?: number;
}

/**
 * Channel adapter interface that each channel implementation must satisfy.
 * Responsible for normalizing inbound messages and sending outbound responses.
 */
export interface ChannelAdapter {
  /**
   * Normalize a raw webhook payload into a unified ChannelMessage.
   * @param rawPayload - The raw data from the channel's webhook
   * @returns A normalized ChannelMessage
   */
  normalizeMessage(rawPayload: any): ChannelMessage;

  /**
   * Send a response message back to the user on this channel.
   * @param channelUserId - The user's ID on this channel
   * @param message - The text content to send
   * @param options - Channel-specific send options (e.g., reply_to, thread_ts)
   */
  sendResponse(
    channelUserId: string,
    message: string,
    options?: Record<string, any>
  ): Promise<void>;

  /**
   * Return the channel type identifier for this adapter.
   */
  getChannelType(): ChannelType;
}

/**
 * Context object passed through the message processing pipeline.
 * Contains user identity, organization, and channel preferences.
 */
export interface ChannelContext {
  /** The Perpetual Core user ID (from auth.users) */
  userId: string;
  /** The user's organization ID */
  organizationId: string;
  /** The active conversation ID for this channel thread */
  conversationId: string;
  /** Which channel this context is for */
  channelType: ChannelType;
  /** User's notification and channel preferences */
  preferences: Record<string, any>;
}

/**
 * The AI-generated response to be sent back through the channel.
 */
export interface ChannelResponse {
  /** The main text response */
  text: string;
  /** Optional file or media attachments to include in the response */
  attachments?: ChannelAttachment[];
  /** Optional suggested follow-up actions for the user */
  suggestedActions?: SuggestedAction[];
}

/**
 * A suggested follow-up action to present to the user.
 */
export interface SuggestedAction {
  /** Display label for the action */
  label: string;
  /** Action identifier or callback data */
  action: string;
  /** Optional URL for link-based actions */
  url?: string;
}
