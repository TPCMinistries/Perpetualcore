import { describe, it, expect } from "vitest";
import { mapSubmissionToProfileJson, type ProfileSubmission } from "./profile-builder";

/**
 * Unit tests for mapSubmissionToProfileJson — the pure mapper from the
 * research agent's submit_profile tool_use input to the rfp_capture_profiles
 * profile_json shape that loadLatestProfile() (lib/rfp/scoring/recompute.ts)
 * reads back out.
 */

function baseSubmission(overrides: Partial<ProfileSubmission> = {}): ProfileSubmission {
  return {
    identified: true,
    website: "https://example.org",
    mission: "Serve young adults with workforce training.",
    programs: ["CNA training"],
    populations_served: ["young adults"],
    capacity_keywords: ["workforce", "training"],
    geo_focus: ["US"],
    typical_award_min: 25_000,
    typical_award_max: 500_000,
    past_funders: ["Example Foundation"],
    capacity_narrative: "Example Org has run workforce training for a decade.",
    sources: ["https://example.org/about"],
    ...overrides,
  };
}

describe("mapSubmissionToProfileJson", () => {
  it("clamps capacity_keywords to 18, lowercases them, and dedupes", () => {
    const many = Array.from({ length: 25 }, (_, i) => `Keyword${i}Unique`);
    const profile = mapSubmissionToProfileJson(baseSubmission({ capacity_keywords: many }));

    const keywords = profile.capacity_keywords as string[];
    expect(keywords.length).toBeLessThanOrEqual(18);
    for (const keyword of keywords) {
      expect(keyword).toBe(keyword.toLowerCase());
    }
  });

  it("drops tokens under 3 characters", () => {
    const profile = mapSubmissionToProfileJson(
      baseSubmission({ capacity_keywords: ["ai", "a", "education", "of"] })
    );
    const keywords = profile.capacity_keywords as string[];
    expect(keywords).toContain("education");
    expect(keywords).not.toContain("ai");
    expect(keywords).not.toContain("a");
    expect(keywords).not.toContain("of");
  });

  it("typical_award_band is null when min >= max", () => {
    const profile = mapSubmissionToProfileJson(
      baseSubmission({ typical_award_min: 100_000, typical_award_max: 100_000 })
    );
    expect(profile.typical_award_band).toBeNull();
  });

  it("typical_award_band is null when either bound is negative or zero", () => {
    const negative = mapSubmissionToProfileJson(
      baseSubmission({ typical_award_min: -5_000, typical_award_max: 100_000 })
    );
    expect(negative.typical_award_band).toBeNull();

    const zero = mapSubmissionToProfileJson(
      baseSubmission({ typical_award_min: 0, typical_award_max: 100_000 })
    );
    expect(zero.typical_award_band).toBeNull();
  });

  it("typical_award_band is populated when min < max and both positive", () => {
    const profile = mapSubmissionToProfileJson(
      baseSubmission({ typical_award_min: 25_000, typical_award_max: 500_000 })
    );
    expect(profile.typical_award_band).toEqual({ min: 25_000, max: 500_000 });
  });

  it("geo_focus defaults to [\"US\"] when empty", () => {
    const profile = mapSubmissionToProfileJson(baseSubmission({ geo_focus: [] }));
    expect(profile.geo_focus).toEqual(["US"]);
  });

  it("geo_focus passes through as uppercase short codes and always includes US", () => {
    const profile = mapSubmissionToProfileJson(
      baseSubmission({ geo_focus: ["nyc", "ny"] })
    );
    expect(profile.geo_focus).toEqual(["NYC", "NY", "US"]);
  });

  it("past_funders is deduped (case-insensitive) and capped at 12", () => {
    const dupes = [
      "Example Foundation",
      "example foundation",
      "Another Funder",
      ...Array.from({ length: 12 }, (_, i) => `Funder ${i}`),
    ];
    const profile = mapSubmissionToProfileJson(baseSubmission({ past_funders: dupes }));
    const funders = profile.past_funders as string[];

    expect(funders.length).toBeLessThanOrEqual(12);
    expect(funders.filter((f) => f.toLowerCase() === "example foundation")).toHaveLength(1);
  });

  it("drops keyword stopwords like 'and'", () => {
    const profile = mapSubmissionToProfileJson(
      baseSubmission({ capacity_keywords: ["and", "the", "workforce", "research and development"] })
    );
    const keywords = profile.capacity_keywords as string[];
    expect(keywords).toContain("workforce");
    expect(keywords).toContain("research");
    expect(keywords).toContain("development");
    expect(keywords).not.toContain("and");
    expect(keywords).not.toContain("the");
  });

  it("maps long-form geo names to scorer codes and drops unmappable regions", () => {
    const profile = mapSubmissionToProfileJson(
      baseSubmission({
        geo_focus: ["UNITED STATES", "New York City", "GLOBAL SOUTH", "AFRICA", "New Jersey"],
      })
    );
    const geo = profile.geo_focus as string[];
    expect(geo).toContain("US");
    expect(geo).toContain("NYC");
    expect(geo).toContain("NJ");
    expect(geo).not.toContain("GLOBAL SOUTH");
    expect(geo).not.toContain("AFRICA");
    expect(geo).not.toContain("UNITED STATES");
  });

  it("filters generic funder descriptions, keeping proper names", () => {
    const profile = mapSubmissionToProfileJson(
      baseSubmission({
        past_funders: [
          "Government agencies (mentioned as workforce cohort funders)",
          "Universities",
          "Robin Hood Foundation",
          "NYC DYCD",
        ],
      })
    );
    const funders = profile.past_funders as string[];
    expect(funders).toEqual(["Robin Hood Foundation", "NYC DYCD"]);
  });

  it("merges prev profile as a floor: keywords union, band/geo/funders fallback", () => {
    const prev = {
      capacity_keywords: ["cna", "nursing", "workforce"],
      geo_focus: ["NYC", "NY", "US"],
      typical_award_band: { min: 25_000, max: 500_000 },
      past_funders: ["NYC DYCD"],
    };
    const profile = mapSubmissionToProfileJson(
      baseSubmission({
        capacity_keywords: ["healthcare", "training"],
        geo_focus: [],
        typical_award_min: null,
        typical_award_max: null,
        past_funders: ["Various donors"],
      }),
      prev
    );
    const keywords = profile.capacity_keywords as string[];
    expect(keywords).toContain("healthcare");
    expect(keywords).toContain("cna");
    expect(keywords).toContain("nursing");
    expect(keywords.indexOf("healthcare")).toBeLessThan(keywords.indexOf("cna"));
    expect(profile.geo_focus).toEqual(["NYC", "NY", "US"]);
    expect(profile.typical_award_band).toEqual({ min: 25_000, max: 500_000 });
    expect(profile.past_funders).toEqual(["NYC DYCD"]);
  });

  it("carries capacity_narrative, rich flag, generated_at, and sources through", () => {
    const profile = mapSubmissionToProfileJson(baseSubmission());
    expect(profile.capacity_narrative).toBe(
      "Example Org has run workforce training for a decade."
    );
    expect(profile.rich).toBe(true);
    expect(typeof profile.generated_at).toBe("string");
    expect(profile.sources).toEqual(["https://example.org/about"]);
  });
});
