import { describe, it, expect } from "vitest";
import { mapToDimensions, type ExplainedDimensions } from "./dimensions";
import type { ScoreBreakdown } from "./score";
import type { DisqualifierFlag } from "./disqualifiers";

/**
 * Unit tests for mapToDimensions (SCORE-03 — Phase 18-02).
 *
 * Verifies the 5 SCORE-03 labeled dimensions with:
 *   - All dimensions present, sub_score in 0-100 range, non-empty labels
 *   - Hard eligibility disqualifier clamps eligibility.sub_score to 0
 *   - vault evidence boosts mission_fit (never lowers)
 *   - Deterministic: same input → same output
 */

// ── Fixtures ──────────────────────────────────────────────────────────────────

const fullBreakdown: ScoreBreakdown = {
  naics: { score: 0.8, matched: ["541611"] },
  keyword: { score: 0.75, matched: ["workforce", "training"] },
  geo: { score: 1.0, opp_geo: "NY", org_geos: ["NY", "NYC"] },
  dollar_band: { score: 1.0, opp_amount: 150000, band_min: 50000, band_max: 200000 },
  past_funder: { score: 1.0, matched: "DOL ETA" },
  fit_score: 88,
  chips: ["NAICS match", "Strong keyword match", "Geo match: NY", "In award band"],
  profile_pending: false,
};

const zeroBreakdown: ScoreBreakdown = {
  naics: { score: 0, matched: [] },
  keyword: { score: 0, matched: [] },
  geo: { score: 0, opp_geo: null, org_geos: [] },
  dollar_band: { score: 0, opp_amount: null, band_min: null, band_max: null },
  past_funder: { score: 0, matched: null },
  fit_score: 0,
  chips: ["Profile pending", "Geo: unknown", "Other source", "Imported"],
  profile_pending: true,
};

const hardEligibilityFlag: DisqualifierFlag = {
  dimension: "eligibility",
  severity: "hard",
  label: "Set-aside restricts to small businesses; nonprofit orgs are not eligible (SBA)",
  field: "set_aside_code",
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("mapToDimensions", () => {
  // ── Case 1: full breakdown → all 5 dimensions present with valid sub_scores ──

  it("Case 1: full breakdown → all 5 dimensions present, each sub_score in 0-100, each with non-empty label", () => {
    const dims = mapToDimensions(fullBreakdown, 0, []);

    const keys: Array<keyof ExplainedDimensions> = [
      "mission_fit",
      "eligibility",
      "track_record",
      "capacity",
      "funder_relationship",
    ];

    for (const key of keys) {
      const dim = dims[key];
      expect(dim, `${key} should exist`).toBeDefined();
      expect(dim.sub_score, `${key}.sub_score should be a number`).toBeTypeOf("number");
      expect(dim.sub_score, `${key}.sub_score should be >= 0`).toBeGreaterThanOrEqual(0);
      expect(dim.sub_score, `${key}.sub_score should be <= 100`).toBeLessThanOrEqual(100);
      expect(dim.label, `${key}.label should be non-empty string`).toBeTypeOf("string");
      expect(dim.label.length, `${key}.label should be non-empty`).toBeGreaterThan(0);
    }
  });

  // ── Case 2: hard eligibility disqualifier → eligibility.sub_score === 0 ─────

  it("Case 2: hard eligibility disqualifier → eligibility.sub_score === 0 and label reflects disqualifier", () => {
    const dims = mapToDimensions(fullBreakdown, 0, [hardEligibilityFlag]);

    expect(dims.eligibility.sub_score).toBe(0);
    // Label should mention ineligibility
    expect(dims.eligibility.label.toLowerCase()).toMatch(/ineligible|disqualif|not eligible/i);
  });

  // ── Case 3: vaultHitCount > 0 boosts mission_fit, never lowers ──────────────

  it("Case 3: vaultHitCount > 0 gives mission_fit.sub_score >= zero-hit case", () => {
    const dimsNoVault = mapToDimensions(fullBreakdown, 0, []);
    const dimsWithVault = mapToDimensions(fullBreakdown, 3, []);

    expect(dimsWithVault.mission_fit.sub_score).toBeGreaterThanOrEqual(
      dimsNoVault.mission_fit.sub_score
    );
  });

  it("Case 3b: vaultHitCount > 0 on zero keyword score still does not drop below zero", () => {
    const dims = mapToDimensions(zeroBreakdown, 5, []);
    expect(dims.mission_fit.sub_score).toBeGreaterThanOrEqual(0);
    expect(dims.mission_fit.sub_score).toBeLessThanOrEqual(100);
  });

  // ── Case 4: deterministic — same input → same output ─────────────────────────

  it("Case 4: deterministic — same input produces identical output on two calls", () => {
    const dims1 = mapToDimensions(fullBreakdown, 2, [hardEligibilityFlag]);
    const dims2 = mapToDimensions(fullBreakdown, 2, [hardEligibilityFlag]);

    expect(dims1).toEqual(dims2);
  });

  it("Case 4b: no Date.now() / random — pure function produces stable sub_scores", () => {
    // Run 5 times and check all sub_scores are identical
    const runs = Array.from({ length: 5 }, () =>
      mapToDimensions(fullBreakdown, 1, [])
    );
    for (let i = 1; i < runs.length; i++) {
      expect(runs[i]).toEqual(runs[0]);
    }
  });
});
