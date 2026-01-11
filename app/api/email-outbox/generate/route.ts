import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const N8N_WEBHOOK_URL = "https://upliftcommunities.app.n8n.cloud/webhook/draft-email";

/**
 * POST /api/email-outbox/generate
 * Trigger n8n workflow to generate an AI email draft
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

    const body = await request.json();
    const {
      recipient_email,
      email_type = "follow_up",
      context = "",
      meeting_id
    } = body;

    if (!recipient_email) {
      return NextResponse.json(
        { error: "recipient_email is required" },
        { status: 400 }
      );
    }

    // Call the n8n webhook to generate the email draft
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient_email,
        email_type,
        context,
        meeting_id,
        user_id: user.id,
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error("n8n webhook error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate email draft" },
        { status: 500 }
      );
    }

    const result = await n8nResponse.json();

    // Save the draft to our local Supabase database
    // (n8n's Supabase connection points to a different database)
    const { data: savedEmail, error: saveError } = await supabase
      .from("email_outbox")
      .insert({
        sent_by: user.id,
        recipient_email: result.to || recipient_email,
        recipient_name: recipient_email.split("@")[0],
        subject: result.subject || "Follow-up",
        body_text: result.body || "",
        status: "draft",
        context_type: email_type,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Failed to save draft to database:", saveError);
      // Still return the generated content even if save fails
      return NextResponse.json({
        success: true,
        message: "Email draft generated (not saved)",
        subject: result.subject,
        body: result.body,
        to: result.to,
        warning: "Draft was generated but could not be saved to database",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Email draft generated and saved",
      email_id: savedEmail.id,
      subject: savedEmail.subject,
      to: savedEmail.recipient_email,
    });
  } catch (error) {
    console.error("Generate email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
