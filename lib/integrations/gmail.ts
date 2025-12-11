/**
 * Gmail Integration
 *
 * Provides functions to fetch and interact with Gmail using stored OAuth tokens.
 */

import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logging";

interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  snippet: string;
  receivedAt: Date;
  isUnread: boolean;
  labels: string[];
}

interface GmailCredentials {
  access_token: string;
  refresh_token: string;
  token_expires_at: string | null;
}

/**
 * Get Gmail OAuth client for a user
 */
async function getGmailClient(userId: string) {
  const supabase = await createClient();

  // Get user's Gmail integration
  const { data: integration, error } = await supabase
    .from("user_integrations")
    .select("access_token, refresh_token, token_expires_at")
    .eq("user_id", userId)
    .eq("integration_id", "gmail")
    .eq("is_connected", true)
    .single();

  if (error || !integration) {
    logger.warn("Gmail not connected for user", { userId });
    return null;
  }

  const credentials = integration as GmailCredentials;

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
  );

  oauth2Client.setCredentials({
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token,
  });

  // Check if token needs refresh
  const expiresAt = credentials.token_expires_at
    ? new Date(credentials.token_expires_at).getTime()
    : 0;

  if (expiresAt && expiresAt < Date.now() + 5 * 60 * 1000) {
    // Token expires in less than 5 minutes, refresh it
    try {
      const { credentials: newCredentials } = await oauth2Client.refreshAccessToken();

      // Update stored tokens
      await supabase
        .from("user_integrations")
        .update({
          access_token: newCredentials.access_token,
          token_expires_at: newCredentials.expiry_date
            ? new Date(newCredentials.expiry_date).toISOString()
            : null,
        })
        .eq("user_id", userId)
        .eq("integration_id", "gmail");

      logger.info("Refreshed Gmail token", { userId });
    } catch (refreshError) {
      logger.error("Failed to refresh Gmail token", { userId, error: refreshError });
      return null;
    }
  }

  return google.gmail({ version: "v1", auth: oauth2Client });
}

/**
 * Parse email headers to extract fields
 */
function parseHeaders(headers: Array<{ name?: string | null; value?: string | null }>) {
  const result: Record<string, string> = {};
  for (const header of headers) {
    if (header.name && header.value) {
      result[header.name.toLowerCase()] = header.value;
    }
  }
  return result;
}

/**
 * Decode base64 URL-safe encoded content
 */
function decodeBase64Url(data: string): string {
  // Replace URL-safe characters
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Extract plain text body from email parts
 */
function extractBody(payload: any): string {
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts) {
    // Look for text/plain first
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    // Fall back to text/html
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        // Strip HTML tags for plain text
        const html = decodeBase64Url(part.body.data);
        return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      }
    }
    // Check nested parts
    for (const part of payload.parts) {
      if (part.parts) {
        const nestedBody = extractBody(part);
        if (nestedBody) return nestedBody;
      }
    }
  }

  return "";
}

/**
 * Fetch recent unread emails from Gmail
 */
export async function fetchUnreadEmails(
  userId: string,
  maxResults: number = 10,
  afterDate?: Date
): Promise<GmailMessage[]> {
  const gmail = await getGmailClient(userId);

  if (!gmail) {
    return [];
  }

  try {
    // Build query
    let query = "is:unread";
    if (afterDate) {
      const dateStr = afterDate.toISOString().split("T")[0];
      query += ` after:${dateStr}`;
    }

    // Get message IDs
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults,
    });

    const messages = listResponse.data.messages || [];

    if (messages.length === 0) {
      return [];
    }

    // Fetch full message details
    const emails: GmailMessage[] = [];

    for (const msg of messages) {
      try {
        const fullMessage = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
          format: "full",
        });

        const payload = fullMessage.data.payload;
        if (!payload) continue;

        const headers = parseHeaders(payload.headers || []);

        emails.push({
          id: msg.id!,
          threadId: msg.threadId || msg.id!,
          subject: headers["subject"] || "(No Subject)",
          from: headers["from"] || "",
          to: headers["to"] || "",
          body: extractBody(payload),
          snippet: fullMessage.data.snippet || "",
          receivedAt: new Date(parseInt(fullMessage.data.internalDate || "0")),
          isUnread: (fullMessage.data.labelIds || []).includes("UNREAD"),
          labels: fullMessage.data.labelIds || [],
        });
      } catch (msgError) {
        logger.error("Failed to fetch Gmail message", {
          userId,
          messageId: msg.id,
          error: msgError
        });
      }
    }

    logger.info("Fetched Gmail messages", { userId, count: emails.length });
    return emails;
  } catch (error) {
    logger.error("Failed to fetch Gmail messages", { userId, error });
    return [];
  }
}

/**
 * Mark an email as read
 */
export async function markAsRead(userId: string, messageId: string): Promise<boolean> {
  const gmail = await getGmailClient(userId);

  if (!gmail) {
    return false;
  }

  try {
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        removeLabelIds: ["UNREAD"],
      },
    });
    return true;
  } catch (error) {
    logger.error("Failed to mark Gmail message as read", { userId, messageId, error });
    return false;
  }
}

/**
 * Add a label to an email
 */
export async function addLabel(
  userId: string,
  messageId: string,
  labelId: string
): Promise<boolean> {
  const gmail = await getGmailClient(userId);

  if (!gmail) {
    return false;
  }

  try {
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        addLabelIds: [labelId],
      },
    });
    return true;
  } catch (error) {
    logger.error("Failed to add label to Gmail message", { userId, messageId, labelId, error });
    return false;
  }
}

/**
 * Check if Gmail is connected for a user
 */
export async function isGmailConnected(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("user_integrations")
    .select("is_connected")
    .eq("user_id", userId)
    .eq("integration_id", "gmail")
    .single();

  return data?.is_connected === true;
}

export default {
  fetchUnreadEmails,
  markAsRead,
  addLabel,
  isGmailConnected,
};
