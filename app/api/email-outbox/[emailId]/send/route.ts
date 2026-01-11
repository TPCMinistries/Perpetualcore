import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTenantEmail } from "@/lib/email/tenant-email-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/email-outbox/[emailId]/send
 * Send an email from the outbox using multi-tenant email configuration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ emailId: string }> }
) {
  try {
    const { emailId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile to get organization_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, full_name")
      .eq("id", user.id)
      .single();

    // Get the email
    const { data: email, error: fetchError } = await supabase
      .from("email_outbox")
      .select("*")
      .eq("id", emailId)
      .eq("sent_by", user.id)
      .single();

    if (fetchError || !email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    if (email.status === "sent") {
      return NextResponse.json(
        { error: "Email has already been sent" },
        { status: 400 }
      );
    }

    // Update status to sending
    await supabase
      .from("email_outbox")
      .update({ status: "sending" })
      .eq("id", emailId);

    // Convert plain text body to simple HTML if no HTML version exists
    const htmlBody = email.body_html || `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto;">
    ${email.body_text.split('\n').map((line: string) =>
      line.trim() === '' ? '<br>' : `<p style="margin: 0 0 1em 0;">${line}</p>`
    ).join('\n')}
  </div>
</body>
</html>
    `.trim();

    // Send the email using tenant-aware email service
    const result = await sendTenantEmail({
      organizationId: profile?.organization_id || "",
      to: email.recipient_email,
      subject: email.subject,
      html: htmlBody,
      text: email.body_text,
      fromName: profile?.full_name || "Perpetual Core",
      outboxId: emailId,
      includeSignature: true,
      includeFooter: true,
    });

    if (!result.success) {
      // TenantEmailService already updated status to failed, but we also need to increment retry_count
      await supabase
        .from("email_outbox")
        .update({
          retry_count: (email.retry_count || 0) + 1,
        })
        .eq("id", emailId);

      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    // Fetch the updated email (TenantEmailService already updated status to sent)
    const { data: updatedEmail } = await supabase
      .from("email_outbox")
      .select()
      .eq("id", emailId)
      .single();

    // Transform to UI format
    const transformedEmail = updatedEmail ? {
      id: updatedEmail.id,
      to_email: updatedEmail.recipient_email,
      subject: updatedEmail.subject,
      body: updatedEmail.body_text,
      status: "sent",
      sent_at: updatedEmail.sent_at,
      created_at: updatedEmail.created_at,
    } : null;

    return NextResponse.json({
      success: true,
      email: transformedEmail,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
