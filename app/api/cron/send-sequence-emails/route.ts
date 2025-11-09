import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/email/config";

// This endpoint should be called by a cron job (Vercel Cron or external service)
// Add authentication header check for security
const CRON_SECRET = process.env.CRON_SECRET || "your-secret-key-here";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get pending emails to send (using our database function)
    const { data: pendingEmails, error } = await supabase.rpc(
      "get_pending_sequence_emails",
      { batch_size: 50 }
    );

    if (error) throw error;

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending emails to send",
        sent: 0,
      });
    }

    let sentCount = 0;
    const errors: any[] = [];

    // Send each email
    for (const emailData of pendingEmails) {
      try {
        // Replace template variables
        const subject = emailData.subject
          .replace("{FIRST_NAME}", emailData.lead_first_name || "there")
          .replace("{LEAD_MAGNET_NAME}", "AI Productivity Guide");

        // For now, send a simple email (later we'll add template rendering)
        const { data: emailResult, error: sendError } = await resend.emails.send({
          from: EMAIL_FROM,
          to: emailData.lead_email,
          subject,
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2>Hi ${emailData.lead_first_name || "there"}!</h2>
                  <p>This is email from your ${emailData.sequence_name} sequence.</p>
                  <p>${emailData.email_template}</p>
                  <p>Best regards,<br/>The Perpetual Core Team</p>
                </div>
              </body>
            </html>
          `,
        });

        if (sendError) {
          throw sendError;
        }

        // Mark email as sent
        await supabase
          .from("email_sequence_sends")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            resend_email_id: emailResult?.id,
          })
          .eq("id", emailData.send_id);

        sentCount++;
      } catch (emailError: any) {
        console.error(`Failed to send email ${emailData.send_id}:`, emailError);

        // Mark as failed
        await supabase
          .from("email_sequence_sends")
          .update({
            status: "failed",
            error_message: emailError.message,
          })
          .eq("id", emailData.send_id);

        errors.push({
          send_id: emailData.send_id,
          error: emailError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${pendingEmails.length} emails`,
      sent: sentCount,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export const runtime = "edge";
export const maxDuration = 300; // 5 minutes max
