"use client";

import { useState } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileSearch,
  Loader2,
  MessageSquareText,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AgentPlan, AgentSpecialist, AgentSynthesis, AgentTraceStep } from "./types";

function stringList(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : fallback;
}

function normalizePlan(value: Record<string, unknown>, goal: string): AgentPlan {
  const rawSpecialists = Array.isArray(value.specialists) ? value.specialists : [];
  const recommended = Array.isArray(value.recommendedSpecialists) ? value.recommendedSpecialists : rawSpecialists;
  const specialists: AgentSpecialist[] = recommended.map((item, index) => {
    if (typeof item === "string") {
      return {
        id: item,
        name: item.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
        purpose: `Contribute a focused ${item.replaceAll("_", " ")} perspective grounded in source evidence.`,
        selected: true,
      };
    }
    const row = typeof item === "object" && item ? item as Record<string, unknown> : {};
    return {
      id: String(row.id ?? row.key ?? `specialist-${index}`),
      name: String(row.name ?? row.label ?? "Evidence specialist"),
      purpose: String(row.purpose ?? row.description ?? "Inspect relevant evidence for this goal."),
      selected: row.selected !== false,
    };
  });
  return {
    id: typeof value.id === "string" ? value.id : typeof value.planId === "string" ? value.planId : undefined,
    goal: String(value.goal ?? goal),
    approach: String(value.objective ?? value.approach ?? value.summary ?? "Analyze observable evidence against a goal-specific rubric, then require human review."),
    specialists: specialists.length ? specialists : [
      { id: "evidence", name: "Evidence analyst", purpose: "Links each finding to exact transcript evidence.", selected: true },
      { id: "development", name: "Development coach", purpose: "Translates observable behavior into a practical next action.", selected: true },
      { id: "safety", name: "Governance reviewer", purpose: "Checks scope, consent, limitations, and prohibited inference.", selected: true },
    ],
    rubric: Array.isArray(value.rubric) ? value.rubric.map((item) => typeof item === "object" && item ? String((item as Record<string, unknown>).label ?? (item as Record<string, unknown>).question ?? "Criterion") : String(item)) : stringList(value.criteria, ["Observable evidence", "Developmental relevance", "Actionability"]),
    exclusions: stringList(value.exclusions, ["Personality or integrity inference", "Diagnosis or protected-trait inference", "Automated employment decisions"]),
    evidenceRequirements: stringList(value.evidenceRequirements ?? value.evidence_requirements, ["Exact transcript excerpt", "Participant label where available", "Uncertainty and limitations"]),
    reviewRequired: value.reviewRequired !== false,
  };
}

function normalizeRun(value: Record<string, unknown>): { trace: AgentTraceStep[]; synthesis: AgentSynthesis } {
  const source = value.run && typeof value.run === "object" ? value.run as Record<string, unknown> : value;
  const traceSource = Array.isArray(source.trace) ? source.trace : Array.isArray(source.specialistReports) ? source.specialistReports : [];
  const trace = traceSource.map((item, index) => {
    const row = item as Record<string, unknown>;
    const findings = Array.isArray(row.findings) ? row.findings : [];
    return {
      id: String(row.id ?? `step-${index}`),
      specialist: String(row.specialist ?? row.name ?? "Specialist"),
      status: String(row.status ?? "completed") as AgentTraceStep["status"],
      summary: String(row.summary ?? row.detail ?? "Analysis completed."),
      evidenceCount: Number(row.evidenceCount ?? row.evidence_count ?? findings.length),
    };
  });
  const rawSynthesis = (source.synthesis && typeof source.synthesis === "object" ? source.synthesis : source.result) as Record<string, unknown> | undefined;
  const rawFindings = Array.isArray(rawSynthesis?.findings) ? rawSynthesis.findings : [];
  const agreements = Array.isArray(rawSynthesis?.agreements) ? rawSynthesis.agreements : [];
  const strengths = stringList(rawSynthesis?.strengths, []);
  const growth = stringList(rawSynthesis?.growthOpportunities, []);
  const nextActions = Array.isArray(rawSynthesis?.nextActions) ? rawSynthesis.nextActions : [];
  const synthesisFindings = [
    ...rawFindings.map((item, index) => {
      const row = item as Record<string, unknown>;
      return { title: String(row.title ?? `Finding ${index + 1}`), detail: String(row.detail ?? row.finding ?? ""), evidence: stringList(row.evidence ?? row.quotes, []) };
    }),
    ...agreements.map((item, index) => {
      const row = item as Record<string, unknown>;
      return { title: `Grounded agreement ${index + 1}`, detail: String(row.claim ?? ""), evidence: stringList(row.evidenceQuotes, []) };
    }),
    ...strengths.map((item) => ({ title: "Demonstrated strength", detail: item, evidence: [] })),
    ...growth.map((item) => ({ title: "Growth opportunity", detail: item, evidence: [] })),
    ...nextActions.map((item) => {
      const row = item as Record<string, unknown>;
      return { title: `Next action · ${String(row.ownerRole ?? "human owner")}`, detail: `${String(row.action ?? "")} ${row.rationale ? `— ${String(row.rationale)}` : ""}`, evidence: [] };
    }),
  ];
  return {
    trace,
    synthesis: {
      summary: String(rawSynthesis?.executiveSummary ?? rawSynthesis?.summary ?? source.summary ?? "The governed analysis completed."),
      findings: synthesisFindings,
      limitations: [...stringList(rawSynthesis?.limitations ?? source.limitations, []), ...stringList(rawSynthesis?.safetyFlags, [])],
      reviewStatus: String(rawSynthesis?.reviewStatus ?? source.reviewStatus ?? "pending"),
    },
  };
}

const examples = [
  "Where did this leadership team create clarity, and what should they coach next?",
  "How effectively did the interviewer create a fair, evidence-based candidate experience?",
  "Which commitments were made, and where is ownership or timing still unclear?",
];

export function AgentCommandCenter() {
  const [goal, setGoal] = useState("");
  const [context, setContext] = useState("");
  const [transcript, setTranscript] = useState("");
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [running, setRunning] = useState(false);
  const [trace, setTrace] = useState<AgentTraceStep[]>([]);
  const [synthesis, setSynthesis] = useState<AgentSynthesis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  async function createPlan() {
    if (!goal.trim()) return;
    setPlanning(true);
    setError(null);
    setSynthesis(null);
    try {
      const response = await fetch("/api/development-intelligence/agent/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goal.trim(),
          context: {
            sourceMode: "transcript",
            notes: context.trim() || undefined,
          },
        }),
      });
      const payload = await response.json() as Record<string, unknown> & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to create an analysis plan");
      const rawPlan = payload.plan && typeof payload.plan === "object" ? payload.plan as Record<string, unknown> : payload;
      setRunId(typeof payload.runId === "string" ? payload.runId : null);
      setPlan(normalizePlan(rawPlan, goal.trim()));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create an analysis plan");
    } finally {
      setPlanning(false);
    }
  }

  async function runAnalysis() {
    if (!plan || !runId || !transcript.trim() || !consentConfirmed) return;
    if (plan.specialists.filter((item) => item.selected).length < 2) {
      toast.error("Select at least two specialists, including the mandatory safety reviewer.");
      return;
    }
    setRunning(true);
    setError(null);
    setSynthesis(null);
    setTrace(plan.specialists.filter((item) => item.selected).map((item) => ({ id: item.id, specialist: item.name, status: "queued", summary: "Waiting for governed execution.", evidenceCount: 0 })));
    try {
      const response = await fetch("/api/development-intelligence/agent/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goal.trim(),
          context: { sourceMode: "transcript", notes: context.trim() || undefined },
          transcript: transcript.trim(),
          participantLabels: [],
          consentConfirmed: true,
          runId,
        }),
      });
      const payload = await response.json() as Record<string, unknown> & { error?: string };
      if (!response.ok) throw new Error(payload.error || "The governed analysis could not run");
      const result = normalizeRun(payload);
      setTrace(result.trace.length ? result.trace : plan.specialists.filter((item) => item.selected).map((item) => ({ id: item.id, specialist: item.name, status: "completed", summary: "Specialist analysis included in the synthesis.", evidenceCount: 0 })));
      setSynthesis(result.synthesis);
      toast.success("Agent synthesis is ready for human review.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The governed analysis could not run");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[28px] border border-indigo-200 bg-[#f5f3ff] px-6 py-8 sm:px-10 sm:py-11">
        <Badge className="border border-indigo-200 bg-white text-indigo-800 hover:bg-white"><BrainCircuit className="mr-1.5 h-3.5 w-3.5" />Development Intelligence Agent</Badge>
        <h1 className="mt-5 max-w-4xl text-3xl font-semibold tracking-[-0.035em] text-[#1e1b4b] sm:text-5xl">What are you trying to understand?</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">Describe the developmental question. The agent will propose a transparent plan, assemble specialist perspectives, and show the evidence rules before anything runs.</p>
        <div className="mt-7 space-y-4 rounded-2xl border border-indigo-200 bg-white p-5 sm:p-6">
          <div className="space-y-2"><Label htmlFor="agent-goal" className="text-base font-semibold text-slate-950">Your question or goal</Label><Textarea id="agent-goal" value={goal} onChange={(event) => { setGoal(event.target.value); setPlan(null); setRunId(null); }} placeholder="For example: Where did this team demonstrate clear ownership, and what should they coach next?" className="min-h-28 resize-y text-base" maxLength={1_000} /></div>
          <div className="space-y-2"><Label htmlFor="agent-context">Context <span className="font-normal text-slate-500">(optional)</span></Label><Input id="agent-context" value={context} onChange={(event) => { setContext(event.target.value); setPlan(null); setRunId(null); }} placeholder="Weekly leadership meeting, first-time managers, focus on decision clarity" maxLength={500} /></div>
          <div className="flex flex-wrap gap-2">{examples.map((example) => <button key={example} type="button" onClick={() => { setGoal(example); setPlan(null); }} className="min-h-10 cursor-pointer rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-left text-xs font-medium text-indigo-800 transition-colors hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">{example}</button>)}</div>
          <Button onClick={() => void createPlan()} disabled={goal.trim().length < 10 || planning} size="lg" className="min-h-12 bg-indigo-600 hover:bg-indigo-700">{planning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Route className="mr-2 h-4 w-4" />}Build the analysis plan</Button>
        </div>
      </section>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"><p className="font-semibold">The agent needs attention</p><p className="mt-1">{error}</p></div>}

      {plan && <section className="space-y-5">
        <div><p className="text-sm font-semibold text-indigo-700">Plan before execution</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Inspect and shape the specialist team</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Nothing runs until you approve the goal, selected specialists, rubric, exclusions, and evidence requirements.</p></div>
        <Card className="border-indigo-200 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Target className="h-5 w-5 text-indigo-700" />Planned approach</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-slate-700">{plan.approach}</p></CardContent></Card>
        <div className="grid gap-4 lg:grid-cols-3">{plan.specialists.map((specialist) => <div key={specialist.id} className="rounded-2xl border border-indigo-300 bg-indigo-50 p-5"><div className="flex items-start gap-3"><Checkbox checked disabled aria-label={`${specialist.name} selected by the approved plan`} className="mt-0.5" /><div><div className="flex flex-wrap items-center gap-2"><UsersRound className="h-4 w-4 text-indigo-700" /><h3 className="font-semibold text-slate-950">{specialist.name}</h3><Badge variant="outline" className={specialist.id === "safety_challenge" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-indigo-200 bg-white text-indigo-800"}>{specialist.id === "safety_challenge" ? "Required" : "Planned"}</Badge></div><p className="mt-2 text-sm leading-6 text-slate-600">{specialist.purpose}</p></div></div></div>)}</div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { title: "Dynamic rubric", icon: ClipboardCheck, items: plan.rubric, tone: "indigo" },
            { title: "Evidence required", icon: FileSearch, items: plan.evidenceRequirements, tone: "emerald" },
            { title: "Explicit exclusions", icon: ShieldCheck, items: plan.exclusions, tone: "amber" },
          ].map((group) => <Card key={group.title} className="border-slate-200 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><group.icon className={`h-5 w-5 ${group.tone === "emerald" ? "text-emerald-700" : group.tone === "amber" ? "text-amber-700" : "text-indigo-700"}`} />{group.title}</CardTitle></CardHeader><CardContent><ul className="space-y-3">{group.items.map((item) => <li key={item} className="flex items-start gap-2 text-sm leading-5 text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />{item}</li>)}</ul></CardContent></Card>)}
        </div>
        <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageSquareText className="h-5 w-5 text-indigo-700" />Source transcript</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="agent-transcript">Paste an authorized transcript</Label><Textarea id="agent-transcript" value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="Speaker 1: Let’s confirm the owner and due date…" className="min-h-64 resize-y font-mono text-sm leading-6" maxLength={120_000} /><p className="text-xs leading-5 text-slate-500">At least 80 characters are required. Avoid unnecessary sensitive information.</p></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2"><Checkbox checked={consentConfirmed} onCheckedChange={(checked) => setConsentConfirmed(checked === true)} className="mt-0.5" /><span className="text-sm leading-6 text-indigo-950"><strong className="font-semibold">I confirm participants authorized developmental analysis and human review.</strong><span className="mt-1 block text-xs text-indigo-800">This source will be used only for the visible plan and prohibited actions remain blocked.</span></span></label><div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-amber-950">Human review is required</p><p className="mt-1 text-xs leading-5 text-amber-800">Agent findings remain provisional until a qualified person inspects evidence and limitations.</p></div><Button onClick={() => void runAnalysis()} disabled={!runId || transcript.trim().length < 80 || !consentConfirmed || running} size="lg" className="min-h-12 shrink-0 bg-indigo-600 hover:bg-indigo-700">{running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{running ? "Specialists are working…" : "Run governed analysis"}</Button></div></CardContent></Card>
      </section>}

      {(trace.length > 0 || synthesis) && <section className="space-y-5" aria-live="polite">
        <div><p className="text-sm font-semibold text-indigo-700">Execution trace</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">See how the answer was assembled</h2></div>
        <div className="space-y-3">{trace.map((step, index) => <Card key={step.id} className="border-slate-200 shadow-none"><CardContent className="flex items-start gap-4 p-5"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${step.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"}`}>{step.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-950">{step.specialist}</h3><Badge variant="outline">{step.status}</Badge>{step.evidenceCount > 0 && <Badge variant="outline">{step.evidenceCount} evidence links</Badge>}</div><p className="mt-2 text-sm leading-6 text-slate-600">{step.summary}</p></div></CardContent></Card>)}</div>
        {synthesis && <Card className="border-indigo-200 shadow-none"><CardHeader className="border-b border-indigo-100 bg-indigo-50/60"><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-indigo-700" />Agent synthesis</CardTitle><Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">Human review {synthesis.reviewStatus === "approved" ? "approved" : "required"}</Badge></div></CardHeader><CardContent className="space-y-6 p-6"><p className="text-base leading-7 text-slate-800">{synthesis.summary}</p>{synthesis.findings.length > 0 && <div className="space-y-4">{synthesis.findings.map((finding) => <div key={finding.title} className="rounded-xl border border-slate-200 p-4"><h3 className="font-semibold text-slate-950">{finding.title}</h3><p className="mt-2 text-sm leading-6 text-slate-700">{finding.detail}</p>{finding.evidence.map((quote) => <blockquote key={quote} className="mt-3 border-l-4 border-indigo-400 bg-indigo-50 px-4 py-3 text-sm leading-6 text-indigo-950">“{quote}”</blockquote>)}</div>)}</div>}{synthesis.limitations.length > 0 && <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Limitations</p><ul className="mt-2 space-y-2">{synthesis.limitations.map((item) => <li key={item} className="flex items-start gap-2 text-sm text-slate-700"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0" />{item}</li>)}</ul></div>}</CardContent></Card>}
      </section>}
    </div>
  );
}
