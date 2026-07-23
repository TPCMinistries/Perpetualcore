"use client";

import { useState } from "react";
import {
  BarChart3,
  BrainCircuit,
  CalendarRange,
  CheckCircle2,
  Database,
  FileSearch,
  HelpCircle,
  Layers3,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface EnterpriseResult {
  supported: boolean;
  answer: string;
  findings: Array<{ claim: string; aggregateKeys: string[]; approvedAnalyses: number; observations: number; confidence: number; limitation: string }>;
  suggestedQuestions: string[];
  limitations: string[];
  dataCoverage: { approvedAnalyses: number; observations: number; dateFrom: string | null; dateTo: string | null; lenses: string[]; aggregateCount: number; coverageNote: string };
  humanReviewRequired: boolean;
}

const suggested = [
  "Which approved development themes appear most often across our conversations?",
  "Where does the evidence show improving decision clarity, and where is coverage limited?",
  "Which meeting practices are most consistently demonstrated in approved reports?",
];

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeResult(value: Record<string, unknown>): EnterpriseResult {
  const source = value.answer && typeof value.answer === "object" ? value.answer as Record<string, unknown> : value;
  const coverage = source.dataCoverage && typeof source.dataCoverage === "object" ? source.dataCoverage as Record<string, unknown> : source.coverage && typeof source.coverage === "object" ? source.coverage as Record<string, unknown> : {};
  const findings = (Array.isArray(source.findings) ? source.findings : []).map((item) => {
    const row = item as Record<string, unknown>;
    return {
      claim: String(row.claim ?? row.title ?? "Grounded finding"),
      aggregateKeys: strings(row.aggregateKeys ?? row.evidence),
      approvedAnalyses: Number(row.approvedAnalyses ?? 0),
      observations: Number(row.observations ?? 0),
      confidence: Number(row.confidence ?? 0),
      limitation: String(row.limitation ?? "Interpret within the available approved evidence."),
    };
  });
  return {
    supported: source.supported !== false,
    answer: String(source.answer ?? source.summary ?? "No answer was returned."),
    findings,
    suggestedQuestions: strings(source.suggestedQuestions),
    limitations: strings(source.limitations),
    dataCoverage: {
      approvedAnalyses: Number(coverage.approvedAnalyses ?? coverage.reports ?? 0),
      observations: Number(coverage.observations ?? 0),
      dateFrom: (coverage.dateFrom ?? null) as string | null,
      dateTo: (coverage.dateTo ?? null) as string | null,
      lenses: strings(coverage.lenses),
      aggregateCount: Number(coverage.aggregateCount ?? 0),
      coverageNote: String(coverage.coverageNote ?? "Coverage must be reviewed before generalizing findings."),
    },
    humanReviewRequired: source.humanReviewRequired !== false,
  };
}

export function EnterpriseIntelligence() {
  const [question, setQuestion] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [lens, setLens] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EnterpriseResult | null>(null);

  async function ask() {
    if (question.trim().length < 10) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/development-intelligence/agent/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, lens: lens === "all" ? undefined : lens }),
      });
      const payload = await response.json() as Record<string, unknown> & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to answer this enterprise question");
      setResult(normalizeResult(payload));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to answer this enterprise question");
    } finally {
      setLoading(false);
    }
  }

  return <div className="space-y-8">
    <section className="overflow-hidden rounded-[28px] border border-indigo-200 bg-[#f5f3ff] px-6 py-8 sm:px-10 sm:py-11">
      <Badge className="border border-indigo-200 bg-white text-indigo-800 hover:bg-white"><BrainCircuit className="mr-1.5 h-3.5 w-3.5" />Enterprise Development Intelligence</Badge>
      <h1 className="mt-5 max-w-4xl text-3xl font-semibold tracking-[-0.035em] text-[#1e1b4b] sm:text-5xl">Ask what the approved evidence says across your organization.</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">Explore aggregate developmental patterns without ranking people or making employment decisions. Every answer states its coverage, grounding, and limitations.</p>
      <div className="mt-7 rounded-2xl border border-indigo-200 bg-white p-5 sm:p-6">
        <div className="space-y-2"><Label htmlFor="enterprise-question" className="text-base font-semibold text-slate-950">Your enterprise question</Label><Textarea id="enterprise-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Where does approved evidence show strong decision clarity, and where should leaders focus coaching next?" className="min-h-28 text-base" maxLength={1_000} /></div>
        <div className="mt-3 flex flex-wrap gap-2">{suggested.map((item) => <button key={item} type="button" onClick={() => setQuestion(item)} className="min-h-10 cursor-pointer rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-left text-xs font-medium text-indigo-800 transition-colors hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">{item}</button>)}</div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor="enterprise-from">From <span className="font-normal text-slate-500">(optional)</span></Label><Input id="enterprise-from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="enterprise-to">To <span className="font-normal text-slate-500">(optional)</span></Label><Input id="enterprise-to" type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="enterprise-lens">Coaching lens</Label><Select value={lens} onValueChange={setLens}><SelectTrigger id="enterprise-lens"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All approved lenses</SelectItem><SelectItem value="enterprise_meeting">Enterprise meetings</SelectItem><SelectItem value="interview_coaching">Interview coaching</SelectItem><SelectItem value="interviewer_quality">Interviewer quality</SelectItem><SelectItem value="leadership_coaching">Leadership coaching</SelectItem></SelectContent></Select></div></div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />Only organization-level aggregates from human-approved observations are eligible.</p><Button size="lg" onClick={() => void ask()} disabled={question.trim().length < 10 || loading || Boolean(dateFrom && dateTo && dateFrom > dateTo)} className="min-h-12 bg-indigo-600 hover:bg-indigo-700">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}{loading ? "Grounding the answer…" : "Ask approved evidence"}</Button></div>
      </div>
    </section>

    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"><p className="font-semibold">This question could not be answered</p><p className="mt-1">{error}</p></div>}

    {!result && !loading && <section className="grid gap-4 md:grid-cols-3">{[
      { icon: Database, title: "Approved data only", detail: "Draft and rejected observations never enter the enterprise answer." },
      { icon: Layers3, title: "Aggregate patterns", detail: "Answers summarize criteria across reports without person-level ranking." },
      { icon: ShieldAlert, title: "Limits stay visible", detail: "Thin samples, missing lenses, and contextual gaps travel with every finding." },
    ].map((item) => <Card key={item.title} className="border-slate-200 shadow-none"><CardContent className="p-6"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><item.icon className="h-5 w-5" /></div><h2 className="mt-4 font-semibold text-slate-950">{item.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p></CardContent></Card>)}</section>}

    {result && <section className="space-y-6" aria-live="polite">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
        { label: "Approved reports", value: result.dataCoverage.approvedAnalyses, icon: FileSearch, tone: "indigo" },
        { label: "Evidence observations", value: result.dataCoverage.observations, icon: Database, tone: "emerald" },
        { label: "Development themes", value: result.dataCoverage.aggregateCount, icon: BarChart3, tone: "indigo" },
        { label: "Coaching lenses", value: result.dataCoverage.lenses.length, icon: Layers3, tone: "amber" },
      ].map((item) => <Card key={item.label} className="border-slate-200 shadow-none"><CardContent className="flex items-center gap-4 p-5"><div className={`rounded-xl p-3 ${item.tone === "emerald" ? "bg-emerald-50 text-emerald-700" : item.tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"}`}><item.icon className="h-5 w-5" /></div><div><p className="text-2xl font-semibold text-slate-950">{item.value}</p><p className="text-sm text-slate-600">{item.label}</p></div></CardContent></Card>)}</div>

      <Card className={result.supported ? "border-indigo-200 shadow-none" : "border-amber-200 bg-amber-50/40 shadow-none"}><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-indigo-700" />Grounded answer</CardTitle><Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">Human review required</Badge></div></CardHeader><CardContent className="space-y-5"><p className="text-base leading-7 text-slate-800">{result.answer}</p><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1.5"><CalendarRange className="h-4 w-4" />{result.dataCoverage.dateFrom && result.dataCoverage.dateTo ? `${new Date(result.dataCoverage.dateFrom).toLocaleDateString()}–${new Date(result.dataCoverage.dateTo).toLocaleDateString()}` : "Available approved history"}</span><span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-700" />{result.dataCoverage.coverageNote}</span></div></CardContent></Card>

      {result.findings.length > 0 && <div><p className="text-sm font-semibold text-indigo-700">Grounded findings</p><h2 className="mt-1 text-2xl font-semibold text-slate-950">Claims with visible support</h2><div className="mt-4 grid gap-4 lg:grid-cols-2">{result.findings.map((finding, index) => <Card key={`${finding.claim}-${index}`} className="border-slate-200 shadow-none"><CardContent className="p-6"><div className="flex items-start justify-between gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-800">{index + 1}</div><Badge variant="outline">{Math.round(finding.confidence * 100)}% model confidence</Badge></div><h3 className="mt-4 font-semibold leading-6 text-slate-950">{finding.claim}</h3><div className="mt-4 flex flex-wrap gap-2">{finding.aggregateKeys.map((key) => <Badge key={key} variant="outline" className="bg-slate-50">{key.replaceAll("_", " ")}</Badge>)}</div><div className="mt-4 grid grid-cols-2 gap-3 text-center"><div className="rounded-xl bg-slate-50 p-3"><p className="font-semibold text-slate-950">{finding.approvedAnalyses}</p><p className="text-xs text-slate-500">Approved reports</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="font-semibold text-slate-950">{finding.observations}</p><p className="text-xs text-slate-500">Observations</p></div></div><div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950"><strong>Finding limit:</strong> {finding.limitation}</div></CardContent></Card>)}</div></div>}

      <div className="grid gap-4 lg:grid-cols-2"><Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldAlert className="h-5 w-5 text-amber-700" />Limitations to review</CardTitle></CardHeader><CardContent><ul className="space-y-3">{result.limitations.map((item) => <li key={item} className="flex items-start gap-2 text-sm leading-6 text-slate-700"><ShieldAlert className="mt-1 h-4 w-4 shrink-0 text-amber-600" />{item}</li>)}</ul></CardContent></Card><Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><HelpCircle className="h-5 w-5 text-indigo-700" />Ask next</CardTitle></CardHeader><CardContent className="space-y-2">{result.suggestedQuestions.map((item) => <button key={item} type="button" onClick={() => { setQuestion(item); setResult(null); }} className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-600" />{item}</button>)}</CardContent></Card></div>
    </section>}

    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />Enterprise Intelligence cannot rank people, infer personality, integrity, emotion, diagnosis, protected traits, or recommend hiring, promotion, discipline, compensation, or termination.</div>
  </div>;
}
