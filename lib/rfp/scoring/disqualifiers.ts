/**
 * Phase 18-02 — SCORE-04: Disqualifier flag detection.
 *
 * Pure function — no DB, no AI, no async.
 *
 * Guards every check behind a presence test: null/empty fields produce
 * ZERO flags, never false positives. This is critical because
 * `set_aside_code` and `eligibility_types` are Phase 14 columns that are
 * NOT backfilled for pre-Phase-15 rows (see Pitfall 2 in 18-RESEARCH.md).
 *
 * Only `rfp_orgs.type` is always available and is the primary eligibility
 * check for set-aside and eligibility_type mismatches.
 */

import { ELIGIBILITY_RULES } from "@/lib/rfp/enrichment/generate";

// ── Public types ─────────────────────────────────────────────────────────────

export interface DisqualifierFlag {
  dimension: "eligibility" | "track_record" | "capacity";
  severity: "hard" | "soft";
  label: string;
  field: string;
}

// ── Set-aside codes that restrict to small businesses ────────────────────────

const SMALL_BUSINESS_SET_ASIDES = new Set(["SBA", "SDVOSB", "8A", "WOSB", "HUBZone", "EDWOSB"]);

// ── Helper: match eligibility_types string against ELIGIBILITY_RULES patterns ─

/** Return the first matching ELIGIBILITY_RULES label for a given text string. */
function matchEligibilityLabel(text: string): string | null {
  for (const rule of ELIGIBILITY_RULES) {
    if (rule.pattern.test(text)) return rule.label;
  }
  return null;
}

/** Returns true if the text matches a "nonprofit organizations" pattern. */
function isNonprofitEligibilityText(text: string): boolean {
  return /\b(nonprofit|non-profit|501\(c\)\(3\))\b/i.test(text);
}

/** Returns true if the text matches a "small businesses" pattern. */
function isSmallBusinessEligibilityText(text: string): boolean {
  return /\bsmall businesses?\b/i.test(text);
}

// ── Main function ─────────────────────────────────────────────────────────────

export function checkDisqualifiers(
  opp: {
    set_aside_code: string | null;
    eligibility_types: string[] | null;
    naics_codes: string[] | null;
  },
  org: { type: "nonprofit" | "forprofit" | "dual"; naics: string[] | null }
): DisqualifierFlag[] {
  const flags: DisqualifierFlag[] = [];

  // ── Check 1: Small-business set-aside vs nonprofit ────────────────────────
  // Guard: only check when set_aside_code is non-null/non-empty.
  // dual orgs are NOT auto-disqualified (they may have a for-profit subsidiary).
  if (
    opp.set_aside_code &&
    opp.set_aside_code.trim().length > 0 &&
    org.type === "nonprofit" &&
    SMALL_BUSINESS_SET_ASIDES.has(opp.set_aside_code.trim())
  ) {
    flags.push({
      dimension: "eligibility",
      severity: "hard",
      label: `Set-aside restricts to small businesses; nonprofit orgs are not eligible (${opp.set_aside_code})`,
      field: "set_aside_code",
    });
  }

  // ── Check 2: eligibility_types mismatch ───────────────────────────────────
  // Guard: only check when eligibility_types is non-null and non-empty.
  if (opp.eligibility_types && opp.eligibility_types.length > 0) {
    const hasSmallBizOnly = opp.eligibility_types.some(isSmallBusinessEligibilityText);
    const hasNonprofitOnly = opp.eligibility_types.some(isNonprofitEligibilityText);

    // Small-business-only opp vs nonprofit org
    if (hasSmallBizOnly && org.type === "nonprofit") {
      flags.push({
        dimension: "eligibility",
        severity: "hard",
        label: "Eligibility restricted to small businesses; nonprofit orgs are not eligible",
        field: "eligibility_types",
      });
    }

    // Nonprofit-only opp vs for-profit org
    if (hasNonprofitOnly && org.type === "forprofit") {
      flags.push({
        dimension: "eligibility",
        severity: "hard",
        label: "Eligibility restricted to nonprofit organizations; for-profit orgs are not eligible",
        field: "eligibility_types",
      });
    }
  }

  // ── Check 3: NAICS code mismatch ─────────────────────────────────────────
  // Guard: only check when opp.naics_codes is non-null and non-empty.
  if (opp.naics_codes && opp.naics_codes.length > 0) {
    const orgNaics = org.naics ?? [];

    if (orgNaics.length === 0) {
      // Org has no NAICS codes on file at all
      flags.push({
        dimension: "eligibility",
        severity: "soft",
        label: "Opportunity requires NAICS codes but none on file for this org",
        field: "naics_codes",
      });
    } else {
      // Check for overlap
      const oppSet = new Set(opp.naics_codes.map((c) => c.trim()));
      const hasOverlap = orgNaics.some((c) => oppSet.has(c.trim()));

      if (!hasOverlap) {
        flags.push({
          dimension: "eligibility",
          severity: "soft",
          label: "No NAICS overlap — may need eligibility confirmation",
          field: "naics_codes",
        });
      }
    }
  }

  return flags;
}

// Re-export matchEligibilityLabel for use in dimensions.ts
export { matchEligibilityLabel };
