export const PRESS_MAX_FILE_BYTES = 512 * 1024 * 1024;
export const PRESS_MAX_CLIP_DURATION_MS = 120_000;

export const PRESS_ACCEPTED_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-m4a",
] as const;

export const PRESS_ACCEPTED_MIME_TYPE_SET: ReadonlySet<string> = new Set(PRESS_ACCEPTED_MIME_TYPES);
