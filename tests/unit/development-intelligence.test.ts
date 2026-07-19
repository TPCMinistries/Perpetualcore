import { describe, expect, it } from "vitest";
import {
  analysisRequestSchema,
  developmentAnalysisOutputSchema,
} from "@/lib/development-intelligence/schemas";
import { getRubric } from "@/lib/development-intelligence/rubrics";
import { buildDevelopmentAnalysisPrompt } from "@/lib/development-intelligence/prompt";
import { validateGroundedAnalysis } from "@/lib/development-intelligence/analyzer";

describe("Development Intelligence safety contract", () => {
  it("requires explicit consent and rejects unexpected fields", () => {
    const base = {
      title: "Practice interview",
      lens: "interview_coaching",
      transcript:
        "Interviewer: Tell me about a time you helped a team. Candidate: I organized our schedule and followed up with each person until the work was complete.",
      sourceType: "transcript_paste",
      participantLabels: ["Interviewer", "Candidate"],
    };

    expect(
      analysisRequestSchema.safeParse({ ...base, consentConfirmed: false }).success
    ).toBe(false);
    expect(
      analysisRequestSchema.safeParse({
        ...base,
        consentConfirmed: true,
        automatedHiringDecision: true,
      }).success
    ).toBe(false);
  });

  it("accepts evidence-linked observations and bounded confidence", () => {
    const parsed = developmentAnalysisOutputSchema.parse({
      summary: "The candidate gave one concrete teamwork example.",
      strengths: ["Used a specific example."],
      growthAreas: ["Explain the outcome more clearly."],
      observations: [
        {
          criterionKey: "specific_evidence",
          criterionLabel: "Specific evidence",
          evidenceLevel: "demonstrated",
          observation: "The response describes a concrete scheduling action.",
          evidenceQuote: "I organized our schedule",
          speakerLabel: "Candidate",
          startMs: null,
          endMs: null,
          confidence: 0.87,
          developmentalAction: "Add the measurable result of the scheduling change.",
        },
      ],
      commitments: [],
      limitations: ["Only one answer was provided."],
      safetyFlags: [],
    });

    expect(parsed.observations[0].confidence).toBe(0.87);
  });

  it("places prohibited inference boundaries in every analysis prompt", () => {
    const request = analysisRequestSchema.parse({
      title: "Leadership meeting",
      lens: "leadership_coaching",
      transcript:
        "Leader: Our priority is enrollment. Alex owns the revised outreach list by Friday. Alex: I will send it by noon Friday and flag any missing contacts.",
      sourceType: "transcript_paste",
      consentConfirmed: true,
      participantLabels: ["Leader", "Alex"],
    });
    const prompt = buildDevelopmentAnalysisPrompt(
      request,
      getRubric(request.lens)
    );

    expect(prompt).toContain("Never infer honesty, integrity, deception");
    expect(prompt).toContain("Never recommend hire, reject");
    expect(prompt).toContain("Every observation must include");
    expect(prompt).toContain("relative dates");
  });

  it("rejects unresolved relative commitment dates", () => {
    const result = developmentAnalysisOutputSchema.safeParse({
      summary: "A concrete follow-up was assigned.",
      strengths: [],
      growthAreas: [],
      observations: [
        {
          criterionKey: "commitment_clarity",
          criterionLabel: "Commitment clarity",
          evidenceLevel: "demonstrated",
          observation: "A follow-up action was assigned.",
          evidenceQuote: "send it by noon Friday",
          speakerLabel: "Alex",
          startMs: null,
          endMs: null,
          confidence: 0.9,
          developmentalAction: "Confirm the calendar date in writing.",
        },
      ],
      commitments: [
        {
          statement: "Send the outreach list.",
          ownerLabel: "Alex",
          dueDate: "Friday",
          evidenceQuote: "send it by noon Friday",
        },
      ],
      limitations: ["The calendar date was not stated."],
      safetyFlags: [],
    });

    expect(result.success).toBe(false);
  });

  it("keeps interview rubrics developmental rather than decisional", () => {
    const rubric = getRubric("interview_coaching");
    expect(rubric.purpose).toContain("without making a hiring recommendation");
    expect(rubric.criteria.map((criterion) => criterion.key)).toEqual([
      "answer_relevance",
      "specific_evidence",
      "role_and_action",
      "outcome_reflection",
      "professional_clarity",
    ]);
  });

  it("rejects fabricated quotes and unknown rubric criteria", () => {
    const request = analysisRequestSchema.parse({
      title: "Leadership meeting",
      lens: "leadership_coaching",
      transcript:
        "Leader: Our priority is enrollment. Alex owns the revised outreach list by Friday. Alex: I will send it by noon Friday and flag any missing contacts.",
      sourceType: "transcript_paste",
      consentConfirmed: true,
      participantLabels: ["Leader", "Alex"],
    });
    const base = developmentAnalysisOutputSchema.parse({
      summary: "One action was assigned.",
      strengths: [],
      growthAreas: [],
      observations: [
        {
          criterionKey: "direction",
          criterionLabel: "Direction",
          evidenceLevel: "demonstrated",
          observation: "The leader named a priority.",
          evidenceQuote: "Our priority is enrollment",
          speakerLabel: "Leader",
          startMs: null,
          endMs: null,
          confidence: 0.9,
          developmentalAction: "Add a measurable outcome.",
        },
      ],
      commitments: [],
      limitations: ["This is a short excerpt."],
      safetyFlags: [],
    });

    expect(() => validateGroundedAnalysis(request, base)).not.toThrow();
    expect(() =>
      validateGroundedAnalysis(request, {
        ...base,
        observations: [
          { ...base.observations[0], evidenceQuote: "fabricated quotation" },
        ],
      })
    ).toThrow("ungrounded evidence quote");
    expect(() =>
      validateGroundedAnalysis(request, {
        ...base,
        observations: [
          { ...base.observations[0], criterionKey: "integrity_score" },
        ],
      })
    ).toThrow("unknown rubric criterion");
  });
});
