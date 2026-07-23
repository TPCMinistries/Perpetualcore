export type AgentRunStatus = "planned" | "running" | "review_ready" | "failed";
export type AgentRunReviewStatus = "pending" | "approved" | "needs_revision" | "rejected";

export interface AgentRunSummary {
  id: string;
  goal: string;
  planTitle: string;
  status: AgentRunStatus;
  humanReviewStatus: AgentRunReviewStatus;
  intendedUse: string;
  specialistCount: number;
  evidenceCount: number;
  safetyFlagCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialistFinding {
  claim: string;
  evidenceQuotes: string[];
  confidence: number;
  caveat: string;
}

export interface SpecialistReport {
  specialist: string;
  summary: string;
  findings: SpecialistFinding[];
  limitations: string[];
  safetyFlags: string[];
}

export interface AgentRunDetail extends AgentRunSummary {
  context: Record<string, unknown>;
  objective: string;
  reviewerFocus: string[];
  synthesis: {
    executiveSummary: string;
    agreements: Array<{ claim: string; specialists: string[]; evidenceQuotes: string[]; confidence: number }>;
    disagreements: Array<{ topic: string; positions: string[]; reviewerQuestion: string }>;
    strengths: string[];
    growthOpportunities: string[];
    commitments: Array<{ statement: string; ownerLabel: string | null; dueDate: string | null; evidenceQuote: string }>;
    nextActions: Array<{ action: string; ownerRole: string; rationale: string }>;
    limitations: string[];
    safetyFlags: string[];
  } | null;
  specialistReports: SpecialistReport[];
  failedSpecialists: string[];
  humanReviewNote: string | null;
  reviewedAt: string | null;
}
