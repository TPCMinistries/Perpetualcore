/**
 * Microsoft Teams Channel Adapter
 *
 * Normalizes Bot Framework activity payloads into unified ChannelMessage format
 * and sends responses back via the Bot Framework REST API (no SDK needed).
 *
 * Microsoft Teams uses the Bot Framework protocol:
 * - Inbound: Activity objects posted to the bot's messaging endpoint
 * - Outbound: POST to serviceUrl/v3/conversations/{id}/activities
 * - Auth: OAuth2 client credentials via login.microsoftonline.com
 */

import { ChannelAdapter, ChannelMessage, ChannelAttachment, ChannelType } from "./types";

const TEAMS_APP_ID = process.env.TEAMS_APP_ID;
const TEAMS_APP_PASSWORD = process.env.TEAMS_APP_PASSWORD;

/** Bot Framework OAuth token endpoint */
const BOT_FRAMEWORK_TOKEN_URL =
  "https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token";

/** Cached access token and expiry to avoid unnecessary re-auth */
let cachedToken: { token: string; expiresAt: number } | null = null;

export class TeamsAdapter implements ChannelAdapter {
  /**
   * Normalize a Bot Framework activity into a unified ChannelMessage.
   * Handles message activities, including mentions, attachments, and reply chains.
   *
   * @param rawPayload - The raw Bot Framework Activity object
   * @returns A normalized ChannelMessage
   */
  normalizeMessage(rawPayload: any): ChannelMessage {
    const fromId = rawPayload.from?.id || "";
    const fromName = rawPayload.from?.name || "";
    const conversationId = rawPayload.conversation?.id || "";
    const activityId = rawPayload.id || "";
    const timestamp = rawPayload.timestamp
      ? new Date(rawPayload.timestamp)
      : new Date();

    // Extract text content, removing bot @mentions
    let text = rawPayload.text || "";
    if (rawPayload.entities && Array.isArray(rawPayload.entities)) {
      for (const entity of rawPayload.entities) {
        if (entity.type === "mention" && entity.mentioned?.role === "bot") {
          // Remove the @mention tag from the text
          text = text.replace(entity.text || "", "").trim();
        }
      }
    }

    // Extract attachments
    const attachments: ChannelAttachment[] = [];

    if (rawPayload.attachments && Array.isArray(rawPayload.attachments)) {
      for (const att of rawPayload.attachments) {
        // Skip adaptive cards and hero cards (UI elements, not files)
        if (
          att.contentType === "application/vnd.microsoft.card.adaptive" ||
          att.contentType === "application/vnd.microsoft.card.hero"
        ) {
          continue;
        }

        let type: ChannelAttachment["type"] = "document";
        const contentType = att.contentType || "";

        if (contentType.startsWith("image/")) type = "image";
        else if (contentType.startsWith("video/")) type = "video";
        else if (contentType.startsWith("audio/")) type = "audio";

        attachments.push({
          type,
          url: att.contentUrl,
          fileName: att.name,
          mimeType: contentType,
        });
      }
    }

    // Check for reply context
    const replyToMessageId = rawPayload.replyToId || undefined;

    return {
      channelType: "teams",
      // Combine user ID and conversation ID for unique identification
      channelUserId: `${fromId}:${conversationId}`,
      channelMessageId: activityId,
      text,
      attachments: attachments.length > 0 ? attachments : undefined,
      replyToMessageId,
      rawPayload,
      timestamp,
    };
  }

  /**
   * Send a response message via the Bot Framework REST API.
   * Obtains an OAuth token and posts to the conversation's service URL.
   *
   * @param channelUserId - Format: "teamsUserId:conversationId"
   * @param message - The text content to send
   * @param options - Required: serviceUrl. Optional: replyToId, activityId
   */
  async sendResponse(
    channelUserId: string,
    message: string,
    options?: Record<string, any>
  ): Promise<void> {
    if (!TEAMS_APP_ID || !TEAMS_APP_PASSWORD) {
      console.error("[TeamsAdapter] TEAMS_APP_ID or TEAMS_APP_PASSWORD not configured");
      return;
    }

    const serviceUrl = options?.serviceUrl;
    const [, conversationId] = channelUserId.split(":");

    if (!serviceUrl || !conversationId) {
      console.error(
        "[TeamsAdapter] Missing serviceUrl or conversationId. serviceUrl:",
        serviceUrl,
        "channelUserId:",
        channelUserId
      );
      return;
    }

    try {
      // Get Bot Framework access token
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        console.error("[TeamsAdapter] Failed to obtain access token");
        return;
      }

      // Build the activity payload
      const activity: Record<string, any> = {
        type: "message",
        text: message,
        textFormat: "markdown",
      };

      // Add reply reference if provided
      if (options?.replyToId) {
        activity.replyToId = options.replyToId;
      }

      // Normalize service URL (remove trailing slash)
      const normalizedServiceUrl = serviceUrl.replace(/\/$/, "");

      const response = await fetch(
        `${normalizedServiceUrl}/v3/conversations/${encodeURIComponent(conversationId)}/activities`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(activity),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("[TeamsAdapter] Send error:", response.status, error);
        return;
      }

      console.log("[TeamsAdapter] Message sent successfully to conversation:", conversationId);
    } catch (error) {
      console.error("[TeamsAdapter] Send error:", error);
    }
  }

  /**
   * Return the channel type identifier.
   */
  getChannelType(): ChannelType {
    return "teams";
  }

  /**
   * Get a Bot Framework OAuth2 access token.
   * Caches the token until near-expiry to minimize auth calls.
   */
  private async getAccessToken(): Promise<string | null> {
    // Check cached token (with 5 minute buffer)
    if (cachedToken && Date.now() < cachedToken.expiresAt - 300_000) {
      return cachedToken.token;
    }

    try {
      const response = await fetch(BOT_FRAMEWORK_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: TEAMS_APP_ID!,
          client_secret: TEAMS_APP_PASSWORD!,
          scope: "https://api.botframework.com/.default",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("[TeamsAdapter] Token error:", response.status, error);
        return null;
      }

      const tokenData = await response.json();

      // Cache the token
      cachedToken = {
        token: tokenData.access_token,
        expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
      };

      return tokenData.access_token;
    } catch (error) {
      console.error("[TeamsAdapter] Token request error:", error);
      return null;
    }
  }
}
