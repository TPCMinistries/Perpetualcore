"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  ClipboardCheck,
  FileSearch,
  Loader2,
  MessageSquareQuote,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AgentRunDetail, AgentRunReviewStatus, AgentRunStatus, SpecialistReport } from "./types";

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeRun(payload: Record<string, unknown>): AgentRunDetail {
  const value = record(payload.run ?? payload);
  const plan = record(value.plan);
  const humanReview = record(plan.humanReview);
  const stored = record(value.synthesis);
  const synthesis = record(stored.synthesis ?? stored.result ?? ("executiveSummary" in stored ? stored : {}));
  const agreements = (Array.isArray(synthesis.agreements) ? synthesis.agreements : []).map((item) => {
    const row = record(item);
    return { claim: String(row.claim ?? "Grounded agreement"), specialists: strings(row.specialists), evidenceQuotes: strings(row.evidenceQuotes), confidence: Number(row.confidence ?? 0) };
  });
  const reports: SpecialistReport[] = (Array.isArray(stored.specialistReports) ? stored.specialistReports : []).map((item) => {
    const row = record(item);
    return {
      specialist: String(row.specialist ?? "specialist"),
      summary: String(row.summary ?? "No specialist summary was stored."),
      findings: (Array.isArray(row.findings) ? row.findings : []).map((finding) => {
        const detail = record(finding);
        return { claim: String(detail.claim ?? "Finding"), evidenceQuotes: strings(detail.evidenceQuotes), confidence: Number(detail.confidence ?? 0), caveat: String(detail.caveat ?? "") };
      }),
      limitations: strings(row.limitations),
      safetyFlags: strings(row.safetyFlags),
    };
  });
  const evidenceCount = agreements.reduce((total, item) => total + item.evidenceQuotes.length, 0);
  const safetyFlags = strings(synthesis.safetyFlags);
  return {
    id: String(value.id ?? ""),
    goal: String(value.goal ?? "Untitled agent run"),
    status: String(value.status ?? "planned") as AgentRunStatus,
    humanReviewStatus: String(value.humanReviewStatus ?? "pending") as AgentRunReviewStatus,
    intendedUse: String(plan.intendedUse ?? "development_coaching"),
    specialistCount: reports.length || (Array.isArray(plan.recommendedSpecialists) ? plan.recommendedSpecialists.length : 0),
    evidenceCount,
    safetyFlagCount: safetyFlags.length + reports.reduce((total, item) => total + item.safetyFlags.length, 0),
    createdAt: String(value.createdAt ?? new Date().toISOString()),
    updatedAt: String(value.updatedAt ?? new Date().toISOString()),
    context: record(value.context),
    planTitle: String(plan.planTitle ?? "Governed analysis plan"),
    objective: String(plan.objective ?? value.goal ?? ""),
    reviewerFocus: strings(humanReview.reviewerFocus),
    synthesis: Object.keys(synthesis).length ? {
      executiveSummary: String(synthesis.executiveSummary ?? "The synthesis is ready for review."),
      agreements,
      disagreements: (Array.isArray(synthesis.disagreements) ? synthesis.disagreements : []).map((item) => { const row = record(item); return { topic: String(row.topic ?? "Disagreement"), positions: strings(row.positions), reviewerQuestion: String(row.reviewerQuestion ?? "What interpretation is best supported?") }; }),
      strengths: strings(synthesis.strengths),
      growthOpportunities: strings(synthesis.growthOpportunities),
      commitments: (Array.isArray(synthesis.commitments) ? synthesis.commitments : []).map((item) => { const row = record(item); return { statement: String(row.statement ?? "Commitment"), ownerLabel: typeof row.ownerLabel === "string" ? row.ownerLabel : null, dueDate: typeof row.dueDate === "string" ? row.dueDate : null, evidenceQuote: String(row.evidenceQuote ?? "") }; }),
      nextActions: (Array.isArray(synthesis.nextActions) ? synthesis.nextActions : []).map((item) => { const row = record(item); return { action: String(row.action ?? "Next action"), ownerRole: String(row.ownerRole ?? "Human owner"), rationale: String(row.rationale ?? "") }; }),
      limitations: strings(synthesis.limitations),
      safetyFlags,
    } : null,
    specialistReports: reports,
    failedSpecialists: strings(stored.failedSpecialists),
    humanReviewNote: typeof value.humanReviewNote === "string" ? value.humanReviewNote : typeof value.reviewNote === "string" ? value.reviewNote : null,
    reviewedAt: typeof value.reviewedAt === "string" ? value.reviewedAt : null,
  };
}

function readable(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const reviewLabels: Record<Exclude<AgentRunReviewStatus, "pending">, string> = {
  approved: "Approve synthesis",
  needs_revision: "Request revision",
  rejected: "Reject synthesis",
};

export function RunDetail({ runId }: { runId: string }) {
  const [run, setRun] = useState<AgentRunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState<Exclude<AgentRunReviewStatus, "pending"> | null>(null);
  const [saving, setSaving] = useState(false);

  const loadRun = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/development-intelligence/agent/runs/${runId}`, { cache: "no-store" });
      const payload = await response.json() as Record<string, unknown> & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to load agent run");
      const next = normalizeRun(payload);
      setRun(next);
      setNote(next.humanReviewNote || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load agent run");
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => { void loadRun(); }, [loadRun]);

  const allEvidence = useMemo(() => run?.specialistReports.flatMap((report) => report.findings.flatMap((finding) => finding.evidenceQuotes)) || [], [run]);

  async function saveReview() {
    if (!decision || !run) return;
    if ((decision === "needs_revision" || decision === "rejected") && !note.trim()) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/development-intelligence/agent/runs/${run.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: decision, note: note.trim() || undefined }),
      });
      const payload = await response.json() as Record<string, unknown> & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to save human review");
      setRun(normalizeRun(payload));
      setDecision(null);
      toast.success("Human review decision recorded.");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Unable to save review");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex min-h-[55vh] items-center justify-center gap-3 text-sm text-slate-600"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" />Loading run evidence…</div>;
  if (error || !run) return <div className="space-y-5"><Link href="/dashboard/development/operations" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700"><ArrowLeft className="h-4 w-4" />Agent Operations</Link><Card className="border-rose-200 bg-rose-50 shadow-none"><CardContent className="p-8"><XCircle className="h-7 w-7 text-rose-700" /><h1 className="mt-4 text-xl font-semibold text-rose-950">This run could not be loaded.</h1><p className="mt-2 text-sm text-rose-800">{error}</p><Button variant="outline" className="mt-5 bg-white" onClick={() => void loadRun()}><RefreshCw className="mr-2 h-4 w-4" />Try again</Button></CardContent></Card></div>;

  const reviewEnabled = run.status === "review_ready" && run.humanReviewStatus === "pending";
  const statusTone = run.status === "review_ready" ? "border-amber-200 bg-amber-50 text-amber-800" : run.status === "failed" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-indigo-200 bg-indigo-50 text-indigo-800";
  const reviewTone = run.humanReviewStatus === "approved" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : run.humanReviewStatus === "rejected" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-amber-200 bg-amber-50 text-amber-800";

  return <div className="space-y-8">
    <Link href="/dashboard/development/operations" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"><ArrowLeft className="h-4 w-4" />Agent Operations</Link>
    <section className="overflow-hidden rounded-[28px] border border-indigo-200 bg-[#f5f3ff] p-6 sm:p-9"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex flex-wrap gap-2"><Badge variant="outline" className={statusTone}>{readable(run.status)}</Badge><Badge variant="outline" className={reviewTone}>{run.humanReviewStatus === "pending" ? "Human review pending" : readable(run.humanReviewStatus)}</Badge>{run.safetyFlagCount > 0 && <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-800"><AlertTriangle className="mr-1 h-3.5 w-3.5" />{run.safetyFlagCount} safety flags</Badge>}</div><h1 className="mt-4 max-w-4xl text-2xl font-semibold tracking-[-0.025em] text-[#1e1b4b] sm:text-4xl">{run.goal}</h1><p className="mt-4 max-w-3xl text-sm leading-6 text-slate-700">{run.objective}</p></div><div className="shrink-0 text-xs leading-5 text-slate-500"><p>Created {new Date(run.createdAt).toLocaleString()}</p><p>Updated {new Date(run.updatedAt).toLocaleString()}</p></div></div></section>

    <section aria-label="Run evidence summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
      { label: "Specialists completed", value: run.specialistCount, icon: UsersRound, tone: "indigo" },
      { label: "Evidence quotes", value: Math.max(run.evidenceCount, allEvidence.length), icon: MessageSquareQuote, tone: "emerald" },
      { label: "Safety flags", value: run.safetyFlagCount, icon: ShieldAlert, tone: "amber" },
      { label: "Failed specialists", value: run.failedSpecialists.length, icon: XCircle, tone: "rose" },
    ].map((item) => <Card key={item.label} className="border-slate-200 shadow-none"><CardContent className="flex items-center gap-4 p-5"><div className={`rounded-xl p-3 ${item.tone === "emerald" ? "bg-emerald-50 text-emerald-700" : item.tone === "amber" ? "bg-amber-50 text-amber-700" : item.tone === "rose" ? "bg-rose-50 text-rose-700" : "bg-indigo-50 text-indigo-700"}`}><item.icon className="h-5 w-5" /></div><div><p className="text-2xl font-semibold text-slate-950">{item.value}</p><p className="text-sm text-slate-600">{item.label}</p></div></CardContent></Card>)}</section>

    <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]"><Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Target className="h-5 w-5 text-indigo-700" />{run.planTitle}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-slate-700">{run.objective}</p><p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Intended use</p><p className="mt-1 text-sm text-slate-700">{readable(run.intendedUse)}</p></CardContent></Card><Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-5 w-5 text-indigo-700" />Reviewer focus</CardTitle></CardHeader><CardContent>{run.reviewerFocus.length ? <ul className="space-y-2">{run.reviewerFocus.map((item) => <li key={item} className="flex items-start gap-2 text-sm leading-5 text-slate-700"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />{item}</li>)}</ul> : <p className="text-sm text-slate-500">Verify grounding, limitations, appropriate scope, and prohibited inference.</p>}</CardContent></Card></section>

    <section><div className="mb-5"><p className="text-sm font-semibold text-indigo-700">Specialist trace</p><h2 className="mt-1 text-2xl font-semibold text-slate-950">Independent work behind the synthesis</h2><p className="mt-2 text-sm text-slate-600">Inspect each specialist&apos;s claims and source excerpts before reviewing the combined answer.</p></div>{run.specialistReports.length === 0 ? <Card className="border-dashed border-slate-200 shadow-none"><CardContent className="px-6 py-10 text-center"><CircleDashed className="mx-auto h-7 w-7 text-slate-400" /><h3 className="mt-3 font-semibold text-slate-950">No completed specialist trace.</h3><p className="mt-2 text-sm text-slate-600">This run may still be planned, running, or failed before specialist completion.</p></CardContent></Card> : <div className="grid gap-4 lg:grid-cols-2">{run.specialistReports.map((report) => <Card key={report.specialist} className="border-slate-200 shadow-none"><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-base"><BrainCircuit className="h-5 w-5 text-indigo-700" />{readable(report.specialist)}</CardTitle><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Completed</Badge></div></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-6 text-slate-700">{report.summary}</p>{report.findings.map((finding, index) => <div key={`${finding.claim}-${index}`} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium leading-6 text-slate-950">{finding.claim}</p><Badge variant="outline" className="shrink-0">{Math.round(finding.confidence * 100)}%</Badge></div>{finding.evidenceQuotes.map((quote) => <blockquote key={quote} className="mt-3 border-l-4 border-indigo-400 bg-indigo-50 px-3 py-2 text-xs leading-5 text-indigo-950">“{quote}”</blockquote>)}{finding.caveat && <p className="mt-3 text-xs leading-5 text-amber-800"><strong>Limit:</strong> {finding.caveat}</p>}</div>)}{report.safetyFlags.length > 0 && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-900"><strong>Safety review:</strong> {report.safetyFlags.join(" · ")}</div>}</CardContent></Card>)}</div>}</section>

    {run.synthesis ? <section className="space-y-5"><div><p className="text-sm font-semibold text-indigo-700">Synthesis</p><h2 className="mt-1 text-2xl font-semibold text-slate-950">Combined findings for human review</h2></div><Card className="border-indigo-200 shadow-none"><CardHeader className="border-b border-indigo-100 bg-indigo-50/50"><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-indigo-700" />Executive summary</CardTitle></CardHeader><CardContent className="p-6"><p className="text-base leading-7 text-slate-800">{run.synthesis.executiveSummary}</p></CardContent></Card>
      {run.synthesis.agreements.length > 0 && <div className="grid gap-4 lg:grid-cols-2">{run.synthesis.agreements.map((agreement, index) => <Card key={`${agreement.claim}-${index}`} className="border-slate-200 shadow-none"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold leading-6 text-slate-950">{agreement.claim}</h3><Badge variant="outline">{Math.round(agreement.confidence * 100)}%</Badge></div><div className="mt-3 flex flex-wrap gap-2">{agreement.specialists.map((item) => <Badge key={item} variant="outline" className="bg-slate-50">{readable(item)}</Badge>)}</div>{agreement.evidenceQuotes.map((quote) => <blockquote key={quote} className="mt-3 border-l-4 border-indigo-400 bg-indigo-50 px-3 py-2 text-sm leading-6 text-indigo-950">“{quote}”</blockquote>)}</CardContent></Card>)}</div>}
      {run.synthesis.disagreements.length > 0 && <Card className="border-amber-200 bg-amber-50/40 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-5 w-5 text-amber-700" />Specialist disagreements</CardTitle></CardHeader><CardContent className="space-y-4">{run.synthesis.disagreements.map((item) => <div key={item.topic} className="rounded-xl bg-white p-4"><h3 className="font-semibold text-slate-950">{item.topic}</h3><ul className="mt-2 space-y-1">{item.positions.map((position) => <li key={position} className="text-sm leading-6 text-slate-700">• {position}</li>)}</ul><p className="mt-3 text-sm font-medium text-amber-900">Reviewer question: {item.reviewerQuestion}</p></div>)}</CardContent></Card>}
      <div className="grid gap-4 lg:grid-cols-2"><Card className="border-emerald-200 bg-emerald-50/30 shadow-none"><CardHeader><CardTitle className="text-base text-emerald-950">Demonstrated strengths</CardTitle></CardHeader><CardContent><ul className="space-y-2">{run.synthesis.strengths.length ? run.synthesis.strengths.map((item) => <li key={item} className="flex items-start gap-2 text-sm leading-6 text-emerald-950"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0" />{item}</li>) : <li className="text-sm text-slate-500">No supported strength was synthesized.</li>}</ul></CardContent></Card><Card className="border-amber-200 bg-amber-50/30 shadow-none"><CardHeader><CardTitle className="text-base text-amber-950">Growth opportunities</CardTitle></CardHeader><CardContent><ul className="space-y-2">{run.synthesis.growthOpportunities.length ? run.synthesis.growthOpportunities.map((item) => <li key={item} className="flex items-start gap-2 text-sm leading-6 text-amber-950"><Target className="mt-1 h-4 w-4 shrink-0" />{item}</li>) : <li className="text-sm text-slate-500">No supported opportunity was synthesized.</li>}</ul></CardContent></Card></div>
      {(run.synthesis.commitments.length > 0 || run.synthesis.nextActions.length > 0) && <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-5 w-5 text-indigo-700" />Commitments and proposed actions</CardTitle></CardHeader><CardContent className="grid gap-4 lg:grid-cols-2">{run.synthesis.commitments.map((item) => <div key={item.statement} className="rounded-xl border border-slate-200 p-4"><Badge variant="outline">Commitment</Badge><p className="mt-3 text-sm font-medium leading-6 text-slate-950">{item.statement}</p><p className="mt-2 text-xs text-slate-500">{item.ownerLabel || "Owner unverified"}{item.dueDate ? ` · Due ${new Date(`${item.dueDate}T12:00:00`).toLocaleDateString()}` : ""}</p><blockquote className="mt-3 border-l-4 border-indigo-400 bg-indigo-50 px-3 py-2 text-xs leading-5 text-indigo-950">“{item.evidenceQuote}”</blockquote></div>)}{run.synthesis.nextActions.map((item) => <div key={item.action} className="rounded-xl border border-slate-200 p-4"><Badge variant="outline">Proposed · human approval required</Badge><p className="mt-3 text-sm font-medium leading-6 text-slate-950">{item.action}</p><p className="mt-2 text-xs text-slate-500">Owner role: {item.ownerRole}</p><p className="mt-2 text-xs leading-5 text-slate-600">{item.rationale}</p></div>)}</CardContent></Card>}
      <div className="grid gap-4 lg:grid-cols-2"><Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileSearch className="h-5 w-5 text-slate-600" />Limitations</CardTitle></CardHeader><CardContent><ul className="space-y-2">{run.synthesis.limitations.map((item) => <li key={item} className="flex items-start gap-2 text-sm leading-6 text-slate-700"><ChevronRight className="mt-1 h-4 w-4 shrink-0" />{item}</li>)}</ul></CardContent></Card><Card className={run.synthesis.safetyFlags.length ? "border-rose-200 bg-rose-50/40 shadow-none" : "border-emerald-200 bg-emerald-50/30 shadow-none"}><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5" />Safety challenge</CardTitle></CardHeader><CardContent>{run.synthesis.safetyFlags.length ? <ul className="space-y-2">{run.synthesis.safetyFlags.map((item) => <li key={item} className="flex items-start gap-2 text-sm leading-6 text-rose-950"><ShieldAlert className="mt-1 h-4 w-4 shrink-0" />{item}</li>)}</ul> : <p className="text-sm text-emerald-900">No synthesis-level safety flag was recorded. The reviewer must still verify scope and grounding.</p>}</CardContent></Card></div>
    </section> : <Card className="border-dashed border-slate-200 shadow-none"><CardContent className="px-6 py-12 text-center"><CircleDashed className="mx-auto h-7 w-7 text-slate-400" /><h2 className="mt-3 font-semibold text-slate-950">No synthesis is ready.</h2><p className="mt-2 text-sm text-slate-600">Review controls remain disabled until the run reaches review ready.</p></CardContent></Card>}

    <section className="rounded-2xl border-2 border-indigo-200 bg-white p-6 sm:p-8"><div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]"><div><div className="flex items-center gap-2 text-sm font-semibold text-indigo-700"><ShieldCheck className="h-5 w-5" />Human review gate</div><h2 className="mt-2 text-2xl font-semibold text-slate-950">Record the operator&apos;s decision.</h2><p className="mt-2 text-sm leading-6 text-slate-600">Approve only when claims are grounded, limitations are adequate, and intended use stays developmental. Revision and rejection require a documented reason.</p>{run.reviewedAt && <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700"><p className="font-semibold">Current decision: {readable(run.humanReviewStatus)}</p><p className="mt-1">{run.humanReviewNote || "No reviewer note was recorded."}</p><p className="mt-2 text-xs text-slate-500">Reviewed {new Date(run.reviewedAt).toLocaleString()}</p></div>}</div><div className="space-y-4"><div className="space-y-2"><Label htmlFor="run-review-note">Reviewer note</Label><Textarea id="run-review-note" value={note} onChange={(event) => setNote(event.target.value)} disabled={!reviewEnabled || saving} placeholder="Confirm grounding or document what must change…" className="min-h-28" maxLength={2_000} /><p className="text-xs leading-5 text-slate-500">Summarize the decision. Do not paste transcript excerpts, participant identifiers, or sensitive content.</p></div><div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"><Button onClick={() => setDecision("approved")} disabled={!reviewEnabled || saving} className="bg-emerald-700 hover:bg-emerald-800"><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button><Button variant="outline" onClick={() => setDecision("needs_revision")} disabled={!reviewEnabled || saving || !note.trim()}><RotateCcw className="mr-2 h-4 w-4" />Needs revision</Button><Button variant="outline" onClick={() => setDecision("rejected")} disabled={!reviewEnabled || saving || !note.trim()} className="border-rose-200 text-rose-700 hover:bg-rose-50"><XCircle className="mr-2 h-4 w-4" />Reject</Button></div>{!reviewEnabled && <p className="text-xs leading-5 text-amber-800">Decision controls unlock only when run status is review ready.</p>}</div></div></section>

    <AlertDialog open={decision !== null} onOpenChange={(open) => { if (!open && !saving) setDecision(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{decision ? reviewLabels[decision] : "Confirm review"}?</AlertDialogTitle><AlertDialogDescription className="leading-6">This records a governed human-review event for this run. It does not trigger publication, messaging, employment action, or any other external action.</AlertDialogDescription></AlertDialogHeader>{note.trim() && <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700"><strong>Reviewer note:</strong> {note.trim()}</div>}<AlertDialogFooter><AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void saveReview(); }} disabled={saving || !decision || ((decision === "needs_revision" || decision === "rejected") && !note.trim())} className={decision === "approved" ? "bg-emerald-700 hover:bg-emerald-800" : "bg-indigo-600 hover:bg-indigo-700"}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Record decision</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />This review concerns evidence quality and developmental usefulness only. The run cannot autonomously rank people, infer protected or sensitive traits, or make workforce decisions.</div>
  </div>;
}
