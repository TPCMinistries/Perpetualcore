"use client";

import { Upload, type DetailedError } from "tus-js-client";

export const PRESS_TUS_CHUNK_BYTES = 6 * 1024 * 1024;
export const PRESS_TUS_RETRY_DELAYS_MS = [0, 3_000, 5_000, 10_000, 20_000] as const;
const PRESS_TUS_SIGNED_TRANSPORT_VERSION = "signed-v2";

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
  url.pathname = "/storage/v1/upload/resumable/sign";
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
      // Supabase signed resumable uploads authenticate with the upload token
      // in x-signature. User-session uploads use Authorization, but Press
      // issues short-lived signed upload URLs server-side so the browser never
      // needs a storage-write JWT.
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
      PRESS_TUS_SIGNED_TRANSPORT_VERSION,
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

/**
 * The hosted TUS endpoint can be unavailable for reasons unrelated to this
 * upload (e.g. "The database schema is invalid or incompatible" while the
 * platform's storage schema and serving version disagree). Those failures
 * happen on the create request, before any bytes move, and are safe to
 * retry over the plain signed-URL transport instead.
 */
export function isTusTransportUnavailable(error: Error | DetailedError): boolean {
  const status = (error as DetailedError).originalResponse?.getStatus?.();
  if (status === 503) return true;
  return /schema is invalid|response code: 503/i.test(error.message ?? "");
}

export interface PressDirectUploadHandle {
  abort: () => void;
}

/**
 * Fallback transport: single PUT to the signed upload URL. No resume — a
 * retry restarts from zero — but it does not depend on the TUS service.
 */
export function startPressDirectUpload(input: PressTusUploadInput): PressDirectUploadHandle {
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!publishableKey || !supabaseUrl) throw new Error("Press upload storage is not configured.");

  const url = new URL(supabaseUrl);
  url.pathname = `/storage/v1/object/upload/sign/${input.bucket}/${input.path}`;
  url.search = `token=${encodeURIComponent(input.token)}`;

  const xhr = new XMLHttpRequest();
  let aborted = false;
  xhr.open("PUT", url.toString());
  xhr.setRequestHeader("apikey", publishableKey);
  xhr.setRequestHeader("content-type", input.file.type || "application/octet-stream");
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) input.onProgress(event.loaded, event.total);
  };
  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      input.onSuccess();
    } else {
      input.onError(new Error(`Upload failed (${xhr.status}): ${xhr.responseText.slice(0, 200)}`));
    }
  };
  xhr.onerror = () => {
    if (!aborted) input.onError(new Error("Upload failed: the connection was interrupted."));
  };
  xhr.send(input.file);

  return {
    abort: () => {
      aborted = true;
      xhr.abort();
    },
  };
}
