"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  FileAudio,
  FileText,
  Loader2,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const lenses = [
  {
    value: "enterprise_meeting",
    label: "Team meeting",
    description: "Find decisions, participation patterns, ownership, and follow-through.",
    icon: Building2,
  },
  {
    value: "interview_coaching",
    label: "Interview coaching",
    description: "Help a candidate strengthen answers without making a hiring decision.",
    icon: BriefcaseBusiness,
  },
  {
    value: "interviewer_quality",
    label: "Interviewer practice",
    description: "Review question quality, consistency, opportunity, and job relevance.",
    icon: MessagesSquare,
  },
  {
    value: "leadership_coaching",
    label: "Leadership conversation",
    description: "Coach direction, listening, alignment, and communication growth.",
    icon: TrendingUp,
  },
] as const;

type Lens = (typeof lenses)[number]["value"];
type SourceMode = "media" | "transcript";

export function AnalysisComposer() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [lens, setLens] = useState<Lens>("enterprise_meeting");
  const [transcript, setTranscript] = useState("");
  const [sourceMode, setSourceMode] = useState<SourceMode>("media");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [participants, setParticipants] = useState("");
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const participantLabels = participants
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean);

  const canSubmit =
    !submitting &&
    title.trim().length >= 3 &&
    (sourceMode === "media" ? Boolean(mediaFile) : transcript.trim().length >= 80) &&
    consentConfirmed;

  async function submitMediaAnalysis() {
    if (!mediaFile) {
      toast.error("Choose an authorized audio or video file.");
      return;
    }
    if (!consentConfirmed) {
      toast.error("Confirm recording, transcription, and analysis authorization first.");
      return;
    }
    setSubmitting(true);
    try {
      const initResponse = await fetch("/api/development-intelligence/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          lens,
          fileName: mediaFile.name,
          fileSize: mediaFile.size,
          contentType: mediaFile.type,
          consentConfirmed: true,
          participantLabels,
        }),
      });
      const upload = await initResponse.json();
      if (!initResponse.ok) throw new Error(upload.error || "Unable to authorize media upload");

      toast.message("Uploading to the private, short-lived processing vault...");
      const { error: uploadError } = await createClient()
        .storage
        .from(upload.bucket)
        .uploadToSignedUrl(upload.path, upload.token, mediaFile, {
          contentType: mediaFile.type,
          upsert: false,
        });
      if (uploadError) throw new Error(uploadError.message);

      toast.message("Separating speakers and building the evidence report...");
      const processResponse = await fetch("/api/development-intelligence/media/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingestionId: upload.ingestionId }),
      });
      const payload = await processResponse.json();
      if (!processResponse.ok) throw new Error(payload.error || "Media analysis failed");
      toast.success("Your evidence report is ready for review.");
      router.push(`/dashboard/development/analyses/${payload.analysisId}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to process media");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitTranscriptAnalysis() {
    if (!consentConfirmed) {
      toast.error("Confirm transcript and analysis authorization first.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/development-intelligence/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          lens,
          transcript,
          sourceType: "transcript_paste",
          consentConfirmed: true,
          participantLabels,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Analysis failed");
      toast.success("Your evidence report is ready for review.");
      router.push(`/dashboard/development/analyses/${payload.analysisId}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to analyze transcript");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="overflow-hidden border-indigo-200 bg-white shadow-none">
      <div className="border-b border-indigo-100 bg-indigo-50 px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-700">Create a new report</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">What do you want to understand?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Choose the conversation type, add your authorized source, and Development Intelligence will build an evidence-linked report.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Raw source is not retained in the report</div>
        </div>
      </div>

      <CardContent className="space-y-8 p-6 sm:p-8">
        <fieldset>
          <legend className="flex items-center gap-3 text-sm font-semibold text-slate-950">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">1</span>
            Choose the coaching goal
          </legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {lenses.map((item) => {
              const selected = item.value === lens;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setLens(item.value)}
                  aria-pressed={selected}
                  className={`relative min-h-36 cursor-pointer rounded-xl border p-4 text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${selected ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40"}`}
                >
                  {selected && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white"><Check className="h-3 w-3" /></span>}
                  <item.icon className={`h-5 w-5 ${selected ? "text-indigo-700" : "text-slate-500"}`} />
                  <span className="mt-3 block text-sm font-semibold text-slate-950">{item.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">{item.description}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="flex items-center gap-3 text-sm font-semibold text-slate-950">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">2</span>
            Add the authorized conversation
          </legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => { setSourceMode("media"); setConsentConfirmed(false); }}
              aria-pressed={sourceMode === "media"}
              className={`flex min-h-20 cursor-pointer items-center gap-4 rounded-xl border px-4 text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${sourceMode === "media" ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-300"}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700"><FileAudio className="h-5 w-5" /></span>
              <span><span className="block text-sm font-semibold text-slate-950">Upload audio or video</span><span className="mt-1 block text-xs text-slate-600">Original file or a Zoom, Teams, or Meet export</span></span>
            </button>
            <button
              type="button"
              onClick={() => { setSourceMode("transcript"); setConsentConfirmed(false); }}
              aria-pressed={sourceMode === "transcript"}
              className={`flex min-h-20 cursor-pointer items-center gap-4 rounded-xl border px-4 text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${sourceMode === "transcript" ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-300"}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700"><FileText className="h-5 w-5" /></span>
              <span><span className="block text-sm font-semibold text-slate-950">Paste a transcript</span><span className="mt-1 block text-xs text-slate-600">Fastest when the text is already available</span></span>
            </button>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="analysis-title">Conversation name</Label>
              <Input id="analysis-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Example: Monday leadership meeting" maxLength={160} className="min-h-11" />
              <p className="text-xs text-slate-500">A clear name helps you find this report later.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="participant-labels">Who participated? <span className="font-normal text-slate-500">Optional</span></Label>
              <Input id="participant-labels" value={participants} onChange={(event) => setParticipants(event.target.value)} placeholder="Facilitator, Participant A, Participant B" className="min-h-11" />
              <p className="text-xs text-slate-500">Use roles or neutral labels, separated by commas.</p>
            </div>
          </div>

          {sourceMode === "media" ? (
            <div className="mt-5 space-y-2">
              <Label htmlFor="media-file">Recording</Label>
              <label htmlFor="media-file" className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-6 text-center transition-colors duration-200 hover:border-indigo-500 hover:bg-indigo-50 focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-indigo-700"><Upload className="h-6 w-6" /></span>
                <span className="mt-3 font-semibold text-slate-950">{mediaFile ? mediaFile.name : "Choose an audio or video file"}</span>
                <span className="mt-1 text-xs text-slate-500">MP3, MP4, M4A, WAV, or WebM · up to 25 MB</span>
                <Input id="media-file" type="file" accept="audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav,audio/webm,video/mp4,video/webm" className="sr-only" onChange={(event) => setMediaFile(event.target.files?.[0] || null)} />
              </label>
              <p className="text-xs leading-5 text-slate-500">The recording is processed in a private two-hour staging vault, then removed. The saved report contains only analysis and short evidence excerpts.</p>
              <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-700">
                <MessagesSquare className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" aria-hidden="true" />
                <p><span className="font-semibold text-slate-950">Using a meeting platform?</span> Export the authorized recording or transcript from Zoom, Microsoft Teams, or Google Meet, then add it here. Direct account connections are not required.</p>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-2">
              <Label htmlFor="transcript">Transcript</Label>
              <Textarea id="transcript" value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder={'Facilitator: What are we committing to this week?\nParticipant A: I’ll own the revised plan and bring it back Friday.'} className="min-h-60 resize-y" maxLength={120_000} />
              <div className="flex justify-between text-xs text-slate-500"><span>At least 80 characters</span><span>{transcript.length.toLocaleString()} / 120,000</span></div>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className="flex items-center gap-3 text-sm font-semibold text-slate-950">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">3</span>
            Confirm authorization and create the report
          </legend>
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
            <div className="flex gap-3">
              <Checkbox id="consent" checked={consentConfirmed} onCheckedChange={(checked) => setConsentConfirmed(checked === true)} className="mt-0.5" />
              <div>
                <Label htmlFor="consent" className="cursor-pointer text-sm font-semibold leading-6 text-emerald-950">
                  {sourceMode === "media" ? "I confirm that recording, transcription, and AI analysis are authorized." : "I confirm that use of this transcript and AI analysis are authorized."}
                </Label>
                <p className="mt-1 text-xs leading-5 text-emerald-800">This report supports development and human review. It cannot be used as a lie detector, diagnosis, protected-trait assessment, or automatic employment decision.</p>
              </div>
            </div>
          </div>
        </fieldset>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Evidence-linked findings · human review required</div>
          <Button onClick={sourceMode === "media" ? submitMediaAnalysis : submitTranscriptAnalysis} disabled={!canSubmit} size="lg" className="min-h-12 bg-emerald-600 px-6 text-base hover:bg-emerald-700">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{sourceMode === "media" ? "Building your report..." : "Analyzing the evidence..."}</> : <><Sparkles className="mr-2 h-4 w-4" />Create my evidence report<ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
