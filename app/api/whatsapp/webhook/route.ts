import { NextRequest, NextResponse } from "next/server";
import { processIncomingWhatsAppMessage } from "@/lib/whatsapp/twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const formData = await req.formData();

    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    const body = formData.get("Body") as string;
    const messageSid = formData.get("MessageSid") as string;
    const numMedia = parseInt(formData.get("NumMedia") as string) || 0;

    // Get media URL if present
    let mediaUrl: string | undefined;
    if (numMedia > 0) {
      mediaUrl = formData.get("MediaUrl0") as string;
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
