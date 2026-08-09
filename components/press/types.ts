export type PressProjectStatus =
  | "draft"
  | "uploading"
  | "processing"
  | "transcribing"
  | "review"
  | "rendering"
  | "ready"
  | "failed"
  | "archived";

export type PressClipStatus = "candidate" | "approved" | "rejected" | "rendering" | "ready";

export interface PressAsset {
  id: string;
  kind: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  durationSeconds?: number | null;
  url?: string | null;
  signedUrl?: string | null;
  createdAt?: string;
}

export interface PressProject {
  id: string;
  title: string;
  status: PressProjectStatus;
  platforms?: string[];
  createdAt: string;
  updatedAt: string;
  assets?: PressAsset[];
  renders?: PressRender[];
  errorMessage?: string | null;
}

export interface PressTranscriptSegment {
  id?: string;
  startMs: number;
  endMs: number;
  speaker?: string | null;
  text: string;
  confidence?: number | null;
}

export interface PressTranscript {
  projectId: string;
  version: number;
  fullText: string;
  segments: PressTranscriptSegment[];
  updatedAt?: string;
}

export interface PressClip {
  id: string;
  projectId: string;
  title: string;
  hook?: string | null;
  startMs: number;
  endMs: number;
  score?: number | null;
  scoreReason?: string | null;
  status: PressClipStatus;
  version: number;
  transcript?: string | null;
  thumbnailUrl?: string | null;
}

export interface PressRender {
  id: string;
  clipId: string;
  aspectRatio: "9:16" | "1:1" | "16:9";
  status: "queued" | "rendering" | "ready" | "failed";
  createdAt?: string;
  downloadUrl?: string | null;
  errorMessage?: string | null;
}

export interface PressPublishCapabilities {
  manualExport: boolean;
  scheduling: boolean;
  directPublish: boolean;
}

export interface PressPublishTarget {
  id: string;
  provider: string;
  accountLabel: string;
  status: string;
  capabilities: PressPublishCapabilities;
}

export interface PressPublication {
  id: string;
  projectId: string;
  clipId: string;
  renderId: string;
  publishTargetId?: string | null;
  provider: string;
  mode: "manual_export" | "scheduled";
  status: string;
  scheduledFor?: string | null;
  externalUrl?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

export interface PressAnalyticsSummary {
  period: { days: number; from: string; to: string };
  totals: {
    events: number;
    publications: number;
    impressions: number;
    views: number;
    engagements: number;
    watchTimeMs: number;
  };
  byProvider: Record<string, { events: number; metrics: Record<string, number> }>;
  byMetric: Record<string, number>;
  daily: Array<{ date: string; metrics: Record<string, number> }>;
  publicationCount: number;
}

export interface PressSystemStatus {
  ready: boolean;
  workerConfigured: boolean;
  workerOnline: boolean;
  lastSeenAt: string | null;
  generationProviders: {
    internal: boolean;
    heygen: boolean;
    elevenlabs: boolean;
    chatterbox: boolean;
  };
  message: string;
}

export interface PressGenerationRun {
  id: string;
  projectId: string;
  recipe: "authentic_clip_pack" | "avatar_explainer" | "narrated_visual_essay";
  provider: "internal" | "heygen" | "elevenlabs" | "chatterbox";
  status: "draft" | "awaiting_approval" | "queued" | "processing" | "review" | "ready" | "partial" | "failed" | "cancelled";
  title: string;
  brief: string;
  config: Record<string, unknown>;
  outputCount: number;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorBody {
  error?: string;
  message?: string;
}
