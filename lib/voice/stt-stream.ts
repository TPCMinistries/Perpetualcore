import OpenAI from "openai";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to transcribe audio");
  }
  openai ??= new OpenAI({ apiKey });
  return openai;
}

/**
 * Transcribe an audio blob using OpenAI Whisper API
 * Server-side only
 */
export async function transcribeAudio(
  audioFile: File
): Promise<{ text: string; language?: string }> {
  const transcription = await getOpenAI().audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language: "en",
  });

  return {
    text: transcription.text,
    language: "en",
  };
}
