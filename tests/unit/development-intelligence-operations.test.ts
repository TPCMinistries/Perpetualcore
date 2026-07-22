import { describe, expect, it } from "vitest";
import { buildDevelopmentOperationsSnapshot } from "@/lib/development-intelligence/operations";
import type { DevelopmentAnalysisRecord } from "@/lib/development-intelligence/store";

function analysis(
  id: string,
  reviewStatus: string,
  safetyFlags: string[] = []
): DevelopmentAnalysisRecord {
  return {
    id,
    session_id: `session-${id}`,
    title: `Report ${id}`,
    lens: "leadership_coaching",
    summary: "Summary",
    strengths: [],
    growth_areas: [],
    limitations: [],
    safety_flags: safetyFlags,
    status: "review_ready",
    human_review_status: reviewStatus,
    human_review_note: null,
    created_at: id === "one" ? "2026-07-21T10:00:00.000Z" : "2026-07-22T10:00:00.000Z",
    occurred_at: "2026-07-21T09:00:00.000Z",
  };
}

describe("Development Intelligence operations indicators", () => {
  it("prioritizes actionable safety review and calculates inspectable process measures", () => {
    const snapshot = buildDevelopmentOperationsSnapshot(
      [analysis("one", "pending", ["review scope"]), analysis("two", "approved")],
      [
        { analysisId: "one", confidence: 0.9, evidenceQuote: "Exact quote one" },
        { analysisId: "one", confidence: 0.5, evidenceQuote: "Exact quote two" },
        { analysisId: "two", confidence: 0.7, evidenceQuote: "" },
      ]
    );

    expect(snapshot.queue.map((item) => item.id)).toEqual(["one", "two"]);
    expect(snapshot.queue[0]).toMatchObject({
      actionable: true,
      evidenceCount: 2,
      averageConfidence: 0.7,
      confidenceBand: "moderate",
    });
    expect(snapshot.quality).toMatchObject({
      reportCount: 2,
      evidenceCount: 3,
      evidenceCoverageRate: 100,
      evidenceTraceabilityRate: 67,
      averageEvidencePerReport: 1.5,
      reviewCompletionRate: 50,
      guardrailFlaggedReports: 1,
      actionableReviewCount: 1,
    });
    expect(snapshot.quality.averageConfidence).toBeCloseTo(0.7);
    expect(snapshot.quality.confidenceDistribution.map((item) => item.key)).toEqual([
      "high",
      "moderate",
      "low",
    ]);
  });

  it("returns neutral zero indicators for an empty pilot", () => {
    const snapshot = buildDevelopmentOperationsSnapshot([], []);

    expect(snapshot.queue).toEqual([]);
    expect(snapshot.quality.reportCount).toBe(0);
    expect(snapshot.quality.averageConfidence).toBeNull();
    expect(snapshot.quality.reviewCompletionRate).toBe(0);
  });
});
