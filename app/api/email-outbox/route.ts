import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/email-outbox
 * List email drafts and sent emails
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, sent, failed, cancelled
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("email_outbox")
      .select("*")
      .eq("sent_by", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      // Map UI status to DB status
      const dbStatus = status === "draft" ? "pending" : status;
      query = query.eq("status", dbStatus);
    }

    const { data: emails, error } = await query;

    if (error) {
      console.error("Error fetching email outbox:", error);
      return NextResponse.json(
        { error: "Failed to fetch emails" },
        { status: 500 }
      );
    }

    // Transform to UI-friendly format
    const transformedEmails = (emails || []).map((email) => ({
      id: email.id,
      to_email: email.recipient_email,
      recipient_name: email.recipient_name,
      subject: email.subject,
      body: email.body_text,
      body_html: email.body_html,
      status: email.status === "pending" ? "draft" : email.status,
      context_type: email.context_type,
      context_id: email.context_id,
      error_message: email.error_message,
      sent_at: email.sent_at,
      created_at: email.created_at,
      scheduled_for: email.scheduled_for,
    }));

    return NextResponse.json({ emails: transformedEmails });
  } catch (error) {
    console.error("Email outbox error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email-outbox
 * Create a new email draft
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      // Try to get any organization
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id")
        .limit(1);

      if (!orgs || orgs.length === 0) {
        return NextResponse.json(
          { error: "No organization found" },
          { status: 400 }
        );
      }
      profile.organization_id = orgs[0].id;
    }

    const body = await request.json();
    const { to_email, recipient_name, subject, body: emailBody, context_type, context_id } = body;

    if (!to_email || !subject) {
      return NextResponse.json(
        { error: "to_email and subject are required" },
        { status: 400 }
      );
    }

    const { data: email, error } = await supabase
      .from("email_outbox")
      .insert({
        organization_id: profile.organization_id,
        sent_by: user.id,
        recipient_email: to_email,
        recipient_name: recipient_name || null,
        subject,
        body_text: emailBody || "",
        status: "pending",
        context_type: context_type || "general",
        context_id: context_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating email draft:", error);
      return NextResponse.json(
        { error: "Failed to create email draft" },
        { status: 500 }
      );
    }

    // Transform to UI format
    const transformedEmail = {
      id: email.id,
      to_email: email.recipient_email,
      recipient_name: email.recipient_name,
      subject: email.subject,
      body: email.body_text,
      status: "draft",
      context_type: email.context_type,
      created_at: email.created_at,
    };

    return NextResponse.json({ email: transformedEmail }, { status: 201 });
  } catch (error) {
    console.error("Email outbox error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
