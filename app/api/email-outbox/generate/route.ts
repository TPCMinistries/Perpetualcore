import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gateFeature } from "@/lib/features/gate";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/email-outbox/generate
 * Generate an AI email draft using Claude
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await checkRateLimit(request, rateLimiters.imageGen);
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Feature gate: email integration
    const { data: genProfile } = await supabase
      .from("profiles")
      .select("organization_id, full_name")
      .eq("id", user.id)
      .single();
    if (genProfile?.organization_id) {
      const gate = await gateFeature("email_integration", genProfile.organization_id);
      if (!gate.allowed) {
        return NextResponse.json(
          { error: gate.reason, code: "FEATURE_GATED", upgrade: gate.upgrade },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      recipient_email,
      email_type = "follow_up",
      context = "",
      meeting_id,
    } = body;

    if (!recipient_email) {
      return NextResponse.json(
        { error: "recipient_email is required" },
        { status: 400 }
      );
    }

    // Gather meeting context if provided
    let meetingContext = "";
    if (meeting_id) {
      const { data: meeting } = await supabase
        .from("meetings")
        .select("title, notes, meeting_type, start_time")
        .eq("id", meeting_id)
        .eq("user_id", user.id)
        .single();
      if (meeting) {
        meetingContext = `\nMeeting: "${meeting.title}" (${meeting.meeting_type}, ${meeting.start_time})\nNotes: ${meeting.notes || "None"}`;
      }
    }

    // Generate email draft with Claude
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const emailTypePrompts: Record<string, string> = {
      follow_up: "a professional follow-up email",
      introduction: "an introduction email",
      thank_you: "a thank-you email",
      meeting_request: "a meeting request email",
      proposal: "a proposal or pitch email",
      reminder: "a friendly reminder email",
    };

    const typeDescription = emailTypePrompts[email_type] || "a professional email";
    const senderName = genProfile?.full_name || "the sender";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Write ${typeDescription} from ${senderName} to ${recipient_email}.

${context ? `Context: ${context}` : ""}${meetingContext}

Return ONLY a JSON object with these fields:
- "subject": A concise email subject line
- "body": The full email body text (professional, concise, no markdown)
- "to": The recipient email address

No markdown, no explanation, just valid JSON.`,
        },
      ],
    });

    const aiText =
      response.content[0].type === "text" ? response.content[0].text : "";

    let result;
    try {
      result = JSON.parse(aiText);
    } catch {
      console.error("Failed to parse AI email response:", aiText);
      return NextResponse.json(
        { error: "AI generation returned invalid format" },
        { status: 500 }
      );
    }

    // Save the draft to database
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
      console.error("Failed to save draft:", saveError);
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
