import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio");

    if (!(audioFile instanceof File)) {
      return new Response("No audio provided", { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY missing for transcription endpoint");
      return new Response("Server configuration error", { status: 500 });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "gpt-4o-mini-transcribe",
      response_format: "json",
      temperature: 0.2,
    });

    return Response.json({
      text: transcription.text?.trim() ?? "",
    });
  } catch (error) {
    console.error("Voice transcription error:", error);
    return new Response("Transcription failed", { status: 500 });
  }
}
