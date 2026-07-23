import { describe, expect, it } from "vitest";
import {
  agenticPlanRequestSchema,
  agenticPlanSchema,
  type AgenticPlan,
} from "@/lib/development-intelligence/agentic/contracts";
import { validatePlannerPolicy } from "@/lib/development-intelligence/agentic/planner";

const prohibitedActions: AgenticPlan["prohibitedActions"] = [
  "automated_hiring_decision",
  "automated_employment_action",
  "deception_or_integrity_scoring",
  "emotion_or_mental_state_inference",
  "protected_trait_inference",
  "diagnosis_or_disability_inference",
  "accent_or_cultural_fit_scoring",
  "autonomous_external_action",
];

function validPlan(): AgenticPlan {
  return agenticPlanSchema.parse({
    planTitle: "Leadership follow-through review",
    objective: "Understand how clearly decisions and next steps were established.",
    intendedUse: "leadership_development",
    recommendedSpecialists: [
      "evidence_grounding",
      "decisions_commitments",
      "safety_challenge",
    ],
    rubric: [
      {
        key: "decision_clarity",
        label: "Decision clarity",
        question: "Was each decision stated in observable terms?",
        evidenceRequirement: "An exact excerpt that states the decision.",
        weight: 5,
      },
      {
        key: "ownership",
        label: "Ownership",
        question: "Was an owner named for each next step?",
        evidenceRequirement: "An exact excerpt linking an owner to an action.",
        weight: 4,
      },
      {
        key: "timing",
        label: "Timing",
        question: "Was timing made explicit for each commitment?",
        evidenceRequirement: "An exact excerpt with a date or explicit timing.",
        weight: 3,
      },
    ],
    evidenceRequirements: [
      "Every claim must cite an exact source excerpt.",
      "Missing evidence must be reported as not observed.",
    ],
    exclusions: ["Do not infer personality."],
    limitations: ["A single meeting cannot establish a stable trait."],
    humanReview: {
      required: true,
      reviewerFocus: ["Verify every claim against its cited excerpt."],
    },
    prohibitedActions,
  });
}

describe("agentic planner contracts", () => {
  it("accepts open-ended goals without accepting transcript content", () => {
    const result = agenticPlanRequestSchema.safeParse({
      goal: "Understand whether this leadership meeting ended with clear ownership.",
      context: { conversationType: "weekly operating review" },
      transcript: "This field is deliberately prohibited from planning.",
    });
    expect(result.success).toBe(false);
  });

  it("requires room for grounding and safety specialists", () => {
    const result = agenticPlanRequestSchema.safeParse({
      goal: "Build a developmental review of this conversation.",
      preferredSpecialists: [
        "decisions_commitments",
        "development_coaching",
        "interaction_dynamics",
        "evidence_grounding",
        "safety_challenge",
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a plan that drops an operator exclusion", () => {
    const request = agenticPlanRequestSchema.parse({
      goal: "Understand how clearly this meeting established accountability.",
      requestedExclusions: ["Do not compare participants."],
    });
    expect(() => validatePlannerPolicy(request, validPlan())).toThrow(
      "omitted a requested exclusion"
    );
  });
});
