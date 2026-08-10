"use client";

import { Upload, type DetailedError } from "tus-js-client";

export const PRESS_TUS_CHUNK_BYTES = 6 * 1024 * 1024;
export const PRESS_TUS_RETRY_DELAYS_MS = [0, 3_000, 5_000, 10_000, 20_000] as const;

export interface PressTusUploadInput {
  assetId: string;
  bucket: string;
  path: string;
  token: string;
  file: File;
  onProgress: (bytesUploaded: number, bytesTotal: number) => void;
  onSuccess: () => void;
  onError: (error: Error | DetailedError) => void;
}

export function getPressTusEndpoint(supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL): string {
  if (!supabaseUrl) throw new Error("Press upload storage is not configured.");
  const url = new URL(supabaseUrl);
  if (url.hostname.endsWith(".supabase.co")) {
    const projectRef = url.hostname.slice(0, -".supabase.co".length);
    url.hostname = `${projectRef}.storage.supabase.co`;
  }
  url.pathname = "/storage/v1/upload/resumable";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export function createPressResumableUpload(input: PressTusUploadInput): Upload {
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!publishableKey) throw new Error("Press upload authorization is not configured.");

  return new Upload(input.file, {
    endpoint: getPressTusEndpoint(),
    chunkSize: PRESS_TUS_CHUNK_BYTES,
    retryDelays: [...PRESS_TUS_RETRY_DELAYS_MS],
    uploadDataDuringCreation: true,
    removeFingerprintOnSuccess: true,
    storeFingerprintForResuming: true,
    headers: {
      apikey: publishableKey,
      "x-signature": input.token,
    },
    metadata: {
      bucketName: input.bucket,
      objectName: input.path,
      contentType: input.file.type,
      cacheControl: "3600",
    },
    fingerprint: async (file) => [
      "press",
      input.assetId,
      file.name,
      file.size,
      file.lastModified,
    ].join(":"),
    onProgress: input.onProgress,
    onSuccess: () => input.onSuccess(),
    onError: input.onError,
  });
}

export async function startPressResumableUpload(upload: Upload): Promise<void> {
  const previousUploads = await upload.findPreviousUploads();
  const previous = previousUploads
    .filter((candidate) => candidate.uploadUrl)
    .sort((left, right) => right.creationTime.localeCompare(left.creationTime))[0];
  if (previous) upload.resumeFromPreviousUpload(previous);
  upload.start();
}
