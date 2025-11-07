import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendBetaInviteEmail } from "@/lib/email";

/**
 * POST /api/beta/resend-invite
 * Resend beta invitation email
 */
export async function POST(request: NextRequest) {
  try {
    const { email, code, betaTier } = await request.json();

    if (!email || !code || !betaTier) {
      return NextResponse.json(
        { error: "Email, code, and betaTier are required" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin check here

    // Send the email
    const result = await sendBetaInviteEmail(email, code, betaTier);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error resending invite:", error);
    return NextResponse.json(
      { error: "Failed to resend invite" },
      { status: 500 }
    );
  }
}
