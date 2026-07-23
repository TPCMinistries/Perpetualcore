import { describe, expect, it } from "vitest";
import {
  findRawContentPaths,
  isEnterpriseEligibleAgentRun,
  summarizeAgentRunsForOrganization,
  validateHumanReviewTransition,
  validateRunStatusTransition,
  type AgentRunLifecycleRecord,
} from "@/lib/development-intelligence/agentic/operations";

const ORG_A = "org-a";
const ORG_B = "org-b";

function run(
  overrides: Partial<AgentRunLifecycleRecord> = {}
): AgentRunLifecycleRecord {
  return {
    id: "run-1",
    organizationId: ORG_A,
    status: "review_ready",
    humanReviewStatus: "pending",
    rawContentStored: false,
    synthesis: {
      executiveSummary: "Observable follow-through was supported by approved evidence.",
      findings: [{ claim: "An owner was named", evidenceQuotes: ["I will own it"] }],
      limitations: ["One conversation"],
    },
    reviewedBy: null,
    reviewedAt: null,
    ...overrides,
  };
}

describe("agent run lifecycle operations", () => {
  it.each([
    ["planned", "running"],
    ["planned", "failed"],
    ["running", "review_ready"],
    ["running", "failed"],
  ] as const)("allows %s -> %s", (current, next) => {
    expect(validateRunStatusTransition(current, next)).toEqual({
      allowed: true,
      reason: null,
    });
  });

  it.each([
    ["planned", "review_ready"],
    ["running", "planned"],
    ["review_ready", "running"],
    ["review_ready", "failed"],
    ["failed", "running"],
  ] as const)("blocks %s -> %s", (current, next) => {
    expect(validateRunStatusTransition(current, next)).toMatchObject({
      allowed: false,
    });
  });

  it.each(["approved", "needs_revision", "rejected"] as const)(
    "allows a pending review-ready run to become %s",
    (outcome) => {
      expect(
        validateHumanReviewTransition(
          run(),
          outcome,
          "reviewer-1",
          "2026-07-22T20:00:00.000Z"
        )
      ).toEqual({ allowed: true, reason: null });
    }
  );

  it("blocks review before synthesis is review-ready and blocks repeated review", () => {
    expect(
      validateHumanReviewTransition(
        run({ status: "running" }),
        "approved",
        "reviewer-1",
        "2026-07-22T20:00:00.000Z"
      )
    ).toMatchObject({ allowed: false, reason: "Only a review-ready run can be reviewed" });
    expect(
      validateHumanReviewTransition(
        run({ humanReviewStatus: "approved" }),
        "rejected",
        "reviewer-1",
        "2026-07-22T20:00:00.000Z"
      )
    ).toMatchObject({ allowed: false, reason: "A completed human review is immutable" });
  });

  it("requires an identified reviewer, valid timestamp, and minimized synthesis", () => {
    expect(
      validateHumanReviewTransition(run(), "approved", "", "not-a-date")
    ).toMatchObject({ allowed: false });
    expect(
      validateHumanReviewTransition(
        run({ synthesis: {} }),
        "approved",
        "reviewer-1",
        "2026-07-22T20:00:00.000Z"
      )
    ).toMatchObject({ allowed: false, reason: "Review requires a minimized synthesis with no raw content" });
  });
});

describe("raw-content and enterprise boundaries", () => {
  it("finds prohibited raw fields recursively across naming styles", () => {
    expect(
      findRawContentPaths({
        synthesis: {
          raw_transcript: "source",
          reports: [{ sourceText: "source" }, { nested: { audio: "bytes" } }],
        },
      })
    ).toEqual([
      "synthesis.raw_transcript",
      "synthesis.reports[0].sourceText",
      "synthesis.reports[1].nested.audio",
    ]);
  });

  it("does not mistake bounded evidence excerpts for raw source storage", () => {
    expect(
      findRawContentPaths({
        evidenceQuote: "I will own it",
        specialistReports: [{ evidenceQuotes: ["I will own it"] }],
      })
    ).toEqual([]);
  });

  it("becomes enterprise eligible only after completed human approval", () => {
    const pending = run();
    expect(isEnterpriseEligibleAgentRun(pending, ORG_A)).toBe(false);
    const approved = run({
      humanReviewStatus: "approved",
      reviewedBy: "reviewer-1",
      reviewedAt: "2026-07-22T20:00:00.000Z",
    });
    expect(isEnterpriseEligibleAgentRun(approved, ORG_A)).toBe(true);
    expect(isEnterpriseEligibleAgentRun(approved, ORG_B)).toBe(false);
    expect(
      isEnterpriseEligibleAgentRun(
        { ...approved, synthesis: { rawTranscript: "must not pass" } },
        ORG_A
      )
    ).toBe(false);
  });

  it("returns tenant-safe count summaries without ids or synthesis content", () => {
    const summary = summarizeAgentRunsForOrganization(
      [
        run({ id: "a-pending" }),
        run({
          id: "a-approved",
          humanReviewStatus: "approved",
          reviewedBy: "reviewer-a",
          reviewedAt: "2026-07-22T20:00:00.000Z",
        }),
        run({
          id: "a-failed",
          status: "failed",
          synthesis: { nested: { video: "raw" } },
        }),
        run({
          id: "b-secret",
          organizationId: ORG_B,
          humanReviewStatus: "approved",
          reviewedBy: "reviewer-b",
          reviewedAt: "2026-07-22T20:00:00.000Z",
          synthesis: { executiveSummary: "Other tenant secret" },
        }),
      ],
      ORG_A
    );
    expect(summary).toEqual({
      total: 3,
      planned: 0,
      running: 0,
      reviewReady: 2,
      failed: 1,
      pendingReview: 2,
      approved: 1,
      needsRevision: 0,
      rejected: 0,
      enterpriseEligible: 1,
      rawContentViolations: 1,
    });
    expect(JSON.stringify(summary)).not.toContain("b-secret");
    expect(JSON.stringify(summary)).not.toContain("Other tenant secret");
  });
});
