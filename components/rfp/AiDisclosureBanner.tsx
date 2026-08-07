"use client";

import { useState } from "react";
import Link from "next/link";

interface AiDisclosureBannerProps {
  proposalId: string;
  initialAcknowledged: boolean;
  acknowledgedAt: string | null;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AiDisclosureBanner({
  proposalId,
  initialAcknowledged,
  acknowledgedAt: initialAcknowledgedAt,
}: AiDisclosureBannerProps) {
  const [acknowledged, setAcknowledged] = useState(initialAcknowledged);
  const [acknowledgedAt, setAcknowledgedAt] = useState<string | null>(initialAcknowledgedAt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAcknowledge() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/rfp/proposals/${proposalId}/compliance-ack`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ acknowledged: true }),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Failed to acknowledge. Please try again.");
        return;
      }
      const data = (await res.json()) as { ok: boolean; acknowledged_at: string };
      setAcknowledged(true);
      setAcknowledgedAt(data.acknowledged_at);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 px-5 py-4 dark:border-amber-600 dark:bg-amber-950/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-700 dark:text-amber-400">
            Drafted with AI assistance
          </p>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            This proposal draft was generated using AI (Claude / GPT-4o). Federal agencies
            including GSA (GSAR&nbsp;552.239-7001) and some grant funders (e.g.&nbsp;NIH) require
            or restrict AI-use disclosure.{" "}
            <Link
              href="/ai-disclosure"
              className="text-amber-700 underline underline-offset-2 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
            >
              Review the full AI-use disclosure
            </Link>{" "}
            and the solicitation&apos;s AI policy before submitting.
          </p>
          {acknowledged && acknowledgedAt ? (
            <p className="mt-2 font-mono text-[10px] text-amber-700 dark:text-amber-400">
              Acknowledged on {fmtDate(acknowledgedAt)} — compliance gate item will be met on
              next readiness run.
            </p>
          ) : null}
          {error ? (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
          ) : null}
        </div>

        {!acknowledged ? (
          <button
            onClick={handleAcknowledge}
            disabled={loading}
            className="shrink-0 rounded border border-amber-400 bg-amber-100 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-amber-800 transition hover:bg-amber-200 disabled:opacity-50 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
          >
            {loading ? "Saving…" : "Acknowledge AI-use disclosure"}
          </button>
        ) : (
          <span className="shrink-0 rounded border border-emerald-300 bg-emerald-50 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
            Acknowledged
          </span>
        )}
      </div>
    </div>
  );
}
