"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type {
  SubmissionTaskPriority,
  SubmissionTaskRow,
} from "@/lib/rfp/submission/tasks";

interface ManualSubmissionTaskFormProps {
  proposalId: string;
  canEdit: boolean;
}

const PRIORITIES: SubmissionTaskPriority[] = ["medium", "high", "critical", "low"];

export function ManualSubmissionTaskForm({
  proposalId,
  canEdit,
}: ManualSubmissionTaskFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [ownerLabel, setOwnerLabel] = useState("Proposal lead");
  const [priority, setPriority] = useState<SubmissionTaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!canEdit || isPending) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await fetch(
        `/api/rfp/proposals/${proposalId}/submission-tasks/manual`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            detail,
            owner_label: ownerLabel,
            priority,
            due_date: dueDate || null,
          }),
        },
      );
      const payload = (await res.json().catch(() => null)) as
        | { task?: SubmissionTaskRow; error?: string; detail?: string }
        | null;

      if (!res.ok || !payload?.task) {
        setError(payload?.detail ?? payload?.error ?? "Could not create task");
        return;
      }

      setTitle("");
      setDetail("");
      setOwnerLabel("Proposal lead");
      setPriority("medium");
      setDueDate("");
      setMessage("Task added.");
      router.refresh();
    });
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Manual task
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-950">
            Add operational work
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Capture calls, budget follow-up, board approvals, signatures, or
            anything the automated readiness pass cannot infer.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm font-medium text-zinc-700">Task</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value.slice(0, 160))}
            disabled={!canEdit || isPending}
            placeholder="Confirm matching funds letter"
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 disabled:opacity-60"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-zinc-700">Detail</span>
          <textarea
            value={detail}
            onChange={(event) => setDetail(event.target.value.slice(0, 1000))}
            disabled={!canEdit || isPending}
            placeholder="Add source, stakeholder, or acceptance detail."
            className="min-h-24 rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 disabled:opacity-60"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-zinc-700">Owner</span>
            <input
              value={ownerLabel}
              onChange={(event) =>
                setOwnerLabel(event.target.value.slice(0, 80))
              }
              disabled={!canEdit || isPending}
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 disabled:opacity-60"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-zinc-700">Priority</span>
            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as SubmissionTaskPriority)
              }
              disabled={!canEdit || isPending}
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 disabled:opacity-60"
            >
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-zinc-700">Due date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              disabled={!canEdit || isPending}
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 disabled:opacity-60"
            />
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={!canEdit || isPending || title.trim().length < 3}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {isPending ? "Adding" : "Add task"}
        </button>
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </div>
    </section>
  );
}
