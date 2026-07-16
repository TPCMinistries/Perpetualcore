"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Clock3, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage, savePressTranscript } from "./api-client";
import type { PressTranscript } from "./types";

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    : `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function TranscriptEditor({ transcript, onSeek, onSaved }: { transcript: PressTranscript | null; onSeek: (milliseconds: number) => void; onSaved: (transcript: PressTranscript) => void }) {
  const [draft, setDraft] = useState<PressTranscript | null>(transcript);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(transcript);
    setDirty(false);
  }, [transcript]);

  if (!draft) {
    return (
      <div className="border border-zinc-300 bg-white p-8 text-center" role="status">
        <Clock3 className="mx-auto h-7 w-7 text-zinc-400" aria-hidden />
        <h3 className="mt-3 font-medium text-zinc-900">Transcript is not ready</h3>
        <p className="mt-1 text-sm text-zinc-600">The transcript will appear here after source processing completes.</p>
      </div>
    );
  }

  async function save() {
    if (!draft || !dirty) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await savePressTranscript(draft);
      setDraft(updated);
      setDirty(false);
      onSaved(updated);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-zinc-300 bg-white">
      <div className="flex flex-col justify-between gap-3 border-b border-zinc-200 p-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-medium text-zinc-950">Transcript</h3>
          <p className="mt-0.5 text-xs text-zinc-500">Edit the words while preserving their source timestamps.</p>
        </div>
        <Button type="button" className="h-11 rounded-md bg-zinc-950 text-white hover:bg-zinc-800" onClick={() => void save()} disabled={!dirty || saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : saved ? <Check className="mr-2 h-4 w-4" aria-hidden /> : <Save className="mr-2 h-4 w-4" aria-hidden />}
          {saving ? "Saving" : saved ? "Saved" : "Save transcript"}
        </Button>
      </div>

      {draft.segments.length > 0 ? (
        <div className="max-h-[640px] divide-y divide-zinc-200 overflow-y-auto">
          {draft.segments.map((segment, index) => (
            <div key={segment.id || `${segment.startMs}-${index}`} className="grid gap-3 p-4 sm:grid-cols-[84px_minmax(0,1fr)]">
              <button type="button" onClick={() => onSeek(segment.startMs)} className="flex min-h-11 items-center self-start font-mono text-xs text-zinc-500 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950" aria-label={`Play from ${formatTime(segment.startMs)}`}>
                {formatTime(segment.startMs)}
              </button>
              <div>
                {segment.speaker && <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">{segment.speaker}</p>}
                <Textarea
                  aria-label={`Transcript segment at ${formatTime(segment.startMs)}`}
                  value={segment.text}
                  rows={Math.max(2, Math.ceil(segment.text.length / 90))}
                  className="min-h-20 resize-y rounded-none border-zinc-200 text-sm leading-6 focus-visible:ring-zinc-950"
                  onChange={(event) => {
                    const segments = [...draft.segments];
                    segments[index] = { ...segment, text: event.target.value };
                    setDraft({ ...draft, segments, fullText: segments.map((item) => item.text).join(" ") });
                    setDirty(true);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4">
          <Textarea
            aria-label="Full transcript"
            value={draft.fullText}
            rows={18}
            className="resize-y rounded-none border-zinc-200 text-sm leading-7 focus-visible:ring-zinc-950"
            onChange={(event) => {
              setDraft({ ...draft, fullText: event.target.value });
              setDirty(true);
            }}
          />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 border-t border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
        </div>
      )}
    </div>
  );
}
