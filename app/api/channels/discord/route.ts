/**
 * Discord Webhook Endpoint
 *
 * POST /api/channels/discord
 *
 * Handles Discord interactions and bot events:
 * - Interaction signature verification (Ed25519)
 * - PING response (required by Discord for endpoint validation)
 * - Slash command and message component processing
 * - Message forwarding to the unified channel hub
 *
 * Discord requires Ed25519 signature verification for all interaction endpoints.
 * The bot also receives gateway-style events when configured as a webhook.
 */

import { NextRequest, NextResponse } from "next/server";
import { processChannelMessage } from "@/lib/channels";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

/**
 * Discord Interaction Types
 */
const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5,
} as const;

/**
 * Discord Interaction Response Types
 */
const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
} as const;

export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // Verify Discord signature
    const signature = request.headers.get("x-signature-ed25519");
    const timestamp = request.headers.get("x-signature-timestamp");

    if (DISCORD_PUBLIC_KEY && signature && timestamp) {
      const isValid = await verifyDiscordSignature(
        rawBody,
        signature,
        timestamp,
        DISCORD_PUBLIC_KEY
      );

      if (!isValid) {
        console.error("[Discord Webhook] Invalid signature");
        return NextResponse.json(
          { error: "Invalid request signature" },
          { status: 401 }
        );
      }
    } else if (DISCORD_PUBLIC_KEY) {
      // Public key is configured but headers are missing
      console.error("[Discord Webhook] Missing signature headers");
      return NextResponse.json(
        { error: "Missing signature headers" },
        { status: 401 }
      );
    } else {
      // Development mode: no public key configured
      console.warn(
        "[Discord Webhook] DISCORD_PUBLIC_KEY not set, accepting all requests"
      );
    }

    // Handle interaction types
    if (body.type === InteractionType.PING) {
      // Discord sends a PING to validate the endpoint during setup
      return NextResponse.json({ type: InteractionResponseType.PONG });
    }

    if (
      body.type === InteractionType.APPLICATION_COMMAND ||
      body.type === InteractionType.MESSAGE_COMPONENT ||
      body.type === InteractionType.MODAL_SUBMIT
    ) {
      // For slash commands and interactive components, respond with a deferred
      // message to buy time for AI processing (Discord requires response within 3s)
      // Then send the actual response as a follow-up

      // Process the message asynchronously
      processChannelMessage("discord", body).catch((error) => {
        console.error("[Discord Webhook] Async processing error:", error);
      });

      // Return a deferred response immediately
      return NextResponse.json({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      });
    }

    // For standard bot message events (non-interaction webhook)
    if (body.content !== undefined && body.author) {
      // Skip bot messages to avoid loops
      if (body.author.bot) {
        return NextResponse.json({ ok: true });
      }

      // Process through the unified channel hub
      await processChannelMessage("discord", body);
      return NextResponse.json({ ok: true });
    }

    // Unrecognized event type
    console.warn("[Discord Webhook] Unrecognized event type:", body.type);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[Discord Webhook] Error:", error);
    // Return 200 to prevent Discord from retrying
    return NextResponse.json({ ok: false, error: error.message });
  }
}

/**
 * Verify Discord interaction signature using Ed25519.
 *
 * Discord requires Ed25519 signature verification for all interaction endpoints.
 * The signature is computed over: timestamp + body
 */
async function verifyDiscordSignature(
  body: string,
  signature: string,
  timestamp: string,
  publicKey: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();

    // Import the public key
    const keyData = hexToUint8Array(publicKey);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "Ed25519" },
      false,
      ["verify"]
    );

    // Verify the signature
    const signatureData = hexToUint8Array(signature);
    const messageData = encoder.encode(timestamp + body);

    const isValid = await crypto.subtle.verify(
      "Ed25519",
      cryptoKey,
      signatureData,
      messageData
    );

    return isValid;
  } catch (error) {
    console.error("[Discord Webhook] Signature verification error:", error);
    return false;
  }
}

/**
 * Convert a hex string to a Uint8Array.
 */
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
