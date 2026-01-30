import { NextRequest, NextResponse } from "next/server";
import { processIncomingWhatsAppMessage } from "@/lib/whatsapp/twilio";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Verify Twilio request signature
 * https://www.twilio.com/docs/usage/security#validating-requests
 */
function verifyTwilioSignature(
  signature: string | null,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Skip validation in development or if auth token not configured
  if (!authToken || process.env.NODE_ENV === "development") {
    console.warn("⚠️ Skipping Twilio signature validation (dev mode or no auth token)");
    return true;
  }

  if (!signature) {
    console.error("❌ Missing Twilio signature header");
    return false;
  }

  // Sort parameters alphabetically and concatenate
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], "");

  const dataToSign = url + sortedParams;
  const expectedSignature = crypto
    .createHmac("sha1", authToken)
    .update(Buffer.from(dataToSign, "utf-8"))
    .digest("base64");

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    console.error("❌ Invalid Twilio signature");
  }

  return isValid;
}

/**
 * POST - Twilio WhatsApp webhook handler
 *
 * This endpoint receives incoming WhatsApp messages from Twilio
 * Configure in Twilio Console:
 * Messaging → WhatsApp Sandbox → When a message comes in:
 * https://your-domain.com/api/whatsapp/webhook
 */
export async function POST(req: NextRequest) {
  try {
    // Get Twilio signature from headers
    const twilioSignature = req.headers.get("x-twilio-signature");
    const url = req.url;

    const formData = await req.formData();

    // Convert formData to params object for signature verification
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    // Verify the request is actually from Twilio
    if (!verifyTwilioSignature(twilioSignature, url, params)) {
      console.error("🚨 Unauthorized WhatsApp webhook request - invalid signature");
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Use params from verification step
    const from = params.From || "";
    const to = params.To || "";
    const body = params.Body || "";
    const messageSid = params.MessageSid || "";
    const numMedia = parseInt(params.NumMedia || "0") || 0;

    // Get media URL if present
    let mediaUrl: string | undefined;
    if (numMedia > 0) {
      mediaUrl = params.MediaUrl0;
    }

    console.log("📱 Incoming WhatsApp message:", {
      from,
      to,
      body: body?.substring(0, 50) + "...",
      messageSid,
    });

    // Process the message
    const result = await processIncomingWhatsAppMessage(
      from,
      to,
      body,
      messageSid,
      numMedia,
      mediaUrl
    );

    if (!result.success) {
      console.error("Failed to process WhatsApp message:", result.error);
    }

    // Twilio expects a 200 OK response
    // We don't send TwiML response here since we're using the API to send replies
    return new NextResponse("", { status: 200 });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    // Still return 200 to avoid Twilio retries
    return new NextResponse("", { status: 200 });
  }
}

/**
 * GET - Webhook verification (optional)
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "WhatsApp webhook endpoint",
    method: "POST",
    description: "Receives incoming WhatsApp messages from Twilio",
  });
}
