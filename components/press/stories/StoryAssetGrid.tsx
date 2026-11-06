"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Play, Trash2, X } from "lucide-react";
import type { PressStoryAssetView } from "@/lib/press/stories/types";
import { deleteStoryAsset, getErrorMessage } from "./api";
import { formatDuration } from "./format";

export function StoryAssetGrid({
  storyId,
  assets,
  onRemoved,
}: {
  storyId: string;
  assets: PressStoryAssetView[];
  onRemoved: (assetId: string) => void;
}) {
  const [lightboxAsset, setLightboxAsset] = useState<PressStoryAssetView | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function handleRemove(asset: PressStoryAssetView) {
    setRemovingId(asset.id);
    setRemoveError(null);
    try {
      await deleteStoryAsset(storyId, asset.id);
      onRemoved(asset.id);
      if (lightboxAsset?.id === asset.id) setLightboxAsset(null);
    } catch (error) {
      setRemoveError(getErrorMessage(error));
    } finally {
      setRemovingId(null);
    }
  }

  if (assets.length === 0) return null;

  return (
    <div className="mt-4">
      {removeError && (
        <div className="mb-3 flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{removeError}</span>
        </div>
      )}
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {assets.map((asset) => {
          const thumb = asset.kind === "video" ? asset.poster_url : asset.url;
          return (
            <li key={asset.id} className="group relative aspect-square overflow-hidden border border-black/10 bg-zinc-100">
              <button
                type="button"
                onClick={() => setLightboxAsset(asset)}
                className="absolute inset-0 h-full w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1648d8]"
                aria-label={`Open ${asset.kind === "video" ? "video" : "photo"}${asset.caption_hint ? `: ${asset.caption_hint}` : ""}`}
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URLs, not a Next-optimizable static source
                  <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">No preview</div>
                )}
                {asset.kind === "video" && (
                  <span className="absolute bottom-1 right-1 flex items-center gap-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    <Play className="h-2.5 w-2.5 fill-white" aria-hidden />
                    {formatDuration(asset.duration_ms)}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => void handleRemove(asset)}
                disabled={removingId === asset.id}
                className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity duration-200 hover:bg-black/80 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-hover:opacity-100"
                aria-label="Remove this file"
              >
                {removingId === asset.id ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden /> : <Trash2 className="h-3.5 w-3.5" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ul>

      {lightboxAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo preview"
          onClick={() => setLightboxAsset(null)}
          onKeyDown={(event) => event.key === "Escape" && setLightboxAsset(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxAsset(null)}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
          <div className="max-h-full max-w-full" onClick={(event) => event.stopPropagation()}>
            {lightboxAsset.kind === "video" ? (
              lightboxAsset.url ? (
                <video src={lightboxAsset.url} controls autoPlay playsInline className="max-h-[85vh] max-w-full" />
              ) : (
                <p className="text-white">This video isn't available to preview right now.</p>
              )
            ) : lightboxAsset.url ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL
              <img src={lightboxAsset.url} alt={lightboxAsset.caption_hint || ""} className="max-h-[85vh] max-w-full object-contain" />
            ) : (
              <p className="text-white">This photo isn't available to preview right now.</p>
            )}
            {lightboxAsset.caption_hint && <p className="mt-3 text-center text-sm text-white/80">{lightboxAsset.caption_hint}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
