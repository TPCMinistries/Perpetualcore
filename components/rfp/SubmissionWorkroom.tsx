"use client";

import { useMemo, useState, useTransition } from "react";
import type {
  SubmissionTaskPriority,
  SubmissionTaskRow,
  SubmissionTaskStatus,
} from "@/lib/rfp/submission/tasks";

interface SubmissionWorkroomProps {
  proposalId: string;
  initialTasks: SubmissionTaskRow[];
  canEdit: boolean;
}

const STATUS_OPTIONS: SubmissionTaskStatus[] = [
  "open",
  "in_progress",
  "blocked",
  "resolved",
  "waived",
];

const STATUS_CLASS: Record<SubmissionTaskStatus, string> = {
  open: "border-zinc-700 bg-zinc-900 text-zinc-300",
  in_progress: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
  blocked: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  resolved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  waived: "border-amber-500/40 bg-amber-500/10 text-amber-200",
};

const PRIORITY_CLASS: Record<SubmissionTaskPriority, string> = {
  low: "text-zinc-500",
  medium: "text-zinc-300",
  high: "text-amber-300",
  critical: "text-rose-300",
};

function label(value: string): string {
  return value.replace(/_/g, " ");
}

function sourceLabel(value: string): string {
  if (value === "verify_marker") return "VERIFY";
  if (value === "compliance") return "Compliance";
  if (value === "packet") return "Packet";
  if (value === "reviewer") return "Reviewer";
  return "Manual";
}

function formatDueDate(iso: string | null): string {
  if (!iso) return "No due date";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function sortTasks(tasks: SubmissionTaskRow[]): SubmissionTaskRow[] {
  const statusRank: Record<SubmissionTaskStatus, number> = {
    blocked: 0,
    open: 1,
    in_progress: 2,
    resolved: 3,
    waived: 4,
  };
  const priorityRank: Record<SubmissionTaskPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return [...tasks].sort((a, b) => {
    const statusDiff = statusRank[a.status] - statusRank[b.status];
    if (statusDiff !== 0) return statusDiff;
    const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.created_at.localeCompare(b.created_at);
  });
}

export function SubmissionWorkroom({
  proposalId,
  initialTasks,
  canEdit,
}: SubmissionWorkroomProps) {
  const [tasks, setTasks] = useState<SubmissionTaskRow[]>(initialTasks);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const open = tasks.filter(
      (task) =>
        task.status === "open" ||
        task.status === "in_progress" ||
        task.status === "blocked",
    ).length;
    const blocked = tasks.filter((task) => task.status === "blocked").length;
    const done = tasks.filter(
      (task) => task.status === "resolved" || task.status === "waived",
    ).length;
    return { open, blocked, done };
  }, [tasks]);

  function refreshTasks() {
    if (!canEdit) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/rfp/proposals/${proposalId}/submission-tasks`, {
        method: "POST",
      });
      const payload = (await res.json().catch(() => null)) as
        | { tasks?: SubmissionTaskRow[]; error?: string }
        | null;
      if (!res.ok || !payload?.tasks) {
        setError(payload?.error ?? "Failed to refresh tasks");
        return;
      }
      setTasks(payload.tasks);
    });
  }

  function updateTask(taskId: string, status: SubmissionTaskStatus) {
    if (!canEdit) return;
    setError(null);
    const previous = tasks;
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, status } : task)),
    );
    startTransition(async () => {
      const res = await fetch(
        `/api/rfp/proposals/${proposalId}/submission-tasks/${taskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const payload = (await res.json().catch(() => null)) as
        | { task?: SubmissionTaskRow; error?: string }
        | null;
      if (!res.ok || !payload?.task) {
        setTasks(previous);
        setError(payload?.error ?? "Failed to update task");
        return;
      }
      setTasks((current) =>
        current.map((task) => (task.id === taskId ? payload.task! : task)),
      );
    });
  }

  const sorted = sortTasks(tasks);

  return (
    <section className="mt-8 rounded-md border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">
            Submission workroom
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Persistent closeout tasks generated from VERIFY markers, reviewer
            findings, compliance gaps, and packet items.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/rfp/proposals/${proposalId}/export/manifest-csv`}
            className="rounded-md border border-sky-500/40 bg-sky-500/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-sky-100 transition hover:border-sky-300"
          >
            Export manifest
          </a>
          <button
            type="button"
            onClick={refreshTasks}
            disabled={!canEdit || isPending}
            className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-200 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Syncing" : "Sync tasks"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label="Open" value={counts.open} />
        <Metric label="Blocked" value={counts.blocked} danger={counts.blocked > 0} />
        <Metric label="Done" value={counts.done} />
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {sorted.length === 0 ? (
        <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-300">
            No submission tasks yet. Run capture readiness and reviewer pass,
            then sync tasks.
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-zinc-900 overflow-hidden rounded-md border border-zinc-800">
          {sorted.map((task) => (
            <li key={task.id} className="bg-zinc-950/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">
                      {sourceLabel(task.source_type)}
                    </span>
                    <span
                      className={`font-mono text-[9px] uppercase tracking-[0.18em] ${PRIORITY_CLASS[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">
                      Due {formatDueDate(task.due_date)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-zinc-100">
                    {task.title}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
                    {task.detail}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
                    <span>{task.owner_label}</span>
                    {task.evidence ? <span>{task.evidence}</span> : null}
                  </div>
                </div>
                <select
                  value={task.status}
                  disabled={!canEdit || isPending}
                  onChange={(event) =>
                    updateTask(task.id, event.target.value as SubmissionTaskStatus)
                  }
                  className={`rounded-md border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] outline-none disabled:cursor-not-allowed disabled:opacity-60 ${STATUS_CLASS[task.status]}`}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {label(status)}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>
      <p className={`mt-2 text-xl font-semibold tabular-nums ${danger ? "text-rose-300" : "text-zinc-100"}`}>
        {value}
      </p>
    </div>
  );
}
