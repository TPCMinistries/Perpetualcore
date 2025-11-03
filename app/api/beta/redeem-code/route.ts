import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json(
        { error: "Code and userId are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find the invite code
    const { data: inviteCode, error: codeError } = await supabase
      .from("beta_invite_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (codeError || !inviteCode) {
      return NextResponse.json(
        { success: false, message: "Invalid invite code" },
        { status: 400 }
      );
    }

    // Check if code is expired
    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, message: "This invite code has expired" },
        { status: 400 }
      );
    }

    // Check if code has reached max uses
    if (inviteCode.uses_count >= inviteCode.max_uses) {
      return NextResponse.json(
        { success: false, message: "This invite code has been fully redeemed" },
        { status: 400 }
      );
    }

    // Check if user has already redeemed this code
    const { data: existingRedemption } = await supabase
      .from("code_redemptions")
      .select("*")
      .eq("code_id", inviteCode.id)
      .eq("user_id", userId)
      .single();

    if (existingRedemption) {
      return NextResponse.json(
        { success: false, message: "You have already redeemed this code" },
        { status: 400 }
      );
    }

    // Update user profile to beta tester
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        beta_tester: true,
        beta_tier: inviteCode.beta_tier,
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return NextResponse.json(
        { success: false, message: "Failed to activate beta access" },
        { status: 500 }
      );
    }

    // Record the redemption
    const { error: redemptionError } = await supabase
      .from("code_redemptions")
      .insert({
        code_id: inviteCode.id,
        user_id: userId,
      });

    if (redemptionError) {
      console.error("Error recording redemption:", redemptionError);
    }

    // Increment uses count
    const { error: updateError } = await supabase
      .from("beta_invite_codes")
      .update({
        uses_count: inviteCode.uses_count + 1,
      })
      .eq("id", inviteCode.id);

    if (updateError) {
      console.error("Error updating code uses:", updateError);
    }

    return NextResponse.json({
      success: true,
      message: "Beta access activated!",
      betaTier: inviteCode.beta_tier,
    });
  } catch (error: any) {
    console.error("Error redeeming invite code:", error);
    return NextResponse.json(
      { error: "Failed to redeem invite code" },
      { status: 500 }
    );
  }
}
