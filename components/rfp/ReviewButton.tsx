"use client";

/**
 * ReviewButton — kicks off the Reviewer Agent v1 pass on a proposal.
 *
 * Style mirrors DraftButton. Honest copy: "Run reviewer pass" with a small
 * subtitle naming the model tier and approximate cost. On success we refresh
 * the page (server-rendered) so the new findings panel renders.
 *
 * v1 = single Opus call, no streaming. The user sees the disabled "Reviewing…"
 * state for ~30-60 seconds. A loading spinner is enough at this scale.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReviewButtonProps {
  orgId: string;
  proposalId: string;
}

export function ReviewButton({ orgId: _orgId, proposalId }: ReviewButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/rfp/proposals/${proposalId}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const payload = (await res.json()) as
        | { overall_score: number }
        | { error: string; detail?: string };
      if (!res.ok || !("overall_score" in payload)) {
        const msg =
          "error" in payload
            ? `${payload.error}${payload.detail ? `: ${payload.detail}` : ""}`
            : `http_${res.status}`;
        setError(msg);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Reviewing…" : "Run reviewer pass"}
      </button>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        Preview · Opus rubric review · ~$0.70/run
      </p>
      {error ? (
        <p className="text-[12px] text-rose-300">Review failed: {error}</p>
      ) : null}
    </div>
  );
}
