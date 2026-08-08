"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, CalendarClock, Download, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createPressPublication,
  getErrorMessage,
  getPressAnalytics,
  listPressPublications,
  listPressPublishTargets,
} from "./api-client";
import type {
  PressAnalyticsSummary,
  PressPublication,
  PressPublishTarget,
  PressRender,
} from "./types";

function labelMetric(metric: string): string {
  return metric.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: value >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

export function PublishPerformancePanel({ projectId, renders }: { projectId: string; renders: PressRender[] }) {
  const [targets, setTargets] = useState<PressPublishTarget[]>([]);
  const [publications, setPublications] = useState<PressPublication[]>([]);
  const [analytics, setAnalytics] = useState<PressAnalyticsSummary | null>(null);
  const [selectedRenderId, setSelectedRenderId] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<"manual" | "scheduled" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const readyRenders = useMemo(() => renders.filter((render) => render.status === "ready"), [renders]);
  const schedulingTargets = useMemo(() => targets.filter((target) => target.capabilities.scheduling === true), [targets]);
  const selectedTarget = targets.find((target) => target.id === selectedTargetId);
  const selectedRender = readyRenders.find((render) => render.id === selectedRenderId);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    const [targetsResult, publicationsResult, analyticsResult] = await Promise.allSettled([
      listPressPublishTargets(signal),
      listPressPublications(projectId, signal),
      getPressAnalytics(projectId, signal),
    ]);

    if (signal?.aborted) return;
    if (targetsResult.status === "fulfilled") setTargets(targetsResult.value);
    if (publicationsResult.status === "fulfilled") setPublications(publicationsResult.value);
    if (analyticsResult.status === "fulfilled") setAnalytics(analyticsResult.value);

    const failed = [targetsResult, publicationsResult, analyticsResult].find((result) => result.status === "rejected");
    if (failed?.status === "rejected") setError(getErrorMessage(failed.reason));
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (!selectedRenderId && readyRenders[0]) setSelectedRenderId(readyRenders[0].id);
  }, [readyRenders, selectedRenderId]);

  useEffect(() => {
    if (!selectedTargetId && schedulingTargets[0]) setSelectedTargetId(schedulingTargets[0].id);
  }, [schedulingTargets, selectedTargetId]);

  async function create(mode: PressPublication["mode"]) {
    if (!selectedRender) return;
    if (mode === "scheduled" && selectedTarget?.capabilities.scheduling !== true) return;

    let isoDate: string | undefined;
    if (mode === "scheduled") {
      const date = new Date(scheduledFor);
      if (!scheduledFor || Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
        setError("Choose a future date and time for this schedule.");
        return;
      }
      isoDate = date.toISOString();
    }

    setWorking(mode === "manual_export" ? "manual" : "scheduled");
    setError(null);
    setNotice(null);
    try {
      const result = await createPressPublication({
        renderId: selectedRender.id,
        publishTargetId: mode === "scheduled" ? selectedTarget?.id : undefined,
        mode,
        scheduledFor: isoDate,
      });
      setPublications((current) => [result.publication, ...current.filter((item) => item.id !== result.publication.id)]);

      if (mode === "manual_export") {
        if (result.capabilities.manualExport !== true || !result.download?.url) {
          throw new Error("The server did not authorize a manual export download.");
        }
        setNotice("Manual export recorded. Your download is starting.");
        window.location.assign(result.download.url);
      } else {
        setNotice(`Schedule recorded for ${formatDate(isoDate as string)}. This does not publish externally.`);
        setScheduledFor("");
      }
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setWorking(null);
    }
  }

  if (loading) {
    return <div className="flex min-h-48 items-center justify-center border border-zinc-300 bg-white" role="status"><Loader2 className="mr-2 h-5 w-5 animate-spin text-zinc-500 motion-reduce:animate-none" aria-hidden /><span className="text-sm text-zinc-600">Loading publishing controls…</span></div>;
  }

  const metricTotals = analytics?.byMetric || {};
  const hasPerformance = (analytics?.totals.events || 0) > 0 && Object.values(metricTotals).some((value) => value > 0);

  return (
    <div className="space-y-8">
      {error && (
        <div className="flex items-start justify-between gap-4 border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          <span className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{error}</span>
          <Button type="button" variant="ghost" size="sm" className="shrink-0 text-red-800" onClick={() => void load()}><RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />Retry</Button>
        </div>
      )}
      {notice && <div className="flex items-start gap-2 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{notice}</div>}

      <section aria-labelledby="publish-controls-title" className="border border-zinc-300 bg-white">
        <div className="border-b border-zinc-200 p-5 sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Delivery control</p>
          <h2 id="publish-controls-title" className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Prepare an approved export</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">Press records the intended destination and keeps delivery explicit. No direct social posting is enabled in this workspace.</p>
        </div>

        {readyRenders.length === 0 ? (
          <div className="p-8 text-center">
            <Download className="mx-auto h-7 w-7 text-zinc-400" aria-hidden />
            <h3 className="mt-3 font-medium text-zinc-900">No completed exports</h3>
            <p className="mt-1 text-sm text-zinc-600">Complete a render before preparing a manual export or schedule.</p>
          </div>
        ) : (
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="press-publish-render">Completed export</Label>
                <Select value={selectedRenderId} onValueChange={setSelectedRenderId}>
                  <SelectTrigger id="press-publish-render" className="h-11 rounded-md"><SelectValue placeholder="Choose an export" /></SelectTrigger>
                  <SelectContent>{readyRenders.map((render) => <SelectItem key={render.id} value={render.id}>{render.aspectRatio} output</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="border border-zinc-200 bg-zinc-50 p-4 text-xs leading-5 text-zinc-600">
                <p className="font-medium text-zinc-900">Manual delivery</p>
                <p className="mt-1">The approved file can be downloaded without configuring a social account. Direct publishing remains unavailable.</p>
              </div>
            </div>

            <div className="space-y-5 border-t border-zinc-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <div>
                <h3 className="font-medium text-zinc-950">Download / export</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">Record the manual export, then download the approved file for a human-managed upload.</p>
                <Button type="button" className="mt-3 h-11 rounded-md bg-zinc-950 text-white hover:bg-zinc-800" disabled={!selectedRender || working !== null} onClick={() => void create("manual_export")}>
                  {working === "manual" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Download className="mr-2 h-4 w-4" aria-hidden />} Record & download
                </Button>
              </div>

              <div className="border-t border-zinc-200 pt-5">
                <h3 className="font-medium text-zinc-950">Schedule handoff</h3>
                {schedulingTargets.length === 0 ? (
                  <p className="mt-1 text-sm leading-6 text-zinc-600">Scheduling is unavailable until an approved provider adapter is configured.</p>
                ) : (
                  <>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">This records the planned handoff time. It does not post to the destination.</p>
                    <div className="mt-3 space-y-2">
                      <Label htmlFor="press-publish-target">Adapter-capable destination</Label>
                      <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                        <SelectTrigger id="press-publish-target" className="h-11 rounded-md"><SelectValue placeholder="Choose a destination" /></SelectTrigger>
                        <SelectContent>{schedulingTargets.map((target) => <SelectItem key={target.id} value={target.id}>{target.accountLabel} · {target.provider}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {selectedTarget?.capabilities.scheduling === true && (
                  <>
                  <div className="mt-3 space-y-2">
                    <Label htmlFor="press-scheduled-for">Future date and time</Label>
                    <Input id="press-scheduled-for" type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} className="h-11 rounded-md" />
                  </div>
                  <Button type="button" variant="outline" className="mt-3 h-11 rounded-md" disabled={!selectedRender || !scheduledFor || working !== null} onClick={() => void create("scheduled")}>
                    {working === "scheduled" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <CalendarClock className="mr-2 h-4 w-4" aria-hidden />} Record schedule
                  </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="configured-targets-title">
        <div className="mb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Connections</p>
          <h2 id="configured-targets-title" className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Configured targets</h2>
        </div>
        {targets.length === 0 ? <p className="border border-zinc-300 bg-white p-5 text-sm text-zinc-600">No active targets are available for this organization.</p> : (
          <div className="grid gap-px border border-zinc-300 bg-zinc-300 sm:grid-cols-2 lg:grid-cols-3">
            {targets.map((target) => <article key={target.id} className="bg-white p-5"><p className="font-medium text-zinc-950">{target.accountLabel}</p><p className="mt-1 text-sm capitalize text-zinc-500">{target.provider}</p><p className="mt-4 text-xs leading-5 text-zinc-600">{target.capabilities.scheduling === true ? "Scheduling adapter configured" : "No scheduling adapter"} · Direct publishing unavailable</p></article>)}
          </div>
        )}
      </section>

      <section aria-labelledby="performance-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Observed results</p><h2 id="performance-title" className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Performance</h2></div>
          {analytics && <p className="text-xs text-zinc-500">Last {analytics.period.days} days</p>}
        </div>
        {!hasPerformance ? (
          <div className="border border-zinc-300 bg-white p-8 text-center">
            <BarChart3 className="mx-auto h-7 w-7 text-zinc-400" aria-hidden />
            <h3 className="mt-3 font-medium text-zinc-900">No performance data yet</h3>
            <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-zinc-600">Metrics appear only after a configured provider reports measurements for published content.</p>
          </div>
        ) : (
          <div className="grid gap-px border border-zinc-300 bg-zinc-300 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(metricTotals).map(([metric, value]) => <div key={metric} className="bg-white p-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">{labelMetric(metric)}</p><p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">{formatNumber(value)}</p></div>)}
          </div>
        )}
      </section>

      <section aria-labelledby="publication-history-title">
        <h2 id="publication-history-title" className="text-xl font-semibold tracking-tight text-zinc-950">Delivery history</h2>
        {publications.length === 0 ? <p className="mt-4 border border-zinc-300 bg-white p-5 text-sm text-zinc-600">No manual exports or schedules have been recorded.</p> : (
          <div className="mt-4 divide-y divide-zinc-200 border border-zinc-300 bg-white">
            {publications.map((publication) => <div key={publication.id} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"><div><p className="font-medium capitalize text-zinc-950">{publication.mode.replace("_", " ")} · {publication.provider}</p><p className="mt-1 text-xs text-zinc-500">{publication.scheduledFor ? `Planned for ${formatDate(publication.scheduledFor)}` : `Recorded ${formatDate(publication.createdAt)}`}</p></div><span className="self-start rounded-full border border-zinc-300 bg-zinc-50 px-2.5 py-1 text-xs capitalize text-zinc-700 sm:self-auto">{publication.status}</span></div>)}
          </div>
        )}
      </section>
    </div>
  );
}
