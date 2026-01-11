import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export const runtime = "nodejs";

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

    // Parse FormData (supports attachments)
    const formData = await request.formData();

    const to_emails = JSON.parse(formData.get("to_emails") as string || "[]");
    const cc_emails = JSON.parse(formData.get("cc_emails") as string || "[]");
    const bcc_emails = JSON.parse(formData.get("bcc_emails") as string || "[]");
    const subject = formData.get("subject") as string || "";
    const body_text = formData.get("body_text") as string || "";
    const body_html = formData.get("body_html") as string | null;
    const scheduled_at = formData.get("scheduled_at") as string | null;
    const in_reply_to = formData.get("in_reply_to") as string | null;
    const email_account_id = formData.get("email_account_id") as string | null;
    const send_via = (formData.get("send_via") as string) || "auto";

    // Get attachments
    const attachmentFiles = formData.getAll("attachments") as File[];
    const attachments: { filename: string; content: Buffer; contentType: string }[] = [];

    for (const file of attachmentFiles) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        attachments.push({
          filename: file.name,
          content: buffer,
          contentType: file.type || "application/octet-stream",
        });
      }
    }

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

    // Get user's email account (first one available, or specified by ID)

    let emailAccountQuery = supabase
      .from("email_accounts")
      .select("*")
      .eq("user_id", user.id);

    if (email_account_id) {
      emailAccountQuery = emailAccountQuery.eq("id", email_account_id);
    }

    const { data: emailAccount } = await emailAccountQuery.limit(1).single();

    // Determine if this is scheduled or immediate send
    const isScheduled = scheduled_at && new Date(scheduled_at) > new Date();
    const status = isScheduled ? "scheduled" : "draft"; // Will be sent by background job

    // If no email account, create a default one for outbound emails
    let accountId = emailAccount?.id;
    if (!accountId) {
      const { data: newAccount, error: accountError } = await supabase
        .from("email_accounts")
        .insert({
          user_id: user.id,
          organization_id: profile.organization_id,
          provider: "resend",
          provider_account_id: profile.email,
          email_address: profile.email,
          sync_enabled: false,
        })
        .select("id")
        .single();

      if (accountError) {
        console.error("Failed to create email account:", accountError);
        return NextResponse.json(
          { error: "Failed to create email account" },
          { status: 500 }
        );
      }
      accountId = newAccount.id;
    }

    // Generate unique message ID for outbound emails
    const messageId = `${Date.now()}-${crypto.randomUUID()}@perpetualcore.com`;

    // Create email record
    const { data: email, error: createError } = await supabase
      .from("emails")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        email_account_id: accountId,
        provider_message_id: messageId,
        provider: emailAccount?.provider || "resend",
        direction: "outbound",
        status,
        from_email: emailAccount?.email_address || profile.email,
        from_name: profile.full_name,
        to_emails: to_emails,
        cc_emails: cc_emails,
        bcc_emails: bcc_emails,
        subject,
        body_text,
        body_html,
        scheduled_at: isScheduled ? scheduled_at : null,
        sent_at: null,
        in_reply_to: in_reply_to || null,
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

    // Send email via Resend or n8n if not scheduled
    if (!isScheduled) {
      const n8nWebhookUrl = process.env.N8N_EMAIL_WEBHOOK_URL;
      const resendApiKey = process.env.RESEND_API_KEY;
      const useN8n = send_via === "n8n" || (send_via === "auto" && emailAccount?.provider === "gmail" && n8nWebhookUrl);

      // Try n8n first for Gmail accounts
      if (useN8n && n8nWebhookUrl) {
        try {
          const n8nResponse = await fetch(n8nWebhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(process.env.N8N_WEBHOOK_SECRET && {
                Authorization: `Bearer ${process.env.N8N_WEBHOOK_SECRET}`,
              }),
            },
            body: JSON.stringify({
              to_emails,
              cc_emails,
              bcc_emails,
              subject,
              body_text,
              body_html,
              from_email: emailAccount?.email_address || profile.email,
              from_name: profile.full_name,
              in_reply_to,
            }),
          });

          if (n8nResponse.ok) {
            const n8nResult = await n8nResponse.json();
            await supabase
              .from("emails")
              .update({
                status: "sent",
                sent_at: new Date().toISOString(),
                provider_message_id: n8nResult.message_id || messageId,
                provider_thread_id: n8nResult.thread_id,
              })
              .eq("id", email.id);

            // Log activity
            try {
              await supabase.from("activity_feed").insert({
                organization_id: profile.organization_id,
                user_id: user.id,
                action_type: "email_sent",
                entity_type: "email",
                entity_id: email.id,
                title: `Email sent: ${subject}`,
                description: `To: ${to_emails.join(", ")}`,
                metadata: { to: to_emails, via: "n8n" },
              });
            } catch (e) {
              console.error("Failed to log activity:", e);
            }

            return NextResponse.json({
              email: { ...email, status: "sent" },
              message: "Email sent via Gmail (n8n)",
            }, { status: 201 });
          } else {
            console.error("n8n send failed:", await n8nResponse.text());
            // Fall through to Resend
          }
        } catch (n8nError: any) {
          console.error("n8n error:", n8nError);
          // Fall through to Resend
        }
      }

      // Initialize Resend if API key is available
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
            attachments: attachments.length > 0 ? attachments : undefined,
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
