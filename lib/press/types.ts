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

export interface PressProject {
  id: string;
  organization_id: string;
  created_by: string;
  brand_id: string | null;
  title: string;
  status: PressProjectStatus;
  platforms: string[];
  rights_attested_at: string;
  rights_attested_by: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PressAsset {
  id: string;
  project_id: string;
  organization_id: string;
  kind: string;
  bucket: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  checksum: string | null;
  duration_seconds: number | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PressJob {
  id: string;
  organization_id: string;
  project_id: string;
  asset_id: string | null;
  render_id: string | null;
  generation_run_id: string | null;
  job_type: string;
  status: string;
  priority: number;
  attempts: number;
  max_attempts: number;
  progress: number;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error_message: string | null;
  lease_owner: string | null;
  lease_expires_at: string | null;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
}

export interface PressGenerationRun {
  id: string;
  organization_id: string;
  project_id: string;
  recipe: "authentic_clip_pack" | "avatar_explainer" | "narrated_visual_essay";
  provider: "internal" | "heygen" | "elevenlabs" | "chatterbox";
  status: "draft" | "awaiting_approval" | "queued" | "processing" | "review" | "ready" | "partial" | "failed" | "cancelled";
  title: string;
  brief: string;
  script: string | null;
  script_approved_by: string | null;
  script_approved_at: string | null;
  consent_id: string | null;
  config: Record<string, unknown>;
  output_count: number;
  provider_job_id: string | null;
  error_message: string | null;
  idempotency_key: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PressTranscriptSegment {
  id?: string;
  start_ms: number;
  end_ms: number;
  speaker: string | null;
  text: string;
  confidence: number | null;
}

export interface PressTranscript {
  id: string;
  project_id: string;
  organization_id: string;
  asset_id: string;
  full_text: string;
  language: string | null;
  version: number;
  status: string;
  segments?: PressTranscriptSegment[];
  created_at: string;
  updated_at: string;
}

export interface PressClip {
  id: string;
  project_id: string;
  organization_id: string;
  generation_run_id: string | null;
  version: number;
  start_ms: number;
  end_ms: number;
  title: string;
  hook: string | null;
  summary: string | null;
  score: number | null;
  scores: Record<string, number>;
  status: string;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PressRender {
  id: string;
  project_id: string;
  clip_id: string;
  organization_id: string;
  aspect_ratio: string;
  template: string | null;
  caption_style: string | null;
  status: string;
  output_bucket: string | null;
  output_path: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PressPublishTarget {
  id: string;
  organization_id: string;
  provider: string;
  account_label: string;
  external_account_id: string;
  status: string;
  adapter_configured?: boolean;
  non_secret_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PressPublication {
  id: string;
  organization_id: string;
  project_id: string;
  clip_id: string;
  render_id: string;
  publish_target_id: string | null;
  provider: string;
  mode: "manual_export" | "scheduled";
  status: string;
  scheduled_for: string | null;
  external_content_id: string | null;
  external_url: string | null;
  idempotency_key: string;
  created_by: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
