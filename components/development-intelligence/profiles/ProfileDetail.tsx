"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CircleDashed,
  ClipboardCheck,
  ExternalLink,
  Link2,
  Loader2,
  MessageSquareQuote,
  ShieldAlert,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { DevelopmentNav } from "@/components/development-intelligence/DevelopmentNav";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import type {
  ApiErrorPayload,
  DevelopmentSubjectDetail,
  DevelopmentSubjectSummary,
  ProfileCommitment,
  ProfileObservation,
  ProfileSession,
  SubjectType,
} from "./types";

const subjectTypeLabels: Record<SubjectType, string> = {
  adult_employee: "Employee",
  adult_candidate: "Candidate",
  adult_participant: "Participant",
  leader: "Leader",
};

const lensLabels: Record<string, string> = {
  enterprise_meeting: "Team meeting",
  interview_coaching: "Interview coaching",
  interviewer_quality: "Interviewer practice",
  leadership_coaching: "Leadership conversation",
};

const levelScore = { demonstrated: 2, emerging: 1, not_observed: 0 } as const;

function normalizeConsentState(value: unknown): DevelopmentSubjectSummary["consentState"] {
  const status = String(value ?? "none");
  if (status === "active" || status === "granted" || status === "verified") return "active";
  if (status === "withdrawn") return "withdrawn";
  if (status === "expired") return "expired";
  return "not_verified";
}

function readable(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeSubject(value: Record<string, unknown>): DevelopmentSubjectSummary {
  return {
    id: String(value.id || ""),
    displayLabel: String(value.displayLabel ?? value.display_label ?? "Unnamed profile"),
    subjectType: String(value.subjectType ?? value.subject_type ?? "adult_participant") as SubjectType,
    status: value.status === "archived" ? "archived" : "active",
    consentState: normalizeConsentState(value.consentStatus ?? value.consentState),
    linkedSessionCount: Number(value.sessionCount ?? value.linkedSessionCount ?? 0),
    observationCount: Number(value.observationCount ?? 0),
    openCommitmentCount: Number(value.openCommitmentCount ?? 0),
    lastObservedAt: (value.lastObservedAt ?? null) as string | null,
    createdAt: String(value.createdAt ?? new Date().toISOString()),
  };
}

function normalizeDetail(payload: Record<string, unknown>): DevelopmentSubjectDetail {
  const subject = normalizeSubject((payload.subject || payload) as Record<string, unknown>);
  const sessions = (Array.isArray(payload.sessions) ? payload.sessions : []).map((value) => {
    const row = value as Record<string, unknown>;
    return {
      id: String(row.sessionId ?? row.id ?? ""),
      analysisId: (row.analysisId ?? null) as string | null,
      title: String(row.title ?? "Untitled conversation"),
      lens: String(row.lens ?? "enterprise_meeting"),
      participantLabel: String(row.participantLabel ?? "Participant"),
      occurredAt: String(row.occurredAt ?? new Date().toISOString()),
      reviewStatus: String(row.reviewStatus ?? "pending"),
      evidenceCount: typeof row.evidenceCount === "number" ? row.evidenceCount : undefined,
    } satisfies ProfileSession;
  });
  const observations = (Array.isArray(payload.observations) ? payload.observations : []).map((value) => {
    const row = value as Record<string, unknown>;
    return {
      id: String(row.id ?? ""),
      analysisId: String(row.analysisId ?? ""),
      sessionTitle: typeof row.sessionTitle === "string" ? row.sessionTitle : undefined,
      metricKey: String(row.metricKey ?? "development_signal"),
      metricLabel: String(row.metricLabel ?? readable(String(row.metricKey ?? "development signal"))),
      evidenceLevel: String(row.evidenceLevel ?? "not_observed") as ProfileObservation["evidenceLevel"],
      observation: typeof row.observation === "string" ? row.observation : undefined,
      evidenceQuote: typeof row.evidenceQuote === "string" ? row.evidenceQuote : undefined,
      developmentalAction: typeof row.developmentalAction === "string" ? row.developmentalAction : undefined,
      observedAt: String(row.observedAt ?? new Date().toISOString()),
    } satisfies ProfileObservation;
  });
  const commitments = (Array.isArray(payload.commitments) ? payload.commitments : []).map((value) => {
    const row = value as Record<string, unknown>;
    return {
      id: String(row.id ?? ""),
      analysisId: String(row.analysisId ?? ""),
      statement: String(row.statement ?? "Commitment"),
      ownerLabel: (row.ownerLabel ?? null) as string | null,
      dueDate: (row.dueDate ?? null) as string | null,
      evidenceQuote: String(row.evidenceQuote ?? "Open the source report to inspect evidence."),
      status: String(row.status ?? "unverified") as ProfileCommitment["status"],
      createdAt: String(row.updatedAt ?? row.createdAt ?? new Date().toISOString()),
    } satisfies ProfileCommitment;
  });
  return { ...subject, sessions, observations, commitments, consentEvents: [] };
}

export function ProfileDetail({ subjectId }: { subjectId: string }) {
  const [profile, setProfile] = useState<DevelopmentSubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [participantLabel, setParticipantLabel] = useState("");
  const [role, setRole] = useState("");
  const [linking, setLinking] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [updatingCommitment, setUpdatingCommitment] = useState<string | null>(null);
  const [pendingCommitment, setPendingCommitment] = useState<{
    id: string;
    statement: string;
    status: ProfileCommitment["status"];
  } | null>(null);
  const [commitmentNote, setCommitmentNote] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`/api/development-intelligence/subjects/${subjectId}`, { cache: "no-store" });
      const payload = (await response.json()) as Record<string, unknown> & ApiErrorPayload;
      if (!response.ok) throw new Error(payload.error || "Unable to load profile");
      setProfile(normalizeDetail(payload));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load profile");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const trends = useMemo(() => {
    const grouped = new Map<string, ProfileObservation[]>();
    for (const observation of profile?.observations || []) {
      const existing = grouped.get(observation.metricKey) || [];
      existing.push(observation);
      grouped.set(observation.metricKey, existing);
    }
    return Array.from(grouped.entries()).map(([key, observations]) => {
      const ordered = observations.sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime());
      const latest = ordered.at(-1)!;
      const previous = ordered.at(-2);
      const change = previous ? levelScore[latest.evidenceLevel] - levelScore[previous.evidenceLevel] : 0;
      return { key, label: latest.metricLabel, latest, previous, count: ordered.length, direction: previous ? change > 0 ? "improving" : change < 0 ? "watch" : "steady" : "new" };
    });
  }, [profile?.observations]);

  async function linkSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLinking(true);
    try {
      const response = await fetch(`/api/development-intelligence/subjects/${subjectId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId.trim(), participantLabel: participantLabel.trim(), role: role.trim() || undefined }),
      });
      const payload = (await response.json()) as ApiErrorPayload & { linkedEvidenceCount?: number };
      if (!response.ok) throw new Error(payload.error || "Unable to link conversation");
      toast.success(`Conversation linked${typeof payload.linkedEvidenceCount === "number" ? ` with ${payload.linkedEvidenceCount} evidence signals` : ""}.`);
      setLinkOpen(false);
      setSessionId("");
      setParticipantLabel("");
      setRole("");
      await loadProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to link conversation");
    } finally {
      setLinking(false);
    }
  }

  async function withdrawConsent() {
    setWithdrawing(true);
    try {
      const response = await fetch(`/api/development-intelligence/subjects/${subjectId}/consent/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: true, reason: withdrawReason.trim() || undefined }),
      });
      const payload = (await response.json()) as ApiErrorPayload;
      if (!response.ok) throw new Error(payload.error || "Unable to withdraw consent");
      toast.success("Longitudinal consent withdrawn. Future linking is now stopped.");
      setWithdrawReason("");
      setWithdrawOpen(false);
      await loadProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to withdraw consent");
    } finally {
      setWithdrawing(false);
    }
  }

  async function updateCommitment(
    commitmentId: string,
    status: ProfileCommitment["status"],
    note?: string
  ) {
    setUpdatingCommitment(commitmentId);
    try {
      const response = await fetch(`/api/development-intelligence/commitments/${commitmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: note?.trim() || undefined }),
      });
      const payload = (await response.json()) as ApiErrorPayload;
      if (!response.ok) throw new Error(payload.error || "Unable to update commitment");
      toast.success("Commitment status updated.");
      setProfile((current) => current ? { ...current, commitments: current.commitments.map((item) => item.id === commitmentId ? { ...item, status } : item) } : current);
      setPendingCommitment(null);
      setCommitmentNote("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update commitment");
    } finally {
      setUpdatingCommitment(null);
    }
  }

  function requestCommitmentUpdate(
    commitment: ProfileCommitment,
    status: ProfileCommitment["status"]
  ) {
    if (status === "changed" || status === "cancelled" || status === "unverified") {
      setPendingCommitment({ id: commitment.id, statement: commitment.statement, status });
      setCommitmentNote("");
      return;
    }
    void updateCommitment(commitment.id, status);
  }

  if (loading) return <div className="space-y-8 pb-12"><DevelopmentNav /><div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm text-slate-600"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" />Loading development profile…</div></div>;

  if (loadError || !profile) {
    return (
      <div className="space-y-6 pb-12">
        <DevelopmentNav />
        <Link href="/dashboard/development/profiles" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700"><ArrowLeft className="h-4 w-4" />Development profiles</Link>
        <Card className="border-rose-200 bg-rose-50 shadow-none"><CardContent className="p-8"><ShieldAlert className="h-7 w-7 text-rose-700" /><h1 className="mt-4 text-xl font-semibold text-rose-950">This profile could not be loaded.</h1><p className="mt-2 text-sm text-rose-800">{loadError || "The profile may no longer be available."}</p><Button variant="outline" className="mt-5 border-rose-300 bg-white" onClick={() => void loadProfile()}>Try again</Button></CardContent></Card>
      </div>
    );
  }

  const consentActive = profile.consentState === "active";
  const openCommitments = profile.commitments.filter((item) => item.status === "open" || item.status === "unverified").length;

  return (
    <div className="space-y-8 pb-12">
      <DevelopmentNav />
      <Link href="/dashboard/development/profiles" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"><ArrowLeft className="h-4 w-4" />Development profiles</Link>

      <section className="overflow-hidden rounded-[28px] border border-indigo-200 bg-[#f5f3ff] p-6 sm:p-9">
        <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border border-indigo-200 bg-white text-indigo-800 hover:bg-white"><UserRound className="mr-1.5 h-3.5 w-3.5" />{subjectTypeLabels[profile.subjectType]}</Badge>
              <Badge variant="outline" className={consentActive ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}>{consentActive ? <ShieldCheck className="mr-1 h-3.5 w-3.5" /> : <ShieldAlert className="mr-1 h-3.5 w-3.5" />}{consentActive ? "Longitudinal consent active" : `Consent ${readable(profile.consentState)}`}</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#1e1b4b] sm:text-4xl">{profile.displayLabel}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">A self-longitudinal view of observable, authorized evidence. Every signal remains connected to the conversation report that produced it.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
              <DialogTrigger asChild><Button size="lg" disabled={!consentActive} className="min-h-12 bg-indigo-600 hover:bg-indigo-700"><Link2 className="mr-2 h-4 w-4" />Link conversation</Button></DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <form onSubmit={linkSession}>
                  <DialogHeader><DialogTitle>Link an authorized conversation</DialogTitle><DialogDescription className="leading-6">Use the session ID from a Development Intelligence report and identify the participant label that belongs to {profile.displayLabel}. Only approved, consented source material should be linked.</DialogDescription></DialogHeader>
                  <div className="space-y-4 py-6">
                    <div className="space-y-2"><Label htmlFor="session-id">Session ID</Label><Input id="session-id" value={sessionId} onChange={(event) => setSessionId(event.target.value)} placeholder="00000000-0000-0000-0000-000000000000" required /></div>
                    <div className="space-y-2"><Label htmlFor="participant-label">Participant label in the report</Label><Input id="participant-label" value={participantLabel} onChange={(event) => setParticipantLabel(event.target.value)} placeholder="Speaker 1" maxLength={80} required /></div>
                    <div className="space-y-2"><Label htmlFor="profile-role">Role in this conversation <span className="font-normal text-slate-500">(optional)</span></Label><Input id="profile-role" value={role} onChange={(event) => setRole(event.target.value)} placeholder="Facilitator" maxLength={80} /></div>
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs leading-5 text-indigo-900"><ShieldCheck className="mr-1 inline h-4 w-4" />Linking assigns only evidence already attributed to the matching participant label. It does not re-analyze identity.</div>
                  </div>
                  <DialogFooter><Button type="button" variant="outline" onClick={() => setLinkOpen(false)} disabled={linking}>Cancel</Button><Button type="submit" disabled={linking || !sessionId.trim() || !participantLabel.trim()} className="bg-indigo-600 hover:bg-indigo-700">{linking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}Link conversation</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {!consentActive && <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Future longitudinal linking is disabled.</p><p className="mt-1">The existing audit history remains visible, but no new conversations or observations can be attached without a new governed consent process.</p></div></div>}

      <section aria-label="Profile summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Linked conversations", value: profile.sessions.length, icon: MessageSquareQuote, tone: "indigo" },
          { label: "Observed signals", value: profile.observations.length, icon: TrendingUp, tone: "emerald" },
          { label: "Development themes", value: trends.length, icon: Target, tone: "indigo" },
          { label: "Open commitments", value: openCommitments, icon: ClipboardCheck, tone: "amber" },
        ].map((item) => <Card key={item.label} className="border-slate-200 shadow-none"><CardContent className="flex items-center gap-4 p-5"><div className={`rounded-xl p-3 ${item.tone === "emerald" ? "bg-emerald-50 text-emerald-700" : item.tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"}`}><item.icon className="h-5 w-5" /></div><div><p className="text-2xl font-semibold text-slate-950">{item.value}</p><p className="text-sm text-slate-600">{item.label}</p></div></CardContent></Card>)}
      </section>

      <section>
        <div className="mb-5"><p className="text-sm font-semibold text-indigo-700">Self-longitudinal trajectory</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">How observable evidence is moving</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Direction compares only this person&apos;s latest evidence with their own previous evidence for the same coaching criterion.</p></div>
        {trends.length === 0 ? <Card className="border-dashed border-indigo-200 bg-indigo-50/40 shadow-none"><CardContent className="flex flex-col items-center px-6 py-10 text-center"><CircleDashed className="h-7 w-7 text-indigo-600" /><h3 className="mt-3 font-semibold text-slate-950">A trajectory appears after a conversation is linked.</h3><p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">Link an authorized report with participant-attributed evidence to begin this profile&apos;s baseline.</p></CardContent></Card> : <div className="grid gap-4 lg:grid-cols-2">{trends.map((trend) => {
          const direction = trend.direction === "improving" ? { label: "Improving", icon: TrendingUp, style: "border-emerald-200 bg-emerald-50 text-emerald-800" } : trend.direction === "watch" ? { label: "Coach next", icon: TrendingDown, style: "border-amber-200 bg-amber-50 text-amber-800" } : trend.direction === "steady" ? { label: "Steady", icon: CircleDashed, style: "border-slate-200 bg-slate-50 text-slate-700" } : { label: "New baseline", icon: Target, style: "border-indigo-200 bg-indigo-50 text-indigo-800" };
          return <Card key={trend.key} className="border-slate-200 shadow-none"><CardContent className="p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{trend.count} {trend.count === 1 ? "observation" : "observations"}</p><h3 className="mt-2 font-semibold text-slate-950">{trend.label}</h3></div><Badge variant="outline" className={direction.style}><direction.icon className="mr-1 h-3.5 w-3.5" />{direction.label}</Badge></div><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-800">Current: {readable(trend.latest.evidenceLevel)}</span>{trend.previous && <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Previous: {readable(trend.previous.evidenceLevel)}</span>}</div>{trend.latest.developmentalAction && <div className="mt-4 rounded-xl bg-indigo-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Developmental action</p><p className="mt-1 text-sm leading-6 text-indigo-950">{trend.latest.developmentalAction}</p></div>}<div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span>{new Date(trend.latest.observedAt).toLocaleDateString()}</span>{trend.latest.analysisId && <Link href={`/dashboard/development/analyses/${trend.latest.analysisId}`} className="inline-flex min-h-9 items-center font-medium text-indigo-700 hover:underline">Inspect source report <ExternalLink className="ml-1 h-3.5 w-3.5" /></Link>}</div></CardContent></Card>;
        })}</div>}
      </section>

      <section>
        <div className="mb-5"><p className="text-sm font-semibold text-indigo-700">Commitments</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Follow-through from the evidence</h2></div>
        {profile.commitments.length === 0 ? <Card className="border-dashed border-slate-200 shadow-none"><CardContent className="px-6 py-10 text-center"><ClipboardCheck className="mx-auto h-7 w-7 text-slate-400" /><h3 className="mt-3 font-semibold text-slate-950">No commitments are linked yet.</h3><p className="mt-2 text-sm text-slate-600">Commitments attributed in linked reports will appear here for human follow-up.</p></CardContent></Card> : <div className="space-y-3">{profile.commitments.map((commitment) => <Card key={commitment.id} className="border-slate-200 shadow-none"><CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={commitment.status === "completed" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}>{readable(commitment.status)}</Badge>{commitment.dueDate && <span className="inline-flex items-center text-xs text-slate-500"><CalendarDays className="mr-1 h-3.5 w-3.5" />Due {new Date(`${commitment.dueDate}T12:00:00`).toLocaleDateString()}</span>}</div><p className="mt-3 font-medium text-slate-950">{commitment.statement}</p><p className="mt-2 text-xs text-slate-500">{commitment.ownerLabel ? `Owner: ${commitment.ownerLabel}` : "Owner not verified"} · <Link href={`/dashboard/development/analyses/${commitment.analysisId}`} className="font-medium text-indigo-700 hover:underline">Inspect source report</Link></p></div><div className="flex items-center gap-2"><Label htmlFor={`commitment-${commitment.id}`} className="sr-only">Status for {commitment.statement}</Label><Select value={commitment.status} disabled={updatingCommitment === commitment.id} onValueChange={(value) => requestCommitmentUpdate(commitment, value as ProfileCommitment["status"])}><SelectTrigger id={`commitment-${commitment.id}`} className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="changed">Changed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem><SelectItem value="unverified">Unverified</SelectItem></SelectContent></Select>{updatingCommitment === commitment.id && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" aria-label="Updating commitment" />}</div></CardContent></Card>)}</div>}
      </section>

      <Dialog open={pendingCommitment !== null} onOpenChange={(open) => { if (!open && !updatingCommitment) { setPendingCommitment(null); setCommitmentNote(""); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Document this commitment change</DialogTitle>
            <DialogDescription className="leading-6">
              A reason is required when a commitment is marked {pendingCommitment ? readable(pendingCommitment.status).toLowerCase() : "changed"}. This preserves a useful human audit trail.
            </DialogDescription>
          </DialogHeader>
          {pendingCommitment && (
            <div className="space-y-4 py-4">
              <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{pendingCommitment.statement}</div>
              <div className="space-y-2">
                <Label htmlFor="commitment-note">Reason for the update</Label>
                <Textarea id="commitment-note" value={commitmentNote} onChange={(event) => setCommitmentNote(event.target.value)} maxLength={1_000} placeholder="Describe what changed or why this status is appropriate." required />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={updatingCommitment !== null} onClick={() => { setPendingCommitment(null); setCommitmentNote(""); }}>Cancel</Button>
            <Button type="button" disabled={!pendingCommitment || !commitmentNote.trim() || updatingCommitment !== null} className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { if (pendingCommitment) void updateCommitment(pendingCommitment.id, pendingCommitment.status, commitmentNote); }}>
              {updatingCommitment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save documented change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section>
        <div className="mb-5"><p className="text-sm font-semibold text-indigo-700">Conversation history</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Authorized reports in this profile</h2></div>
        {profile.sessions.length === 0 ? <Card className="border-dashed border-slate-200 shadow-none"><CardContent className="px-6 py-10 text-center"><MessageSquareQuote className="mx-auto h-7 w-7 text-slate-400" /><h3 className="mt-3 font-semibold text-slate-950">No conversations linked.</h3><p className="mt-2 text-sm text-slate-600">Use the link action to connect a reviewed, authorized report.</p></CardContent></Card> : <div className="space-y-3">{profile.sessions.map((session) => <Card key={session.id} className="border-slate-200 shadow-none"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700"><MessageSquareQuote className="h-5 w-5" /></div><div><h3 className="font-semibold text-slate-950">{session.title}</h3><p className="mt-1 text-sm text-slate-500">{lensLabels[session.lens] || readable(session.lens)} · {new Date(session.occurredAt).toLocaleDateString()}</p><p className="mt-1 text-xs text-slate-500">Participant label: {session.participantLabel}</p></div></div>{session.analysisId ? <Button asChild variant="outline" className="min-h-11"><Link href={`/dashboard/development/analyses/${session.analysisId}`}>Open report <ArrowRight className="ml-2 h-4 w-4" /></Link></Button> : <Badge variant="outline">Linked session</Badge>}</CardContent></Card>)}</div>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div><div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><ShieldCheck className="h-5 w-5 text-emerald-700" />Consent control</div><h2 className="mt-2 text-xl font-semibold text-slate-950">The participant can stop future longitudinal tracking.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Withdrawal archives this profile and blocks new session links. It does not silently rewrite the audit record or erase governed source reports.</p></div>
          <AlertDialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <AlertDialogTrigger asChild><Button variant="outline" disabled={!consentActive} className="min-h-11 border-rose-200 text-rose-700 hover:bg-rose-50"><ShieldAlert className="mr-2 h-4 w-4" />Withdraw consent</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Withdraw longitudinal consent?</AlertDialogTitle><AlertDialogDescription className="leading-6">This immediately stops new conversations and evidence from being linked to {profile.displayLabel}. The profile will be archived and the withdrawal will be recorded in the consent ledger.</AlertDialogDescription></AlertDialogHeader>
              <div className="space-y-2"><Label htmlFor="withdraw-reason">Reason <span className="font-normal text-slate-500">(optional)</span></Label><Textarea id="withdraw-reason" value={withdrawReason} onChange={(event) => setWithdrawReason(event.target.value)} maxLength={500} placeholder="Participant requested withdrawal" /></div>
              <AlertDialogFooter><AlertDialogCancel disabled={withdrawing}>Keep consent active</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void withdrawConsent(); }} disabled={withdrawing} className="bg-rose-700 hover:bg-rose-800">{withdrawing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm withdrawal</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />This is developmental coaching evidence, not a diagnosis, personality or integrity score, emotion or accent assessment, protected-trait inference, or automated employment recommendation.</div>
    </div>
  );
}
