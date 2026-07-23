import { describe, expect, it } from "vitest";
import type { AgenticPlan } from "@/lib/development-intelligence/agentic/contracts";
import {
  selectSpecialists,
  validateSpecialistReport,
} from "@/lib/development-intelligence/agentic/specialists";
import { validateSynthesisGrounding } from "@/lib/development-intelligence/agentic/orchestrator";
import {
  buildEnterpriseAggregate,
  prohibitedEnterpriseQuestionReason,
} from "@/lib/development-intelligence/agentic/enterprise";

function plan(specialists: AgenticPlan["recommendedSpecialists"]): AgenticPlan {
  return {
    planTitle: "Development review",
    objective: "Understand observable communication and follow-through patterns.",
    intendedUse: "development_coaching",
    recommendedSpecialists: specialists,
    rubric: [
      { key: "clarity", label: "Clarity", question: "Were ideas stated clearly?", evidenceRequirement: "Exact excerpts showing a clear explanation.", weight: 3 },
      { key: "follow_through", label: "Follow-through", question: "Were next steps made explicit?", evidenceRequirement: "Exact excerpts stating an action or decision.", weight: 3 },
      { key: "inquiry", label: "Inquiry", question: "Were useful questions asked?", evidenceRequirement: "Exact excerpts containing relevant questions.", weight: 2 },
    ],
    evidenceRequirements: ["Use exact excerpts from the transcript.", "State when evidence was not observed."],
    exclusions: ["Do not infer personality or internal state."],
    limitations: ["One conversation cannot establish a stable personal trait."],
    humanReview: { required: true, reviewerFocus: ["Check every claim against the cited excerpt."] },
    prohibitedActions: [
      "automated_hiring_decision",
      "automated_employment_action",
      "deception_or_integrity_scoring",
      "emotion_or_mental_state_inference",
      "protected_trait_inference",
      "diagnosis_or_disability_inference",
      "accent_or_cultural_fit_scoring",
      "autonomous_external_action",
    ],
  };
}

describe("agentic Development Intelligence guardrails", () => {
  it("deduplicates specialists and always includes the safety challenger", () => {
    expect(selectSpecialists(plan(["evidence_grounding", "development_coaching"]))).toEqual([
      "evidence_grounding",
      "development_coaching",
      "safety_challenge",
    ]);
    expect(
      selectSpecialists(
        plan([
          "evidence_grounding",
          "decisions_commitments",
          "development_coaching",
          "interaction_dynamics",
          "safety_challenge",
        ])
      )
    ).toHaveLength(5);
    expect(
      selectSpecialists(plan(["decisions_commitments", "development_coaching"]))
    ).toEqual([
      "evidence_grounding",
      "decisions_commitments",
      "development_coaching",
      "safety_challenge",
    ]);
  });

  it("rejects specialist and synthesis excerpts absent from the transcript", () => {
    const report = {
      specialist: "evidence_grounding" as const,
      summary: "A summary",
      findings: [{ claim: "Clear next step", evidenceQuotes: ["Invented quote"], confidence: 0.8, caveat: "Single example" }],
      commitments: [],
      limitations: ["Limited sample"],
      safetyFlags: [],
    };
    expect(() => validateSpecialistReport("We will call Friday.", "evidence_grounding", report)).toThrow("ungrounded");
    expect(() =>
      validateSynthesisGrounding("We will call Friday.", {
        executiveSummary: "Summary",
        agreements: [{ claim: "Claim", specialists: ["evidence_grounding"], evidenceQuotes: ["Invented quote"], confidence: 0.7 }],
        disagreements: [],
        strengths: [],
        growthOpportunities: [],
        commitments: [],
        nextActions: [],
        limitations: ["Limited sample"],
        safetyFlags: [],
        humanReviewRequired: true,
      })
    ).toThrow("ungrounded");
  });

  it("blocks person ranking and consequential employment questions", () => {
    expect(prohibitedEnterpriseQuestionReason("Who is our best employee to promote?")).toContain("does not provide");
    expect(prohibitedEnterpriseQuestionReason("Which development themes appear most often?" )).toBeNull();
  });

  it("builds aggregate coverage without quotes or participant identifiers", () => {
    const result = buildEnterpriseAggregate(
      [
        { id: "a1", lens: "leadership_coaching", occurredAt: "2026-07-20T10:00:00.000Z" },
        { id: "a2", lens: "leadership_coaching", occurredAt: "2026-07-21T10:00:00.000Z" },
      ],
      [
        { analysisId: "a1", criterionKey: "clarity", criterionLabel: "Clarity", evidenceLevel: "demonstrated", confidence: 0.8 },
        { analysisId: "a2", criterionKey: "clarity", criterionLabel: "Clarity", evidenceLevel: "emerging", confidence: 0.6 },
        { analysisId: "not-approved", criterionKey: "clarity", criterionLabel: "Clarity", evidenceLevel: "not_observed", confidence: 0.2 },
      ]
    );
    expect(result.aggregates[0]).toMatchObject({ approvedAnalyses: 2, observations: 2, demonstrated: 1, emerging: 1, averageConfidence: 0.7 });
    expect(result.coverage).toMatchObject({ approvedAnalyses: 2, observations: 2 });
    expect(JSON.stringify(result)).not.toContain("quote");
  });
});
