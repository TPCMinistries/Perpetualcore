/**
 * Voice configuration constants
 * Shared between client and server components
 */

export type VoiceId = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

export interface VoiceOption {
  id: VoiceId;
  name: string;
  description: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: "alloy", name: "Alloy", description: "Neutral and balanced" },
  { id: "nova", name: "Nova", description: "Warm and friendly" },
  { id: "echo", name: "Echo", description: "Clear and professional" },
  { id: "onyx", name: "Onyx", description: "Deep and authoritative" },
  { id: "shimmer", name: "Shimmer", description: "Bright and expressive" },
  { id: "fable", name: "Fable", description: "British and engaging" },
];

export const DEFAULT_VOICE: VoiceId = "alloy";

/** Maximum recording duration in milliseconds (60 seconds) */
export const MAX_RECORDING_DURATION = 60_000;

/** Audio MIME type for MediaRecorder */
export const AUDIO_MIME_TYPE = "audio/webm;codecs=opus";
