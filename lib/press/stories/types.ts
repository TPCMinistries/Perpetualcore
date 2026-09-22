// Press Stories — shared contract between API routes and Studio UI.
// A "story" = a batch of photos/videos + notes from a real moment (event, visit, launch),
// an AI interview that draws out the human details, and generated content in a brand voice.

import type { PressStoryVoiceKey } from "./voices";

export type PressStoryStatus = "collecting" | "interviewing" | "generating" | "ready" | "failed";

export type PressStoryAssetKind = "image" | "video";
export type PressStoryAssetStatus = "awaiting_upload" | "uploaded" | "failed";

export type PressStoryAsset = {
  id: string;
  story_id: string;
  organization_id: string;
  kind: PressStoryAssetKind;
  /** Bucket-relative path of the ORIGINAL file (video or re-encoded JPEG). */
  storage_path: string;
  /** For videos: bucket-relative path of a JPEG poster frame extracted client-side. Null for images. */
  poster_path: string | null;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  original_filename: string | null;
  /** Optional per-file note the user typed ("this is the moment the kids saw the robot"). */
  caption_hint: string | null;
  status: PressStoryAssetStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/** Signed read URLs are minted per response; never stored. */
export type PressStoryAssetView = PressStoryAsset & {
  url: string | null;
  poster_url: string | null;
};

export type PressStoryInterviewTurn = {
  role: "assistant" | "user";
  text: string;
  at: string; // ISO
};

export type PressStoryOutputs = {
  headline: string;
  /** One-paragraph plain summary of what happened, in the voice. */
  summary: string;
  linkedin: string;
  instagram: string;
  /** Each item is one post in a thread. */
  x_thread: string[];
  /** Short newsletter/email blurb (subject + body). */
  newsletter: { subject: string; body: string };
  /** Suggested caption per uploaded asset. */
  photo_captions: { asset_id: string; caption: string }[];
  /** 3–6 short pull-quotes / hooks lifted from the interview. */
  hooks: string[];
  generated_at: string;
  model: string;
};

export type PressStory = {
  id: string;
  organization_id: string;
  created_by: string;
  title: string;
  voice_key: PressStoryVoiceKey;
  /** Free-form notes the user typed up front ("Uplift CNA orientation, 40 students, KBCC"). */
  notes: string;
  status: PressStoryStatus;
  interview: PressStoryInterviewTurn[];
  interview_complete: boolean;
  outputs: PressStoryOutputs | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type PressStoryView = PressStory & { assets: PressStoryAssetView[] };

// ---------- API contract (all under /api/press/stories) ----------
// Auth: requirePressUser() + org membership (same as press_projects). Editors mutate, viewers read.
//
// GET    /api/press/stories                       -> { stories: PressStory[] }   (asset_count included via `asset_count` field, most recent first)
// POST   /api/press/stories                       body CreateStoryInput -> { story: PressStory }  (201)
// GET    /api/press/stories/[storyId]             -> { story: PressStoryView }
// PATCH  /api/press/stories/[storyId]             body UpdateStoryInput -> { story: PressStory }
// DELETE /api/press/stories/[storyId]             -> 204 (deletes storage objects + rows; admins/owners only)
//
// POST   /api/press/stories/[storyId]/assets/upload-intent  body UploadIntentInput -> UploadIntentResponse
// POST   /api/press/stories/[storyId]/assets/[assetId]/finalize  body FinalizeAssetInput -> { asset: PressStoryAssetView }
// DELETE /api/press/stories/[storyId]/assets/[assetId]      -> 204
//
// POST   /api/press/stories/[storyId]/interview   body InterviewInput -> InterviewResponse
//        Server appends the user's answer (if any) to `interview`, asks Claude for the next question
//        (or decides the interview is complete), appends the assistant turn, returns the updated story.
// POST   /api/press/stories/[storyId]/generate    -> { story: PressStoryView }  (sets status generating -> ready; outputs filled)
//        maxDuration = 300. Non-streaming.

export type CreateStoryInput = {
  title: string;              // 1..160
  voice_key: PressStoryVoiceKey;
  notes?: string;             // ≤ 4000
  organizationId?: string;    // optional, same semantics as createProjectSchema
};

export type UpdateStoryInput = {
  title?: string;
  voice_key?: PressStoryVoiceKey;
  notes?: string;
  /** Allows the client to mark the interview finished early ("skip to generate"). */
  interview_complete?: boolean;
};

export type UploadIntentInput = {
  kind: PressStoryAssetKind;
  mime_type: string;          // image/jpeg | image/png | video/mp4 | video/quicktime | video/webm
  file_size: number;          // bytes; images ≤ 25MB, videos ≤ 512MB
  original_filename?: string;
  width?: number;
  height?: number;
  duration_ms?: number;
  caption_hint?: string;
  /** For videos only: request a second signed URL for the poster JPEG. */
  with_poster?: boolean;
};

export type SignedUploadTarget = {
  path: string;
  /** Result of storage.createSignedUploadUrl — client PUTs to `signedUrl` with header `x-upsert: false`, or uses supabase-js uploadToSignedUrl(path, token, file). */
  signedUrl: string;
  token: string;
};

export type UploadIntentResponse = {
  asset: PressStoryAsset;
  upload: SignedUploadTarget;
  poster_upload: SignedUploadTarget | null;
};

export type FinalizeAssetInput = {
  /** Client-measured after upload; server verifies object exists and size matches within tolerance. */
  file_size: number;
  poster_uploaded?: boolean;
};

export type InterviewInput = {
  /** Omit on the first call (server asks the opening question). */
  answer?: string;            // ≤ 4000
};

export type InterviewResponse = {
  story: PressStory;
  /** Convenience: the assistant turn just added (question text), or null if the interview is complete. */
  question: string | null;
  complete: boolean;
};

export const PRESS_STORY_IMAGE_MIME_TYPES = ["image/jpeg", "image/png"] as const;
export const PRESS_STORY_VIDEO_MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;
export const PRESS_STORY_MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const PRESS_STORY_MAX_VIDEO_BYTES = 512 * 1024 * 1024;
export const PRESS_STORY_MAX_ASSETS = 40;
export const PRESS_STORY_MAX_INTERVIEW_QUESTIONS = 6;
/** Storage layout inside PRESS_ASSET_BUCKET. */
export const pressStoryAssetPath = (organizationId: string, storyId: string, assetId: string, ext: string) =>
  `stories/${organizationId}/${storyId}/${assetId}.${ext}`;
export const pressStoryPosterPath = (organizationId: string, storyId: string, assetId: string) =>
  `stories/${organizationId}/${storyId}/${assetId}.poster.jpg`;
