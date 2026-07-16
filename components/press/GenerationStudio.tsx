"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertCircle, Check, Clock3, Film, Loader2, Mic2, RefreshCw, Sparkles, UserRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createAuthenticClipPack, getErrorMessage, getPressSystemStatus, listPressGenerationRuns } from "./api-client";
import type { PressGenerationRun, PressSystemStatus } from "./types";

const schema = z.object({
  title: z.string().trim().min(1, "Give this content pack a title").max(180),
  brief: z.string().trim().max(2000),
  clipCount: z.number().int().min(3).max(12),
  targetLength: z.enum(["15-30", "30-60", "60-90"]),
  goals: z.array(z.enum(["teach", "inspire", "announce", "demonstrate", "story"])).min(1, "Choose at least one content goal"),
  formats: z.array(z.enum(["9:16", "1:1", "16:9"])).min(1, "Choose at least one output format"),
  captions: z.boolean(),
});

type Values = z.infer<typeof schema>;

const RECIPES = [
  {
    id: "authentic_clip_pack",
    title: "Authentic Clip Pack",
    description: "Find the strongest real moments in this recording and send them to human review.",
    provider: "Owned pipeline",
    icon: Film,
    enabled: true,
  },
  {
    id: "avatar_explainer",
    title: "Avatar Explainer",
    description: "Turn an approved script into a consented presenter-led video.",
    provider: "HeyGen adapter required",
    icon: UserRound,
    enabled: false,
  },
  {
    id: "narrated_visual_essay",
    title: "Narrated Visual Essay",
    description: "Create a voiced, branded editorial story from an approved idea.",
    provider: "Voice and visual adapters required",
    icon: Mic2,
    enabled: false,
  },
] as const;

const GOALS = [
  ["teach", "Teach"],
  ["inspire", "Inspire"],
  ["announce", "Announce"],
  ["demonstrate", "Demonstrate"],
  ["story", "Tell a story"],
] as const;

const FORMATS = [
  ["9:16", "Vertical"],
  ["1:1", "Square"],
  ["16:9", "Widescreen"],
] as const;

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  }).format(date);
}

export function GenerationStudio({ projectId, onReviewClips }: { projectId: string; onReviewClips: () => void }) {
  const [runs, setRuns] = useState<PressGenerationRun[]>([]);
  const [systemStatus, setSystemStatus] = useState<PressSystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "Strongest moments",
      brief: "",
      clipCount: 5,
      targetLength: "30-60",
      goals: ["teach"],
      formats: ["9:16"],
      captions: true,
    },
  });

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [nextRuns, nextStatus] = await Promise.all([
        listPressGenerationRuns(projectId, signal),
        getPressSystemStatus(signal),
      ]);
      setRuns(nextRuns);
      setSystemStatus(nextStatus);
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") return;
      setError(getErrorMessage(loadError));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function submit(values: Values) {
    const [targetMinSeconds, targetMaxSeconds] = values.targetLength.split("-").map(Number);
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const run = await createAuthenticClipPack(projectId, {
        title: values.title,
        brief: values.brief,
        clipCount: values.clipCount,
        targetMinSeconds,
        targetMaxSeconds,
        goals: values.goals,
        formats: values.formats,
        captions: values.captions,
      });
      setRuns((current) => [run, ...current.filter((item) => item.id !== run.id)]);
      setNotice("Content pack queued. You can leave this page; Press will preserve the run and send candidates to Clips for approval.");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  const workerReady = systemStatus?.generationProviders.internal === true;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Generation Studio</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Turn one source into a deliberate content pack.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">Choose a production recipe, define the editorial intent, then review every output before rendering or publishing.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={workerReady ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-900"}>
            {workerReady ? <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden /> : <Clock3 className="mr-1.5 h-3.5 w-3.5" aria-hidden />}
            {workerReady ? "Worker online" : "Worker offline"}
          </Badge>
          <Button type="button" variant="outline" size="icon" className="h-11 w-11" onClick={() => void load()} disabled={loading} aria-label="Refresh Generation Studio">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden />
          </Button>
        </div>
      </div>

      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Generation could not continue</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {notice && <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900"><Check className="h-4 w-4" /><AlertTitle>Content pack queued</AlertTitle><AlertDescription>{notice}</AlertDescription></Alert>}

      <section aria-labelledby="generation-recipes-title">
        <h3 id="generation-recipes-title" className="sr-only">Generation recipe</h3>
        <RadioGroup value="authentic_clip_pack" className="grid gap-3 lg:grid-cols-3" aria-label="Generation recipe">
          {RECIPES.map((recipe) => {
            const Icon = recipe.icon;
            return (
              <label key={recipe.id} className={`relative flex min-h-[190px] flex-col border p-5 ${recipe.enabled ? "cursor-pointer border-zinc-950 bg-zinc-950 text-white" : "cursor-not-allowed border-zinc-300 bg-zinc-50 text-zinc-500"}`}>
                <div className="flex items-start justify-between gap-4">
                  <span className={`flex h-10 w-10 items-center justify-center ${recipe.enabled ? "bg-white text-zinc-950" : "bg-zinc-200 text-zinc-500"}`}><Icon className="h-5 w-5" aria-hidden /></span>
                  <RadioGroupItem value={recipe.id} disabled={!recipe.enabled} aria-label={recipe.title} />
                </div>
                <span className={`mt-5 font-semibold ${recipe.enabled ? "text-white" : "text-zinc-700"}`}>{recipe.title}</span>
                <span className={`mt-2 text-sm leading-6 ${recipe.enabled ? "text-zinc-300" : "text-zinc-500"}`}>{recipe.description}</span>
                <span className={`mt-auto pt-4 font-mono text-[10px] uppercase tracking-[0.14em] ${recipe.enabled ? "text-zinc-400" : "text-amber-700"}`}>{recipe.provider}</span>
              </label>
            );
          })}
        </RadioGroup>
      </section>

      {!workerReady && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-950">
          <Clock3 className="h-4 w-4" />
          <AlertTitle>Generation is safely paused</AlertTitle>
          <AlertDescription>{systemStatus?.message || "The private media worker must be online before a content pack can be queued."}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="border border-zinc-300 bg-white">
            <div className="border-b border-zinc-200 p-5 sm:p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Production brief</p>
              <h3 className="mt-2 text-lg font-semibold text-zinc-950">Authentic Clip Pack</h3>
            </div>
            <div className="grid gap-6 p-5 sm:p-6">
              <FormField control={form.control} name="title" render={({ field }) => <FormItem><FormLabel>Pack title</FormLabel><FormControl><Input className="h-11" {...field} /></FormControl><FormMessage /></FormItem>} />

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField control={form.control} name="clipCount" render={({ field }) => (
                  <FormItem><FormLabel>Number of candidates</FormLabel><Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}><FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl><SelectContent>{[3, 5, 8, 10, 12].map((count) => <SelectItem key={count} value={String(count)}>{count} clips</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="targetLength" render={({ field }) => (
                  <FormItem><FormLabel>Target length</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="15-30">15–30 seconds</SelectItem><SelectItem value="30-60">30–60 seconds</SelectItem><SelectItem value="60-90">60–90 seconds</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="goals" render={() => (
                <FormItem><FormLabel>Content goals</FormLabel><FormDescription>Press uses these as editorial guidance, not as an automatic approval.</FormDescription><div className="grid gap-2 sm:grid-cols-2">{GOALS.map(([value, label]) => <FormField key={value} control={form.control} name="goals" render={({ field }) => <FormItem className="flex min-h-11 items-center gap-3 border border-zinc-200 px-3"><FormControl><Checkbox checked={field.value.includes(value)} onCheckedChange={(checked) => field.onChange(checked ? [...field.value, value] : field.value.filter((item) => item !== value))} /></FormControl><FormLabel className="m-0 cursor-pointer font-normal">{label}</FormLabel></FormItem>} />)}</div><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="brief" render={({ field }) => <FormItem><FormLabel>Selection brief</FormLabel><FormControl><Textarea rows={5} maxLength={2000} placeholder="Prioritize practical operating-system lessons. Avoid personal anecdotes and repeated introductions." {...field} /></FormControl><FormDescription>{field.value.length}/2000 characters · optional</FormDescription><FormMessage /></FormItem>} />

              <FormField control={form.control} name="formats" render={() => (
                <FormItem><FormLabel>Planned output formats</FormLabel><div className="grid gap-2 sm:grid-cols-3">{FORMATS.map(([value, label]) => <FormField key={value} control={form.control} name="formats" render={({ field }) => <FormItem className="flex min-h-11 items-center gap-3 border border-zinc-200 px-3"><FormControl><Checkbox checked={field.value.includes(value)} onCheckedChange={(checked) => field.onChange(checked ? [...field.value, value] : field.value.filter((item) => item !== value))} /></FormControl><FormLabel className="m-0 cursor-pointer font-normal">{value} <span className="text-zinc-500">{label}</span></FormLabel></FormItem>} />)}</div><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="captions" render={({ field }) => <FormItem className="flex items-start gap-3 border border-zinc-200 bg-zinc-50 p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} /></FormControl><div><FormLabel className="cursor-pointer">Prepare captioned variants after approval</FormLabel><FormDescription>Candidate selection remains separate from rendering and publishing.</FormDescription></div></FormItem>} />
            </div>
            <div className="flex flex-col justify-between gap-3 border-t border-zinc-200 bg-zinc-50 p-5 sm:flex-row sm:items-center sm:p-6">
              <p className="max-w-lg text-xs leading-5 text-zinc-500">No clip is approved, rendered, or published automatically. The results will appear in Clips for human review.</p>
              <Button type="submit" className="h-11 rounded-md bg-zinc-950 px-5 text-white hover:bg-zinc-800" disabled={!workerReady || submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Sparkles className="mr-2 h-4 w-4" aria-hidden />}
                {submitting ? "Queuing" : "Create clip pack"}
              </Button>
            </div>
          </form>
        </Form>

        <aside className="border border-zinc-300 bg-white p-5 xl:sticky xl:top-24" aria-label="Production summary">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Production summary</p>
          <dl className="mt-5 divide-y divide-zinc-200 text-sm">
            <div className="flex justify-between gap-4 py-3"><dt className="text-zinc-500">Recipe</dt><dd className="text-right font-medium text-zinc-900">Authentic Clip Pack</dd></div>
            <div className="flex justify-between gap-4 py-3"><dt className="text-zinc-500">Candidates</dt><dd className="text-right font-medium text-zinc-900">{form.watch("clipCount")}</dd></div>
            <div className="flex justify-between gap-4 py-3"><dt className="text-zinc-500">Target</dt><dd className="text-right font-medium text-zinc-900">{form.watch("targetLength")} sec</dd></div>
            <div className="flex justify-between gap-4 py-3"><dt className="text-zinc-500">Provider</dt><dd className="text-right font-medium text-zinc-900">Owned worker</dd></div>
            <div className="flex justify-between gap-4 py-3"><dt className="text-zinc-500">Approval</dt><dd className="text-right font-medium text-zinc-900">Required</dd></div>
          </dl>
          <p className="mt-5 text-xs leading-5 text-zinc-500">Press stores the brief, scoring provenance, and resulting candidate relationship for audit and iteration.</p>
        </aside>
      </div>

      <section aria-labelledby="generation-history-title">
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Durable runs</p><h3 id="generation-history-title" className="mt-2 text-xl font-semibold text-zinc-950">Generation history</h3></div>{runs.some((run) => run.status === "review") && <Button type="button" variant="outline" className="h-11" onClick={onReviewClips}>Review clips</Button>}</div>
        {loading ? <div className="flex min-h-32 items-center justify-center border border-zinc-300 bg-white" role="status"><Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> Loading runs…</div> : runs.length === 0 ? <div className="border border-zinc-300 bg-white p-6 text-sm text-zinc-600">No generation runs yet. Your first content pack will remain here even if you leave the page.</div> : <div className="divide-y divide-zinc-200 border border-zinc-300 bg-white">{runs.map((run) => <article key={run.id} className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><h4 className="font-medium text-zinc-950">{run.title}</h4><Badge variant="outline" className="capitalize">{run.status.replace("_", " ")}</Badge></div><p className="mt-1 text-xs text-zinc-500">{formatDate(run.createdAt)} · {run.outputCount} candidates</p>{run.errorMessage && <p className="mt-2 text-sm text-red-700">{run.errorMessage}</p>}</div>{run.status === "review" && <Button type="button" variant="outline" className="h-11 self-start sm:self-auto" onClick={onReviewClips}>Review candidates</Button>}</article>)}</div>}
      </section>
    </div>
  );
}
