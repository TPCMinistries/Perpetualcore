import { describe, expect, it } from "vitest";
import {
  computeOpportunityActionability,
  matchesActionabilityFilter,
} from "@/lib/rfp/actionability";

describe("computeOpportunityActionability", () => {
  it("marks strong, structured opportunities as ready", () => {
    const result = computeOpportunityActionability({
      fitScore: 92,
      deadline: new Date(Date.now() + 21 * 86_400_000).toISOString(),
      needsReview: false,
      enrichment: {
        eligibility: ["Nonprofit organizations"],
        required_documents: ["Narrative", "Budget"],
        submission_method: "Apply through Grants.gov",
        submission_url: "https://example.test/apply",
        risks: [],
        missing_fields: [],
        quality_score: 88,
      },
    });

    expect(result.level).toBe("ready");
    expect(result.score).toBeGreaterThanOrEqual(78);
    expect(matchesActionabilityFilter(result, "ready")).toBe(true);
  });

  it("downgrades past-deadline or under-structured opportunities", () => {
    const result = computeOpportunityActionability({
      fitScore: 70,
      deadline: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      needsReview: true,
      enrichment: null,
    });

    expect(result.level).toBe("blocked");
    expect(result.blockers).toContain("Deadline appears to have passed");
    expect(matchesActionabilityFilter(result, "missing_info")).toBe(true);
  });
});
