import OpenAI, { toFile } from "openai";
import type {
  DevelopmentAnalysisInput,
  MediaIngestionRequest,
  TimedTranscriptSegment,
} from "./schemas";

export const HDI_MEDIA_BUCKET = "hdi-media-staging";
export const HDI_MAX_MEDIA_BYTES = 25 * 1024 * 1024;
export const HDI_TRANSCRIPTION_MODEL = "gpt-4o-transcribe-diarize";

const extensionByType: Record<MediaIngestionRequest["contentType"], string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/webm": "webm",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export function mediaExtension(contentType: MediaIngestionRequest["contentType"]): string {
  return extensionByType[contentType];
}

function formatTimestamp(milliseconds: number): string {
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const seconds = Math.floor((milliseconds % 60_000) / 1_000);
  const millis = milliseconds % 1_000;
  return [hours, minutes, seconds]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":") + `.${millis.toString().padStart(3, "0")}`;
}

export function buildTimedTranscript(segments: TimedTranscriptSegment[]): string {
  return segments
    .map(
      (segment) =>
        `[${formatTimestamp(segment.startMs)} - ${formatTimestamp(segment.endMs)}] ${segment.speakerLabel}: ${segment.text}`
    )
    .join("\n");
}

export async function transcribeDevelopmentMedia(input: {
  bytes: ArrayBuffer;
  contentType: MediaIngestionRequest["contentType"];
  fileName: string;
}): Promise<{
  transcript: string;
  segments: TimedTranscriptSegment[];
  participantLabels: string[];
  durationMs: number;
  model: string;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  if (input.bytes.byteLength > HDI_MAX_MEDIA_BYTES) {
    throw new Error("HDI media exceeds the 25 MB transcription limit");
  }

  const openai = new OpenAI({ apiKey });
  const file = await toFile(Buffer.from(input.bytes), input.fileName, {
    type: input.contentType,
  });
  const response = await openai.audio.transcriptions.create({
    file,
    model: HDI_TRANSCRIPTION_MODEL,
    response_format: "diarized_json",
    chunking_strategy: "auto",
  });

  if (!("segments" in response) || !Array.isArray(response.segments)) {
    throw new Error("Diarized transcription did not return speaker segments");
  }

  const segments = response.segments
    .map((segment) => ({
      speakerLabel: `Speaker ${segment.speaker}`,
      startMs: Math.max(0, Math.round(segment.start * 1_000)),
      endMs: Math.max(0, Math.round(segment.end * 1_000)),
      text: segment.text.trim(),
    }))
    .filter((segment) => segment.text.length > 0);

  if (segments.length === 0) {
    throw new Error("No speech was detected in the uploaded media");
  }

  const reportedDuration =
    "duration" in response && typeof response.duration === "number"
      ? response.duration
      : Math.max(...segments.map((segment) => segment.endMs)) / 1_000;

  return {
    transcript: buildTimedTranscript(segments),
    segments,
    participantLabels: [...new Set(segments.map((segment) => segment.speakerLabel))],
    durationMs: Math.round(reportedDuration * 1_000),
    model: HDI_TRANSCRIPTION_MODEL,
  };
}

export function asMediaAnalysisInput(input: {
  title: string;
  lens: DevelopmentAnalysisInput["lens"];
  occurredAt: string;
  transcript: string;
  segments: TimedTranscriptSegment[];
  participantLabels: string[];
}): DevelopmentAnalysisInput {
  return {
    title: input.title,
    lens: input.lens,
    occurredAt: input.occurredAt,
    transcript: input.transcript,
    sourceType: "media_upload",
    consentConfirmed: true,
    participantLabels: input.participantLabels,
    timedSegments: input.segments,
  };
}
