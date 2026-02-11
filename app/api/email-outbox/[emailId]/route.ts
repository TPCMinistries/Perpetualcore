import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gateFeature } from "@/lib/features/gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/email-outbox/[emailId]
 * Get a specific email
 */
export async function GET(
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

    // Feature gate: email integration
    const { data: emailProfile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    if (emailProfile?.organization_id) {
      const gate = await gateFeature("email_integration", emailProfile.organization_id);
      if (!gate.allowed) {
        return NextResponse.json(
          { error: gate.reason, code: "FEATURE_GATED", upgrade: gate.upgrade },
          { status: 403 }
        );
      }
    }

    const { data: email, error } = await supabase
      .from("email_outbox")
      .select("*")
      .eq("id", emailId)
      .eq("sent_by", user.id)
      .single();

    if (error || !email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Transform to UI format
    const transformedEmail = {
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
    };

    return NextResponse.json({ email: transformedEmail });
  } catch (error) {
    console.error("Email outbox error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/email-outbox/[emailId]
 * Update an email draft
 */
export async function PUT(
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

    // Verify ownership
    const { data: existing } = await supabase
      .from("email_outbox")
      .select("id, status")
      .eq("id", emailId)
      .eq("sent_by", user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    if (existing.status === "sent") {
      return NextResponse.json(
        { error: "Cannot edit a sent email" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { to_email, subject, body: emailBody, recipient_name } = body;

    const updateData: Record<string, unknown> = {};
    if (to_email !== undefined) updateData.recipient_email = to_email;
    if (recipient_name !== undefined) updateData.recipient_name = recipient_name;
    if (subject !== undefined) updateData.subject = subject;
    if (emailBody !== undefined) updateData.body_text = emailBody;

    const { data: email, error } = await supabase
      .from("email_outbox")
      .update(updateData)
      .eq("id", emailId)
      .select()
      .single();

    if (error) {
      console.error("Error updating email:", error);
      return NextResponse.json(
        { error: "Failed to update email" },
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
      status: email.status === "pending" ? "draft" : email.status,
      context_type: email.context_type,
      created_at: email.created_at,
    };

    return NextResponse.json({ email: transformedEmail });
  } catch (error) {
    console.error("Email outbox error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/email-outbox/[emailId]
 * Delete an email draft
 */
export async function DELETE(
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

    const { error } = await supabase
      .from("email_outbox")
      .delete()
      .eq("id", emailId)
      .eq("sent_by", user.id);

    if (error) {
      console.error("Error deleting email:", error);
      return NextResponse.json(
        { error: "Failed to delete email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email outbox error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
