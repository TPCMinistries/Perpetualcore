/**
 * FitScoreChip — renders the canonical "94 · Strong fit" chip from 05-CONTEXT.md.
 *
 * Color tokens (locked in 05-CONTEXT.md "Fit score presentation"):
 *   ≥ 90 → emerald-300 on emerald-950 with thin emerald border
 *   70-89 → zinc-300 on zinc-900 with zinc-700 border
 *   < 70 → zinc-500 on zinc-950 with zinc-800 border (low-emphasis)
 *
 * The number + tier label sit inline as one credit-bureau-style readout.
 * Mono font keeps the number from competing with the row's serif title.
 */

import type { FitTier } from "@/lib/rfp/scoring/weights";

interface FitScoreChipProps {
  score: number;
  tier: FitTier;
  className?: string;
}

function classesForScore(score: number): string {
  if (score >= 90) {
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  }
  if (score >= 70) {
    return "bg-blue-50 text-blue-800 border-blue-200";
  }
  return "bg-zinc-100 text-zinc-600 border-zinc-200";
}

export function FitScoreChip({ score, tier, className }: FitScoreChipProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${classesForScore(score)} ${className ?? ""}`}
      aria-label={`Fit score ${score} out of 100, ${tier}`}
    >
      {score} · {tier}
    </span>
  );
}
