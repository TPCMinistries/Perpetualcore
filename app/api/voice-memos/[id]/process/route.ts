import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";
import { classifyVoiceMemo } from "@/lib/voice-intel/classifier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST - Brain-classify a voice memo (entity/activity/action + prophetic + actions)
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

    // Run Brain classification
    const result = await classifyVoiceMemo(
      id,
      user.id,
      memo.transcript,
      memo.title
    );

    // Fetch updated memo after classification
    const adminSupabase = createAdminClient();
    const { data: updatedMemo } = await adminSupabase
      .from("voice_memos")
      .select("*")
      .eq("id", id)
      .single();

    return NextResponse.json({
      memo: updatedMemo || memo,
      classification: result.classification,
      actions: result.actions,
    });
  } catch (error) {
    console.error("Voice memo process error:", error);
    return NextResponse.json(
      { error: "AI processing failed" },
      { status: 500 }
    );
  }
}
