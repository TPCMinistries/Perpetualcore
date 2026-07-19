"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const lenses = [
  {
    value: "enterprise_meeting",
    label: "Enterprise meeting",
    description: "Decisions, participation, ownership, and follow-through",
  },
  {
    value: "interview_coaching",
    label: "Interview coaching",
    description: "Developmental feedback only; no hiring recommendation",
  },
  {
    value: "interviewer_quality",
    label: "Interviewer quality",
    description: "Consistency, opportunity, job relevance, and evidence",
  },
  {
    value: "leadership_coaching",
    label: "Leadership coaching",
    description: "Direction, listening, alignment, and development",
  },
] as const;

export function AnalysisComposer() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [lens, setLens] = useState<(typeof lenses)[number]["value"]>(
    "enterprise_meeting"
  );
  const [transcript, setTranscript] = useState("");
  const [participants, setParticipants] = useState("");
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submitAnalysis() {
    if (!consentConfirmed) {
      toast.error("Confirm recording and analysis consent before continuing.");
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
          participantLabels: participants
            .split(",")
            .map((label) => label.trim())
            .filter(Boolean),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Analysis failed");
      }
      toast.success("Evidence report is ready for human review.");
      router.push(`/dashboard/development/analyses/${payload.analysisId}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to analyze transcript"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-cyan-200 bg-gradient-to-br from-white to-cyan-50/60 shadow-sm">
      <CardHeader className="border-b border-cyan-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-700 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Analyze an authorized conversation</CardTitle>
            <p className="mt-1 text-sm text-slate-600">
              The full transcript is processed transiently; only the analysis and short supporting excerpts are retained.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="analysis-title">Session title</Label>
            <Input
              id="analysis-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Monday leadership meeting"
              maxLength={160}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="analysis-lens">Analysis lens</Label>
            <Select
              value={lens}
              onValueChange={(value) =>
                setLens(value as (typeof lenses)[number]["value"])
              }
            >
              <SelectTrigger id="analysis-lens">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lenses.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              {lenses.find((item) => item.value === lens)?.description}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="participant-labels">Participant labels</Label>
          <Input
            id="participant-labels"
            value={participants}
            onChange={(event) => setParticipants(event.target.value)}
            placeholder="Facilitator, Participant A, Participant B"
          />
          <p className="text-xs text-slate-500">
            Use roles or neutral labels instead of unnecessary personal information.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transcript">Transcript</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Textarea
              id="transcript"
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="Paste an authorized transcript with speaker labels..."
              className="min-h-56 pl-10"
              maxLength={120_000}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Minimum 80 characters</span>
            <span>{transcript.length.toLocaleString()} / 120,000</span>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex gap-3">
            <Checkbox
              id="consent"
              checked={consentConfirmed}
              onCheckedChange={(checked) => setConsentConfirmed(checked === true)}
              className="mt-0.5"
            />
            <div>
              <Label htmlFor="consent" className="cursor-pointer text-emerald-950">
                I confirm that recording and AI analysis are authorized.
              </Label>
              <p className="mt-1 text-xs leading-5 text-emerald-800">
                This report supports coaching and human review. It must not be used
                as a lie detector, diagnosis, protected-trait assessment, or automatic
                employment decision.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            Evidence-linked observations · human review required
          </div>
          <Button
            onClick={submitAnalysis}
            disabled={
              submitting ||
              title.trim().length < 3 ||
              transcript.trim().length < 80 ||
              !consentConfirmed
            }
            className="min-h-11 bg-cyan-800 hover:bg-cyan-900"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing evidence...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Create evidence report
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
