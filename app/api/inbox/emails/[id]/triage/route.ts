import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { triageEmail } from "@/lib/email/gmail";

/**
 * POST /api/inbox/emails/[id]/triage
 * On-demand AI triage - only runs when user opens an email
 * This saves ~90% on AI costs vs triaging all synced emails
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the email
    const { data: email, error: emailError } = await supabase
      .from("emails")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (emailError || !email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Check if already triaged
    if (email.ai_triaged_at) {
      return NextResponse.json({
        already_triaged: true,
        triage: {
          priority_score: email.ai_priority_score,
          category: email.ai_category,
          summary: email.ai_summary,
          sentiment: email.ai_sentiment,
          requires_response: email.requires_response,
        },
      });
    }

    // Perform AI triage
    const triage = await triageEmail({
      subject: email.subject || "(No Subject)",
      from: email.from_email || "",
      body: email.body_text || email.body_html || "",
    });

    // Update the email with triage results
    const { error: updateError } = await supabase
      .from("emails")
      .update({
        ai_priority_score: triage.priority_score,
        ai_category: triage.category,
        ai_summary: triage.summary,
        ai_sentiment: triage.sentiment,
        requires_response: triage.requires_response,
        ai_triaged_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating email with triage:", updateError);
      return NextResponse.json(
        { error: "Failed to save triage results" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      triage,
    });
  } catch (error) {
    console.error("Triage API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
