/**
 * Email Channel Adapter
 *
 * Normalizes inbound email webhook payloads (SendGrid Inbound Parse, Gmail push)
 * into unified ChannelMessage format. Sends responses via Resend API (already
 * configured in the project) or Gmail API via existing skill infrastructure.
 *
 * Inbound formats supported:
 * - SendGrid Inbound Parse (POST with JSON or multipart)
 * - Gmail push notification (pub/sub with history ID)
 * - Raw email webhook (custom format)
 */

import { ChannelAdapter, ChannelMessage, ChannelAttachment, ChannelType } from "./types";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || "agent@perpetualcore.com";
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "Perpetual Core";

export class EmailAdapter implements ChannelAdapter {
  /**
   * Normalize an inbound email webhook payload into a unified ChannelMessage.
   * Supports SendGrid Inbound Parse format and generic email webhook format.
   *
   * @param rawPayload - The parsed email webhook data
   * @returns A normalized ChannelMessage
   */
  normalizeMessage(rawPayload: any): ChannelMessage {
    // Detect format and normalize accordingly
    if (rawPayload.envelope) {
      return this.normalizeSendGridPayload(rawPayload);
    }

    if (rawPayload.historyId) {
      return this.normalizeGmailPush(rawPayload);
    }

    // Generic email format
    return this.normalizeGenericEmail(rawPayload);
  }

  /**
   * Normalize a SendGrid Inbound Parse payload.
   * SendGrid posts parsed email data as JSON.
   */
  private normalizeSendGridPayload(rawPayload: any): ChannelMessage {
    const from = rawPayload.from || rawPayload.envelope?.from || "";
    const fromEmail = this.extractEmailAddress(from);
    const messageId = rawPayload.headers?.["Message-ID"] ||
      rawPayload["Message-ID"] ||
      `sg-${Date.now()}`;
    const subject = rawPayload.subject || "";
    const textBody = rawPayload.text || "";
    const htmlBody = rawPayload.html || "";
    const timestamp = rawPayload.headers?.Date
      ? new Date(rawPayload.headers.Date)
      : new Date();

    // Prefer text body, fall back to a simplified version of HTML
    const body = textBody || this.stripHtml(htmlBody);

    // Extract attachments
    const attachments = this.parseAttachments(rawPayload);

    return {
      channelType: "email",
      channelUserId: fromEmail,
      channelMessageId: messageId,
      text: subject ? `Subject: ${subject}\n\n${body}` : body,
      attachments: attachments.length > 0 ? attachments : undefined,
      rawPayload,
      timestamp,
    };
  }

  /**
   * Normalize a Gmail push notification.
   * Gmail push sends a minimal payload; the actual email data needs
   * to be fetched separately via the Gmail API.
   */
  private normalizeGmailPush(rawPayload: any): ChannelMessage {
    return {
      channelType: "email",
      channelUserId: rawPayload.emailAddress || "",
      channelMessageId: rawPayload.historyId || `gmail-${Date.now()}`,
      text: `[Gmail notification] New email activity (historyId: ${rawPayload.historyId})`,
      rawPayload,
      timestamp: new Date(),
    };
  }

  /**
   * Normalize a generic email webhook payload.
   */
  private normalizeGenericEmail(rawPayload: any): ChannelMessage {
    const from = rawPayload.from || rawPayload.sender || rawPayload.from_email || "";
    const fromEmail = this.extractEmailAddress(from);
    const messageId = rawPayload.messageId || rawPayload.message_id || `email-${Date.now()}`;
    const subject = rawPayload.subject || "";
    const body = rawPayload.text || rawPayload.body || rawPayload.html || "";
    const timestamp = rawPayload.date ? new Date(rawPayload.date) : new Date();

    // Extract attachments
    const attachments = this.parseAttachments(rawPayload);

    return {
      channelType: "email",
      channelUserId: fromEmail,
      channelMessageId: messageId,
      text: subject ? `Subject: ${subject}\n\n${body}` : body,
      attachments: attachments.length > 0 ? attachments : undefined,
      rawPayload,
      timestamp,
    };
  }

  /**
   * Send an email response via Resend API.
   * Converts markdown to styled HTML for email clients.
   *
   * @param channelUserId - The recipient's email address
   * @param message - The text content to send (markdown)
   * @param options - Optional: subject, fromEmail, fromName, inReplyTo, references
   */
  async sendResponse(
    channelUserId: string,
    message: string,
    options?: Record<string, any>
  ): Promise<void> {
    if (!RESEND_API_KEY) {
      console.error("[EmailAdapter] RESEND_API_KEY not configured");
      return;
    }

    if (!channelUserId || !channelUserId.includes("@")) {
      console.error("[EmailAdapter] Invalid email address:", channelUserId);
      return;
    }

    const subject = options?.subject || "Re: Your message to Perpetual Core";
    const fromEmail = options?.fromEmail || EMAIL_FROM_ADDRESS;
    const fromName = options?.fromName || EMAIL_FROM_NAME;

    try {
      const emailBody: Record<string, any> = {
        from: `${fromName} <${fromEmail}>`,
        to: channelUserId,
        subject,
        html: formatEmailHtml(message),
      };

      // Add reply headers for threading
      if (options?.inReplyTo) {
        emailBody.headers = {
          "In-Reply-To": options.inReplyTo,
          References: options.references || options.inReplyTo,
        };
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailBody),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("[EmailAdapter] Send error:", response.status, error);
        return;
      }

      const result = await response.json();
      console.log("[EmailAdapter] Email sent successfully, id:", result.id);
    } catch (error) {
      console.error("[EmailAdapter] Send error:", error);
    }
  }

  /**
   * Return the channel type identifier.
   */
  getChannelType(): ChannelType {
    return "email";
  }

  /**
   * Extract a clean email address from a "Name <email>" formatted string.
   */
  private extractEmailAddress(from: string): string {
    if (!from) return "";

    // Match email in angle brackets: "John Doe <john@example.com>"
    const match = from.match(/<([^>]+)>/);
    if (match) return match[1].trim();

    // Already just an email address
    if (from.includes("@")) return from.trim();

    return from;
  }

  /**
   * Parse attachments from various email webhook formats.
   */
  private parseAttachments(rawPayload: any): ChannelAttachment[] {
    const attachments: ChannelAttachment[] = [];

    // SendGrid format: attachments as numbered fields or array
    const rawAttachments = rawPayload.attachments || rawPayload.attachment_info;

    if (Array.isArray(rawAttachments)) {
      for (const att of rawAttachments) {
        const contentType = att.type || att.contentType || att.content_type || "";
        let type: ChannelAttachment["type"] = "document";

        if (contentType.startsWith("image/")) type = "image";
        else if (contentType.startsWith("video/")) type = "video";
        else if (contentType.startsWith("audio/")) type = "audio";

        attachments.push({
          type,
          url: att.url || att.contentUrl,
          fileName: att.filename || att.name,
          mimeType: contentType,
          sizeBytes: att.size,
        });
      }
    }

    // SendGrid numbered attachments (attachment1, attachment2, etc.)
    for (let i = 1; i <= 10; i++) {
      const att = rawPayload[`attachment${i}`];
      if (!att) break;

      attachments.push({
        type: "document",
        fileName: att.filename || `attachment${i}`,
        mimeType: att.type || att["content-type"],
        sizeBytes: att.size,
      });
    }

    return attachments;
  }

  /**
   * Strip HTML tags to get plain text (basic implementation for fallback).
   */
  private stripHtml(html: string): string {
    if (!html) return "";
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
  }
}

/**
 * Convert markdown text to styled HTML for email clients.
 * Supports headers, bold, italic, code, links, and lists.
 */
function formatEmailHtml(markdown: string): string {
  let html = markdown
    // Convert headers
    .replace(/^### (.+)$/gm, '<h3 style="font-size: 16px; font-weight: 600; margin: 16px 0 8px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size: 18px; font-weight: 600; margin: 20px 0 8px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size: 22px; font-weight: 700; margin: 24px 0 12px;">$1</h1>')
    // Convert bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Convert italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Convert code blocks
    .replace(
      /```(\w*)\n([\s\S]*?)```/g,
      '<pre style="background: #f4f4f5; padding: 12px 16px; border-radius: 6px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.5; margin: 12px 0;"><code>$2</code></pre>'
    )
    // Convert inline code
    .replace(
      /`([^`]+)`/g,
      '<code style="background: #f4f4f5; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px;">$1</code>'
    )
    // Convert links
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" style="color: #6366f1; text-decoration: underline;">$1</a>'
    )
    // Convert unordered list items
    .replace(/^[\-\*] (.+)$/gm, '<li style="margin: 4px 0;">$1</li>')
    // Convert line breaks
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 32px 32px 24px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #1a1a1a;">
                ${html}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0 16px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                Sent by Perpetual Core AI Agent<br>
                <a href="https://perpetualcore.com" style="color: #6366f1; text-decoration: none;">perpetualcore.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
