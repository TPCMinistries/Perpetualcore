"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Clock3, Eye, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getErrorMessage, getPressSystemStatus, listPressProjects } from "./api-client";
import { PressConsoleHeader } from "./PressConsoleHeader";
import { RecordingList } from "./RecordingList";
import { RecordingUploader } from "./RecordingUploader";
import type { PressProject, PressSystemStatus } from "./types";

export function PressConsolePage() {
  const [projects, setProjects] = useState<PressProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<PressSystemStatus | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [projectsResult, statusResult] = await Promise.allSettled([
        listPressProjects(signal),
        getPressSystemStatus(signal),
      ]);
      if (projectsResult.status === "rejected") throw projectsResult.reason;
      setProjects(projectsResult.value);
      setSystemStatus(statusResult.status === "fulfilled" ? statusResult.value : null);
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") return;
      setError(getErrorMessage(loadError));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const inProgress = projects.filter((project) => ["draft", "uploading", "processing", "transcribing", "rendering"].includes(project.status)).length;
  const inReview = projects.filter((project) => project.status === "review").length;
  const ready = projects.filter((project) => project.status === "ready").length;

  return (
    <div className="space-y-8 pb-6">
      <PressConsoleHeader
        eyebrow="Your Press workspace"
        title="One recording. Every useful next step."
        description="Add a video, podcast, interview, class, or event when you are ready. Press turns it into a reviewable content pack—and stays quiet until you ask it to work."
      />

      <Link
        href="/press/studio/stories"
        className="group flex items-center justify-between gap-4 border border-black/10 bg-[#c7f34b] px-5 py-4 transition-colors duration-200 hover:bg-[#b6e02f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1648d8] focus-visible:ring-offset-2 sm:px-7"
      >
        <span className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 shrink-0 text-[#121214]" aria-hidden />
          <span className="text-sm font-semibold text-[#121214] sm:text-base">
            <strong className="font-black">New: Stories</strong> — turn today&apos;s photos into posts
          </span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-[#121214] transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden />
      </Link>

      <RecordingUploader
        processingMessage={systemStatus?.ready === false ? systemStatus.message : undefined}
        onComplete={(project) => setProjects((current) => [project, ...current.filter((item) => item.id !== project.id)])}
      />

      {projects.length > 0 && !loading && !error && (
        <section aria-label="Press production summary" className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Being prepared", value: inProgress, icon: Clock3, color: "bg-[#1648d8] text-white", iconColor: "text-white/65" },
            { label: "Waiting for you", value: inReview, icon: Eye, color: "bg-[#ffcc30] text-[#121214]", iconColor: "text-black/45" },
            { label: "Ready to use", value: ready, icon: CheckCircle2, color: "bg-[#c7f34b] text-[#121214]", iconColor: "text-black/45" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`min-h-40 border border-black/10 p-5 sm:p-6 ${item.color}`}>
                <div className="flex items-center justify-between gap-4">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">{item.label}</p>
                  <Icon className={`h-4 w-4 ${item.iconColor}`} aria-hidden />
                </div>
                <p className="mt-8 text-5xl font-black tracking-[-0.06em]">{item.value}</p>
              </div>
            );
          })}
        </section>
      )}

      {loading && (
        <div className="flex min-h-48 items-center justify-center border border-black/10 bg-white" role="status">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#1648d8] motion-reduce:animate-none" aria-hidden />
          <span className="text-sm text-black/60">Loading your recordings…</span>
        </div>
      )}

      {!loading && error && (
        <div className="border border-red-200 bg-red-50 p-5" role="alert">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden />
            <div className="flex-1">
              <h2 className="font-medium text-red-950">Recordings could not be loaded</h2>
              <p className="mt-1 text-sm text-red-800">{error}</p>
              <Button type="button" variant="outline" className="mt-4 h-11 border-red-300 bg-white" onClick={() => void load()}>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden /> Try again
              </Button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="border border-black/10 bg-white">
          <EmptyState
            icon={Clock3}
            title="Your first content pack starts here"
            description="Choose a recording above. Press will keep the source, prepare the transcript, and bring every draft back here for your review."
          />
        </div>
      )}

      {!loading && !error && projects.length > 0 && <RecordingList projects={projects} />}
    </div>
  );
}
