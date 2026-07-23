"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileSearch,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AgentRunReviewStatus, AgentRunStatus, AgentRunSummary } from "./types";

function normalizeStatus(value: unknown): AgentRunStatus {
  const status = String(value ?? "planned");
  return (["planned", "running", "review_ready", "failed"] as const).includes(status as AgentRunStatus) ? status as AgentRunStatus : "planned";
}

function normalizeReview(value: unknown): AgentRunReviewStatus {
  const status = String(value ?? "pending");
  return (["pending", "approved", "needs_revision", "rejected"] as const).includes(status as AgentRunReviewStatus) ? status as AgentRunReviewStatus : "pending";
}

function normalizeRun(value: Record<string, unknown>): AgentRunSummary {
  const plan = value.plan && typeof value.plan === "object" ? value.plan as Record<string, unknown> : {};
  const specialists = Array.isArray(plan.recommendedSpecialists) ? plan.recommendedSpecialists : [];
  return {
    id: String(value.id ?? ""),
    goal: String(value.goal ?? "Untitled agent run"),
    planTitle: String(value.planTitle ?? plan.planTitle ?? "Governed analysis plan"),
    status: normalizeStatus(value.status),
    humanReviewStatus: normalizeReview(value.humanReviewStatus ?? value.human_review_status),
    intendedUse: String(value.intendedUse ?? plan.intendedUse ?? "development_coaching"),
    specialistCount: Number(value.specialistCount ?? specialists.length),
    evidenceCount: 0,
    safetyFlagCount: 0,
    createdAt: String(value.createdAt ?? value.created_at ?? new Date().toISOString()),
    updatedAt: String(value.updatedAt ?? value.updated_at ?? new Date().toISOString()),
  };
}

const statusStyle: Record<AgentRunStatus, { label: string; className: string; icon: typeof Clock3 }> = {
  planned: { label: "Planned", className: "border-indigo-200 bg-indigo-50 text-indigo-800", icon: Clock3 },
  running: { label: "Running", className: "border-blue-200 bg-blue-50 text-blue-800", icon: Loader2 },
  review_ready: { label: "Review ready", className: "border-amber-200 bg-amber-50 text-amber-800", icon: FileSearch },
  failed: { label: "Failed", className: "border-rose-200 bg-rose-50 text-rose-800", icon: XCircle },
};

const reviewStyle: Record<AgentRunReviewStatus, { label: string; className: string }> = {
  pending: { label: "Human review pending", className: "border-amber-200 bg-amber-50 text-amber-800" },
  approved: { label: "Human approved", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  needs_revision: { label: "Needs revision", className: "border-orange-200 bg-orange-50 text-orange-800" },
  rejected: { label: "Rejected", className: "border-rose-200 bg-rose-50 text-rose-800" },
};

type QueueFilter = "all" | "pending" | "approved" | "needs_revision" | "failed";

export function RunQueue() {
  const [runs, setRuns] = useState<AgentRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<QueueFilter>("pending");
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState<{ pending: number; approved: number; needsRevision: number; failed: number } | null>(null);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/development-intelligence/agent/runs?limit=50", { cache: "no-store" });
      const payload = await response.json() as { runs?: Array<Record<string, unknown>>; summary?: { pending?: number; approved?: number; needsRevision?: number; failed?: number }; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to load agent runs");
      setRuns((payload.runs || []).map(normalizeRun));
      setSummary({ pending: Number(payload.summary?.pending ?? 0), approved: Number(payload.summary?.approved ?? 0), needsRevision: Number(payload.summary?.needsRevision ?? 0), failed: Number(payload.summary?.failed ?? 0) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load agent runs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadRuns(); }, [loadRuns]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return runs.filter((run) => {
      const matchesFilter = filter === "all" || (filter === "failed" ? run.status === "failed" : run.humanReviewStatus === filter);
      const matchesSearch = !term || `${run.goal} ${run.intendedUse}`.toLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });
  }, [filter, runs, search]);

  const pending = summary?.pending ?? runs.filter((run) => run.status === "review_ready" && run.humanReviewStatus === "pending").length;
  const approved = summary?.approved ?? runs.filter((run) => run.humanReviewStatus === "approved").length;
  const concerns = summary ? summary.needsRevision + summary.failed : runs.filter((run) => run.safetyFlagCount > 0 || run.humanReviewStatus === "needs_revision").length;

  return <div className="space-y-8">
    <section className="overflow-hidden rounded-[28px] border border-indigo-200 bg-[#f5f3ff] p-6 sm:p-9">
      <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end"><div><Badge className="border border-indigo-200 bg-white text-indigo-800 hover:bg-white"><Workflow className="mr-1.5 h-3.5 w-3.5" />Agent Operations</Badge><h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-[#1e1b4b] sm:text-4xl">Review every agent run before its findings leave the workspace.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">Inspect specialist traces, exact evidence, disagreements, safety flags, and limitations. Approval records human judgment—it never triggers an autonomous workforce action.</p></div><Button asChild size="lg" className="min-h-12 bg-indigo-600 hover:bg-indigo-700"><Link href="/dashboard/development/agent"><Sparkles className="mr-2 h-4 w-4" />Start a governed run</Link></Button></div>
    </section>

    <section aria-label="Run operations summary" className="grid gap-3 sm:grid-cols-3">{[
      { label: "Awaiting review", value: pending, icon: FileSearch, tone: "amber" },
      { label: "Human approved", value: approved, icon: CheckCircle2, tone: "emerald" },
      { label: "Needs attention", value: concerns, icon: AlertTriangle, tone: "rose" },
    ].map((item) => <Card key={item.label} className="border-slate-200 shadow-none"><CardContent className="flex items-center gap-4 p-5"><div className={`rounded-xl p-3 ${item.tone === "emerald" ? "bg-emerald-50 text-emerald-700" : item.tone === "rose" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}><item.icon className="h-5 w-5" /></div><div><p className="text-2xl font-semibold text-slate-950">{item.value}</p><p className="text-sm text-slate-600">{item.label}</p></div></CardContent></Card>)}</section>

    <section>
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-sm font-semibold text-indigo-700">Run queue</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Evidence awaiting operator judgment</h2><p className="mt-2 text-sm text-slate-600">Runs are ordered by their latest activity.</p></div><div className="flex flex-col gap-3 sm:flex-row"><div className="relative sm:w-64"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search run goals" aria-label="Search run goals" className="pl-9" /></div><Button variant="outline" onClick={() => void loadRuns()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button></div></div>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter agent runs">{([
        ["pending", "Pending"], ["all", "All runs"], ["approved", "Approved"], ["needs_revision", "Needs revision"], ["failed", "Failed"],
      ] as Array<[QueueFilter, string]>).map(([value, label]) => <Button key={value} type="button" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)} className={`min-h-10 shrink-0 ${filter === value ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}>{label}</Button>)}</div>

      {loading ? <Card className="border-slate-200 shadow-none"><CardContent className="flex min-h-52 items-center justify-center gap-3 text-sm text-slate-600"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" />Loading governed runs…</CardContent></Card> : error ? <Card className="border-rose-200 bg-rose-50 shadow-none"><CardContent className="p-6"><XCircle className="h-6 w-6 text-rose-700" /><h3 className="mt-3 font-semibold text-rose-950">The run queue could not be loaded.</h3><p className="mt-2 text-sm text-rose-800">{error}</p><Button variant="outline" className="mt-4 bg-white" onClick={() => void loadRuns()}>Try again</Button></CardContent></Card> : runs.length === 0 ? <Card className="border-dashed border-indigo-200 bg-indigo-50/40 shadow-none"><CardContent className="flex flex-col items-center px-6 py-12 text-center"><BrainCircuit className="h-8 w-8 text-indigo-600" /><h3 className="mt-4 text-lg font-semibold text-slate-950">No governed runs yet.</h3><p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">Start with a developmental question. A run appears here after its transparent plan is created.</p><Button asChild className="mt-5 bg-indigo-600 hover:bg-indigo-700"><Link href="/dashboard/development/agent"><Sparkles className="mr-2 h-4 w-4" />Open the agent</Link></Button></CardContent></Card> : filtered.length === 0 ? <Card className="border-dashed border-slate-200 shadow-none"><CardContent className="px-6 py-12 text-center"><Search className="mx-auto h-6 w-6 text-slate-400" /><h3 className="mt-3 font-semibold text-slate-950">No runs match this view.</h3><p className="mt-2 text-sm text-slate-600">Change the filter or search term to see more runs.</p></CardContent></Card> : <div className="space-y-3">{filtered.map((run) => {
        const runStatus = statusStyle[run.status];
        const review = reviewStyle[run.humanReviewStatus];
        return <Link key={run.id} href={`/dashboard/development/operations/${run.id}`} className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"><Card className="border-slate-200 shadow-none transition-colors group-hover:border-indigo-300 group-hover:bg-indigo-50/30"><CardContent className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><BrainCircuit className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={runStatus.className}><runStatus.icon className={`mr-1 h-3.5 w-3.5 ${run.status === "running" ? "animate-spin" : ""}`} />{runStatus.label}</Badge><Badge variant="outline" className={review.className}>{review.label}</Badge></div><p className="mt-3 text-xs font-semibold uppercase tracking-wide text-indigo-700">{run.planTitle}</p><h3 className="mt-1 line-clamp-2 font-semibold leading-6 text-slate-950">{run.goal}</h3><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500"><span>{run.intendedUse.replaceAll("_", " ")}</span><span>{run.specialistCount} specialists</span><span>Updated {new Date(run.updatedAt).toLocaleString()}</span></div></div><ArrowRight className="hidden h-5 w-5 shrink-0 text-slate-400 transition-colors group-hover:text-indigo-700 sm:block" /></div></CardContent></Card></Link>;
      })}</div>}
    </section>

    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />Operator approval confirms evidence quality and appropriate developmental use. It does not authorize hiring, discipline, promotion, compensation, termination, diagnosis, or person-level ranking.</div>
  </div>;
}
