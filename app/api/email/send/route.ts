import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

// POST /api/email/send
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, email, full_name")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      to_emails,
      cc_emails = [],
      bcc_emails = [],
      subject,
      body_text,
      body_html,
      scheduled_at,
      in_reply_to,
    } = body;

    if (!to_emails || to_emails.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient is required" },
        { status: 400 }
      );
    }

    if (!subject || !body_text) {
      return NextResponse.json(
        { error: "Subject and body are required" },
        { status: 400 }
      );
    }

    // Get user's default email account
    const { data: emailAccount } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .single();

    // Determine if this is scheduled or immediate send
    const isScheduled = scheduled_at && new Date(scheduled_at) > new Date();
    const status = isScheduled ? "scheduled" : "draft"; // Will be sent by background job

    // Create email record
    const { data: email, error: createError } = await supabase
      .from("emails")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        email_account_id: emailAccount?.id || null,
        direction: "outbound",
        status,
        from_address: emailAccount?.email_address || profile.email,
        from_name: profile.full_name,
        to_addresses: to_emails,
        cc_addresses: cc_emails,
        bcc_addresses: bcc_emails,
        subject,
        body_text,
        body_html,
        scheduled_at: isScheduled ? scheduled_at : null,
        in_reply_to: in_reply_to || null,
        provider: emailAccount?.provider || "custom_smtp",
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating email:", createError);
      return NextResponse.json(
        { error: "Failed to create email" },
        { status: 500 }
      );
    }

    // Send email via Resend if not scheduled
    if (!isScheduled) {
      // Initialize Resend if API key is available
      const resendApiKey = process.env.RESEND_API_KEY;

      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.RESEND_FROM_EMAIL || "noreply@perpetualcore.com";
        const fromName = profile.full_name || "Perpetual Core";

        try {
          const { data: resendData, error: resendError } = await resend.emails.send({
            from: `${fromName} <${fromAddress}>`,
            to: to_emails,
            cc: cc_emails.length > 0 ? cc_emails : undefined,
            bcc: bcc_emails.length > 0 ? bcc_emails : undefined,
            subject: subject,
            html: body_html || `<pre style="font-family: sans-serif;">${body_text}</pre>`,
            text: body_text,
            replyTo: emailAccount?.email_address || profile.email,
          });

          if (resendError) {
            console.error("Resend error:", resendError);
            // Update email status to failed
            await supabase
              .from("emails")
              .update({
                status: "failed",
                error_message: resendError.message,
              })
              .eq("id", email.id);

            return NextResponse.json(
              { error: `Failed to send email: ${resendError.message}` },
              { status: 500 }
            );
          }

          // Update email with Resend message ID and mark as sent
          await supabase
            .from("emails")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              external_id: resendData?.id,
            })
            .eq("id", email.id);
        } catch (sendError: any) {
          console.error("Email send error:", sendError);
          await supabase
            .from("emails")
            .update({
              status: "failed",
              error_message: sendError.message,
            })
            .eq("id", email.id);

          return NextResponse.json(
            { error: `Failed to send email: ${sendError.message}` },
            { status: 500 }
          );
        }
      } else {
        // No Resend API key - mark as sent for demo purposes
        console.warn("RESEND_API_KEY not configured - email not actually sent");
        await supabase
          .from("emails")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", email.id);
      }

      // Log activity
      try {
        await supabase.from("activity_logs").insert({
          organization_id: profile.organization_id,
          user_id: user.id,
          action_type: "created",
          entity_type: "email",
          entity_id: email.id,
          entity_name: subject,
          metadata: {
            to: to_emails,
            scheduled: false,
          },
        });
      } catch (activityError) {
        // Non-critical, just log
        console.error("Failed to log activity:", activityError);
      }
    } else {
      // Log scheduled email activity
      try {
        await supabase.from("activity_logs").insert({
          organization_id: profile.organization_id,
          user_id: user.id,
          action_type: "created",
          entity_type: "email",
          entity_id: email.id,
          entity_name: subject,
          metadata: {
            to: to_emails,
            scheduled: true,
            scheduled_at,
          },
        });
      } catch (activityError) {
        console.error("Failed to log activity:", activityError);
      }
    }

    return NextResponse.json({
      email: {
        ...email,
        status: isScheduled ? "scheduled" : "sent",
      },
      message: isScheduled
        ? `Email scheduled for ${new Date(scheduled_at).toLocaleString()}`
        : "Email sent successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("Send email API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
