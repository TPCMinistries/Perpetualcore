import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getClipMarkersForMemo } from "@/lib/voice-intel/audio-clipper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Return clip markers or a signed audio URL for playback
 *
 * Query params:
 *   memo (required) - voice memo ID
 *   start (optional) - clip start in ms
 *   end (optional) - clip end in ms
 *
 * Without start/end: returns all clip markers for the memo
 * With start+end: returns signed audio URL + timestamps for frontend seeking
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const memoId = searchParams.get("memo");
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    if (!memoId) {
      return NextResponse.json(
        { error: "Missing memo parameter" },
        { status: 400 }
      );
    }

    // If no start/end, return all clip markers
    if (!startParam || !endParam) {
      const clips = await getClipMarkersForMemo(memoId, user.id);
      return NextResponse.json({ clips, memoId });
    }

    const startMs = parseInt(startParam, 10);
    const endMs = parseInt(endParam, 10);

    if (isNaN(startMs) || isNaN(endMs) || startMs < 0 || endMs <= startMs) {
      return NextResponse.json(
        { error: "Invalid start/end timestamps" },
        { status: 400 }
      );
    }

    // Fetch the voice memo's audio URL
    const admin = createAdminClient();
    const { data: memo, error: memoError } = await admin
      .from("voice_memos")
      .select("audio_url")
      .eq("id", memoId)
      .eq("user_id", user.id)
      .single();

    if (memoError || !memo?.audio_url) {
      return NextResponse.json(
        { error: "Voice memo not found or has no audio" },
        { status: 404 }
      );
    }

    // Generate a signed URL for the audio file (1 hour expiry)
    // audio_url format is typically "voice-memos/userId/filename.mp3"
    const storagePath = memo.audio_url.replace(/^\//, "");
    const { data: signedData, error: signError } = await admin.storage
      .from("voice-memos")
      .createSignedUrl(storagePath, 3600);

    if (signError || !signedData?.signedUrl) {
      return NextResponse.json(
        { error: "Failed to generate signed URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      startMs,
      endMs,
      memoId,
    });
  } catch (error) {
    console.error("Voice intel clips GET error:", error);
    return NextResponse.json(
      { error: "Failed to process clip request" },
      { status: 500 }
    );
  }
}
