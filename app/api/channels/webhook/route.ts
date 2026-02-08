/**
 * Unified Channel Webhook Endpoint
 *
 * POST /api/channels/webhook?channel=telegram|slack|whatsapp
 *
 * Receives incoming webhooks from all supported messaging channels,
 * verifies signatures, and routes through the unified channel hub.
 */

import { NextRequest, NextResponse } from "next/server";
import { processChannelMessage } from "@/lib/channels";
import { ChannelType } from "@/lib/channels/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Handle incoming webhook POST requests from messaging channels.
 */
export async function POST(request: NextRequest) {
  const channelParam = request.nextUrl.searchParams.get("channel");

  if (!channelParam) {
    return NextResponse.json(
      { error: "Missing 'channel' query parameter" },
      { status: 400 }
    );
  }

  const validChannels: ChannelType[] = [
    "telegram",
    "slack",
    "whatsapp",
    "discord",
    "email",
  ];

  if (!validChannels.includes(channelParam as ChannelType)) {
    return NextResponse.json(
      { error: `Invalid channel: ${channelParam}. Supported: ${validChannels.join(", ")}` },
      { status: 400 }
    );
  }

  const channelType = channelParam as ChannelType;

  try {
    // Verify webhook signature per channel
    const verificationResult = await verifyWebhookSignature(
      request,
      channelType
    );

    if (!verificationResult.valid) {
      console.error(
        `[Webhook] Signature verification failed for ${channelType}:`,
        verificationResult.reason
      );
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    // Handle Slack URL verification challenge
    if (channelType === "slack") {
      const body = verificationResult.body;
      if (body?.type === "url_verification") {
        return NextResponse.json({ challenge: body.challenge });
      }

      // Skip bot messages to avoid loops
      if (body?.event?.bot_id || body?.event?.subtype === "bot_message") {
        return NextResponse.json({ ok: true });
      }
    }

    // Parse the raw payload
    const rawPayload = verificationResult.body;

    // Process through the unified channel hub
    const response = await processChannelMessage(channelType, rawPayload);

    // Return appropriate response per channel
    switch (channelType) {
      case "telegram":
        // Telegram expects 200 OK to acknowledge receipt
        return NextResponse.json({ ok: true });

      case "slack":
        // Slack expects 200 within 3 seconds; actual processing is async
        return NextResponse.json({ ok: true });

      case "whatsapp":
        // Twilio expects a TwiML response or 200 OK
        return new NextResponse(
          '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
          {
            status: 200,
            headers: { "Content-Type": "text/xml" },
          }
        );

      default:
        return NextResponse.json({ ok: true, response: response.text });
    }
  } catch (error: any) {
    console.error(`[Webhook] Error processing ${channelType} webhook:`, error);

    // Still return 200 for most channels to prevent retries
    if (channelType === "telegram" || channelType === "slack") {
      return NextResponse.json({ ok: false, error: error.message });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Verify webhook signature based on channel type.
 *
 * Each channel has its own signature verification mechanism:
 * - Telegram: Secret token header
 * - Slack: HMAC-SHA256 signature
 * - WhatsApp (Twilio): Twilio request signature
 */
async function verifyWebhookSignature(
  request: NextRequest,
  channelType: ChannelType
): Promise<{ valid: boolean; reason?: string; body?: any }> {
  try {
    switch (channelType) {
      case "telegram":
        return await verifyTelegramSignature(request);
      case "slack":
        return await verifySlackSignature(request);
      case "whatsapp":
        return await verifyTwilioSignature(request);
      default:
        // For channels without signature verification, parse body and pass through
        const body = await request.json();
        return { valid: true, body };
    }
  } catch (error: any) {
    return { valid: false, reason: error.message };
  }
}

/**
 * Verify Telegram webhook using the secret token header.
 */
async function verifyTelegramSignature(
  request: NextRequest
): Promise<{ valid: boolean; reason?: string; body?: any }> {
  const body = await request.json();

  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secretToken) {
    // If no secret is configured, accept all (development mode)
    console.warn("[Webhook] TELEGRAM_WEBHOOK_SECRET not set, accepting all requests");
    return { valid: true, body };
  }

  const headerToken = request.headers.get("x-telegram-bot-api-secret-token");
  if (headerToken !== secretToken) {
    return {
      valid: false,
      reason: "Invalid Telegram secret token",
    };
  }

  return { valid: true, body };
}

/**
 * Verify Slack webhook using HMAC-SHA256 signature.
 */
async function verifySlackSignature(
  request: NextRequest
): Promise<{ valid: boolean; reason?: string; body?: any }> {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  const rawBody = await request.text();
  const body = JSON.parse(rawBody);

  if (!signingSecret) {
    console.warn("[Webhook] SLACK_SIGNING_SECRET not set, accepting all requests");
    return { valid: true, body };
  }

  const timestamp = request.headers.get("x-slack-request-timestamp");
  const slackSignature = request.headers.get("x-slack-signature");

  if (!timestamp || !slackSignature) {
    return { valid: false, reason: "Missing Slack signature headers" };
  }

  // Reject requests older than 5 minutes
  const requestTimestamp = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - requestTimestamp) > 300) {
    return { valid: false, reason: "Request timestamp too old" };
  }

  // Compute the expected signature
  const sigBasestring = `v0:${timestamp}:${rawBody}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(sigBasestring)
  );
  const expectedSignature = `v0=${Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;

  if (expectedSignature !== slackSignature) {
    return { valid: false, reason: "Invalid Slack signature" };
  }

  return { valid: true, body };
}

/**
 * Verify Twilio (WhatsApp) webhook request signature.
 */
async function verifyTwilioSignature(
  request: NextRequest
): Promise<{ valid: boolean; reason?: string; body?: any }> {
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Parse form data from Twilio
  const contentType = request.headers.get("content-type") || "";
  let body: Record<string, string> = {};

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    const params = new URLSearchParams(text);
    body = Object.fromEntries(params.entries());
  } else {
    body = await request.json();
  }

  if (!authToken) {
    console.warn("[Webhook] TWILIO_AUTH_TOKEN not set, accepting all requests");
    return { valid: true, body };
  }

  const twilioSignature = request.headers.get("x-twilio-signature");
  if (!twilioSignature) {
    return { valid: false, reason: "Missing Twilio signature header" };
  }

  // For full Twilio signature verification, the URL and sorted params are needed.
  // This is a simplified check; in production, use the twilio library's validateRequest.
  // For now, we verify the presence of the signature header and known fields.
  const hasRequiredFields =
    body.MessageSid && body.From && body.AccountSid;

  if (!hasRequiredFields) {
    return {
      valid: false,
      reason: "Missing required Twilio fields",
    };
  }

  // Verify AccountSid matches
  if (body.AccountSid !== process.env.TWILIO_ACCOUNT_SID) {
    return {
      valid: false,
      reason: "AccountSid mismatch",
    };
  }

  return { valid: true, body };
}
