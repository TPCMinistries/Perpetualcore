"use client";

import { useState } from "react";
import { Bookmark, CheckCircle2, RotateCcw, XCircle } from "lucide-react";

export type OpportunityTriageStatus =
  | "untriaged"
  | "watch"
  | "pursuing"
  | "passed";

interface OpportunityTriageControlProps {
  orgId: string;
  oppId: string;
  initialStatus: OpportunityTriageStatus;
  initialNote?: string | null;
  onChange?: (status: OpportunityTriageStatus, note: string | null) => void;
}

const OPTIONS: Array<{
  status: OpportunityTriageStatus;
  label: string;
  icon: typeof Bookmark;
}> = [
  { status: "watch", label: "Watch", icon: Bookmark },
  { status: "pursuing", label: "Pursue", icon: CheckCircle2 },
  { status: "passed", label: "Pass", icon: XCircle },
];

function statusLabel(status: OpportunityTriageStatus): string {
  if (status === "watch") return "Watching";
  if (status === "pursuing") return "Pursuing";
  if (status === "passed") return "Passed";
  return "Not triaged";
}

function buttonClasses(active: boolean, status: OpportunityTriageStatus): string {
  if (!active) {
    return "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950";
  }
  if (status === "watch") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }
  if (status === "pursuing") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "passed") {
    return "border-zinc-300 bg-zinc-100 text-zinc-700";
  }
  return "border-zinc-200 bg-white text-zinc-600";
}

export function OpportunityTriageControl({
  orgId,
  oppId,
  initialStatus,
  initialNote = null,
  onChange,
}: OpportunityTriageControlProps) {
  const [status, setStatus] = useState<OpportunityTriageStatus>(initialStatus);
  const [note, setNote] = useState(initialNote ?? "");
  const [saving, setSaving] = useState<OpportunityTriageStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function update(nextStatus: OpportunityTriageStatus) {
    if (saving) return;
    setSaving(nextStatus);
    setError(null);
    try {
      const res = await fetch(`/api/rfp/opps/${oppId}/triage`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          status: nextStatus,
          note: note.trim() || null,
        }),
      });
      const payload = (await res.json().catch(() => null)) as
        | { triage_status?: OpportunityTriageStatus; triage_note?: string | null }
        | { error?: string; detail?: unknown }
        | null;
      if (!res.ok || !payload || !("triage_status" in payload)) {
        setError(
          payload && "error" in payload && payload.error
            ? payload.error
            : `HTTP ${res.status}`,
        );
        return;
      }

      const savedStatus = payload.triage_status ?? nextStatus;
      const savedNote = payload.triage_note ?? null;
      setStatus(savedStatus);
      setNote(savedNote ?? "");
      onChange?.(savedStatus, savedNote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
            Triage
          </h3>
          <p className="mt-1 text-sm font-semibold text-zinc-950">
            {statusLabel(status)}
          </p>
        </div>
        {status !== "untriaged" ? (
          <button
            type="button"
            onClick={() => void update("untriaged")}
            disabled={saving !== null}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = status === option.status;
          return (
            <button
              key={option.status}
              type="button"
              onClick={() => void update(option.status)}
              disabled={saving !== null}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${buttonClasses(active, option.status)}`}
            >
              <Icon className="h-4 w-4" />
              {saving === option.status ? "Saving..." : option.label}
            </button>
          );
        })}
      </div>

      <label className="mt-3 block">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          Note
        </span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, 500))}
          onBlur={() => {
            if (status !== "untriaged") void update(status);
          }}
          placeholder="Why watch, pursue, or pass?"
          className="mt-1 min-h-20 w-full resize-y rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>

      {error ? (
        <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          Could not save triage: {error}
        </p>
      ) : null}
    </section>
  );
}
