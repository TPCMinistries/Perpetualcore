import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

    // TODO: Implement actual email sending via Resend or similar service
    // For now, just log and return success
    console.log("Invite email would be sent:", {
      to: email,
      from: profile?.email,
      senderName,
      message,
      referralLink,
    });

    // In production, send via Resend:
    /*
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Perpetual Core <invites@perpetualcore.com>",
      to: email,
      subject: `${senderName} invited you to Perpetual Core`,
      html: `
        <h2>${senderName} invited you to join Perpetual Core</h2>
        ${message ? `<p><em>"${message}"</em></p>` : ""}
        <p>Perpetual Core is an infinite memory AI brain that remembers everything you share with it.</p>
        <p><a href="${referralLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a></p>
        <p style="color: #666; font-size: 14px;">Or copy this link: ${referralLink}</p>
      `,
    });
    */

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
    });
  } catch (error) {
    console.error("Error sending invite:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}
