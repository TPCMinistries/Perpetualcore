import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Fetch WhatsApp messages
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const conversationPhone = searchParams.get("phone");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (conversationPhone) {
      query = query.or(`from_number.eq.${conversationPhone},to_number.eq.${conversationPhone}`);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("Error fetching WhatsApp messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("WhatsApp messages GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

/**
 * POST - Send WhatsApp message
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const body = await req.json();
    const { to, message, mediaUrl } = body;

    if (!to || !message) {
      return NextResponse.json(
        { error: "To and message are required" },
        { status: 400 }
      );
    }

    // Get user's WhatsApp account
    const { data: account } = await supabase
      .from("whatsapp_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "verified")
      .single();

    if (!account) {
      return NextResponse.json(
        { error: "No verified WhatsApp account found" },
        { status: 400 }
      );
    }

    // Send message via Twilio
    const result = await sendWhatsAppMessage(to, message, mediaUrl);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send message" },
        { status: 500 }
      );
    }

    // Save to database
    const { data: savedMessage, error: saveError } = await supabase
      .from("whatsapp_messages")
      .insert({
        whatsapp_account_id: account.id,
        organization_id: profile.organization_id,
        user_id: user.id,
        twilio_message_sid: result.messageSid,
        direction: "outbound",
        from_number: account.phone_number,
        to_number: to.replace("whatsapp:", ""),
        body: message,
        media_url: mediaUrl,
        status: "sent",
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving outbound message:", saveError);
    }

    return NextResponse.json({
      success: true,
      message: savedMessage,
      messageSid: result.messageSid,
    });
  } catch (error) {
    console.error("WhatsApp messages POST error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
