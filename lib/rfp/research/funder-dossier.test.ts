import { describe, it, expect } from "vitest";
import { matchFunderProfile, type FunderProfileCandidate } from "./funder-dossier";

/**
 * Unit tests for matchFunderProfile — the pure fuzzy matcher used to reconcile
 * an opportunity's free-text funder name against known rfp_funder_profiles
 * rows (which may spell the same funder differently: "Inc", "The", "Foundation"
 * appear inconsistently across IRS BMF names, scraper output, and foundation
 * self-descriptions).
 */

function candidates(...names: string[]): FunderProfileCandidate[] {
  return names.map((name, i) => ({ id: `id-${i}`, name, ein: null }));
}

describe("matchFunderProfile", () => {
  it("Case 1: exact match after stopword-stripping ('Altman Foundation' vs 'The Altman Foundation')", () => {
    const result = matchFunderProfile(
      "Altman Foundation",
      candidates("The Altman Foundation", "Some Other Fund")
    );
    expect(result).toBe("id-0");
  });

  it("Case 2: containment match ('Tiger Foundation' vs 'Tiger Foundation Inc')", () => {
    const result = matchFunderProfile(
      "Tiger Foundation",
      candidates("Tiger Foundation Inc", "Unrelated Trust")
    );
    expect(result).toBe("id-0");
  });

  it("Case 3: negative — no match ('Robin Hood Foundation' vs 'Pinkerton Foundation')", () => {
    const result = matchFunderProfile(
      "Robin Hood Foundation",
      candidates("Pinkerton Foundation")
    );
    expect(result).toBeNull();
  });

  it("Case 4: stopword-only funder name never matches anything ('The Foundation')", () => {
    const result = matchFunderProfile(
      "The Foundation",
      candidates("The Foundation", "Altman Foundation", "Tiger Foundation Inc")
    );
    expect(result).toBeNull();
  });

  it("returns null against an empty candidate list", () => {
    expect(matchFunderProfile("Altman Foundation", [])).toBeNull();
  });

  it("does not match on a single shared generic token below the 2-token containment threshold", () => {
    // "Fund" alone is a stopword, so both reduce to zero significant tokens
    // once "Community" isn't shared — this should stay a clean miss.
    const result = matchFunderProfile(
      "Community Fund",
      candidates("Regional Fund")
    );
    expect(result).toBeNull();
  });
});
