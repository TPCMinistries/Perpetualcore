export type SubjectType =
  | "adult_employee"
  | "adult_candidate"
  | "adult_participant"
  | "leader";

export type ConsentState = "active" | "withdrawn" | "expired" | "not_verified";

export interface DevelopmentSubjectSummary {
  id: string;
  displayLabel: string;
  subjectType: SubjectType;
  status: "active" | "archived";
  consentState: ConsentState;
  linkedSessionCount: number;
  observationCount: number;
  openCommitmentCount: number;
  lastObservedAt: string | null;
  createdAt: string;
}

export interface ProfileSession {
  id: string;
  analysisId?: string | null;
  title: string;
  lens: string;
  participantLabel: string;
  occurredAt: string;
  reviewStatus: string;
  evidenceCount?: number;
}

export interface ProfileObservation {
  id: string;
  analysisId: string;
  sessionTitle?: string;
  metricKey: string;
  metricLabel: string;
  evidenceLevel: "demonstrated" | "emerging" | "not_observed";
  observation?: string;
  evidenceQuote?: string;
  developmentalAction?: string;
  observedAt: string;
}

export interface ProfileCommitment {
  id: string;
  analysisId: string;
  statement: string;
  ownerLabel: string | null;
  dueDate: string | null;
  evidenceQuote: string;
  status: "open" | "completed" | "changed" | "cancelled" | "unverified";
  createdAt: string;
}

export interface ConsentEvent {
  id: string | number;
  eventType: "granted" | "refused" | "withdrawn" | "expired" | "verified";
  scope: string;
  policyVersion: string;
  occurredAt: string;
}

export interface AvailableProfileSession {
  id: string;
  title: string;
  lens: string;
  occurredAt: string;
  participantLabels?: string[];
}

export interface DevelopmentSubjectDetail extends DevelopmentSubjectSummary {
  sessions: ProfileSession[];
  observations: ProfileObservation[];
  commitments: ProfileCommitment[];
  consentEvents: ConsentEvent[];
  availableSessions?: AvailableProfileSession[];
}

export interface ApiErrorPayload {
  error?: string;
}

