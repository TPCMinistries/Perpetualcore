"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export type PursuitDecisionEventType =
  | "note"
  | "bid_decision"
  | "risk"
  | "owner_change"
  | "stage_change"
  | "submission_update";

export interface PursuitDecisionLogRow {
  id: string;
  org_id: string;
  opp_id: string;
  event_type: PursuitDecisionEventType;
  title: string;
  body: string;
  created_by: string | null;
  created_at: string;
}

interface PursuitDecisionLogProps {
  orgId: string;
  oppId: string;
  logs: PursuitDecisionLogRow[];
  canEdit: boolean;
}

const EVENT_TYPES: PursuitDecisionEventType[] = [
  "note",
  "bid_decision",
  "risk",
  "submission_update",
];

function eventLabel(value: string): string {
  return value.replaceAll("_", " ");
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PursuitDecisionLog({
  orgId,
  oppId,
  logs,
  canEdit,
}: PursuitDecisionLogProps) {
  const router = useRouter();
  const [eventType, setEventType] = useState<PursuitDecisionEventType>("note");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!canEdit || isPending) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/rfp/opps/${oppId}/decision-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          event_type: eventType,
          title,
          body,
        }),
      });
      const payload = (await res.json().catch(() => null)) as
        | { error?: string; detail?: string }
        | null;
      if (!res.ok) {
        setError(payload?.detail ?? payload?.error ?? "Could not add log entry");
        return;
      }
      setEventType("note");
      setTitle("");
      setBody("");
      router.refresh();
    });
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        Decision log
      </p>

      {canEdit ? (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-700">Type</span>
              <select
                value={eventType}
                onChange={(event) =>
                  setEventType(event.target.value as PursuitDecisionEventType)
                }
                disabled={isPending}
                className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm capitalize text-zinc-950 outline-none transition focus:border-zinc-500 disabled:opacity-60"
              >
                {EVENT_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {eventLabel(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-700">Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value.slice(0, 160))}
                disabled={isPending}
                placeholder="Eligibility confirmed with funder"
                className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 disabled:opacity-60"
              />
            </label>
          </div>
          <label className="mt-3 grid gap-1">
            <span className="text-sm font-medium text-zinc-700">Detail</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value.slice(0, 2000))}
              disabled={isPending}
              placeholder="What changed, who decided, and what evidence supports it?"
              className="min-h-24 rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 disabled:opacity-60"
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={isPending || title.trim().length < 3}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {isPending ? "Adding" : "Add entry"}
            </button>
            {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          </div>
        </div>
      ) : null}

      {logs.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          No decision entries yet. Add the rationale for pursuing, watching, or
          changing course.
        </p>
      ) : (
        <ol className="mt-5 space-y-3">
          {logs.map((log) => (
            <li key={log.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500">
                  {eventLabel(log.event_type)}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                  {fmtDate(log.created_at)}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-zinc-950">
                {log.title}
              </h3>
              {log.body ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600">
                  {log.body}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
