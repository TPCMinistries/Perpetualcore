"use client";

import { useCallback, useRef, useState } from "react";
import { AlertCircle, FileImage, FileVideo2, RotateCcw, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  PRESS_STORY_IMAGE_MIME_TYPES,
  PRESS_STORY_MAX_ASSETS,
  PRESS_STORY_MAX_IMAGE_BYTES,
  PRESS_STORY_MAX_VIDEO_BYTES,
  PRESS_STORY_VIDEO_MIME_TYPES,
  type PressStoryAssetKind,
  type PressStoryAssetView,
} from "@/lib/press/stories/types";
import { createUploadIntent, finalizeStoryAsset, getErrorMessage, uploadToSignedUrl } from "./api";
import { downscaleImageToJpeg, extractVideoPoster, readVideoMeta } from "./media-processing";
import { formatBytes } from "./format";

const MAX_CONCURRENT = 3;

type QueueStatus = "queued" | "processing" | "uploading" | "finalizing" | "done" | "error";

interface QueueItem {
  clientId: string;
  file: File;
  kind: PressStoryAssetKind;
  captionHint: string;
  status: QueueStatus;
  progress: number;
  error: string | null;
}

function inferKind(file: File): PressStoryAssetKind | null {
  if ((PRESS_STORY_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) return "image";
  if ((PRESS_STORY_VIDEO_MIME_TYPES as readonly string[]).includes(file.type)) return "video";
  if (file.type.startsWith("image/")) return "image"; // e.g. HEIC — decode client-side, re-encoded to JPEG before upload
  if (file.type.startsWith("video/")) return "video";
  return null;
}

export function StoryUploader({
  storyId,
  existingAssetCount,
  onFinalized,
}: {
  storyId: string;
  existingAssetCount: number;
  onFinalized: (asset: PressStoryAssetView) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<QueueItem[]>([]);
  const activeCountRef = useRef(0);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [selectError, setSelectError] = useState<string | null>(null);

  const syncItems = useCallback(() => setItems([...itemsRef.current]), []);

  const patchItem = useCallback((clientId: string, patch: Partial<QueueItem>) => {
    itemsRef.current = itemsRef.current.map((item) => (item.clientId === clientId ? { ...item, ...patch } : item));
    syncItems();
  }, [syncItems]);

  // Plain function (not memoized): it closes over `uploadItem`, which itself closes over
  // `storyId`/`onFinalized` from the current render. Recreating it each render avoids a
  // stale closure while staying cheap, since it's only ever called synchronously.
  function runNext() {
    while (activeCountRef.current < MAX_CONCURRENT) {
      const next = itemsRef.current.find((item) => item.status === "queued");
      if (!next) return;
      activeCountRef.current += 1;
      patchItem(next.clientId, { status: "processing", progress: 0, error: null });
      void uploadItem(next).finally(() => {
        activeCountRef.current -= 1;
        runNext();
      });
    }
  }

  async function uploadItem(item: QueueItem) {
    try {
      let uploadBlob: Blob = item.file;
      let mimeType = item.file.type;
      let width: number | undefined;
      let height: number | undefined;
      let durationMs: number | undefined;
      let posterBlob: Blob | null = null;

      if (item.kind === "image") {
        const processed = await downscaleImageToJpeg(item.file).catch(() => {
          throw new Error("couldn't read this image");
        });
        uploadBlob = processed.blob;
        mimeType = "image/jpeg";
        width = processed.width;
        height = processed.height;
      } else {
        const poster = await extractVideoPoster(item.file).catch(() => null);
        if (poster) {
          posterBlob = poster.blob;
          width = poster.width;
          height = poster.height;
          durationMs = poster.durationMs;
        } else {
          const meta = await readVideoMeta(item.file).catch(() => null);
          width = meta?.width ?? undefined;
          height = meta?.height ?? undefined;
          durationMs = meta?.durationMs ?? undefined;
        }
      }

      const cap = item.kind === "image" ? PRESS_STORY_MAX_IMAGE_BYTES : PRESS_STORY_MAX_VIDEO_BYTES;
      if (uploadBlob.size > cap) {
        throw new Error(`This file is too large (max ${formatBytes(cap)} for ${item.kind}s).`);
      }

      patchItem(item.clientId, { status: "uploading", progress: 2 });
      const intent = await createUploadIntent(storyId, {
        kind: item.kind,
        mime_type: mimeType,
        file_size: uploadBlob.size,
        original_filename: item.file.name,
        width,
        height,
        duration_ms: durationMs,
        caption_hint: item.captionHint.trim() || undefined,
        with_poster: item.kind === "video" && Boolean(posterBlob),
      });

      await uploadToSignedUrl(intent.upload.signedUrl, uploadBlob, mimeType, (fraction) => {
        patchItem(item.clientId, { progress: Math.min(85, Math.max(2, Math.round(fraction * 85))) });
      });

      let posterUploaded = false;
      if (intent.poster_upload && posterBlob) {
        await uploadToSignedUrl(intent.poster_upload.signedUrl, posterBlob, "image/jpeg", (fraction) => {
          patchItem(item.clientId, { progress: 85 + Math.round(fraction * 10) });
        });
        posterUploaded = true;
      }

      patchItem(item.clientId, { status: "finalizing", progress: 97 });
      const finalized = await finalizeStoryAsset(storyId, intent.asset.id, {
        file_size: uploadBlob.size,
        poster_uploaded: posterUploaded,
      });
      patchItem(item.clientId, { status: "done", progress: 100 });
      onFinalized(finalized);
    } catch (uploadError) {
      patchItem(item.clientId, { status: "error", error: getErrorMessage(uploadError) });
    }
  }

  function enqueueFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const activeCount = itemsRef.current.filter((item) => item.status !== "error").length;
    const remainingSlots = PRESS_STORY_MAX_ASSETS - existingAssetCount - activeCount;
    if (remainingSlots <= 0) {
      setSelectError(`This story already has the maximum of ${PRESS_STORY_MAX_ASSETS} files.`);
      return;
    }
    setSelectError(null);

    const accepted: QueueItem[] = [];
    let rejectedType = false;
    let rejectedCount = 0;
    for (const file of files) {
      if (accepted.length >= remainingSlots) {
        rejectedCount += 1;
        continue;
      }
      const kind = inferKind(file);
      if (!kind) {
        rejectedType = true;
        continue;
      }
      accepted.push({
        clientId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        kind,
        captionHint: "",
        status: "queued",
        progress: 0,
        error: null,
      });
    }

    if (rejectedType || rejectedCount > 0) {
      setSelectError(
        rejectedCount > 0
          ? `Only ${remainingSlots} more file${remainingSlots === 1 ? "" : "s"} can be added to this story.`
          : "Some files were skipped — Press Stories accepts photos and videos only."
      );
    }

    if (accepted.length === 0) return;
    itemsRef.current = [...itemsRef.current, ...accepted];
    syncItems();
    runNext();
  }

  function removeItem(clientId: string) {
    itemsRef.current = itemsRef.current.filter((item) => item.clientId !== clientId);
    syncItems();
  }

  function retryItem(clientId: string) {
    patchItem(clientId, { status: "queued", error: null, progress: 0 });
    runNext();
  }

  function setCaptionHint(clientId: string, value: string) {
    patchItem(clientId, { captionHint: value });
  }

  const atCapacity = existingAssetCount + items.filter((item) => item.status !== "error").length >= PRESS_STORY_MAX_ASSETS;

  return (
    <div>
      <div
        className={cn(
          "rounded-md border border-dashed p-6 text-center transition-colors sm:p-8",
          dragging ? "border-[#1648d8] bg-[#edf2ff]" : "border-black/20 bg-[#f6f1e8]",
          !atCapacity && "cursor-pointer hover:border-[#1648d8] hover:bg-[#f1f5ff]"
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!atCapacity) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!atCapacity && event.dataTransfer.files.length > 0) enqueueFiles(event.dataTransfer.files);
        }}
        onClick={() => !atCapacity && inputRef.current?.click()}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && !atCapacity) inputRef.current?.click();
        }}
        role="button"
        tabIndex={atCapacity ? -1 : 0}
        aria-disabled={atCapacity}
        aria-label="Choose photos or videos to add to this story"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="sr-only"
          tabIndex={-1}
          disabled={atCapacity}
          onChange={(event) => {
            if (event.target.files && event.target.files.length > 0) enqueueFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#ff3b5c]">
          <Upload className="h-6 w-6 text-black" aria-hidden />
        </span>
        <p className="mt-4 text-base font-black text-[#121214]">Drop photos or videos, or tap to choose</p>
        <p className="mt-1 text-xs text-black/60">
          {atCapacity ? `This story has ${PRESS_STORY_MAX_ASSETS} files, the pilot maximum.` : `Up to ${PRESS_STORY_MAX_ASSETS} files per story · images up to ${formatBytes(PRESS_STORY_MAX_IMAGE_BYTES)} · videos up to ${formatBytes(PRESS_STORY_MAX_VIDEO_BYTES)}`}
        </p>
      </div>

      {selectError && (
        <div className="mt-3 flex items-start gap-2 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{selectError}</span>
        </div>
      )}

      {items.length > 0 && (
        <ul className="mt-4 space-y-3" aria-live="polite">
          {items.map((item) => (
            <li key={item.clientId} className="border border-zinc-200 bg-white p-3">
              <div className="flex items-start gap-3">
                {item.kind === "image" ? <FileImage className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" aria-hidden /> : <FileVideo2 className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" aria-hidden />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-zinc-950">{item.file.name}</p>
                    <div className="flex shrink-0 items-center gap-1">
                      {item.status === "error" && (
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => retryItem(item.clientId)} aria-label={`Retry uploading ${item.file.name}`}>
                          <RotateCcw className="h-4 w-4" aria-hidden />
                        </Button>
                      )}
                      {item.status !== "done" && (
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeItem(item.clientId)} aria-label={`Remove ${item.file.name}`}>
                          <X className="h-4 w-4" aria-hidden />
                        </Button>
                      )}
                    </div>
                  </div>
                  {item.status === "queued" && <p className="mt-1 text-xs text-zinc-500">Waiting to upload…</p>}
                  {(item.status === "processing" || item.status === "uploading" || item.status === "finalizing") && (
                    <div className="mt-2">
                      <Progress value={item.progress} className="h-1.5" />
                      <p className="mt-1 text-xs text-zinc-500">
                        {item.status === "processing" ? "Preparing…" : item.status === "finalizing" ? "Finishing up…" : `Uploading… ${item.progress}%`}
                      </p>
                    </div>
                  )}
                  {item.status === "done" && <p className="mt-1 text-xs font-medium text-emerald-700">Uploaded</p>}
                  {item.status === "error" && (
                    <div className="mt-1 flex items-start gap-1.5 text-xs text-red-700">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span>{item.error}</span>
                    </div>
                  )}
                  {item.status !== "done" && (
                    <Input
                      value={item.captionHint}
                      onChange={(event) => setCaptionHint(item.clientId, event.target.value)}
                      placeholder="Optional note about this moment"
                      className="mt-2 h-9 rounded-md text-sm"
                      maxLength={300}
                    />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
