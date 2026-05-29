"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

export type PursuitStage =
  | "evaluating"
  | "drafting"
  | "reviewing"
  | "ready"
  | "submitted"
  | "closed";

export type PursuitPriority = "low" | "medium" | "high" | "critical";

interface PursuitCommandStateFormProps {
  orgId: string;
  oppId: string;
  initialOwnerLabel: string;
  initialStage: PursuitStage;
  initialPriority: PursuitPriority;
  canEdit: boolean;
}

const STAGES: PursuitStage[] = [
  "evaluating",
  "drafting",
  "reviewing",
  "ready",
  "submitted",
  "closed",
];

const PRIORITIES: PursuitPriority[] = ["medium", "high", "critical", "low"];

function label(value: string): string {
  return value.replaceAll("_", " ");
}

export function PursuitCommandStateForm({
  orgId,
  oppId,
  initialOwnerLabel,
  initialStage,
  initialPriority,
  canEdit,
}: PursuitCommandStateFormProps) {
  const router = useRouter();
  const [ownerLabel, setOwnerLabel] = useState(initialOwnerLabel);
  const [stage, setStage] = useState<PursuitStage>(initialStage);
  const [priority, setPriority] = useState<PursuitPriority>(initialPriority);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!canEdit || isPending) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/rfp/opps/${oppId}/pursuit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          owner_label: ownerLabel.trim() || "Unassigned",
          stage,
          priority,
        }),
      });
      const payload = (await res.json().catch(() => null)) as
        | { error?: string; detail?: string }
        | null;
      if (!res.ok) {
        setError(payload?.detail ?? payload?.error ?? "Could not save pursuit state");
        return;
      }
      setMessage("Saved.");
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        Ownership
      </p>
      <div className="mt-4 grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm font-medium text-zinc-700">Owner</span>
          <input
            value={ownerLabel}
            onChange={(event) => setOwnerLabel(event.target.value.slice(0, 80))}
            disabled={!canEdit || isPending}
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 disabled:opacity-60"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-zinc-700">Stage</span>
            <select
              value={stage}
              onChange={(event) => setStage(event.target.value as PursuitStage)}
              disabled={!canEdit || isPending}
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm capitalize text-zinc-950 outline-none transition focus:border-zinc-500 disabled:opacity-60"
            >
              {STAGES.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-zinc-700">Priority</span>
            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as PursuitPriority)
              }
              disabled={!canEdit || isPending}
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm capitalize text-zinc-950 outline-none transition focus:border-zinc-500 disabled:opacity-60"
            >
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={!canEdit || isPending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Saving" : "Save"}
        </button>
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </div>
    </section>
  );
}
