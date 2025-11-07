import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendVerificationCode,
  verifyWhatsAppNumber,
} from "@/lib/whatsapp/twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST - Connect WhatsApp number (send verification code)
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
    const { phoneNumber, action } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number required" },
        { status: 400 }
      );
    }

    if (action === "verify") {
      // Verify with code
      const { code } = body;
      if (!code) {
        return NextResponse.json(
          { error: "Verification code required" },
          { status: 400 }
        );
      }

      const result = await verifyWhatsAppNumber(phoneNumber, code);
      return NextResponse.json(result);
    } else {
      // Send verification code
      const result = await sendVerificationCode(
        phoneNumber,
        user.id,
        profile.organization_id
      );
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("WhatsApp connect error:", error);
    return NextResponse.json(
      { error: "Failed to connect WhatsApp" },
      { status: 500 }
    );
  }
}

/**
 * GET - Get connected WhatsApp accounts
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

    const { data: accounts, error } = await supabase
      .from("whatsapp_accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching WhatsApp accounts:", error);
      return NextResponse.json(
        { error: "Failed to fetch accounts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ accounts: accounts || [] });
  } catch (error) {
    console.error("WhatsApp connect GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}
