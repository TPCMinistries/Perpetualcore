/**
 * Phase 05-03 — Pure deterministic fit-scoring function.
 *
 * This module exports ONE pure function — `scoreOpportunity(opp, profile)` —
 * that takes an opportunity row and an org's capture profile and returns a
 * structured ScoreBreakdown. No DB, no AI, no fetch. Unit-testable in isolation.
 *
 * Why pure:
 *   1. Predictability — the same inputs always produce the same output, so
 *      "this opp scored 87 yesterday and 23 today" never happens unexpectedly.
 *   2. Cacheability — callers can hash inputs to detect when re-scoring is
 *      unnecessary (see `lib/rfp/scoring/summary.ts` for the cache key pattern).
 *   3. Testability — the verify cases in 05-03-PLAN.md (lines 234-242) can run
 *      against this function with zero infrastructure.
 *
 * The 30/25/20/15/10 weighting and tier thresholds live in `./weights.ts`.
 * Component scoring rules come from 05-03-PLAN.md `<task type="auto">` Task 1c.
 *
 * Output contract — `chips.length === 4` ALWAYS:
 *   FeedRow.tsx (Plan 05-04) renders `chips[0..3]` without index guards. If
 *   the strongest-signal positive chips don't fill 4 slots, we pad with a
 *   source-tier fallback. The profile-pending path uses the same parity rule.
 */

import { WEIGHTS } from './weights';

// ── Public types ─────────────────────────────────────────────────────────────

export interface OpportunityForScoring {
  id: string;
  source: string;
  title: string;
  agency: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  brief: string | null;
  keywords: string[];
  geo: string | null;
}

export interface CaptureProfileForScoring {
  /** NAICS codes the org operates under (from rfp_orgs.naics). */
  naics: string[];
  /** Capacity terms extracted from profile_json/voice/past wins. */
  capacity_keywords: string[];
  /** Home geographies, e.g. ['NY','NYC','US']. */
  geo_focus: string[];
  /** Min/max award amount observed across past wins. */
  typical_award_band: { min: number; max: number } | null;
  /** Agency names from past wins (for past_funder component). */
  past_funders: string[];
}

export interface ScoreBreakdown {
  naics: { score: number; matched: string[] };
  keyword: { score: number; matched: string[] };
  geo: { score: number; opp_geo: string | null; org_geos: string[] };
  dollar_band: {
    score: number;
    opp_amount: number | null;
    band_min: number | null;
    band_max: number | null;
  };
  past_funder: { score: number; matched: string | null };
  /** 0-100 weighted sum × 100. */
  fit_score: number;
  /** Exactly 4 short labels for UI parity. */
  chips: string[];
  /** True when profile is empty/null and we degraded to geo+deadline only. */
  profile_pending: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Token-split a free-text string. Lowercase, dedupe, drop empties + tokens <3 chars. */
function tokenize(input: string | null | undefined): Set<string> {
  const out = new Set<string>();
  if (!input) return out;
  for (const tok of input.toLowerCase().split(/[^a-z0-9]+/)) {
    if (tok.length >= 3) out.add(tok);
  }
  return out;
}

/** Intersection size for arrays of strings (lowercased for case-insensitive). */
function intersect(a: Iterable<string>, b: Iterable<string>): string[] {
  const setB = new Set(Array.from(b).map((s) => s.toLowerCase()));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of a) {
    const k = item.toLowerCase();
    if (setB.has(k) && !seen.has(k)) {
      seen.add(k);
      out.push(k);
    }
  }
  return out;
}

/**
 * Source-tier fallback chip label. Used in two cases:
 *   1. Profile-pending rows that need to fill the 4-slot parity contract.
 *   2. Non-pending rows where positive-signal chips < 4 (pad to length 4).
 */
function sourceTierChip(source: string): string {
  switch (source) {
    case 'sam_gov':
    case 'grants_gov':
    case 'simpler_grants':
    case 'sbir':
    case 'fed_register':
      return 'Federal';
    case 'ny_state':
      return 'NY State';
    case 'nyc_dycd':
    case 'nyc_hra':
    case 'nyc_doe':
      return 'NYC';
    case 'foundation_url':
      return 'Foundation';
    default:
      return 'Other source';
  }
}

/**
 * Deadline-workability chip based on weeks until the opp deadline.
 *   >4 weeks  → 'Workable deadline'
 *   1-4 weeks → 'Tight deadline'
 *   <1 week   → 'Imminent deadline'
 *   null      → null (caller substitutes a source-tier chip)
 */
function deadlineChip(deadline: string | null): string | null {
  if (!deadline) return null;
  const dl = new Date(deadline);
  if (Number.isNaN(dl.getTime())) return null;
  const weeks = (dl.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7);
  if (weeks < 1) return 'Imminent deadline';
  if (weeks <= 4) return 'Tight deadline';
  return 'Workable deadline';
}

/** Round to two decimal places — keeps breakdown JSON readable. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Pad a chips array to exactly 4 entries using source-tier fallback chips.
 * Avoids duplicates so the UI doesn't render the same label twice.
 */
function padChipsToFour(chips: string[], opp: OpportunityForScoring): string[] {
  const out = [...chips];
  const tier = sourceTierChip(opp.source);
  const fallbacks = [tier, 'Imported', 'Active opportunity', 'Other source'];
  let i = 0;
  while (out.length < 4) {
    const candidate = fallbacks[i++ % fallbacks.length];
    if (!out.includes(candidate)) out.push(candidate);
    if (i > 20) break; // safety
  }
  return out.slice(0, 4);
}

// ── Profile-pending fallback ──────────────────────────────────────────────────

function profilePendingBreakdown(opp: OpportunityForScoring): ScoreBreakdown {
  const tier = sourceTierChip(opp.source);
  const dlChip = deadlineChip(opp.deadline);
  const geoChip = `Geo: ${opp.geo ?? 'unknown'}`;

  // Build chips array in priority order, then pad to length 4.
  // Slot 1: 'Profile pending' — always.
  // Slot 2: geo chip — always.
  // Slot 3: deadline chip if available, otherwise source-tier fallback.
  // Slot 4: source-tier chip for parity with non-pending rows. If slot 3 already
  //   used the same tier (because deadline was null), use 'Imported' instead to
  //   avoid dup.
  const chips: string[] = ['Profile pending', geoChip];
  if (dlChip) {
    chips.push(dlChip);
    chips.push(tier);
  } else {
    chips.push(tier);
    chips.push('Imported');
  }

  return {
    naics: { score: 0, matched: [] },
    keyword: { score: 0, matched: [] },
    geo: {
      score: 0,
      opp_geo: opp.geo,
      org_geos: [],
    },
    dollar_band: {
      score: 0,
      opp_amount: opp.amount_max ?? opp.amount_min ?? null,
      band_min: null,
      band_max: null,
    },
    past_funder: { score: 0, matched: null },
    fit_score: 50, // neutral — sits in 'Marginal' tier so user sees the row
    chips: padChipsToFour(chips, opp),
    profile_pending: true,
  };
}

// ── Main scoring function ─────────────────────────────────────────────────────

export function scoreOpportunity(
  opp: OpportunityForScoring,
  profile: CaptureProfileForScoring | null
): ScoreBreakdown {
  // Profile-pending: degrade gracefully so the feed still ranks something.
  if (
    profile === null ||
    (profile.naics.length === 0 && profile.capacity_keywords.length === 0)
  ) {
    return profilePendingBreakdown(opp);
  }

  // ── Component 1: NAICS overlap (30%) ──────────────────────────────────────
  // 05-01 normalizer drops SAM.gov NAICS codes into opp.keywords. Other sources
  // naturally return 0 for this component, which is correct (NAICS isn't a
  // signal where it doesn't exist).
  const naicsMatched = intersect(opp.keywords, profile.naics);
  const naicsScore = profile.naics.length === 0
    ? 0
    : Math.min(1, naicsMatched.length / profile.naics.length);

  // ── Component 2: Keyword alignment (25%) ──────────────────────────────────
  // Pool: opp.keywords + tokens(title) + tokens(brief). Tokenize via
  // lowercase + non-word split, dedupe.
  const oppPool = new Set<string>();
  for (const k of opp.keywords) oppPool.add(k.toLowerCase());
  for (const t of tokenize(opp.title)) oppPool.add(t);
  for (const t of tokenize(opp.brief)) oppPool.add(t);
  const keywordMatched = intersect(oppPool, profile.capacity_keywords);
  const keywordScore = profile.capacity_keywords.length === 0
    ? 0
    : Math.min(1, keywordMatched.length / profile.capacity_keywords.length);

  // ── Component 3: Geo match (20%) ──────────────────────────────────────────
  // 1.0 if opp.geo ∈ profile.geo_focus (case-insensitive)
  // 0.5 if opp.geo == 'US' AND any geo_focus entry is a US sub-region
  // 0.0 otherwise
  let geoScore = 0;
  if (opp.geo) {
    const oppGeoLc = opp.geo.toLowerCase();
    const focusLc = profile.geo_focus.map((g) => g.toLowerCase());
    if (focusLc.includes(oppGeoLc)) {
      geoScore = 1;
    } else if (oppGeoLc === 'us') {
      // Heuristic: any non-'US' geo_focus entry is treated as a US sub-region.
      // Aligns with how the planner described state/city/regional matches.
      const hasUsSubRegion = focusLc.some((g) => g !== 'us' && g.length <= 5);
      if (hasUsSubRegion) geoScore = 0.5;
    }
  }

  // ── Component 4: Dollar-band (15%) ────────────────────────────────────────
  // opp_amount = amount_max ?? amount_min
  // Within band [min, max*1.5] → 1.0
  // Within ±2× of band       → 0.5
  // Else                      → 0.0
  const oppAmount = opp.amount_max ?? opp.amount_min ?? null;
  let dollarScore = 0;
  let bandMin: number | null = null;
  let bandMax: number | null = null;
  if (oppAmount !== null && profile.typical_award_band) {
    bandMin = profile.typical_award_band.min;
    bandMax = profile.typical_award_band.max;
    const inExpanded = oppAmount >= bandMin && oppAmount <= bandMax * 1.5;
    if (inExpanded) {
      dollarScore = 1;
    } else {
      const halfMin = bandMin * 0.5;
      const doubleMax = bandMax * 2;
      if (oppAmount >= halfMin && oppAmount <= doubleMax) {
        dollarScore = 0.5;
      }
    }
  }

  // ── Component 5: Past funder (10%) ────────────────────────────────────────
  // Case-insensitive substring match: opp.agency ⊂ any of profile.past_funders,
  // OR any past_funder ⊂ opp.agency. The substring relationship is symmetric
  // for our purposes (e.g. agency='DOL ETA' matches past_funder='DOL').
  let pastScore = 0;
  let pastMatch: string | null = null;
  if (opp.agency && profile.past_funders.length > 0) {
    const agencyLc = opp.agency.toLowerCase();
    for (const funder of profile.past_funders) {
      const funderLc = funder.toLowerCase();
      if (agencyLc.includes(funderLc) || funderLc.includes(agencyLc)) {
        pastScore = 1;
        pastMatch = funder;
        break;
      }
    }
  }

  // ── Weighted sum × 100 ───────────────────────────────────────────────────
  const weighted =
    naicsScore * WEIGHTS.naics +
    keywordScore * WEIGHTS.keyword +
    geoScore * WEIGHTS.geo +
    dollarScore * WEIGHTS.dollar_band +
    pastScore * WEIGHTS.past_funder;
  const fit_score = Math.round(weighted * 100);

  // ── Chip selection ────────────────────────────────────────────────────────
  // Build candidate chips in strongest-signal-first order. Filter to positive
  // signals, then pad to exactly 4.
  const candidates: Array<{ chip: string; rank: number }> = [];
  if (naicsScore > 0) {
    candidates.push({ chip: 'NAICS match', rank: 1 });
  }
  if (keywordScore > 0.5) {
    candidates.push({ chip: 'Strong keyword match', rank: 2 });
  } else if (keywordScore > 0) {
    candidates.push({ chip: 'Capacity OK', rank: 3 });
  }
  if (geoScore === 1 && opp.geo) {
    candidates.push({ chip: `Geo match: ${opp.geo}`, rank: 4 });
  } else if (geoScore === 0.5 && opp.geo) {
    candidates.push({ chip: `Geo overlap: ${opp.geo}`, rank: 5 });
  }
  if (dollarScore === 1) {
    candidates.push({ chip: 'In award band', rank: 6 });
  } else if (dollarScore === 0.5) {
    candidates.push({ chip: 'Near award band', rank: 7 });
  }
  if (pastScore === 1 && pastMatch) {
    candidates.push({ chip: 'Prior funder match', rank: 8 });
  }

  // Always include a deadline chip if we have a real deadline.
  const dl = deadlineChip(opp.deadline);
  if (dl) candidates.push({ chip: dl, rank: 9 });

  // Sort by rank (strongest first) and take up to 4 unique chips.
  const seen = new Set<string>();
  const chips: string[] = [];
  for (const c of candidates.sort((a, b) => a.rank - b.rank)) {
    if (seen.has(c.chip)) continue;
    seen.add(c.chip);
    chips.push(c.chip);
    if (chips.length >= 4) break;
  }

  return {
    naics: { score: round2(naicsScore), matched: naicsMatched },
    keyword: { score: round2(keywordScore), matched: keywordMatched },
    geo: {
      score: round2(geoScore),
      opp_geo: opp.geo,
      org_geos: profile.geo_focus,
    },
    dollar_band: {
      score: round2(dollarScore),
      opp_amount: oppAmount,
      band_min: bandMin,
      band_max: bandMax,
    },
    past_funder: { score: round2(pastScore), matched: pastMatch },
    fit_score,
    chips: padChipsToFour(chips, opp),
    profile_pending: false,
  };
}
