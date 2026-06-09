"use client";

/**
 * ProposalStatusControl — owner/writer-only control to advance a proposal
 * through its lifecycle. Renders inline at the top of the proposal page.
 *
 * Statuses: draft → submitted → won | lost  (withdrawn possible from any)
 *
 * v1 has no notes field — the API accepts notes but the UI sends none.
 * If we want notes we add a textarea later; keeping the click-path one
 * tap shorter for the common path matters more than capturing rationale.
 *
 * On transition to won/lost, the API enrolls the org owner in the
 * win-loss-survey sequence. We don't surface that in the UI; the
 * sequence email shows up in their inbox.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "draft" | "submitted" | "won" | "lost" | "withdrawn";

const STATUS_META: Record<
  Status,
  { label: string; chip: string }
> = {
  draft: {
    label: "Draft",
    chip: "border-zinc-300 bg-zinc-100 text-zinc-700",
  },
  submitted: {
    label: "Submitted",
    chip: "border-amber-200 bg-amber-50 text-amber-700",
  },
  won: {
    label: "Won",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  lost: {
    label: "Lost",
    chip: "border-rose-200 bg-rose-50 text-rose-700",
  },
  withdrawn: {
    label: "Withdrawn",
    chip: "border-zinc-300 bg-zinc-100 text-zinc-500",
  },
};

// Allowed forward transitions. We let drafts go directly to any terminal
// state so a writer who marks "won" without flagging "submitted" first
// doesn't get blocked. Withdrawn is reachable from anywhere.
const NEXT_OPTIONS: Record<Status, Status[]> = {
  draft: ["submitted", "won", "lost", "withdrawn"],
  submitted: ["won", "lost", "withdrawn"],
  won: ["lost", "withdrawn"],
  lost: ["won", "withdrawn"],
  withdrawn: ["draft"],
};

interface ProposalStatusControlProps {
  proposalId: string;
  initialStatus: Status | string;
  canEdit: boolean;
}

function coerceStatus(s: string): Status {
  if (s === "draft" || s === "submitted" || s === "won" || s === "lost" || s === "withdrawn") {
    return s;
  }
  return "draft";
}

export function ProposalStatusControl({
  proposalId,
  initialStatus,
  canEdit,
}: ProposalStatusControlProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(coerceStatus(initialStatus));
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  const meta = STATUS_META[status];

  async function changeTo(next: Status) {
    setBusy(next);
    setError(null);
    try {
      const res = await fetch(`/api/rfp/proposals/${proposalId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const payload = (await res.json()) as {
        status?: string;
        error?: string;
        detail?: string;
        next_action?: string;
      };
      if (!res.ok || !payload.status) {
        setError(payload.next_action ?? payload.detail ?? payload.error ?? `http_${res.status}`);
        return;
      }
      setStatus(coerceStatus(payload.status));
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    } finally {
      setBusy(null);
    }
  }

  if (!canEdit) {
    return (
      <span
        className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${meta.chip}`}
      >
        {meta.label}
      </span>
    );
  }

  const options = NEXT_OPTIONS[status];

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy !== null}
        className={`inline-flex items-center gap-2 rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] transition hover:brightness-95 ${meta.chip} disabled:opacity-50`}
      >
        {meta.label}
        <span aria-hidden className="text-[8px]">▾</span>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-20 mt-2 min-w-[180px] rounded-md border border-zinc-200 bg-white p-1 shadow-lg">
          {options.map((next) => {
            const nextMeta = STATUS_META[next];
            const isBusy = busy === next;
            return (
              <button
                key={next}
                type="button"
                onClick={() => void changeTo(next)}
                disabled={busy !== null}
                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[12px] text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>Mark {nextMeta.label.toLowerCase()}</span>
                {isBusy ? (
                  <span className="font-mono text-[9px] text-zinc-500">saving…</span>
                ) : null}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-1 w-full rounded px-2 py-1 text-left font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400 hover:text-zinc-600"
          >
            cancel
          </button>
        </div>
      ) : null}
      {error ? (
        <p className="mt-1 font-mono text-[10px] text-rose-700">{error}</p>
      ) : null}
    </div>
  );
}
