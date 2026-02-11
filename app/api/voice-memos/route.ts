import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET - List voice memos for the current user
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
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status"); // pending, processing, completed, failed
    const search = searchParams.get("search");

    let query = supabase
      .from("voice_memos")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("processing_status", status);
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,transcript.ilike.%${search}%,ai_summary.ilike.%${search}%`
      );
    }

    const { data: memos, error, count } = await query;

    if (error) {
      console.error("Voice memos fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch voice memos" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      memos: memos || [],
      count: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Voice memos GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch voice memos" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new voice memo (upload audio + transcribe)
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await checkRateLimit(req, rateLimiters.imageGen);
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const title = (formData.get("title") as string) || null;
    const durationSeconds = formData.get("duration")
      ? parseInt(formData.get("duration") as string)
      : null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Validate file size (50MB max)
    if (audioFile.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Audio file too large. Maximum size: 50MB" },
        { status: 400 }
      );
    }

    // Upload audio to Supabase Storage
    const fileExt = audioFile.name?.split(".").pop() || "webm";
    const uniqueFilename = `${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;

    const fileBuffer = await audioFile.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("voice-memos")
      .upload(uniqueFilename, fileBuffer, {
        contentType: audioFile.type || "audio/webm",
        upsert: false,
      });

    if (uploadError) {
      console.error("Voice memo upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload audio file" },
        { status: 500 }
      );
    }

    // Create voice memo record
    const { data: memo, error: insertError } = await supabase
      .from("voice_memos")
      .insert({
        user_id: user.id,
        title: title || `Voice Memo ${new Date().toLocaleString()}`,
        audio_url: uploadData.path,
        duration_seconds: durationSeconds,
        source: "manual",
        processing_status: "pending",
        recorded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Voice memo insert error:", insertError);
      // Clean up uploaded file
      await supabase.storage.from("voice-memos").remove([uniqueFilename]);
      return NextResponse.json(
        { error: "Failed to create voice memo record" },
        { status: 500 }
      );
    }

    // Transcribe in the background using admin client (async, don't block response)
    const adminSupabase = createAdminClient();
    transcribeAndProcess(memo.id, audioFile, adminSupabase).catch((err) =>
      console.error(`Voice memo ${memo.id} transcription failed:`, err)
    );

    return NextResponse.json({ memo }, { status: 201 });
  } catch (error) {
    console.error("Voice memos POST error:", error);
    return NextResponse.json(
      { error: "Failed to create voice memo" },
      { status: 500 }
    );
  }
}

/**
 * Background transcription using Whisper
 */
async function transcribeAndProcess(
  memoId: string,
  audioFile: File,
  supabase: ReturnType<typeof createAdminClient>
) {
  try {
    // Update status to processing
    await supabase
      .from("voice_memos")
      .update({ processing_status: "processing" })
      .eq("id", memoId);

    // Transcribe with Whisper (plain text + SRT for timestamps)
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const [transcription, srtTranscription] = await Promise.all([
      openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en",
      }),
      openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en",
        response_format: "srt",
      }).catch(() => null),
    ]);

    // Update with transcript + SRT
    await supabase
      .from("voice_memos")
      .update({
        transcript: transcription.text,
        srt_transcript: typeof srtTranscription === "string" ? srtTranscription : null,
        processing_status: "completed",
      })
      .eq("id", memoId);
  } catch (error) {
    console.error(`Transcription failed for memo ${memoId}:`, error);
    await supabase
      .from("voice_memos")
      .update({ processing_status: "failed" })
      .eq("id", memoId);
  }
}
