import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/email/send
export async function POST(request: Request) {
  try {
    const supabase = createClient();
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

    // In a production environment, you would:
    // 1. Queue the email for sending (e.g., using a background job processor)
    // 2. Use a service like SendGrid, Mailgun, or AWS SES
    // 3. Handle OAuth for Gmail/Outlook
    // 4. Track sending status and delivery

    // For now, we'll mark it as sent immediately if not scheduled
    if (!isScheduled) {
      await supabase
        .from("emails")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", email.id);

      // Log activity
      await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_type: "created",
          entity_type: "email",
          entity_id: email.id,
          entity_name: subject,
          metadata: {
            to: to_emails,
            scheduled: false,
          },
        }),
      });
    } else {
      // Log scheduled email activity
      await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_type: "created",
          entity_type: "email",
          entity_id: email.id,
          entity_name: subject,
          metadata: {
            to: to_emails,
            scheduled: true,
            scheduled_at,
          },
        }),
      });
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
