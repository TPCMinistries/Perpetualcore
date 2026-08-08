"use client";

import { useState } from "react";
import { AlertCircle, Check, Clock3, Film, Loader2, Pencil, Scissors, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage, renderPressClip, reviewPressClip, updatePressClip } from "./api-client";
import type { PressClip, PressRender } from "./types";

function formatTime(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function scoreLabel(score?: number | null): string | null {
  if (score === null || score === undefined) return null;
  return score <= 1 ? `${Math.round(score * 100)}% score` : `${Math.round(score)} score`;
}

const RATIOS: PressRender["aspectRatio"][] = ["9:16", "1:1", "16:9"];

export function ClipCandidates({ clips, onChange, onRenders }: { clips: PressClip[]; onChange: (clip: PressClip) => void; onRenders: (renders: PressRender[]) => void }) {
  const [selected, setSelected] = useState<PressClip | null>(null);
  const [dialog, setDialog] = useState<"edit" | "reject" | "render" | null>(null);
  const [reason, setReason] = useState("");
  const [ratios, setRatios] = useState<PressRender["aspectRatio"][]>(["9:16"]);
  const [captionStyle, setCaptionStyle] = useState<"none" | "minimal" | "bold" | "brand">("minimal");
  const [captionPosition, setCaptionPosition] = useState<"top" | "center" | "bottom">("bottom");
  const [focalPreset, setFocalPreset] = useState<"left" | "center" | "right">("center");
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editHook, setEditHook] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  function openEdit(clip: PressClip) {
    setSelected(clip);
    setEditTitle(clip.title);
    setEditHook(clip.hook || "");
    setEditStart((clip.startMs / 1000).toFixed(1));
    setEditEnd((clip.endMs / 1000).toFixed(1));
    setError(null);
    setDialog("edit");
  }

  async function saveEdit(clip: PressClip) {
    const startMs = Math.round(Number(editStart) * 1000);
    const endMs = Math.round(Number(editEnd) * 1000);
    if (!editTitle.trim() || !Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs < 0 || endMs <= startMs) {
      setError("Enter a title and a valid clip range where the end is after the start.");
      return;
    }
    setWorkingId(clip.id);
    setError(null);
    try {
      onChange(await updatePressClip(clip, {
        title: editTitle.trim(), hook: editHook.trim() || null, startMs, endMs,
      }));
      setDialog(null);
      setSelected(null);
    } catch (editError) {
      setError(getErrorMessage(editError));
    } finally {
      setWorkingId(null);
    }
  }

  async function review(clip: PressClip, action: "approve" | "reject", rejectionReason?: string) {
    setWorkingId(clip.id);
    setError(null);
    try {
      onChange(await reviewPressClip(clip, action, rejectionReason));
      setDialog(null);
      setSelected(null);
      setReason("");
    } catch (reviewError) {
      setError(getErrorMessage(reviewError));
    } finally {
      setWorkingId(null);
    }
  }

  async function render(clip: PressClip) {
    if (ratios.length === 0) return;
    setWorkingId(clip.id);
    setError(null);
    try {
      onRenders(await renderPressClip(clip, {
        aspectRatios: ratios,
        captionStyle,
        captionPosition,
        focalPoint: {
          x: focalPreset === "left" ? 0.25 : focalPreset === "right" ? 0.75 : 0.5,
          y: 0.5,
        },
      }));
      onChange({ ...clip, status: "rendering" });
      setDialog(null);
      setSelected(null);
    } catch (renderError) {
      setError(getErrorMessage(renderError));
    } finally {
      setWorkingId(null);
    }
  }

  if (clips.length === 0) {
    return (
      <div className="border border-zinc-300 bg-white p-8 text-center" role="status">
        <Scissors className="mx-auto h-7 w-7 text-zinc-400" aria-hidden />
        <h3 className="mt-3 font-medium text-zinc-900">No clip candidates yet</h3>
        <p className="mt-1 text-sm text-zinc-600">Candidates will appear after the source transcript has been analyzed.</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {clips.map((clip) => {
          const working = workingId === clip.id;
          return (
            <article key={clip.id} className="flex flex-col border border-zinc-300 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full capitalize">{clip.status}</Badge>
                    {scoreLabel(clip.score) && <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">{scoreLabel(clip.score)}</span>}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-zinc-950">{clip.title || "Untitled candidate"}</h3>
                </div>
                <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-zinc-500"><Clock3 className="h-3.5 w-3.5" aria-hidden /> {formatTime(clip.startMs)}–{formatTime(clip.endMs)}</span>
              </div>
              {clip.hook && <p className="mt-4 text-sm font-medium leading-6 text-zinc-900">{clip.hook}</p>}
              {clip.transcript && <p className="mt-2 line-clamp-4 text-sm leading-6 text-zinc-600">{clip.transcript}</p>}
              {clip.scoreReason && <p className="mt-4 border-l-2 border-zinc-300 pl-3 text-xs leading-5 text-zinc-500">{clip.scoreReason}</p>}

              <div className="mt-auto flex flex-wrap gap-2 border-t border-zinc-200 pt-5">
                {(clip.status === "candidate" || clip.status === "approved") && (
                  <Button type="button" variant="outline" className="h-11 rounded-md" disabled={working} onClick={() => openEdit(clip)}>
                    <Pencil className="mr-2 h-4 w-4" aria-hidden /> Edit clip
                  </Button>
                )}
                {clip.status === "candidate" && (
                  <>
                    <Button type="button" variant="outline" className="h-11 rounded-md" disabled={working} onClick={() => { setSelected(clip); setDialog("reject"); setError(null); }}><X className="mr-2 h-4 w-4" aria-hidden /> Reject</Button>
                    <Button type="button" className="h-11 rounded-md bg-zinc-950 text-white hover:bg-zinc-800" disabled={working} onClick={() => void review(clip, "approve")}>
                      {working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Check className="mr-2 h-4 w-4" aria-hidden />} Approve
                    </Button>
                  </>
                )}
                {clip.status === "approved" && (
                  <Button type="button" className="h-11 rounded-md bg-zinc-950 text-white hover:bg-zinc-800" onClick={() => { setSelected(clip); setDialog("render"); setError(null); }}><Film className="mr-2 h-4 w-4" aria-hidden /> Render variants</Button>
                )}
                {(clip.status === "rendering" || clip.status === "ready") && <p className="flex min-h-11 items-center text-sm text-zinc-600">{clip.status === "rendering" ? "Render is in progress." : "Output is ready in Exports."}</p>}
              </div>
            </article>
          );
        })}
      </div>

      <Dialog open={dialog === "edit"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit clip details and timing</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="clip-edit-title">Title</Label>
              <Input id="clip-edit-title" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} maxLength={180} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clip-edit-hook">Hook</Label>
              <Textarea id="clip-edit-hook" value={editHook} onChange={(event) => setEditHook(event.target.value)} rows={3} maxLength={500} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="clip-edit-start">Start (seconds)</Label>
                <Input id="clip-edit-start" type="number" min="0" step="0.1" inputMode="decimal" value={editStart} onChange={(event) => setEditStart(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clip-edit-end">End (seconds)</Label>
                <Input id="clip-edit-end" type="number" min="0.1" step="0.1" inputMode="decimal" value={editEnd} onChange={(event) => setEditEnd(event.target.value)} />
              </div>
            </div>
            {selected?.status === "approved" && <p className="text-xs leading-5 text-zinc-500">Changing an approved clip returns it to candidate review before rendering.</p>}
            {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button className="bg-zinc-950 text-white hover:bg-zinc-800" disabled={!selected || workingId === selected?.id} onClick={() => selected && void saveEdit(selected)}>
              {selected && workingId === selected.id && <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />} Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "reject"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject this clip candidate?</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="clip-rejection-reason">Reason</Label>
            <Textarea id="clip-rejection-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="What should change in the next selection pass?" rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="destructive" disabled={!reason.trim() || !selected || workingId === selected?.id} onClick={() => selected && void review(selected, "reject", reason.trim())}>Reject candidate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "render"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Design the output variants</DialogTitle></DialogHeader>
          <fieldset className="space-y-3 py-2">
            <legend className="text-sm text-zinc-600">Choose formats, caption treatment, and the crop focus used across variants.</legend>
            {RATIOS.map((ratio) => (
              <div key={ratio} className="flex min-h-11 items-center gap-3 border border-zinc-200 px-3">
                <Checkbox id={`ratio-${ratio}`} checked={ratios.includes(ratio)} onCheckedChange={(checked) => setRatios((current) => checked ? [...current, ratio] : current.filter((item) => item !== ratio))} />
                <Label htmlFor={`ratio-${ratio}`} className="flex-1 cursor-pointer">{ratio} <span className="ml-1 text-zinc-500">{ratio === "9:16" ? "Vertical" : ratio === "1:1" ? "Square" : "Landscape"}</span></Label>
              </div>
            ))}
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="render-caption-style">Caption style</Label>
              <select id="render-caption-style" value={captionStyle} onChange={(event) => setCaptionStyle(event.target.value as typeof captionStyle)} className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm">
                <option value="none">No captions</option>
                <option value="minimal">Minimal</option>
                <option value="bold">Bold social</option>
                <option value="brand">Brand outline</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="render-caption-position">Caption position</Label>
              <select id="render-caption-position" value={captionPosition} onChange={(event) => setCaptionPosition(event.target.value as typeof captionPosition)} disabled={captionStyle === "none"} className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm disabled:opacity-50">
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="render-focal-point">Crop focus</Label>
              <select id="render-focal-point" value={focalPreset} onChange={(event) => setFocalPreset(event.target.value as typeof focalPreset)} className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm">
                <option value="left">Subject left</option>
                <option value="center">Subject center</option>
                <option value="right">Subject right</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button className="bg-zinc-950 text-white hover:bg-zinc-800" disabled={ratios.length === 0 || !selected || workingId === selected?.id} onClick={() => selected && void render(selected)}>
              {selected && workingId === selected.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />} Start render
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
