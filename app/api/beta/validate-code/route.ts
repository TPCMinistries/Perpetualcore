import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Invalid code format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find the invite code
    const { data: inviteCode, error } = await supabase
      .from("beta_invite_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (error || !inviteCode) {
      return NextResponse.json(
        { valid: false, message: "Invalid invite code" },
        { status: 200 }
      );
    }

    // Check if code is expired
    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, message: "This invite code has expired" },
        { status: 200 }
      );
    }

    // Check if code has reached max uses
    if (inviteCode.uses_count >= inviteCode.max_uses) {
      return NextResponse.json(
        { valid: false, message: "This invite code has been fully redeemed" },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      betaTier: inviteCode.beta_tier,
      message: "Valid invite code",
    });
  } catch (error: any) {
    console.error("Error validating invite code:", error);
    return NextResponse.json(
      { error: "Failed to validate invite code" },
      { status: 500 }
    );
  }
}
