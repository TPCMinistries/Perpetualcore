import { describe, expect, it } from "vitest";
import {
  analysisRequestSchema,
  developmentAnalysisOutputSchema,
  mediaIngestionRequestSchema,
} from "@/lib/development-intelligence/schemas";
import { getRubric } from "@/lib/development-intelligence/rubrics";
import { buildDevelopmentAnalysisPrompt } from "@/lib/development-intelligence/prompt";
import { validateGroundedAnalysis } from "@/lib/development-intelligence/analyzer";
import { asMediaAnalysisInput, buildTimedTranscript } from "@/lib/development-intelligence/media";
import { buildDevelopmentTrajectory } from "@/lib/development-intelligence/store";

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

  it("accepts only bounded supported media with explicit consent", () => {
    const base = {
      title: "Authorized interview practice",
      lens: "interview_coaching",
      consentConfirmed: true,
      participantLabels: [],
      fileName: "practice.webm",
      fileSize: 2_000_000,
      contentType: "audio/webm",
    };
    expect(mediaIngestionRequestSchema.safeParse(base).success).toBe(true);
    expect(
      mediaIngestionRequestSchema.safeParse({
        ...base,
        fileSize: 26 * 1024 * 1024,
      }).success
    ).toBe(false);
    expect(
      mediaIngestionRequestSchema.safeParse({
        ...base,
        contentType: "application/octet-stream",
      }).success
    ).toBe(false);
  });

  it("requires media evidence to match one diarized speaker segment exactly", () => {
    const segments = [
      {
        speakerLabel: "Speaker A",
        startMs: 1_200,
        endMs: 4_800,
        text: "Our priority is enrollment this quarter.",
      },
    ];
    const request = asMediaAnalysisInput({
      title: "Leadership meeting",
      lens: "leadership_coaching",
      occurredAt: "2026-07-19T12:00:00.000Z",
      transcript: buildTimedTranscript(segments),
      segments,
      participantLabels: ["Speaker A"],
    });
    const output = developmentAnalysisOutputSchema.parse({
      summary: "One priority was stated.",
      strengths: ["The priority was explicit."],
      growthAreas: [],
      observations: [
        {
          criterionKey: "direction",
          criterionLabel: "Direction",
          evidenceLevel: "demonstrated",
          observation: "A quarterly priority was named.",
          evidenceQuote: "Our priority is enrollment",
          speakerLabel: "Speaker A",
          startMs: 1_200,
          endMs: 4_800,
          confidence: 0.92,
          developmentalAction: "Connect the priority to a measurable target.",
        },
      ],
      commitments: [],
      limitations: ["Only one segment was supplied."],
      safetyFlags: [],
    });

    expect(() => validateGroundedAnalysis(request, output)).not.toThrow();
    expect(() =>
      validateGroundedAnalysis(request, {
        ...output,
        observations: [{ ...output.observations[0], startMs: 1_201 }],
      })
    ).toThrow("ungrounded media timestamps");
  });

  it("builds a self-baselined trajectory from repeated evidence", () => {
    const trajectory = buildDevelopmentTrajectory(
      [
        {
          id: "analysis-1",
          humanReviewStatus: "approved",
          title: "First leadership meeting",
          lens: "leadership_coaching",
          occurredAt: "2026-07-01T12:00:00.000Z",
        },
        {
          id: "analysis-2",
          humanReviewStatus: "pending",
          title: "Second leadership meeting",
          lens: "leadership_coaching",
          occurredAt: "2026-07-15T12:00:00.000Z",
        },
      ],
      [
        {
          analysisId: "analysis-1",
          criterionKey: "direction",
          criterionLabel: "Direction",
          evidenceLevel: "emerging",
          developmentalAction: "Name the outcome and owner.",
        },
        {
          analysisId: "analysis-2",
          criterionKey: "direction",
          criterionLabel: "Direction",
          evidenceLevel: "demonstrated",
          developmentalAction: "Add the due date to the stated outcome.",
        },
      ]
    );

    expect(trajectory.reportCount).toBe(2);
    expect(trajectory.approvedCount).toBe(1);
    expect(trajectory.metrics[0]).toMatchObject({
      label: "Direction",
      direction: "improving",
      currentLevel: "demonstrated",
      previousLevel: "emerging",
      observations: 2,
    });
    expect(trajectory.sessions[0].title).toBe("Second leadership meeting");
  });
});
