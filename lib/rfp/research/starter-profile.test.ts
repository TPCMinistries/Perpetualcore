import { describe, it, expect } from "vitest";
import { buildStarterProfileJson } from "./starter-profile";

/**
 * Unit tests for buildStarterProfileJson — fixes the dead-Discovery-feed bug
 * where org creation never wrote a rfp_capture_profiles row, so every org
 * scored 0 on every opportunity (scoreOpportunity's profile-pending path in
 * lib/rfp/scoring/score.ts).
 */

describe("buildStarterProfileJson", () => {
  it("Case 1: NYC nonprofit with 624310+611420 NAICS → workforce/training/education keywords, NYC geo, nonprofit band", () => {
    const profile = buildStarterProfileJson({
      name: "Example Community Workforce Center",
      type: "nonprofit",
      naics: ["624310", "611420"],
      capacity_summary:
        "We serve young adults in the Bronx and Brooklyn with healthcare credential training.",
    });

    const keywords = profile.capacity_keywords as string[];
    expect(keywords).toContain("workforce");
    expect(keywords).toContain("training");
    expect(keywords).toContain("education");

    expect(profile.geo_focus).toEqual(["NYC", "NY", "US"]);
    expect(profile.typical_award_band).toEqual({ min: 25_000, max: 750_000 });
    expect(profile.past_funders).toEqual([]);
    expect(profile.starter).toBe(true);
    expect(typeof profile.generated_at).toBe("string");
  });

  it("Case 2: empty capacity_summary + unknown NAICS → non-empty keywords from name, geo defaults to US, forprofit band", () => {
    const profile = buildStarterProfileJson({
      name: "Riverside Alliance Group",
      type: "forprofit",
      naics: ["999999"],
      capacity_summary: null,
    });

    const keywords = profile.capacity_keywords as string[];
    expect(keywords.length).toBeGreaterThan(0);
    expect(keywords).toEqual(
      expect.arrayContaining(["riverside", "alliance", "group"])
    );

    expect(profile.geo_focus).toEqual(["US"]);
    expect(profile.typical_award_band).toEqual({ min: 50_000, max: 2_000_000 });
  });

  it("Case 3: keyword list is capped at 18 and every keyword is lowercase", () => {
    const profile = buildStarterProfileJson({
      name: "Big Multi Word Nonprofit Organization For Community Health Workforce Training Advocacy Development",
      type: "nonprofit",
      naics: ["624310", "611420", "813319", "541611"],
      capacity_summary:
        "Extra long capacity summary with many many different unique words meant to overflow the eighteen word cap limit intentionally here today",
    });

    const keywords = profile.capacity_keywords as string[];
    expect(keywords.length).toBeLessThanOrEqual(18);
    for (const keyword of keywords) {
      expect(keyword).toBe(keyword.toLowerCase());
    }
  });
});
