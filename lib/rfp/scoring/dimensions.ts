/**
 * Phase 18-02 — SCORE-03: Five labeled dimension breakdown.
 *
 * Pure function — no DB, no AI, no async.
 *
 * Maps the existing 5 ScoreBreakdown components onto the SCORE-03 required
 * dimensions (mission_fit, eligibility, track_record, capacity,
 * funder_relationship). Each dimension gets a 0-100 sub_score and a
 * plain-English label.
 *
 * Mapping table (from 18-RESEARCH.md Pattern 2):
 *   mission_fit       ← keyword (25%) + vault boost when vaultHitCount > 0
 *   eligibility       ← naics (30%); clamped to 0 on hard disqualifier
 *   track_record      ← past_funder (10%)
 *   capacity          ← dollar_band (15%)
 *   funder_relationship ← past_funder (10%) + geo (20%)
 */

import type { ScoreBreakdown } from "@/lib/rfp/scoring/score";
import type { DisqualifierFlag } from "@/lib/rfp/scoring/disqualifiers";

// ── Public types ─────────────────────────────────────────────────────────────

export interface DimensionScore {
  sub_score: number;
  label: string;
}

export interface ExplainedDimensions {
  mission_fit: DimensionScore;
  eligibility: DimensionScore;
  track_record: DimensionScore;
  capacity: DimensionScore;
  funder_relationship: DimensionScore;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Clamp a value to [0, 100]. */
function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Build a plain-English label for a 0-100 sub_score. */
function scoreLabel(score: number, dimension: string): string {
  if (score >= 80) return `Strong ${dimension}`;
  if (score >= 60) return `Good ${dimension}`;
  if (score >= 40) return `Partial ${dimension}`;
  if (score > 0) return `Weak ${dimension}`;
  return `No ${dimension} signal`;
}

// ── Main function ─────────────────────────────────────────────────────────────

export function mapToDimensions(
  breakdown: ScoreBreakdown,
  vaultHitCount: number,
  disqualifiers: DisqualifierFlag[]
): ExplainedDimensions {
  // ── mission_fit: keyword component + vault boost ──────────────────────────
  // Base from keyword.score (0-1), scaled to 0-100.
  // Add a small boost (up to +15) when vault hits are present, clamped.
  const keywordBase = breakdown.keyword.score * 100;
  const vaultBoost = vaultHitCount > 0 ? Math.min(15, vaultHitCount * 5) : 0;
  const missionScore = clamp100(keywordBase + vaultBoost);
  const missionLabel =
    vaultHitCount > 0
      ? `${scoreLabel(missionScore, "mission alignment")} (${vaultHitCount} vault doc${vaultHitCount === 1 ? "" : "s"} found)`
      : scoreLabel(missionScore, "mission alignment");

  // ── eligibility: naics component; hard disqualifier clamps to 0 ──────────
  const hardEligibilityFlag = disqualifiers.find(
    (f) => f.dimension === "eligibility" && f.severity === "hard"
  );
  let eligibilityScore: number;
  let eligibilityLabel: string;
  if (hardEligibilityFlag) {
    eligibilityScore = 0;
    eligibilityLabel = `Ineligible: ${hardEligibilityFlag.label}`;
  } else {
    eligibilityScore = clamp100(breakdown.naics.score * 100);
    eligibilityLabel = scoreLabel(eligibilityScore, "eligibility");
  }

  // ── track_record: past_funder component ───────────────────────────────────
  const trackScore = clamp100(breakdown.past_funder.score * 100);
  const trackLabel = breakdown.past_funder.matched
    ? `Prior funder match: ${breakdown.past_funder.matched}`
    : scoreLabel(trackScore, "track record");

  // ── capacity: dollar_band component ──────────────────────────────────────
  const capacityScore = clamp100(breakdown.dollar_band.score * 100);
  const capacityLabel = scoreLabel(capacityScore, "capacity fit");

  // ── funder_relationship: past_funder (10%) + geo (20%) combined ──────────
  // Both components are 0-1 fractions; weight them proportionally.
  // past_funder contributes 10/(10+20) = 1/3, geo contributes 20/(10+20) = 2/3
  const funderRelScore = clamp100(
    (breakdown.past_funder.score * (1 / 3) + breakdown.geo.score * (2 / 3)) * 100
  );
  const funderRelLabel =
    breakdown.past_funder.matched
      ? `Known funder match: ${breakdown.past_funder.matched}`
      : breakdown.geo.score > 0 && breakdown.geo.opp_geo
      ? `Geo match: ${breakdown.geo.opp_geo}`
      : scoreLabel(funderRelScore, "funder relationship");

  return {
    mission_fit: { sub_score: missionScore, label: missionLabel },
    eligibility: { sub_score: eligibilityScore, label: eligibilityLabel },
    track_record: { sub_score: trackScore, label: trackLabel },
    capacity: { sub_score: capacityScore, label: capacityLabel },
    funder_relationship: { sub_score: funderRelScore, label: funderRelLabel },
  };
}
