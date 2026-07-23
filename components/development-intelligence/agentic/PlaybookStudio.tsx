"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Archive,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  CopyPlus,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DevelopmentPlaybook } from "./types";

interface PlaybookDraft {
  id?: string;
  name: string;
  description: string;
  goalTemplate: string;
  version: number;
  status: DevelopmentPlaybook["status"];
  plan: Record<string, unknown> | null;
}

const emptyDraft: PlaybookDraft = { name: "", description: "", goalTemplate: "", version: 1, status: "draft", plan: null };

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizePlaybook(value: Record<string, unknown>): DevelopmentPlaybook & { rawPlan: Record<string, unknown> } {
  const plan = value.plan && typeof value.plan === "object" ? value.plan as Record<string, unknown> : {};
  const rubric = Array.isArray(plan.rubric) ? plan.rubric.map((item) => typeof item === "object" && item ? String((item as Record<string, unknown>).label ?? "Criterion") : String(item)) : [];
  return {
    id: String(value.id ?? ""),
    name: String(value.name ?? "Untitled playbook"),
    purpose: String(value.description ?? value.purpose ?? "Reusable governed analysis"),
    version: Number(value.version ?? 1),
    status: String(value.status ?? "draft") as DevelopmentPlaybook["status"],
    goalTemplate: String(value.goalTemplate ?? ""),
    specialists: strings(plan.recommendedSpecialists ?? value.specialists),
    rubric,
    exclusions: strings(plan.exclusions ?? value.exclusions),
    evidenceRequirements: strings(plan.evidenceRequirements ?? value.evidenceRequirements),
    updatedAt: String(value.updatedAt ?? new Date().toISOString()),
    rawPlan: plan,
  };
}

export function PlaybookStudio() {
  const [playbooks, setPlaybooks] = useState<Array<DevelopmentPlaybook & { rawPlan: Record<string, unknown> }>>([]);
  const [draft, setDraft] = useState<PlaybookDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);

  const loadPlaybooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/development-intelligence/playbooks", { cache: "no-store" });
      const payload = await response.json() as { playbooks?: Array<Record<string, unknown>>; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to load playbooks");
      setPlaybooks((payload.playbooks || []).map(normalizePlaybook));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load playbooks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPlaybooks(); }, [loadPlaybooks]);

  function openPlaybook(playbook: DevelopmentPlaybook & { rawPlan: Record<string, unknown> }) {
    setDraft({ id: playbook.id, name: playbook.name, description: playbook.purpose, goalTemplate: playbook.goalTemplate, version: playbook.version, status: playbook.status, plan: playbook.rawPlan });
  }

  function newPlaybook() {
    setDraft({ ...emptyDraft });
  }

  async function generatePlan() {
    if (draft.goalTemplate.trim().length < 10) return;
    setGenerating(true);
    try {
      const response = await fetch("/api/development-intelligence/agent/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: draft.goalTemplate.trim(), context: { sourceMode: "transcript", notes: draft.description.trim() || undefined } }),
      });
      const payload = await response.json() as Record<string, unknown> & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to generate the governed playbook plan");
      const plan = payload.plan && typeof payload.plan === "object" ? payload.plan as Record<string, unknown> : payload;
      setDraft((current) => ({ ...current, plan }));
      toast.success("Governed playbook plan generated. Review it before saving.");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Unable to generate plan");
    } finally {
      setGenerating(false);
    }
  }

  async function savePlaybook() {
    if (!draft.plan) return;
    setSaving(true);
    try {
      const response = await fetch(draft.id ? `/api/development-intelligence/playbooks/${draft.id}/versions` : "/api/development-intelligence/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft.name.trim(), description: draft.description.trim(), goalTemplate: draft.goalTemplate.trim(), plan: draft.plan }),
      });
      const payload = await response.json() as { playbook?: Record<string, unknown>; error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to save playbook");
      toast.success(draft.id ? "A new playbook version was saved." : "Playbook draft created.");
      if (payload.playbook) openPlaybook(normalizePlaybook(payload.playbook));
      await loadPlaybooks();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Unable to save playbook");
    } finally {
      setSaving(false);
    }
  }

  async function activatePlaybook() {
    if (!draft.id) return;
    setActivating(true);
    try {
      const response = await fetch(`/api/development-intelligence/playbooks/${draft.id}/activate`, { method: "POST" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to activate playbook");
      setDraft((current) => ({ ...current, status: "active" }));
      toast.success("This version is now the active playbook.");
      await loadPlaybooks();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Unable to activate playbook");
    } finally {
      setActivating(false);
    }
  }

  const plan = draft.plan;
  const rubric = Array.isArray(plan?.rubric) ? plan.rubric : [];

  return <div className="space-y-8">
    <section className="overflow-hidden rounded-[28px] border border-indigo-200 bg-[#f5f3ff] p-6 sm:p-9">
      <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end"><div><Badge className="border border-indigo-200 bg-white text-indigo-800 hover:bg-white"><BookOpenCheck className="mr-1.5 h-3.5 w-3.5" />Agent Playbook Studio</Badge><h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-[#1e1b4b] sm:text-4xl">Turn your best analysis method into a governed, reusable playbook.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">Version goals, specialist teams, evidence standards, and exclusions. Activation is explicit, and every update creates a reviewable version.</p></div><Button size="lg" onClick={newPlaybook} className="min-h-12 bg-indigo-600 hover:bg-indigo-700"><Plus className="mr-2 h-4 w-4" />New playbook</Button></div>
    </section>

    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"><p className="font-semibold">Playbooks could not be loaded</p><p className="mt-1">{error}</p><Button variant="outline" className="mt-3 bg-white" onClick={() => void loadPlaybooks()}>Try again</Button></div>}

    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <aside aria-label="Playbook versions" className="space-y-3">
        <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-indigo-700">Library</p><h2 className="mt-1 text-xl font-semibold text-slate-950">Playbooks</h2></div>{loading && <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />}</div>
        {!loading && playbooks.length === 0 ? <Card className="border-dashed border-indigo-200 bg-indigo-50/40 shadow-none"><CardContent className="p-6 text-center"><BookOpenCheck className="mx-auto h-7 w-7 text-indigo-600" /><h3 className="mt-3 font-semibold text-slate-950">No playbooks yet</h3><p className="mt-2 text-sm leading-6 text-slate-600">Create a governed draft for a question your organization asks repeatedly.</p></CardContent></Card> : playbooks.map((playbook) => <button key={playbook.id} type="button" onClick={() => openPlaybook(playbook)} className={`w-full cursor-pointer rounded-xl border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${draft.id === playbook.id ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-semibold text-slate-950">{playbook.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{playbook.purpose}</p></div><Badge variant="outline" className={playbook.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-700"}>{playbook.status}</Badge></div><div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>Version {playbook.version}</span><span>{new Date(playbook.updatedAt).toLocaleDateString()}</span></div></button>)}
      </aside>

      <section aria-label="Playbook editor" className="space-y-5">
        <Card className="border-slate-200 shadow-none"><CardContent className="space-y-5 p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-indigo-700">{draft.id ? `Version ${draft.version}` : "New draft"}</p><h2 className="mt-1 text-2xl font-semibold text-slate-950">Playbook definition</h2></div>{draft.id && <Badge variant="outline" className={draft.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "bg-slate-50"}>{draft.status === "active" ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : <Clock3 className="mr-1 h-3.5 w-3.5" />}{draft.status}</Badge>}</div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="playbook-name">Name</Label><Input id="playbook-name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Leadership decision clarity" maxLength={120} /></div><div className="space-y-2"><Label htmlFor="playbook-description">Purpose</Label><Input id="playbook-description" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Consistent coaching after leadership meetings" maxLength={800} /></div></div>
          <div className="space-y-2"><Label htmlFor="playbook-goal">Reusable goal template</Label><Textarea id="playbook-goal" value={draft.goalTemplate} onChange={(event) => setDraft((current) => ({ ...current, goalTemplate: event.target.value, plan: null }))} placeholder="Identify where the team created decision clarity, where ownership remained ambiguous, and the next developmental action…" className="min-h-28" maxLength={1_500} /></div>
          <Button variant="outline" onClick={() => void generatePlan()} disabled={draft.goalTemplate.trim().length < 10 || generating}>{generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}{plan ? "Regenerate governed plan" : "Generate governed plan"}</Button>
        </CardContent></Card>

        {!plan ? <Card className="border-dashed border-indigo-200 bg-indigo-50/40 shadow-none"><CardContent className="flex flex-col items-center p-10 text-center"><Sparkles className="h-7 w-7 text-indigo-600" /><h3 className="mt-3 font-semibold text-slate-950">Generate the plan before saving.</h3><p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">The agent will create a rubric, select specialists, require evidence, and state exclusions for you to inspect.</p></CardContent></Card> : <>
          <div className="grid gap-4 lg:grid-cols-2"><Card className="border-slate-200 shadow-none"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Specialist team</p><div className="mt-3 flex flex-wrap gap-2">{strings(plan.recommendedSpecialists).map((item) => <Badge key={item} variant="outline" className="bg-indigo-50 text-indigo-800">{item.replaceAll("_", " ")}</Badge>)}</div></CardContent></Card><Card className="border-slate-200 shadow-none"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Evidence requirements</p><ul className="mt-3 space-y-2">{strings(plan.evidenceRequirements).map((item) => <li key={item} className="flex items-start gap-2 text-sm leading-5 text-slate-700"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>)}</ul></CardContent></Card></div>
          <Card className="border-slate-200 shadow-none"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Versioned rubric</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{rubric.map((item, index) => { const row = item as Record<string, unknown>; return <div key={String(row.key ?? index)} className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold text-slate-950">{String(row.label ?? `Criterion ${index + 1}`)}</h3><Badge variant="outline">Weight {String(row.weight ?? 1)}</Badge></div><p className="mt-2 text-sm leading-6 text-slate-600">{String(row.question ?? "")}</p><p className="mt-3 text-xs leading-5 text-indigo-800">Evidence: {String(row.evidenceRequirement ?? "Exact source evidence required")}</p></div>; })}</div></CardContent></Card>
          <Card className="border-amber-200 bg-amber-50/50 shadow-none"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Exclusions and limits</p><ul className="mt-3 grid gap-2 sm:grid-cols-2">{[...strings(plan.exclusions), ...strings(plan.limitations)].map((item) => <li key={item} className="flex items-start gap-2 text-sm leading-5 text-amber-950"><Archive className="mt-0.5 h-4 w-4 shrink-0" />{item}</li>)}</ul></CardContent></Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">{draft.id && draft.status !== "active" && <Button variant="outline" onClick={() => void activatePlaybook()} disabled={activating}>{activating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Activate this version</Button>}<Button onClick={() => void savePlaybook()} disabled={saving || draft.name.trim().length < 3 || draft.description.trim().length < 8} className="bg-indigo-600 hover:bg-indigo-700">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : draft.id ? <CopyPlus className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}{draft.id ? "Save as new version" : "Save draft"}</Button></div>
        </>}
      </section>
    </div>
  </div>;
}
