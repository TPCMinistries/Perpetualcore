import type {
  ApiErrorBody,
  PressClip,
  PressAsset,
  PressProject,
  PressPublication,
  PressPublishTarget,
  PressAnalyticsSummary,
  PressRender,
  PressTranscript,
  PressSystemStatus,
  PressGenerationRun,
} from "./types";

interface RawProject {
  id: string;
  title: string;
  status: PressProject["status"];
  platforms?: string[];
  created_at: string;
  updated_at: string;
  metadata?: { errorMessage?: string };
}

interface RawAsset {
  id: string;
  kind: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  duration_seconds?: number | null;
  signed_url?: string | null;
  created_at?: string;
}

interface RawTranscriptSegment {
  id?: string;
  start_ms: number;
  end_ms: number;
  speaker?: string | null;
  text: string;
  confidence?: number | null;
}

interface RawTranscript {
  project_id: string;
  version: number;
  full_text: string;
  segments?: RawTranscriptSegment[];
  updated_at?: string;
}

interface RawClip {
  id: string;
  project_id: string;
  title: string;
  hook?: string | null;
  summary?: string | null;
  start_ms: number;
  end_ms: number;
  score?: number | null;
  status: string;
  version: number;
}

interface RawRender {
  id: string;
  clip_id: string;
  aspect_ratio: PressRender["aspectRatio"];
  status: string;
  created_at?: string;
}

interface RawPublication {
  id: string;
  project_id: string;
  clip_id: string;
  render_id: string;
  publish_target_id?: string | null;
  provider: string;
  mode: PressPublication["mode"];
  status: string;
  scheduled_for?: string | null;
  external_url?: string | null;
  error_message?: string | null;
  created_at: string;
}

interface RawGenerationRun {
  id: string;
  project_id: string;
  recipe: PressGenerationRun["recipe"];
  provider: PressGenerationRun["provider"];
  status: PressGenerationRun["status"];
  title: string;
  brief: string;
  config: Record<string, unknown>;
  output_count: number;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

function normalizeAsset(asset: RawAsset): PressAsset {
  return {
    id: asset.id,
    kind: asset.kind,
    fileName: asset.original_filename,
    mimeType: asset.mime_type,
    fileSize: asset.file_size,
    durationSeconds: asset.duration_seconds,
    signedUrl: asset.signed_url,
    createdAt: asset.created_at,
  };
}

function normalizeProject(project: RawProject, assets?: RawAsset[], renders?: RawRender[]): PressProject {
  return {
    id: project.id,
    title: project.title,
    status: project.status,
    platforms: project.platforms || [],
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    assets: assets?.map(normalizeAsset),
    renders: renders?.map(normalizeRender),
    errorMessage: project.metadata?.errorMessage || null,
  };
}

function normalizeTranscript(transcript: RawTranscript): PressTranscript {
  return {
    projectId: transcript.project_id,
    version: transcript.version,
    fullText: transcript.full_text,
    segments: (transcript.segments || []).map((segment) => ({
      id: segment.id,
      startMs: segment.start_ms,
      endMs: segment.end_ms,
      speaker: segment.speaker,
      text: segment.text,
      confidence: segment.confidence,
    })),
    updatedAt: transcript.updated_at,
  };
}

function normalizeClip(clip: RawClip): PressClip {
  const status: PressClip["status"] = clip.status === "proposed"
    ? "candidate"
    : clip.status === "rendered"
      ? "ready"
      : clip.status as PressClip["status"];
  return {
    id: clip.id,
    projectId: clip.project_id,
    title: clip.title,
    hook: clip.hook,
    startMs: clip.start_ms,
    endMs: clip.end_ms,
    score: clip.score,
    status,
    version: clip.version,
    transcript: clip.summary,
  };
}

function normalizeRender(render: RawRender): PressRender {
  const status: PressRender["status"] = render.status === "completed"
    ? "ready"
    : render.status === "processing"
      ? "rendering"
      : render.status as PressRender["status"];
  return {
    id: render.id,
    clipId: render.clip_id,
    aspectRatio: render.aspect_ratio,
    status,
    createdAt: render.created_at,
  };
}

function normalizePublication(publication: RawPublication): PressPublication {
  return {
    id: publication.id,
    projectId: publication.project_id,
    clipId: publication.clip_id,
    renderId: publication.render_id,
    publishTargetId: publication.publish_target_id,
    provider: publication.provider,
    mode: publication.mode,
    status: publication.status,
    scheduledFor: publication.scheduled_for,
    externalUrl: publication.external_url,
    errorMessage: publication.error_message,
    createdAt: publication.created_at,
  };
}

function normalizeGenerationRun(run: RawGenerationRun): PressGenerationRun {
  return {
    id: run.id,
    projectId: run.project_id,
    recipe: run.recipe,
    provider: run.provider,
    status: run.status,
    title: run.title,
    brief: run.brief,
    config: run.config,
    outputCount: run.output_count,
    errorMessage: run.error_message,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
  };
}

export class PressApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "PressApiError";
  }
}

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // The status-specific fallback below is clearer than a JSON parse error.
    }
    throw new PressApiError(body.error || body.message || "Press could not complete that request.", response.status);
  }

  return (await response.json()) as T;
}

export async function listPressProjects(signal?: AbortSignal): Promise<PressProject[]> {
  const data = await request<{ projects: RawProject[] }>("/api/press/projects?limit=100&offset=0", { signal });
  return data.projects.map((project) => normalizeProject(project));
}

export async function getPressSystemStatus(signal?: AbortSignal): Promise<PressSystemStatus> {
  return request<PressSystemStatus>("/api/press/status", { signal });
}

export async function listPressGenerationRuns(projectId: string, signal?: AbortSignal): Promise<PressGenerationRun[]> {
  const data = await request<{ runs: RawGenerationRun[] }>(`/api/press/projects/${projectId}/generations`, { signal });
  return data.runs.map(normalizeGenerationRun);
}

export async function createAuthenticClipPack(projectId: string, input: {
  title: string;
  brief: string;
  clipCount: number;
  targetMinSeconds: number;
  targetMaxSeconds: number;
  goals: Array<"teach" | "inspire" | "announce" | "demonstrate" | "story">;
  formats: Array<"9:16" | "1:1" | "16:9">;
  captions: boolean;
}): Promise<PressGenerationRun> {
  const data = await request<{ run: RawGenerationRun }>(`/api/press/projects/${projectId}/generations`, {
    method: "POST",
    body: JSON.stringify({
      recipe: "authentic_clip_pack",
      ...input,
      idempotencyKey: `clip-pack:${crypto.randomUUID()}`,
    }),
  });
  return normalizeGenerationRun(data.run);
}

export async function createPressProject(title: string, rightsAttested: boolean): Promise<PressProject> {
  const data = await request<{ project: RawProject }>("/api/press/projects", {
    method: "POST",
    body: JSON.stringify({ title, rightsAttested }),
  });
  return normalizeProject(data.project);
}

export interface PressUploadIntent {
  asset: { id: string };
  upload: { bucket: string; path: string; token: string };
}

export function createUploadIntent(projectId: string, file: File): Promise<PressUploadIntent> {
  return request<PressUploadIntent>(`/api/press/projects/${projectId}/assets/upload-intent`, {
    method: "POST",
    body: JSON.stringify({ fileName: file.name, mimeType: file.type, fileSize: file.size }),
  });
}

export async function finalizeAsset(assetId: string): Promise<void> {
  await request(`/api/press/assets/${assetId}/finalize`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getPressProject(projectId: string, signal?: AbortSignal): Promise<PressProject> {
  const data = await request<{ project: RawProject; assets: RawAsset[]; renders: RawRender[] }>(`/api/press/projects/${projectId}`, { signal });
  return normalizeProject(data.project, data.assets, data.renders);
}

export async function updatePressProject(
  projectId: string,
  updates: { title?: string; status?: PressProject["status"]; platforms?: string[] },
): Promise<PressProject> {
  const data = await request<{ project: RawProject }>(`/api/press/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return normalizeProject(data.project);
}

export async function getPressTranscript(projectId: string, signal?: AbortSignal): Promise<PressTranscript | null> {
  try {
    const data = await request<{ transcript: RawTranscript }>(`/api/press/projects/${projectId}/transcript`, { signal });
    return normalizeTranscript(data.transcript);
  } catch (error) {
    if (error instanceof PressApiError && error.status === 404) return null;
    throw error;
  }
}

export async function savePressTranscript(transcript: PressTranscript): Promise<PressTranscript> {
  const data = await request<{ transcript: RawTranscript }>(`/api/press/projects/${transcript.projectId}/transcript`, {
    method: "PATCH",
    body: JSON.stringify({
      version: transcript.version,
      fullText: transcript.fullText,
      segments: transcript.segments,
    }),
  });
  return normalizeTranscript(data.transcript);
}

export async function listPressClips(projectId: string, signal?: AbortSignal): Promise<PressClip[]> {
  const data = await request<{ clips: RawClip[] }>(`/api/press/projects/${projectId}/clips`, { signal });
  return data.clips.map(normalizeClip);
}

export async function reviewPressClip(clip: PressClip, action: "approve" | "reject", rejectionReason?: string): Promise<PressClip> {
  const data = await request<{ clip: RawClip }>(`/api/press/clips/${clip.id}`, {
    method: "PATCH",
    body: JSON.stringify({ action, version: clip.version, rejectionReason }),
  });
  return normalizeClip(data.clip);
}

export async function updatePressClip(
  clip: PressClip,
  updates: { startMs?: number; endMs?: number; title?: string; hook?: string | null },
): Promise<PressClip> {
  const data = await request<{ clip: RawClip }>(`/api/press/clips/${clip.id}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "update", version: clip.version, ...updates }),
  });
  return normalizeClip(data.clip);
}

export async function renderPressClip(
  clip: PressClip,
  input: {
    aspectRatios: PressRender["aspectRatio"][];
    captionStyle: "none" | "minimal" | "bold" | "brand";
    focalPoint: { x: number; y: number };
    captionPosition: "top" | "center" | "bottom";
  },
): Promise<PressRender[]> {
  const data = await request<{ renders: RawRender[] }>(`/api/press/clips/${clip.id}/renders`, {
    method: "POST",
    body: JSON.stringify({
      formats: input.aspectRatios.map((aspectRatio) => ({
        aspectRatio,
        template: "clean",
        captionStyle: input.captionStyle,
        settings: {
          focalPoint: input.focalPoint,
          captionPosition: input.captionPosition,
        },
      })),
    }),
  });
  return data.renders.map(normalizeRender);
}

export async function listPressRenders(projectId: string, signal?: AbortSignal): Promise<PressRender[]> {
  const data = await request<{ renders: RawRender[] }>(`/api/press/projects/${projectId}/renders`, { signal });
  return data.renders.map(normalizeRender);
}

export async function getRenderDownload(renderId: string): Promise<{ url: string; expiresAt: string }> {
  return request(`/api/press/renders/${renderId}/download`);
}

export async function listPressPublishTargets(signal?: AbortSignal): Promise<PressPublishTarget[]> {
  const data = await request<{ targets: PressPublishTarget[] }>("/api/press/publish-targets", { signal });
  return data.targets;
}

export async function listPressPublications(projectId: string, signal?: AbortSignal): Promise<PressPublication[]> {
  const data = await request<{ publications: RawPublication[] }>(`/api/press/projects/${projectId}/publications`, { signal });
  return data.publications.map(normalizePublication);
}

export async function createPressPublication(input: {
  renderId: string;
  publishTargetId?: string;
  mode: PressPublication["mode"];
  scheduledFor?: string;
}): Promise<{
  publication: PressPublication;
  capabilities: PressPublishTarget["capabilities"];
  download?: { url: string; expiresAt: string };
}> {
  const data = await request<{
    publication: RawPublication;
    capabilities: PressPublishTarget["capabilities"];
    download?: { url: string; expiresAt: string };
  }>("/api/press/publications", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return { ...data, publication: normalizePublication(data.publication) };
}

export async function getPressAnalytics(projectId: string, signal?: AbortSignal): Promise<PressAnalyticsSummary> {
  const data = await request<{ summary: PressAnalyticsSummary }>(`/api/press/projects/${projectId}/analytics?days=30`, { signal });
  return data.summary;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Press encountered an unexpected error.";
}
