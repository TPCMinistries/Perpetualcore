// Typed fetch helpers for Press Stories. The contract lives in lib/press/stories/types.ts —
// this file is a thin, typed wrapper around it. Mirrors the request()/error style of
// components/press/api-client.ts.
import type {
  CreateStoryInput,
  FinalizeAssetInput,
  InterviewInput,
  InterviewResponse,
  PressStory,
  PressStoryAssetView,
  PressStoryView,
  UpdateStoryInput,
  UploadIntentInput,
  UploadIntentResponse,
} from "@/lib/press/stories/types";

export type PressStoryListItem = PressStory & { asset_count: number };

interface ApiErrorBody {
  error?: string;
  message?: string;
}

export class PressStoriesApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "PressStoriesApiError";
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
      // Fall through to the status-specific message below.
    }
    throw new PressStoriesApiError(body.error || body.message || "Press Stories could not complete that request.", response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function listStories(signal?: AbortSignal): Promise<PressStoryListItem[]> {
  const data = await request<{ stories: PressStoryListItem[] }>("/api/press/stories", { signal });
  return data.stories;
}

export async function createStory(input: CreateStoryInput): Promise<PressStory> {
  const data = await request<{ story: PressStory }>("/api/press/stories", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.story;
}

export async function getStory(storyId: string, signal?: AbortSignal): Promise<PressStoryView> {
  const data = await request<{ story: PressStoryView }>(`/api/press/stories/${storyId}`, { signal });
  return data.story;
}

export async function updateStory(storyId: string, input: UpdateStoryInput): Promise<PressStory> {
  const data = await request<{ story: PressStory }>(`/api/press/stories/${storyId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.story;
}

export async function deleteStory(storyId: string): Promise<void> {
  await request<void>(`/api/press/stories/${storyId}`, { method: "DELETE" });
}

export async function createUploadIntent(storyId: string, input: UploadIntentInput): Promise<UploadIntentResponse> {
  return request<UploadIntentResponse>(`/api/press/stories/${storyId}/assets/upload-intent`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function finalizeStoryAsset(storyId: string, assetId: string, input: FinalizeAssetInput): Promise<PressStoryAssetView> {
  const data = await request<{ asset: PressStoryAssetView }>(`/api/press/stories/${storyId}/assets/${assetId}/finalize`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.asset;
}

export async function deleteStoryAsset(storyId: string, assetId: string): Promise<void> {
  await request<void>(`/api/press/stories/${storyId}/assets/${assetId}`, { method: "DELETE" });
}

export async function postInterviewTurn(storyId: string, input: InterviewInput): Promise<InterviewResponse> {
  return request<InterviewResponse>(`/api/press/stories/${storyId}/interview`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function generateStoryContent(storyId: string): Promise<PressStoryView> {
  const data = await request<{ story: PressStoryView }>(`/api/press/stories/${storyId}/generate`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return data.story;
}

/** PUT a blob/file to a Supabase signed upload URL, reporting progress via XHR. */
export function uploadToSignedUrl(signedUrl: string, body: Blob, mimeType: string, onProgress?: (fraction: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl, true);
    xhr.setRequestHeader("Content-Type", mimeType);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.send(body);
  });
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Press Stories encountered an unexpected error.";
}
