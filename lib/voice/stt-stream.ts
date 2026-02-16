import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Transcribe an audio blob using OpenAI Whisper API
 * Server-side only
 */
export async function transcribeAudio(
  audioFile: File
): Promise<{ text: string; language?: string }> {
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language: "en",
  });

  return {
    text: transcription.text,
    language: "en",
  };
}
