import { describe, it, expect } from "vitest";
import { checkDisqualifiers, type DisqualifierFlag } from "./disqualifiers";

/**
 * Unit tests for checkDisqualifiers (SCORE-04 — Phase 18-02).
 *
 * Verifies:
 *   - Ineligible opportunity (SBA set-aside vs nonprofit) produces a HARD flag (SCORE-04 fixture)
 *   - Sparse/null data produces ZERO flags (no false positives — Pitfall 2)
 *   - dual org type is not auto-disqualified by SBA set-aside
 */

describe("checkDisqualifiers", () => {
  // ── Set-aside code checks ────────────────────────────────────────────────

  it("Case 1 (SCORE-04 fixture): SBA set-aside + nonprofit → one HARD eligibility flag on set_aside_code", () => {
    const flags = checkDisqualifiers(
      { set_aside_code: "SBA", eligibility_types: null, naics_codes: null },
      { type: "nonprofit", naics: null }
    );
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject<Partial<DisqualifierFlag>>({
      dimension: "eligibility",
      severity: "hard",
      field: "set_aside_code",
    });
  });

  it("Case 2: SDVOSB set-aside + nonprofit → one hard flag", () => {
    const flags = checkDisqualifiers(
      { set_aside_code: "SDVOSB", eligibility_types: null, naics_codes: null },
      { type: "nonprofit", naics: null }
    );
    expect(flags).toHaveLength(1);
    expect(flags[0].severity).toBe("hard");
    expect(flags[0].dimension).toBe("eligibility");
  });

  it("Case 3: 8A set-aside + nonprofit → one hard flag", () => {
    const flags = checkDisqualifiers(
      { set_aside_code: "8A", eligibility_types: null, naics_codes: null },
      { type: "nonprofit", naics: null }
    );
    expect(flags).toHaveLength(1);
    expect(flags[0].severity).toBe("hard");
    expect(flags[0].dimension).toBe("eligibility");
  });

  // ── eligibility_types checks ─────────────────────────────────────────────

  it("Case 4: eligibility_types ['Small businesses'] + nonprofit → one hard flag", () => {
    const flags = checkDisqualifiers(
      { set_aside_code: null, eligibility_types: ["Small businesses"], naics_codes: null },
      { type: "nonprofit", naics: null }
    );
    expect(flags).toHaveLength(1);
    expect(flags[0].severity).toBe("hard");
    expect(flags[0].dimension).toBe("eligibility");
  });

  it("Case 5: eligibility_types ['Nonprofit organizations'] + forprofit → one hard flag", () => {
    const flags = checkDisqualifiers(
      { set_aside_code: null, eligibility_types: ["Nonprofit organizations"], naics_codes: null },
      { type: "forprofit", naics: null }
    );
    expect(flags).toHaveLength(1);
    expect(flags[0].severity).toBe("hard");
    expect(flags[0].dimension).toBe("eligibility");
  });

  // ── NAICS checks ─────────────────────────────────────────────────────────

  it("Case 6: opp has naics_codes + org.naics is empty → one SOFT flag", () => {
    const flags = checkDisqualifiers(
      { set_aside_code: null, eligibility_types: null, naics_codes: ["541611"] },
      { type: "nonprofit", naics: [] }
    );
    expect(flags).toHaveLength(1);
    expect(flags[0].severity).toBe("soft");
    expect(flags[0].dimension).toBe("eligibility");
  });

  it("Case 7: opp naics_codes with no overlap to org naics → one soft flag", () => {
    const flags = checkDisqualifiers(
      { set_aside_code: null, eligibility_types: null, naics_codes: ["541611"] },
      { type: "nonprofit", naics: ["621111"] }
    );
    expect(flags).toHaveLength(1);
    expect(flags[0].severity).toBe("soft");
  });

  it("Case 8: naics_codes overlap with org.naics → zero flags", () => {
    const flags = checkDisqualifiers(
      { set_aside_code: null, eligibility_types: null, naics_codes: ["541611"] },
      { type: "nonprofit", naics: ["541611"] }
    );
    expect(flags).toHaveLength(0);
  });

  // ── Sparse data — no false positives (Pitfall 2) ─────────────────────────

  it("Case 9 (sparse data): all-null opp fields → zero flags (no false positives)", () => {
    const flags = checkDisqualifiers(
      { set_aside_code: null, eligibility_types: null, naics_codes: null },
      { type: "nonprofit", naics: null }
    );
    expect(flags).toHaveLength(0);
  });

  it("Case 9b: empty array fields → zero flags", () => {
    const flags = checkDisqualifiers(
      { set_aside_code: null, eligibility_types: [], naics_codes: [] },
      { type: "nonprofit", naics: [] }
    );
    expect(flags).toHaveLength(0);
  });

  // ── dual org type ────────────────────────────────────────────────────────

  it("Case 10: dual org + SBA set-aside → zero flags (dual not auto-disqualified)", () => {
    const flags = checkDisqualifiers(
      { set_aside_code: "SBA", eligibility_types: null, naics_codes: null },
      { type: "dual", naics: null }
    );
    expect(flags).toHaveLength(0);
  });
});
