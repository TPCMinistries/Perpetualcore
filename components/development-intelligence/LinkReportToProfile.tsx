"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Link2, Loader2, Plus, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubjectOption {
  id: string;
  label: string;
  consentActive: boolean;
}

function normalizeSubjects(payload: unknown): SubjectOption[] {
  if (!payload || typeof payload !== "object") return [];
  const rows = "subjects" in payload && Array.isArray(payload.subjects)
    ? payload.subjects
    : [];

  return rows.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const row = value as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id : "";
    if (!id) return [];
    const consent = String(row.consentStatus ?? row.consent_state ?? "none");
    return [{
      id,
      label: String(row.displayLabel ?? row.display_label ?? "Unnamed profile"),
      consentActive: consent === "granted" || consent === "verified" || consent === "active",
    }];
  });
}

export function LinkReportToProfile({
  sessionId,
  participantLabels,
}: {
  sessionId: string;
  participantLabels: string[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [participantLabel, setParticipantLabel] = useState(participantLabels[0] || "");

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    fetch("/api/development-intelligence/subjects?status=active&limit=100", { cache: "no-store" })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok) throw new Error("Unable to load development profiles");
        if (active) setSubjects(normalizeSubjects(payload).filter((item) => item.consentActive));
      })
      .catch((error: unknown) => {
        if (active) toast.error(error instanceof Error ? error.message : "Unable to load development profiles");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [open]);

  async function linkReport() {
    if (!subjectId || !participantLabel) return;
    setLinking(true);
    try {
      const response = await fetch(`/api/development-intelligence/subjects/${subjectId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, participantLabel }),
      });
      const payload = await response.json() as { error?: string; linkedEvidenceCount?: number };
      if (!response.ok) throw new Error(payload.error || "Unable to link this report");
      toast.success(`Report linked with ${payload.linkedEvidenceCount || 0} evidence signals.`);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to link this report");
    } finally {
      setLinking(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11">
          <Link2 className="mr-2 h-4 w-4" />
          Link to person
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Link this report to a consented profile</DialogTitle>
          <DialogDescription className="leading-6">
            Choose the person and their neutral speaker label. Only evidence with that exact label will be added to the person&apos;s self-longitudinal trajectory.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex min-h-36 items-center justify-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> Loading profiles…
          </div>
        ) : subjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50 p-6 text-center">
            <UserRound className="mx-auto h-6 w-6 text-indigo-700" />
            <p className="mt-3 font-semibold text-slate-950">No active consented profile is available.</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Create the profile and record longitudinal consent before linking evidence.</p>
            <Button asChild className="mt-4 bg-indigo-600 hover:bg-indigo-700">
              <Link href="/dashboard/development/profiles"><Plus className="mr-2 h-4 w-4" />Create a profile</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-5 py-5">
            <div className="space-y-2">
              <Label htmlFor="report-profile">Development profile</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger id="report-profile"><SelectValue placeholder="Choose a person" /></SelectTrigger>
                <SelectContent>{subjects.map((subject) => <SelectItem key={subject.id} value={subject.id}>{subject.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-speaker">Participant label in this report</Label>
              <Select value={participantLabel} onValueChange={setParticipantLabel}>
                <SelectTrigger id="report-speaker"><SelectValue placeholder="Choose a speaker" /></SelectTrigger>
                <SelectContent>{participantLabels.map((label) => <SelectItem key={label} value={label}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          {subjects.length > 0 && (
            <Button type="button" onClick={() => void linkReport()} disabled={!subjectId || !participantLabel || linking} className="bg-indigo-600 hover:bg-indigo-700">
              {linking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              Link evidence
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
