"use client";

/**
 * DetailPane — right pane that shows the full reasoning for the selected opp.
 *
 * Contract (locked in 05-CONTEXT.md "Fit score presentation" → "Reasoning
 * rendering"): BOTH structured chips AND a 1-2 sentence AI summary. The chips
 * are the durable, model-agnostic explanation; the summary is the narrative
 * gloss. When summary is null (AI rate-limited, generation failed, etc.), we
 * render the literal fallback string `"No summary generated."` — never an
 * empty element. This is the explicit must-have truth in 05-04-PLAN.md:
 *   "DetailPane renders both the structured reasoning chips (from match.chips)
 *    AND the 1-2 sentence AI summary (match.summary); when summary is null,
 *    an explicit 'No summary generated.' fallback is shown"
 *
 * Visual mood: dark zinc-950 base, mono uppercase eyebrow, serif Georgia
 * italic for the title, emerald accent for the fit chip. Matches the rfp
 * marketing surface rhythm.
 */

import { useEffect, useState } from "react";
import { FitScoreChip } from "./FitScoreChip";
import type { FeedRow } from "@/lib/rfp/feed";

interface DetailPaneProps {
  orgId: string;
  selected: FeedRow | null;
}

interface OppDetail extends FeedRow {
  score_breakdown: unknown;
  posted_at: string | null;
  keywords: string[];
  geo: string | null;
  raw_json: unknown;
}

function formatAmount(amt: number | null): string {
  if (amt === null || amt === undefined) return "—";
  if (amt >= 1_000_000)
    return `$${(amt / 1_000_000).toFixed(amt >= 10_000_000 ? 0 : 1)}M`;
  if (amt >= 1_000) return `$${Math.round(amt / 1_000)}K`;
  return `$${amt}`;
}

function formatDate(iso: string | null, prefix: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${prefix} ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export function DetailPane({ orgId, selected }: DetailPaneProps) {
  const [detail, setDetail] = useState<OppDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch single-opp detail whenever the selected row changes.
  useEffect(() => {
    if (!selected) {
      setDetail(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(
      `/api/rfp/opps/${encodeURIComponent(selected.opp_id)}?org_id=${encodeURIComponent(orgId)}`
    )
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`detail_${res.status}`);
        }
        return (await res.json()) as OppDetail;
      })
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, selected]);

  // Empty state
  if (!selected) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="font-serif italic text-zinc-400 text-lg text-center max-w-sm">
          Select an opportunity to see fit reasoning.
        </p>
      </div>
    );
  }

  // Use cached row data as scaffold while detail loads — feels instant.
  const row = detail ?? selected;
  const moneyParts = [
    formatAmount(row.amount_max ?? row.amount_min ?? null),
    formatDate(row.deadline, "deadline"),
    detail ? formatDate(detail.posted_at, "posted") : null,
  ].filter((p): p is string => Boolean(p));

  return (
    <div className="h-full overflow-y-auto p-6 lg:p-8">
      {/* Eyebrow */}
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-mono">
        <span>{row.source.replace(/_/g, " ")}</span>
        {row.agency && (
          <>
            <span aria-hidden="true">·</span>
            <span>{row.agency}</span>
          </>
        )}
        {row.needs_review && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-amber-300">Needs review</span>
          </>
        )}
      </div>

      {/* Title — serif italic large */}
      <h2
        className="mt-3 text-2xl leading-tight text-zinc-100 italic"
        style={{ fontFamily: "Georgia, serif" }}
      >
        {row.title}
      </h2>

      {/* Fit row — chip + reasoning chips inline */}
      <div className="mt-5 flex items-center gap-2 flex-wrap">
        <FitScoreChip score={row.fit_score} tier={row.tier} />
        {row.chips.map((chip, i) => (
          <span
            key={`${chip}-${i}`}
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-zinc-900 text-zinc-300 border border-zinc-800"
          >
            {chip}
          </span>
        ))}
      </div>

      {/* Money / deadline strip */}
      {moneyParts.length > 0 && (
        <p className="mt-4 text-sm text-zinc-400 font-mono">
          {moneyParts.join(" · ")}
        </p>
      )}

      {/* AI summary — REQUIRED render; null falls back to literal string. */}
      <section className="mt-6">
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-mono mb-2">
          AI summary
        </h3>
        <p className="font-serif italic text-zinc-300 leading-relaxed">
          {row.summary ?? "No summary generated."}
        </p>
      </section>

      {/* Brief */}
      {row.brief && (
        <section className="mt-6">
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-mono mb-2">
            Opportunity brief
          </h3>
          <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {row.brief}
          </div>
        </section>
      )}

      {/* Keywords */}
      {detail && detail.keywords.length > 0 && (
        <section className="mt-6">
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-mono mb-2">
            Keywords
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {detail.keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-zinc-950 text-zinc-500 border border-zinc-800"
              >
                {kw}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Source link */}
      {row.url && (
        <section className="mt-8 pt-6 border-t border-zinc-900">
          <a
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-emerald-300 hover:text-emerald-200 underline-offset-4 hover:underline"
          >
            Open at source <span aria-hidden="true">↗</span>
          </a>
        </section>
      )}

      {/* Loading / error overlays */}
      {loading && !detail && (
        <p className="mt-6 text-xs text-zinc-500 font-mono uppercase tracking-wide">
          Loading detail…
        </p>
      )}
      {error && (
        <p className="mt-6 text-xs text-amber-400 font-mono">
          Detail unavailable ({error}). Showing summary from list.
        </p>
      )}
    </div>
  );
}
