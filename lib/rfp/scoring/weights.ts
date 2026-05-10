/**
 * Phase 05-03 — Fit-scoring weights + tier thresholds.
 *
 * These constants are FROZEN for v1. User-tunable weights are explicitly
 * deferred to Phase 7/10 per `.planning/phases/05-discovery/05-CONTEXT.md`
 * "Deferred Ideas" — score history, user-tunable weights, and score-delta UX
 * are all post-MVP.
 *
 * Why these weights (30/25/20/15/10):
 *   - NAICS overlap (30%) — strongest first-line signal for whether an org is
 *     even eligible to bid; misalignment is a near-disqualifier.
 *   - Keyword alignment (25%) — captures capacity-area match (workforce, youth,
 *     STEM, etc.) where NAICS is too coarse.
 *   - Geo match (20%) — eligibility constraint; a US-wide opp + NY-only capacity
 *     still scores 0.5 because some funders accept out-of-region applicants.
 *   - Dollar band (15%) — past-win amounts predict the org's realistic award
 *     size; an org that's won $50k grants is unlikely to be awarded $5M.
 *   - Past funder (10%) — strong but rare signal; agencies who've funded you
 *     before are more likely to fund you again.
 *
 * Source: `.planning/research/rfp-engine/TECH-SPEC.md` § 4.1.
 */

export const WEIGHTS = {
  naics: 0.3,
  keyword: 0.25,
  geo: 0.2,
  dollar_band: 0.15,
  past_funder: 0.1,
} as const;

/**
 * Tier thresholds applied to the final 0-100 fit_score.
 *   ≥90 → Strong fit (emerald-300 chip)
 *   70-89 → Good fit (zinc-300 chip)
 *   50-69 → Marginal (zinc-500 chip)
 *   <50 → Weak (zinc-500 chip, surfaced only when user removes filters)
 *
 * Used by FeedRow.tsx in Plan 05-04 and the alert threshold default in
 * Plan 05-07 (default fires at fit ≥ 80, configurable 60-100).
 */
export const TIER_THRESHOLDS = {
  strong: 90,
  good: 70,
  marginal: 50,
} as const;

export type FitTier = 'Strong fit' | 'Good fit' | 'Marginal' | 'Weak';

export function tierFor(score: number): FitTier {
  if (score >= TIER_THRESHOLDS.strong) return 'Strong fit';
  if (score >= TIER_THRESHOLDS.good) return 'Good fit';
  if (score >= TIER_THRESHOLDS.marginal) return 'Marginal';
  return 'Weak';
}
