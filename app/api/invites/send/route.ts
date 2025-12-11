import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendReferralInviteEmail } from "@/lib/email";

const isDev = process.env.NODE_ENV === "development";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, message, referralLink } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Get user profile for sender info
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const senderName = profile?.full_name || profile?.email || "A colleague";

    // Send the referral invite email
    await sendReferralInviteEmail({
      email,
      senderName,
      message,
      referralLink,
    });

    if (isDev) console.log("Invite email sent:", {
      to: email,
      senderName,
      referralLink,
    });

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
    });
  } catch (error) {
    if (isDev) console.error("Error sending invite:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}
