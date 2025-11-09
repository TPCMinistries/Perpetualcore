import { NextRequest, NextResponse } from "next/server";
import { resend, EMAIL_FROM, APP_URL } from "@/lib/email/config";
import { WelcomeEmail } from "@/lib/email/templates/WelcomeEmail";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userName, userEmail } = body;

    // Validate required fields
    if (!userName || !userEmail) {
      return NextResponse.json(
        { error: "userName and userEmail are required" },
        { status: 400 }
      );
    }

    // Send welcome email using Resend
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: userEmail,
      subject: "Welcome to Perpetual Core! 🎉",
      react: WelcomeEmail({
        userName,
        userEmail,
        loginUrl: `${APP_URL}/login`,
      }),
    });

    if (error) {
      console.error("Error sending welcome email:", error);
      return NextResponse.json(
        { error: "Failed to send welcome email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Welcome email sent successfully",
      emailId: data?.id,
    });
  } catch (error: any) {
    console.error("Welcome email error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
