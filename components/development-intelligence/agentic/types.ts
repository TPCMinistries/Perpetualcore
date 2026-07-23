export interface AgentSpecialist {
  id: string;
  name: string;
  purpose: string;
  selected: boolean;
}

export interface AgentPlan {
  id?: string;
  goal: string;
  approach: string;
  specialists: AgentSpecialist[];
  rubric: string[];
  exclusions: string[];
  evidenceRequirements: string[];
  reviewRequired: boolean;
}

export interface AgentTraceStep {
  id: string;
  specialist: string;
  status: "queued" | "running" | "completed" | "limited";
  summary: string;
  evidenceCount: number;
}

export interface AgentSynthesis {
  summary: string;
  findings: Array<{ title: string; detail: string; evidence: string[] }>;
  limitations: string[];
  reviewStatus: string;
}

export interface EnterpriseFinding {
  id: string;
  title: string;
  detail: string;
  evidence: string[];
  confidence?: number;
}

export interface EnterpriseAnswer {
  answer: string;
  coverage: { reports: number; conversations: number; period?: string };
  findings: EnterpriseFinding[];
  limitations: string[];
  reviewStatus: string;
}

export interface DevelopmentPlaybook {
  id: string;
  name: string;
  purpose: string;
  version: number;
  status: "draft" | "active" | "archived";
  goalTemplate: string;
  specialists: string[];
  rubric: string[];
  exclusions: string[];
  evidenceRequirements: string[];
  updatedAt: string;
}
