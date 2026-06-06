"use client";

import Link from "next/link";
import { useState } from "react";
import { Archive, ArrowRight, Bookmark, CheckCircle2, Loader2 } from "lucide-react";
import type { OpportunityTriageStatus } from "@/components/rfp/OpportunityTriageControl";
import type { PursuitDecisionAction } from "@/lib/rfp/pursuit-decision";

interface PursuitDecisionBarProps {
  orgId: string;
  oppId: string;
  initialStatus: OpportunityTriageStatus;
  initialNote?: string | null;
  onChange?: (
    oppId: string,
    status: OpportunityTriageStatus,
    note: string | null,
  ) => void;
}

const ACTIONS: Array<{
  action: PursuitDecisionAction;
  label: string;
  status: OpportunityTriageStatus;
  icon: typeof CheckCircle2;
  note: string;
}> = [
  {
    action: "pursue",
    label: "Pursue",
    status: "pursuing",
    icon: CheckCircle2,
    note: "Marked for active pursuit from Discovery.",
  },
  {
    action: "watch",
    label: "Watch",
    status: "watch",
    icon: Bookmark,
    note: "Added to watchlist from Discovery.",
  },
  {
    action: "archive",
    label: "Archive",
    status: "passed",
    icon: Archive,
    note: "Archived from Discovery.",
  },
];

function classes(active: boolean, status: OpportunityTriageStatus): string {
  if (!active) {
    return "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50";
  }
  if (status === "pursuing") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "watch") return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-zinc-300 bg-zinc-100 text-zinc-700";
}

export function PursuitDecisionBar({
  orgId,
  oppId,
  initialStatus,
  initialNote = null,
  onChange,
}: PursuitDecisionBarProps) {
  const [status, setStatus] = useState<OpportunityTriageStatus>(initialStatus);
  const [note, setNote] = useState(initialNote ?? "");
  const [saving, setSaving] = useState<PursuitDecisionAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(action: PursuitDecisionAction) {
    if (saving) return;
    const option = ACTIONS.find((item) => item.action === action);
    if (!option) return;
    setSaving(action);
    setError(null);
    const nextNote = note.trim() || option.note;
    try {
      const res = await fetch(`/api/rfp/opps/${oppId}/decision`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          action,
          note: nextNote,
        }),
      });
      const payload = (await res.json().catch(() => null)) as
        | {
            triage_status?: OpportunityTriageStatus;
            triage_note?: string | null;
          }
        | { error?: string; detail?: string }
        | null;
      if (!res.ok || !payload || !("triage_status" in payload)) {
        setError(
          payload && "error" in payload && payload.error
            ? payload.detail ?? payload.error
            : `HTTP ${res.status}`,
        );
        return;
      }
      const savedStatus = payload.triage_status ?? option.status;
      const savedNote = payload.triage_note ?? nextNote;
      setStatus(savedStatus);
      setNote(savedNote);
      onChange?.(oppId, savedStatus, savedNote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
            Decision
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {ACTIONS.map((option) => {
              const Icon = option.icon;
              const active = status === option.status;
              return (
                <button
                  key={option.action}
                  type="button"
                  onClick={() => void choose(option.action)}
                  disabled={saving !== null}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${classes(active, option.status)}`}
                >
                  {saving === option.action ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <Link
          href={`/org/${orgId}/pursuits/${oppId}`}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100"
        >
          Command file
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <label className="mt-4 block">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          Decision note
        </span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, 500))}
          placeholder="Why pursue, watch, or archive?"
          className="mt-1 min-h-16 w-full resize-y rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>
      {error ? (
        <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          Could not save decision: {error}
        </p>
      ) : null}
    </section>
  );
}
