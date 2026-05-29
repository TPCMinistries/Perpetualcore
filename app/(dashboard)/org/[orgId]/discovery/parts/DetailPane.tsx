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
import { DraftButton } from "@/components/rfp/DraftButton";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  SearchCheck,
  Sparkles,
} from "lucide-react";
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

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86_400_000);
}

function deadlineSignal(days: number | null): {
  label: string;
  detail: string;
  tone: "emerald" | "amber" | "zinc";
} {
  if (days === null) {
    return {
      label: "No deadline found",
      detail: "Confirm the source package before assigning work.",
      tone: "zinc",
    };
  }
  if (days < 0) {
    return {
      label: "Past deadline",
      detail: "Keep for market intelligence unless the source extended it.",
      tone: "zinc",
    };
  }
  if (days <= 7) {
    return {
      label: `${days} day${days === 1 ? "" : "s"} left`,
      detail: "Only pursue if requirements are already mostly reusable.",
      tone: "amber",
    };
  }
  if (days <= 21) {
    return {
      label: `${days} days left`,
      detail: "Start the workroom before drafting heavily.",
      tone: "amber",
    };
  }
  return {
    label: `${days} days left`,
    detail: "Workable window for review, attachments, and sign-off.",
    tone: "emerald",
  };
}

function pursuitDecision(score: number, deadlineDays: number | null): {
  label: string;
  detail: string;
  tone: "emerald" | "amber" | "zinc";
} {
  if (deadlineDays !== null && deadlineDays < 0) {
    return {
      label: "Pass for now",
      detail: "Deadline appears closed. Check the source for extensions.",
      tone: "zinc",
    };
  }
  if (score >= 90 && (deadlineDays === null || deadlineDays > 14)) {
    return {
      label: "Pursue now",
      detail: "Strong fit with enough room to build a clean submission packet.",
      tone: "emerald",
    };
  }
  if (score >= 70 && (deadlineDays === null || deadlineDays > 7)) {
    return {
      label: "Review closely",
      detail: "Good match. Confirm eligibility and required attachments first.",
      tone: "amber",
    };
  }
  if (score >= 50) {
    return {
      label: "Watch or import details",
      detail: "There may be a path, but the score needs human confirmation.",
      tone: "zinc",
    };
  }
  return {
    label: "Low priority",
    detail: "Keep it visible for search, but do not spend drafting time yet.",
    tone: "zinc",
  };
}

function effortSignal(amount: number | null, brief: string | null): {
  label: string;
  detail: string;
} {
  if (amount !== null && amount >= 1_000_000) {
    return {
      label: "High effort",
      detail: "Expect budget, compliance, partner, and attachment work.",
    };
  }
  if ((brief?.length ?? 0) < 500) {
    return {
      label: "Needs source review",
      detail: "Brief is thin. Open the source before relying on the draft.",
    };
  }
  return {
    label: "Standard pursuit",
    detail: "Draft, reviewer, readiness matrix, then submission packet.",
  };
}

function decisionToneClasses(tone: "emerald" | "amber" | "zinc"): string {
  if (tone === "emerald") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-zinc-200 bg-white text-zinc-700";
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
        <p className="max-w-sm text-center text-lg text-zinc-500">
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
  const deadlineDays = daysUntil(row.deadline);
  const deadline = deadlineSignal(deadlineDays);
  const decision = pursuitDecision(row.fit_score, deadlineDays);
  const effort = effortSignal(row.amount_max ?? row.amount_min ?? null, row.brief);

  return (
    <div className="h-full overflow-y-auto p-6 lg:p-8">
      {/* Eyebrow */}
      <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
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
            <span className="text-amber-700">Needs review</span>
          </>
        )}
      </div>

      <h2 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-zinc-950">
        {row.title}
      </h2>

      {/* Fit row — chip + reasoning chips inline */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <FitScoreChip score={row.fit_score} tier={row.tier} />
        {row.chips.map((chip, i) => (
          <span
            key={`${chip}-${i}`}
            className="inline-flex items-center rounded border border-zinc-200 bg-white px-2 py-0.5 font-mono text-xs text-zinc-600"
          >
            {chip}
          </span>
        ))}
      </div>

      {/* Money / deadline strip */}
      {moneyParts.length > 0 && (
        <p className="mt-4 font-mono text-sm text-zinc-500">
          {moneyParts.join(" · ")}
        </p>
      )}

      <section className="mt-6 grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <div
          className={`rounded-lg border p-4 ${decisionToneClasses(decision.tone)}`}
        >
          <ClipboardCheck className="mb-3 h-4 w-4" />
          <p className="text-sm font-semibold">{decision.label}</p>
          <p className="mt-1 text-xs leading-5 opacity-80">{decision.detail}</p>
        </div>
        <div
          className={`rounded-lg border p-4 ${decisionToneClasses(deadline.tone)}`}
        >
          <CalendarClock className="mb-3 h-4 w-4" />
          <p className="text-sm font-semibold">{deadline.label}</p>
          <p className="mt-1 text-xs leading-5 opacity-80">{deadline.detail}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 text-zinc-700">
          {(row.amount_max ?? row.amount_min ?? null) !== null ? (
            <CircleDollarSign className="mb-3 h-4 w-4 text-zinc-500" />
          ) : (
            <AlertTriangle className="mb-3 h-4 w-4 text-zinc-500" />
          )}
          <p className="text-sm font-semibold">{effort.label}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{effort.detail}</p>
        </div>
      </section>

      <section className="mt-6 grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <SearchCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-950">Confirm fit</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Score, source, deadline, and funder intent.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-950">Draft</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Profile, voice, vault, and opportunity context.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
            <FileCheck2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-950">Submit ready</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Review, compliance, packet, and workroom.
            </p>
          </div>
        </div>
      </section>

      {/* AI summary — REQUIRED render; null falls back to literal string. */}
      <section className="mt-6">
        <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          AI summary
        </h3>
        <p className="max-w-3xl text-sm leading-7 text-zinc-700">
          {row.summary ?? "No summary generated."}
        </p>
      </section>

      {/* Brief */}
      {row.brief && (
        <section className="mt-6">
          <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
            Opportunity brief
          </h3>
          <div className="max-w-3xl whitespace-pre-wrap text-sm leading-7 text-zinc-700">
            {row.brief}
          </div>
        </section>
      )}

      {/* Keywords */}
      {detail && detail.keywords.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
            Keywords
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {detail.keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center rounded border border-zinc-200 bg-white px-2 py-0.5 font-mono text-xs text-zinc-600"
              >
                {kw}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Action row — draft + source */}
      <section className="mt-8 flex flex-col gap-4 border-t border-zinc-200 pt-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-3 flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" />
            <div>
              <p className="text-sm font-semibold text-zinc-950">
                Run the end-to-end engine
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-600">
                Creates a proposal workspace, generates draft sections, then
                opens reviewer, compliance, export, and submission workroom flow.
              </p>
            </div>
          </div>
          <DraftButton orgId={orgId} oppId={row.opp_id} />
        </div>
        {row.url && (
          <a
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-zinc-700 underline-offset-4 hover:text-zinc-950 hover:underline"
          >
            Open at source <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </section>

      {/* Loading / error overlays */}
      {loading && !detail && (
        <p className="mt-6 font-mono text-xs uppercase tracking-wide text-zinc-500">
          Loading detail…
        </p>
      )}
      {error && (
        <p className="mt-6 font-mono text-xs text-amber-700">
          Detail unavailable ({error}). Showing summary from list.
        </p>
      )}
    </div>
  );
}
