"use client";

/**
 * FitReasoningPanel — shows the 5-dimension fit breakdown with sub-scores,
 * disqualifier warning chips, and named vault citations per dimension.
 *
 * Phase 18-04:
 *   SCORE-01 — plain-English summary already in DetailPane; panel adds context
 *   SCORE-02 — named vault artifact citations with excerpt previews
 *   SCORE-03 — 5 labeled dimensions each with a sub-score bar
 *   SCORE-04 — disqualifier warning chips (amber/red) when flags exist
 *
 * Pre-v2 rows: shows a "Score this opportunity" button that POSTs to the
 *   rescore endpoint. On 402 (budget exceeded), shows the budget message.
 *   On success, calls onRescored() so DetailPane can re-fetch the updated detail.
 */

import { useState } from "react";
import { AlertTriangle, RefreshCw, Sparkles } from "lucide-react";
import { VaultCitation } from "./VaultCitation";
import type { ExplainedDimensions } from "@/lib/rfp/scoring/dimensions";
import type { DisqualifierFlag } from "@/lib/rfp/scoring/disqualifiers";
import type { FitEvidenceDimension } from "@/lib/rfp/scoring/evidence-store";

// ── Types ────────────────────────────────────────────────────────────────────

interface EvidenceItem {
  artifact_id: string;
  artifact_doc_id: string;
  artifact_title: string;
  artifact_type: string;
  excerpt: string;
  similarity: number;
  dimension: FitEvidenceDimension;
}

export interface FitReasoningData {
  scored_v2: boolean;
  dimensions: ExplainedDimensions | null;
  disqualifiers: DisqualifierFlag[];
  /** Evidence grouped by dimension key. */
  evidence: Record<FitEvidenceDimension, EvidenceItem[]> | Record<string, never>;
}

interface FitReasoningPanelProps {
  oppId: string;
  orgId: string;
  fitReasoning: FitReasoningData;
  onRescored?: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** The 5 SCORE-03 dimensions in display order. */
const DIMENSIONS: { key: keyof ExplainedDimensions; label: string }[] = [
  { key: "mission_fit", label: "Mission fit" },
  { key: "eligibility", label: "Eligibility" },
  { key: "track_record", label: "Track record" },
  { key: "capacity", label: "Capacity" },
  { key: "funder_relationship", label: "Funder relationship" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

/** A thin score bar, 0-100, zinc palette with emerald/amber tones. */
function ScoreBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const barColor =
    pct >= 70
      ? "bg-emerald-500"
      : pct >= 40
      ? "bg-amber-400"
      : "bg-zinc-300";

  return (
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
      <div
        className={`h-full rounded-full transition-all ${barColor}`}
        style={{ width: `${pct}%` }}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        role="meter"
      />
    </div>
  );
}

/** Disqualifier warning chip. Hard flags are red-tinted; soft flags are amber. */
function DisqualifierChip({ flag }: { flag: DisqualifierFlag }) {
  const isHard = flag.severity === "hard";
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs leading-5 ${
        isHard
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
      role="alert"
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        <span className="font-semibold uppercase tracking-wide text-[10px] mr-1">
          {isHard ? "Ineligible" : "Warning"}
        </span>
        {flag.label}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FitReasoningPanel({
  oppId,
  orgId,
  fitReasoning,
  onRescored,
}: FitReasoningPanelProps) {
  const [rescoring, setRescoring] = useState(false);
  const [rescoreError, setRescoreError] = useState<string | null>(null);

  // ── Pre-v2 state: show "Score this opportunity" CTA ──────────────────────
  if (!fitReasoning.scored_v2) {
    async function handleRescore() {
      setRescoring(true);
      setRescoreError(null);
      try {
        const res = await fetch(
          `/api/rfp/opps/${encodeURIComponent(oppId)}/rescore?org_id=${encodeURIComponent(orgId)}`,
          { method: "POST" }
        );
        if (res.status === 402) {
          const json = await res.json().catch(() => ({}));
          const msg =
            typeof json?.message === "string" && json.message.length > 0
              ? json.message
              : "AI budget exceeded for this org. Increase the monthly AI budget or wait for the next billing cycle.";
          setRescoreError(msg);
          return;
        }
        if (!res.ok) {
          setRescoreError("Scoring failed. Try again in a moment.");
          return;
        }
        onRescored?.();
      } catch {
        setRescoreError("Network error. Check your connection and try again.");
      } finally {
        setRescoring(false);
      }
    }

    return (
      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          Fit reasoning
        </h3>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-600">
            Vault-grounded dimension scoring is not yet available for this opportunity.
            Score it now to see mission fit, eligibility, track record, capacity, and funder
            relationship breakdowns with citations from your vault.
          </p>
          {rescoreError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {rescoreError}
            </div>
          )}
          <button
            onClick={() => { void handleRescore(); }}
            disabled={rescoring}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
          >
            {rescoring ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Scoring…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Score this opportunity
              </>
            )}
          </button>
        </div>
      </section>
    );
  }

  // ── v2 state: render full panel ──────────────────────────────────────────
  const { dimensions, disqualifiers, evidence } = fitReasoning;

  return (
    <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
        Fit reasoning
      </h3>

      {/* SCORE-04: Disqualifier flags */}
      {disqualifiers.length > 0 && (
        <div className="mb-4 space-y-2">
          {disqualifiers.map((flag, i) => (
            <DisqualifierChip key={`${flag.field}-${i}`} flag={flag} />
          ))}
        </div>
      )}

      {/* SCORE-03: 5 dimensions */}
      {dimensions ? (
        <div className="space-y-4">
          {DIMENSIONS.map(({ key, label }) => {
            const dim = dimensions[key];
            const dimEvidence =
              (evidence as Record<FitEvidenceDimension, EvidenceItem[]>)[key] ?? [];

            return (
              <div key={key}>
                {/* Dimension header */}
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    {label}
                  </span>
                  <span className="font-mono text-xs text-zinc-700">
                    {dim.sub_score}
                  </span>
                </div>
                <ScoreBar score={dim.sub_score} />
                {dim.label && (
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{dim.label}</p>
                )}

                {/* SCORE-02: Vault citations for this dimension */}
                {dimEvidence.length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {dimEvidence.map((ev) => (
                      <VaultCitation
                        key={`${ev.artifact_id}-${ev.dimension}`}
                        artifactTitle={ev.artifact_title}
                        artifactType={ev.artifact_type}
                        excerpt={ev.excerpt}
                        similarity={ev.similarity}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs text-zinc-400 italic">
                    No vault evidence cited for this dimension.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Dimension breakdown unavailable.</p>
      )}
    </section>
  );
}
