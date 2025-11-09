import { NextRequest, NextResponse } from "next/server";
import { resend, EMAIL_FROM } from "@/lib/email/config";
import { FormSubmissionEmail } from "@/lib/email/templates/FormSubmissionEmail";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formType, submitterName, submitterEmail, formData } = body;

    // Validate required fields
    if (!formType || !submitterName || !submitterEmail || !formData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const submittedAt = new Date().toISOString();

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: EMAIL_FROM, // Send to yourself
      replyTo: submitterEmail,
      subject: `New ${formType} Form Submission from ${submitterName}`,
      react: FormSubmissionEmail({
        formType,
        submitterName,
        submitterEmail,
        formData,
        submittedAt,
      }),
    });

    if (error) {
      console.error("Error sending form submission email:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    // Optionally: Store submission in database
    try {
      const supabase = await createClient();
      await supabase.from("form_submissions").insert({
        form_type: formType,
        submitter_name: submitterName,
        submitter_email: submitterEmail,
        form_data: formData,
        email_sent: true,
        email_id: data?.id,
      });
    } catch (dbError) {
      console.error("Error storing form submission:", dbError);
      // Don't fail the request if database insert fails
    }

    return NextResponse.json({
      success: true,
      message: "Form submitted successfully",
      emailId: data?.id,
    });
  } catch (error: any) {
    console.error("Form submission error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
