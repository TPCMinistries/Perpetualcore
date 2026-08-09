"use client";

import { useState } from "react";
import { AlertCircle, Download, Eye, Film, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getErrorMessage, getRenderDownload } from "./api-client";
import type { PressClip, PressRender } from "./types";

export function ExportsPanel({ renders, clips }: { renders: PressRender[]; clips: PressClip[] }) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function download(render: PressRender) {
    setDownloading(render.id);
    setError(null);
    try {
      const result = await getRenderDownload(render.id);
      window.location.assign(result.url);
    } catch (downloadError) {
      setError(getErrorMessage(downloadError));
    } finally {
      setDownloading(null);
    }
  }

  async function preview(render: PressRender) {
    setPreviewing(render.id);
    setError(null);
    try {
      const result = await getRenderDownload(render.id);
      setPreviewUrls((current) => ({ ...current, [render.id]: result.url }));
    } catch (previewError) {
      setError(getErrorMessage(previewError));
    } finally {
      setPreviewing(null);
    }
  }

  if (renders.length === 0) {
    return (
      <div className="border border-zinc-300 bg-white p-8 text-center" role="status">
        <Film className="mx-auto h-7 w-7 text-zinc-400" aria-hidden />
        <h3 className="mt-3 font-medium text-zinc-900">No exports yet</h3>
        <p className="mt-1 text-sm text-zinc-600">Approve a clip candidate and start a render to create downloadable output.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <div className="flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}</div>}
      <div className="divide-y divide-zinc-200 border border-zinc-300 bg-white">
        {renders.map((render) => {
          const clipTitle = clips.find((clip) => clip.id === render.clipId)?.title;
          return (
          <div key={render.id} className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center bg-zinc-100"><Film className="h-4 w-4 text-zinc-600" aria-hidden /></span>
              <div>
                <p className="font-medium text-zinc-950">{clipTitle || "Approved clip"}</p>
                <p className="mt-0.5 text-xs text-zinc-600">{render.aspectRatio} output</p>
                <p className="mt-0.5 text-xs capitalize text-zinc-500">{render.status}</p>
              </div>
            </div>
            {render.status === "ready" ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="h-11 rounded-md" disabled={previewing === render.id} onClick={() => void preview(render)}>
                  {previewing === render.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Eye className="mr-2 h-4 w-4" aria-hidden />} Preview
                </Button>
                <Button type="button" variant="outline" className="h-11 rounded-md" disabled={downloading === render.id} onClick={() => void download(render)}>
                  {downloading === render.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Download className="mr-2 h-4 w-4" aria-hidden />} Download
                </Button>
              </div>
            ) : (
              <p className="flex min-h-11 items-center text-sm text-zinc-600">{render.status === "failed" ? render.errorMessage || "Render failed." : "Processing…"}</p>
            )}
            {previewUrls[render.id] && (
              <video
                src={previewUrls[render.id]}
                controls
                playsInline
                preload="metadata"
                className="max-h-[520px] w-full bg-black sm:col-span-2"
                aria-label={`Preview ${clipTitle || "approved clip"} in ${render.aspectRatio}`}
              />
            )}
          </div>
        );})}
      </div>
    </div>
  );
}
