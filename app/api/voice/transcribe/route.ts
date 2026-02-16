import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { transcribeAudio } from "@/lib/voice/stt-stream";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting - STT is an expensive operation
    const rateLimitResponse = await checkRateLimit(req, rateLimiters.imageGen);
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return new Response("No audio file provided", { status: 400 });
    }

    // Transcribe using Whisper via shared utility
    const result = await transcribeAudio(audioFile);

    return Response.json({
      text: result.text,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return new Response("Transcription failed", { status: 500 });
  }
}
