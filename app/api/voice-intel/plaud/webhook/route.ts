import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyPlaudSignature, fetchPlaudTranscript, fetchPlaudAudio } from "@/lib/voice-intel/plaud-client";
import { classifyVoiceMemo } from "@/lib/voice-intel/classifier";
import type { PlaudWebhookEvent } from "@/lib/voice-intel/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST - Plaud AI webhook receiver
 * Handles audio_transcribe.completed events
 */
export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("Plaud-Signature") || "";

    // Verify webhook signature
    if (!verifyPlaudSignature(bodyText, signature)) {
      console.error("Plaud webhook: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event: PlaudWebhookEvent = JSON.parse(bodyText);

    // Only handle transcription completed events
    if (event.event !== "audio_transcribe.completed") {
      return NextResponse.json({ status: "ignored" });
    }

    const supabase = createAdminClient();
    const userId = process.env.LORENZO_USER_ID;
    if (!userId) {
      console.error("Plaud webhook: LORENZO_USER_ID not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Idempotency check — skip if we already processed this file
    const { data: existing } = await supabase
      .from("voice_memos")
      .select("id")
      .eq("external_id", event.data.file_id)
      .single();

    if (existing) {
      return NextResponse.json({ status: "already_processed" });
    }

    // Fetch transcript from Plaud
    const { text: transcript, srt } = await fetchPlaudTranscript(
      event.data.workflow_id
    );

    // Fetch audio from Plaud
    const audioBuffer = await fetchPlaudAudio(event.data.file_id);

    // Upload audio to Supabase Storage
    const audioPath = `${userId}/${Date.now()}-plaud-${event.data.file_id}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from("voice-memos")
      .upload(audioPath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Plaud webhook: audio upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload audio" },
        { status: 500 }
      );
    }

    // Create voice memo record
    const { data: memo, error: insertError } = await supabase
      .from("voice_memos")
      .insert({
        user_id: userId,
        title: event.data.file_name || `Plaud Recording ${new Date().toLocaleString()}`,
        audio_url: audioPath,
        transcript,
        srt_transcript: srt,
        source: "plaud",
        external_id: event.data.file_id,
        processing_status: "completed",
        classification_status: "pending",
        recorded_at: event.timestamp || new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !memo) {
      console.error("Plaud webhook: memo insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create voice memo" },
        { status: 500 }
      );
    }

    // Trigger Brain classification in background
    classifyVoiceMemo(memo.id, userId, transcript, memo.title).catch((err) =>
      console.error(`Plaud webhook: classification failed for memo ${memo.id}:`, err)
    );

    return NextResponse.json({ status: "processed", memo_id: memo.id });
  } catch (error) {
    console.error("Plaud webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
