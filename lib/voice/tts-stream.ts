import OpenAI from "openai";
import { VoiceId, DEFAULT_VOICE, VOICE_OPTIONS } from "./constants";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to synthesize speech");
  }
  openai ??= new OpenAI({ apiKey });
  return openai;
}

/**
 * Synthesize speech from text using OpenAI TTS API
 * Server-side only
 * @returns Audio buffer in mp3 format
 */
export async function synthesizeSpeech(
  text: string,
  voice?: VoiceId
): Promise<Buffer> {
  const mp3 = await getOpenAI().audio.speech.create({
    model: "tts-1",
    voice: voice || DEFAULT_VOICE,
    input: text,
    speed: 1.0,
  });

  return Buffer.from(await mp3.arrayBuffer());
}

// Re-export for convenience
export { VOICE_OPTIONS, DEFAULT_VOICE };
export type { VoiceId };
