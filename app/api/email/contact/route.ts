import { NextRequest, NextResponse } from "next/server";
import { resend, EMAIL_FROM } from "@/lib/email/config";
import { ContactFormEmail } from "@/lib/email/templates/ContactFormEmail";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message, phone, company } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: EMAIL_FROM, // Send to yourself
      replyTo: email, // Allow easy reply to sender
      subject: subject || `New Contact Form Submission from ${name}`,
      react: ContactFormEmail({
        name,
        email,
        subject,
        message,
        phone,
        company,
      }),
    });

    if (error) {
      console.error("Error sending contact email:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    // Optionally: Store submission in database for record-keeping
    try {
      const supabase = await createClient();
      await supabase.from("contact_submissions").insert({
        name,
        email,
        subject,
        message,
        phone,
        company,
        email_sent: true,
        email_id: data?.id,
      });
    } catch (dbError) {
      console.error("Error storing contact submission:", dbError);
      // Don't fail the request if database insert fails
    }

    return NextResponse.json({
      success: true,
      message: "Contact form submitted successfully",
      emailId: data?.id,
    });
  } catch (error: any) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
