import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { synthesizeSpeech } from "@/lib/voice/tts-stream";
import { VoiceId } from "@/lib/voice/constants";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting - TTS is an expensive operation
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

    const { text, voice } = await req.json();

    if (!text) {
      return new Response("No text provided", { status: 400 });
    }

    // Convert text to speech using shared utility
    const buffer = await synthesizeSpeech(text, voice as VoiceId);

    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return new Response("TTS failed", { status: 500 });
  }
}
