import { requireAdmin } from "@/lib/auth/admin";
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

    const supabase = await createClient();

    // Get current user
    await requireAdmin();

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
