/**
 * Email Inbound Webhook Endpoint
 *
 * POST /api/channels/email
 *
 * Handles inbound emails from:
 * - SendGrid Inbound Parse (JSON format)
 * - Gmail push notifications (pub/sub)
 * - Generic email webhook payloads
 *
 * SendGrid Inbound Parse setup:
 * 1. Configure MX records to point to mx.sendgrid.net
 * 2. Set up inbound parse at: https://app.sendgrid.com/settings/parse
 * 3. Point to: https://perpetualcore.com/api/channels/email
 * 4. Check "Post the raw, full MIME message" OFF (we want parsed JSON)
 *
 * Gmail push notification setup:
 * 1. Enable Gmail API + Pub/Sub in Google Cloud Console
 * 2. Create topic + subscription pointing to this endpoint
 * 3. Call gmail.users.watch() to register the subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { processChannelMessage } from "@/lib/channels";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: any;

    // Parse body based on content type
    if (contentType.includes("multipart/form-data")) {
      // SendGrid sends multipart form data
      body = await parseSendGridMultipart(request);
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      // SendGrid can also send URL-encoded form data
      const text = await request.text();
      const params = new URLSearchParams(text);
      body = Object.fromEntries(params.entries());
    } else {
      // JSON format (Gmail push, generic webhooks)
      body = await request.json();
    }

    // Handle Gmail pub/sub verification
    if (body.message?.data) {
      // Gmail push notification wraps data in a pub/sub message
      try {
        const decoded = Buffer.from(body.message.data, "base64").toString();
        body = JSON.parse(decoded);
      } catch {
        // Not base64 JSON, treat as-is
      }
    }

    // Basic validation
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Extract sender email for spam/bounce filtering
    const senderEmail = extractSenderEmail(body);

    if (senderEmail) {
      // Skip known automated/bounce emails
      if (isAutomatedEmail(senderEmail, body)) {
        console.log("[Email Webhook] Skipping automated email from:", senderEmail);
        return NextResponse.json({ ok: true, skipped: "automated" });
      }

      // Rate limit: max 10 inbound emails per sender per hour
      const isRateLimited = await checkEmailRateLimit(senderEmail);
      if (isRateLimited) {
        console.warn("[Email Webhook] Rate limited sender:", senderEmail);
        return NextResponse.json({ ok: true, skipped: "rate_limited" });
      }
    }

    // Process through the unified channel hub
    const response = await processChannelMessage("email", body);

    return NextResponse.json({
      ok: true,
      processed: true,
      responseLength: response.text.length,
    });
  } catch (error: any) {
    console.error("[Email Webhook] Error:", error);
    // Return 200 to prevent webhook retries for transient errors
    return NextResponse.json({
      ok: false,
      error: error.message,
    });
  }
}

/**
 * Parse SendGrid multipart form data into a structured object.
 */
async function parseSendGridMultipart(request: NextRequest): Promise<any> {
  try {
    const formData = await request.formData();
    const body: Record<string, any> = {};

    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        body[key] = value;
      } else {
        // File attachment
        if (!body.attachments) body.attachments = [];
        body.attachments.push({
          filename: value.name,
          type: value.type,
          size: value.size,
        });
      }
    }

    // Parse the envelope JSON if present
    if (body.envelope && typeof body.envelope === "string") {
      try {
        body.envelope = JSON.parse(body.envelope);
      } catch {
        // Keep as string
      }
    }

    // Parse charsets if present
    if (body.charsets && typeof body.charsets === "string") {
      try {
        body.charsets = JSON.parse(body.charsets);
      } catch {
        // Keep as string
      }
    }

    return body;
  } catch (error) {
    console.error("[Email Webhook] Form data parse error:", error);
    // Fallback to raw text parsing
    const text = await request.text();
    return { rawText: text };
  }
}

/**
 * Extract the sender email address from various payload formats.
 */
function extractSenderEmail(body: any): string {
  const from =
    body.from ||
    body.sender ||
    body.from_email ||
    body.envelope?.from ||
    "";

  // Extract email from "Name <email>" format
  const match = from.match(/<([^>]+)>/);
  if (match) return match[1].trim().toLowerCase();
  if (from.includes("@")) return from.trim().toLowerCase();

  return "";
}

/**
 * Check if an email is from an automated source (bounces, auto-replies, etc.).
 */
function isAutomatedEmail(senderEmail: string, body: any): boolean {
  // Common automated sender patterns
  const automatedPatterns = [
    "noreply@",
    "no-reply@",
    "mailer-daemon@",
    "postmaster@",
    "bounce@",
    "notifications@",
    "donotreply@",
    "auto-reply@",
  ];

  if (automatedPatterns.some((p) => senderEmail.startsWith(p))) {
    return true;
  }

  // Check for auto-reply headers
  const headers = body.headers || {};
  if (
    headers["Auto-Submitted"] === "auto-replied" ||
    headers["X-Auto-Response-Suppress"] ||
    headers["Precedence"] === "auto_reply"
  ) {
    return true;
  }

  // Check for bounce indicators
  const subject = (body.subject || "").toLowerCase();
  if (
    subject.includes("delivery status notification") ||
    subject.includes("undeliverable") ||
    subject.includes("mail delivery failed") ||
    subject.includes("out of office")
  ) {
    return true;
  }

  return false;
}

/**
 * Check rate limit for inbound emails per sender.
 * Returns true if the sender has exceeded the limit.
 */
async function checkEmailRateLimit(senderEmail: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { count } = await supabase
      .from("channel_messages")
      .select("*", { count: "exact", head: true })
      .eq("channel_type", "email")
      .eq("channel_user_id", senderEmail)
      .eq("direction", "inbound")
      .gte("created_at", oneHourAgo.toISOString());

    return (count || 0) >= 10;
  } catch (error) {
    // If rate limit check fails, allow the message through
    console.error("[Email Webhook] Rate limit check error:", error);
    return false;
  }
}
