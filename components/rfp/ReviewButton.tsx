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
import { ShieldCheck } from "lucide-react";

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
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        {busy ? "Reviewing…" : "Run reviewer pass"}
      </button>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        Preview · Opus rubric review · ~$0.70/run
      </p>
      {error ? (
        <p className="text-[12px] text-rose-600">Review failed: {error}</p>
      ) : null}
    </div>
  );
}
