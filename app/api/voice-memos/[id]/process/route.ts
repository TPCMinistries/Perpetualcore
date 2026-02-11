import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST - AI-process a voice memo (summarize, extract tasks/contacts)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitResponse = await checkRateLimit(req, rateLimiters.imageGen);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the memo with transcript
    const { data: memo, error } = await supabase
      .from("voice_memos")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !memo) {
      return NextResponse.json(
        { error: "Voice memo not found" },
        { status: 404 }
      );
    }

    if (!memo.transcript) {
      return NextResponse.json(
        { error: "Voice memo has no transcript yet. Wait for transcription to complete." },
        { status: 400 }
      );
    }

    // Use Claude to extract structured data from transcript
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze this voice memo transcript and extract structured information. Return a JSON object with these fields:

- "summary": A 1-3 sentence summary of the memo's content
- "title": A concise descriptive title (5-8 words max) if the current title is generic
- "tasks": An array of task objects with { "description": string, "priority": "high"|"medium"|"low" }
- "contacts": An array of person names mentioned
- "meeting_type": If this sounds like a meeting/call summary, suggest a type: "one_on_one", "team_standup", "client_call", "brainstorm", "interview", or null
- "project_tags": Array of relevant topic/project tags (2-4 max)

Transcript:
"""
${memo.transcript}
"""

Return ONLY valid JSON, no markdown.`,
        },
      ],
    });

    // Parse the AI response
    const aiText =
      response.content[0].type === "text" ? response.content[0].text : "";

    let aiData;
    try {
      aiData = JSON.parse(aiText);
    } catch {
      console.error("Failed to parse AI response:", aiText);
      return NextResponse.json(
        { error: "AI processing returned invalid data" },
        { status: 500 }
      );
    }

    // Update memo with AI-extracted data using admin client for reliability
    const adminSupabase = createAdminClient();
    const { data: updatedMemo, error: updateError } = await adminSupabase
      .from("voice_memos")
      .update({
        ai_summary: aiData.summary || null,
        ai_extracted_tasks: aiData.tasks || null,
        ai_extracted_contacts: aiData.contacts || null,
        ai_suggested_meeting_type: aiData.meeting_type || null,
        project_tags: aiData.project_tags || null,
        title:
          aiData.title && memo.title?.startsWith("Voice Memo ")
            ? aiData.title
            : memo.title,
        processing_status: "completed",
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Voice memo AI update error:", updateError);
      return NextResponse.json(
        { error: "Failed to save AI processing results" },
        { status: 500 }
      );
    }

    return NextResponse.json({ memo: updatedMemo });
  } catch (error) {
    console.error("Voice memo process error:", error);
    return NextResponse.json(
      { error: "AI processing failed" },
      { status: 500 }
    );
  }
}
