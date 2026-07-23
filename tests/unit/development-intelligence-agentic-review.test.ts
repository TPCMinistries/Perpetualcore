import { describe, expect, it } from "vitest";
import { humanReviewSchema } from "@/lib/development-intelligence/schemas";
import {
  assertMinimizedAgentResult,
  deriveAgentRunIndicators,
  mapAgentRunSummary,
} from "@/lib/development-intelligence/agentic/store";

describe("agentic run review operations", () => {
  it("requires reviewer feedback for revision or rejection", () => {
    expect(
      humanReviewSchema.safeParse({ status: "needs_revision" }).success
    ).toBe(false);
    expect(
      humanReviewSchema.safeParse({
        status: "rejected",
        note: "The synthesis overstates the cited evidence.",
      }).success
    ).toBe(true);
    expect(humanReviewSchema.safeParse({ status: "approved" }).success).toBe(
      true
    );
  });

  it("maps exact database summary counts into the API contract", () => {
    expect(
      mapAgentRunSummary({
        total: 12,
        planned: 2,
        running: 1,
        review_ready: 6,
        failed: 3,
        pending: 5,
        approved: 4,
        needs_revision: 2,
        rejected: 1,
      })
    ).toEqual({
      total: 12,
      planned: 2,
      running: 1,
      reviewReady: 6,
      failed: 3,
      pending: 5,
      approved: 4,
      needsRevision: 2,
      rejected: 1,
    });
  });

  it("rejects raw content keys anywhere in a persisted run envelope", () => {
    expect(() =>
      assertMinimizedAgentResult({
        synthesis: { executiveSummary: "A grounded summary." },
        specialistReports: [{ findings: [{ sourceText: "raw content" }] }],
      })
    ).toThrow("cannot persist sourceText");
    expect(() =>
      assertMinimizedAgentResult({
        synthesis: { executiveSummary: "A grounded summary." },
        specialistReports: [],
        failedSpecialists: [],
      })
    ).not.toThrow();
  });

  it("derives bounded queue indicators without exposing synthesis content", () => {
    expect(
      deriveAgentRunIndicators({
        synthesis: {
          agreements: [
            { evidenceQuotes: ["We will deliver Friday.", "Owner is Alex."] },
            { evidenceQuotes: ["Owner is Alex."] },
          ],
          safetyFlags: ["insufficient_evidence"],
        },
        specialistReports: [
          { safetyFlags: ["insufficient_evidence", "consent_scope_unclear"] },
        ],
      })
    ).toEqual({ evidenceCount: 2, safetyFlagCount: 2 });
  });
});
