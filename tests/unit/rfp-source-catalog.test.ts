import { describe, expect, it } from "vitest";

import {
  RFP_ALLOWED_OPPORTUNITY_SOURCES,
  RFP_SOURCE_CATALOG_BY_SOURCE,
  sourceKeyToOpportunitySource,
} from "@/lib/rfp/source-catalog";

describe("RFP source catalog", () => {
  it("has catalog entries for every allowed opportunity source", () => {
    const missingSources = RFP_ALLOWED_OPPORTUNITY_SOURCES.filter(
      (source) => !RFP_SOURCE_CATALOG_BY_SOURCE.has(source),
    );

    expect(missingSources).toEqual([]);
  });

  it("does not collapse duplicate catalog entries by source key", () => {
    expect(RFP_SOURCE_CATALOG_BY_SOURCE.size).toBeGreaterThanOrEqual(
      RFP_ALLOWED_OPPORTUNITY_SOURCES.length,
    );
  });

  it("maps registry source keys to opportunity source enum values", () => {
    expect(sourceKeyToOpportunitySource("sbir_gov")).toBe("sbir");

    for (const source of RFP_ALLOWED_OPPORTUNITY_SOURCES) {
      expect(sourceKeyToOpportunitySource(source)).toBe(source);
    }
  });

  it("rejects unknown opportunity sources", () => {
    expect(() => sourceKeyToOpportunitySource("unknown_source")).toThrow(
      "Unsupported opportunity source: unknown_source",
    );
  });
});
