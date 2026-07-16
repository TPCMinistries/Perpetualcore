"use client";

import { useEffect, useRef } from "react";
import { FileVideo2 } from "lucide-react";
import type { PressAsset } from "./types";

function formatBytes(bytes: number): string {
  if (!bytes) return "Size unavailable";
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

export function SourcePlayer({
  asset,
  playbackAsset,
  posterAsset,
  seekToMs,
}: {
  asset?: PressAsset;
  playbackAsset?: PressAsset;
  posterAsset?: PressAsset;
  seekToMs?: number | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playable = playbackAsset ?? asset;
  const sourceUrl = playable?.signedUrl || playable?.url;
  const posterUrl = posterAsset?.signedUrl || posterAsset?.url || undefined;
  const isAudio = asset?.mimeType.startsWith("audio/");

  useEffect(() => {
    if (seekToMs === null || seekToMs === undefined) return;
    const media = isAudio ? audioRef.current : videoRef.current;
    if (!media) return;
    media.currentTime = seekToMs / 1000;
    void media.play().catch(() => undefined);
  }, [isAudio, seekToMs]);

  if (!asset) {
    return (
      <div className="flex aspect-video min-h-64 items-center justify-center border border-zinc-300 bg-zinc-100 p-8 text-center">
        <div>
          <FileVideo2 className="mx-auto h-8 w-8 text-zinc-400" aria-hidden />
          <p className="mt-3 text-sm font-medium text-zinc-800">No source recording is attached</p>
          <p className="mt-1 text-xs text-zinc-500">Return to the Press console to start a new upload.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-zinc-300 bg-white">
      <div className="flex min-h-64 items-center justify-center bg-black">
        {sourceUrl ? (
          isAudio ? (
            <div className="w-full p-6 sm:p-10">
              <audio ref={audioRef} src={sourceUrl} controls preload="metadata" className="w-full" aria-label={`Audio source: ${asset.fileName}`} />
            </div>
          ) : (
            <video ref={videoRef} src={sourceUrl} poster={posterUrl} controls playsInline preload="metadata" className="aspect-video max-h-[560px] w-full bg-black object-contain" aria-label={`Video source: ${asset.fileName}`} />
          )
        ) : (
          <div className="p-8 text-center text-white">
            <FileVideo2 className="mx-auto h-8 w-8 text-white/50" aria-hidden />
            <p className="mt-3 text-sm font-medium">Preview is not available</p>
            <p className="mt-1 text-xs text-white/60">The source metadata is available below.</p>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between gap-2 border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500 sm:flex-row sm:items-center">
        <span className="truncate font-medium text-zinc-800">{asset.fileName}{playbackAsset ? " · review proxy" : ""}</span>
        <span>{formatBytes(asset.fileSize)}{asset.durationSeconds ? ` · ${Math.round(asset.durationSeconds / 60)} min` : ""}</span>
      </div>
    </div>
  );
}
