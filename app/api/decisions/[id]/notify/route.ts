import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/decisions/[id]/notify - Send notifications about a decision
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get the decision
    const { data: decision, error: decisionError } = await supabase
      .from("decisions")
      .select("*")
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .single();

    if (decisionError || !decision) {
      return NextResponse.json({ error: "Decision not found" }, { status: 404 });
    }

    const body = await request.json();
    const { recipient_ids, message, send_email, notification_type } = body;

    if (!recipient_ids || !Array.isArray(recipient_ids) || recipient_ids.length === 0) {
      return NextResponse.json({ error: "recipient_ids is required" }, { status: 400 });
    }

    const notificationType = notification_type || (decision.status === "decided" ? "decision_made" : "status_changed");
    const title = decision.status === "decided"
      ? `Decision Made: ${decision.title}`
      : `Decision Update: ${decision.title}`;

    const notificationMessage = message || (
      decision.status === "decided"
        ? `A decision has been made: ${decision.decision_made || decision.title}`
        : `The decision "${decision.title}" has been updated.`
    );

    // Create in-app notifications for each recipient
    const notifications = recipient_ids.map((recipientId: string) => ({
      user_id: recipientId,
      decision_id: id,
      notification_type: notificationType,
      title,
      message: notificationMessage,
      triggered_by: user.id,
      sent_in_app: true,
      sent_email: send_email || false,
    }));

    const { data: createdNotifications, error: notifError } = await supabase
      .from("decision_notifications")
      .insert(notifications)
      .select();

    if (notifError) {
      console.error("Error creating notifications:", notifError);
      // Try to create in the general notifications table as fallback
      const generalNotifications = recipient_ids.map((recipientId: string) => ({
        user_id: recipientId,
        organization_id: profile.organization_id,
        type: "system",
        title,
        message: notificationMessage,
        triggered_by: user.id,
        sent_in_app: true,
        sent_email: send_email || false,
        metadata: { decision_id: id, notification_type: notificationType },
      }));

      await supabase.from("notifications").insert(generalNotifications);
    }

    // If email is requested, send emails directly and queue for backup
    let emailsSent = 0;
    if (send_email) {
      // Get recipient details
      const { data: recipients } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", recipient_ids);

      if (recipients && recipients.length > 0) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com";
        const decisionUrl = `${appUrl}/dashboard/command-center?tab=decisions&id=${id}`;

        // Send emails directly using Resend
        for (const recipient of recipients) {
          if (!recipient.email) continue;

          const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi ${recipient.full_name || "there"},
              </p>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${notificationMessage}
              </p>
              <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <table width="100%" cellpadding="8" style="font-size: 15px; color: #4b5563;">
                  <tr>
                    <td style="font-weight: 600; width: 120px;">Decision:</td>
                    <td>${decision.title}</td>
                  </tr>
                  ${decision.decision_made ? `
                  <tr>
                    <td style="font-weight: 600;">Outcome:</td>
                    <td>${decision.decision_made}</td>
                  </tr>
                  ` : ""}
                  <tr>
                    <td style="font-weight: 600;">Priority:</td>
                    <td style="text-transform: capitalize;">${decision.priority || "medium"}</td>
                  </tr>
                  ${decision.due_date ? `
                  <tr>
                    <td style="font-weight: 600;">Due Date:</td>
                    <td>${new Date(decision.due_date).toLocaleDateString()}</td>
                  </tr>
                  ` : ""}
                </table>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${decisionUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">View Decision</a>
              </div>
              <p style="margin: 30px 0 0; color: #9ca3af; font-size: 14px;">
                Sent by ${profile.full_name || "a team member"}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                © ${new Date().getFullYear()} Perpetual Core. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

          const result = await sendEmail(recipient.email, title, emailHtml);
          if (result.success) {
            emailsSent++;
          } else {
            console.error(`Failed to send email to ${recipient.email}:`, result.error);
          }
        }

        // Also queue to email_outbox for backup/tracking
        const emails = recipients.map((recipient) => ({
          organization_id: profile.organization_id,
          sent_by: user.id,
          recipient_user_id: recipient.id,
          recipient_email: recipient.email,
          recipient_name: recipient.full_name,
          subject: title,
          body_text: `${notificationMessage}\n\nFrom: ${profile.full_name}\n\nDecision: ${decision.title}${decision.decision_made ? `\nOutcome: ${decision.decision_made}` : ""}`,
          body_html: null,
          context_type: "decision",
          context_id: id,
          status: emailsSent > 0 ? "sent" : "pending",
        }));

        const { error: emailError } = await supabase
          .from("email_outbox")
          .insert(emails);

        if (emailError) {
          console.error("Error queuing emails:", emailError);
          // Don't fail the request, just log the error
        }
      }
    }

    // Record event
    await supabase.from("decision_events").insert({
      decision_id: id,
      event_type: "reminder_sent",
      comment: `Notifications sent to ${recipient_ids.length} recipient(s)${emailsSent > 0 ? `, ${emailsSent} email(s) delivered` : ""}`,
      performed_by: user.id,
      performed_by_system: false,
      metadata: {
        recipient_count: recipient_ids.length,
        send_email: send_email || false,
        emails_sent: emailsSent
      },
    });

    return NextResponse.json({
      success: true,
      notifications_sent: recipient_ids.length,
      emails_sent: emailsSent,
    });
  } catch (error) {
    console.error("Send notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
