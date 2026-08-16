"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getErrorMessage, retryPressJob } from "./api-client";
import type { PressJobSummary } from "./types";

function stepLabel(type: string): string {
  return type.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusCopy(job: PressJobSummary): string {
  if (job.status === "completed") return "Complete";
  if (job.status === "processing") return "In progress";
  if (job.status === "pending") return "Waiting to start";
  if (job.status === "failed" || job.status === "dead") return "Needs attention";
  return job.status.replaceAll("_", " ");
}

function progressValue(job: PressJobSummary): number {
  if (job.status === "completed") return 100;
  if (job.status === "pending") return 0;
  return Math.max(0, Math.min(100, Math.round(job.progress || 0)));
}

function progressTone(job: PressJobSummary): string {
  if (job.status === "completed") return "text-emerald-600";
  if (job.status === "failed" || job.status === "dead") return "text-amber-600";
  return "text-[#1648d8]";
}

function ProgressCircle({ job }: { job: PressJobSummary }) {
  const progress = progressValue(job);
  const remaining = Math.max(0, 100 - progress);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const label = job.status === "completed" ? "Done" : `${remaining}% left`;

  return (
    <div
      className="relative grid h-20 w-20 shrink-0 place-items-center"
      aria-label={`${stepLabel(job.type)} ${progress}% complete, ${remaining}% remaining`}
      role="img"
    >
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80" aria-hidden>
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-zinc-200"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${progressTone(job)} transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none`}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-lg font-black tracking-tight text-zinc-950">{progress}%</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      </div>
    </div>
  );
}

export function PressJobMonitor({ jobs, canRetry, onRefresh }: {
  jobs: PressJobSummary[];
  canRetry: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function retry(job: PressJobSummary) {
    setRetryingId(job.id);
    setError(null);
    try {
      await retryPressJob(job.id);
      await onRefresh();
    } catch (retryError) {
      setError(getErrorMessage(retryError));
    } finally {
      setRetryingId(null);
    }
  }

  if (jobs.length === 0) return null;

  return (
    <section className="mt-6 border border-zinc-300 bg-white" aria-labelledby="press-progress-heading">
      <div className="border-b border-zinc-200 p-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1648d8]">Production progress</p>
        <h2 id="press-progress-heading" className="mt-2 text-lg font-semibold tracking-tight text-zinc-950">What Press is working on</h2>
        <p className="mt-1 text-sm text-zinc-600">Press starts when you submit work. The circle shows how much of the current step is done and how much is left.</p>
      </div>
      {error && <div className="flex items-start gap-2 border-b border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{error}</div>}
      <ol className="divide-y divide-zinc-200">
        {jobs.slice(0, 6).map((job) => {
          const active = job.status === "processing" || job.status === "pending";
          const failed = job.status === "failed" || job.status === "dead";
          return (
            <li key={job.id} className="p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 gap-4">
                  <ProgressCircle job={job} />
                  <div className="min-w-0 pt-1">
                    <div className="flex items-center gap-2">
                      {job.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden /> : active ? <Clock3 className="h-4 w-4 text-[#1648d8]" aria-hidden /> : <AlertCircle className="h-4 w-4 text-amber-700" aria-hidden />}
                      <h3 className="font-medium text-zinc-950">{stepLabel(job.type)}</h3>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">{statusCopy(job)}{job.attempts > 0 ? ` · attempt ${job.attempts} of ${job.maxAttempts}` : ""}</p>
                    {active && (
                      <p className="mt-2 max-w-xl text-xs leading-5 text-zinc-500">
                        Long recordings can stay on the same percentage while the Mac Mini is working. Use Refresh status to pull the latest heartbeat.
                      </p>
                    )}
                    {failed && job.errorMessage && <p className="mt-2 text-sm text-amber-800">{job.errorMessage}</p>}
                  </div>
                </div>
                {failed && job.retryable && canRetry && (
                  <Button type="button" variant="outline" className="h-11 shrink-0" disabled={retryingId === job.id} onClick={() => void retry(job)}>
                    {retryingId === job.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <RefreshCw className="mr-2 h-4 w-4" aria-hidden />}
                    Retry this step
                  </Button>
                )}
              </div>
              {active && (
                <div className="mt-4" aria-label={`${stepLabel(job.type)} ${job.progress}% complete`}>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
                    <div className="h-full rounded-full bg-[#1648d8] transition-[width] motion-reduce:transition-none" style={{ width: `${Math.max(4, Math.min(100, job.progress))}%` }} />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
