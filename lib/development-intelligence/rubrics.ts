import type { DevelopmentLens } from "./schemas";

export interface RubricCriterion {
  key: string;
  label: string;
  description: string;
}
export interface BuiltInRubric {
  key: string;
  name: string;
  version: number;
  lens: DevelopmentLens;
  purpose: string;
  criteria: RubricCriterion[];
}

export const BUILT_IN_RUBRICS: Record<DevelopmentLens, BuiltInRubric> = {
  enterprise_meeting: {
    key: "enterprise-meeting-effectiveness",
    name: "Enterprise Meeting Effectiveness",
    version: 1,
    lens: "enterprise_meeting",
    purpose:
      "Improve decision quality, participation, ownership, and follow-through.",
    criteria: [
      {
        key: "decision_clarity",
        label: "Decision clarity",
        description: "Decisions are explicit, bounded, and understood.",
      },
      {
        key: "ownership",
        label: "Ownership",
        description: "Actions have named owners and concrete next steps.",
      },
      {
        key: "participation",
        label: "Participation",
        description: "Relevant voices have meaningful opportunities to contribute.",
      },
      {
        key: "listening",
        label: "Listening and response",
        description: "Questions are answered and contributions are acknowledged.",
      },
      {
        key: "focus",
        label: "Focus",
        description: "Discussion advances the stated purpose without avoidable drift.",
      },
    ],
  },
  interview_coaching: {
    key: "workforce-interview-coaching",
    name: "Workforce Interview Coaching",
    version: 1,
    lens: "interview_coaching",
    purpose:
      "Help a candidate communicate job-relevant experience clearly without making a hiring recommendation.",
    criteria: [
      {
        key: "answer_relevance",
        label: "Answer relevance",
        description: "The response directly addresses the question asked.",
      },
      {
        key: "specific_evidence",
        label: "Specific evidence",
        description: "The response uses concrete examples rather than general claims.",
      },
      {
        key: "role_and_action",
        label: "Role and action",
        description: "The speaker explains their own responsibility and actions.",
      },
      {
        key: "outcome_reflection",
        label: "Outcome and reflection",
        description: "The response explains results and lessons learned.",
      },
      {
        key: "professional_clarity",
        label: "Professional clarity",
        description: "The response is understandable, structured, and appropriately concise.",
      },
    ],
  },
  interviewer_quality: {
    key: "structured-interviewer-quality",
    name: "Structured Interviewer Quality",
    version: 1,
    lens: "interviewer_quality",
    purpose:
      "Improve consistency, candidate opportunity, and evidence quality in structured interviews.",
    criteria: [
      {
        key: "question_consistency",
        label: "Question consistency",
        description: "Required questions are asked in a comparable way.",
      },
      {
        key: "candidate_opportunity",
        label: "Candidate opportunity",
        description: "The candidate receives adequate time and relevant follow-up prompts.",
      },
      {
        key: "job_relevance",
        label: "Job relevance",
        description: "Questions and follow-ups stay tied to published job competencies.",
      },
      {
        key: "neutral_prompting",
        label: "Neutral prompting",
        description: "Prompts do not lead, pressure, or introduce unsupported assumptions.",
      },
      {
        key: "evidence_capture",
        label: "Evidence capture",
        description: "Notes and conclusions are traceable to what was actually said.",
      },
    ],
  },
  leadership_coaching: {
    key: "leadership-communication",
    name: "Leadership Communication",
    version: 1,
    lens: "leadership_coaching",
    purpose:
      "Strengthen direction, listening, alignment, accountability, and communication impact.",
    criteria: [
      {
        key: "purpose",
        label: "Purpose and framing",
        description: "The purpose and desired outcome are made clear.",
      },
      {
        key: "direction",
        label: "Direction",
        description: "Instructions identify priorities, owners, and expected results.",
      },
      {
        key: "listening",
        label: "Listening",
        description: "Questions and concerns receive responsive treatment.",
      },
      {
        key: "alignment",
        label: "Alignment",
        description: "The conversation checks shared understanding before moving on.",
      },
      {
        key: "development",
        label: "Development",
        description: "Feedback is specific, actionable, and oriented toward improvement.",
      },
    ],
  },
};

export function getRubric(lens: DevelopmentLens): BuiltInRubric {
  return BUILT_IN_RUBRICS[lens];
}
