export type CaptureRecommendation = "pursue" | "maybe" | "pass";
export type CaptureStatus = "pass" | "warn" | "fail";
export type RequirementStatus = "met" | "partial" | "missing" | "needs_review";
export type RequirementCategory =
  | "eligibility"
  | "deadline"
  | "format"
  | "attachment"
  | "narrative"
  | "budget"
  | "evaluation"
  | "other";

export interface BidNoBidArtifact {
  kind: "bid_no_bid_v1";
  recommendation: CaptureRecommendation;
  score: number;
  drivers: string[];
  risks: string[];
  next_actions: string[];
}

export interface ComplianceMatrixItem {
  id: string;
  category: RequirementCategory;
  requirement: string;
  source: string;
  response_status: RequirementStatus;
  owner_section: string;
  evidence: string;
}

export interface ComplianceMatrixArtifact {
  kind: "compliance_matrix_v1";
  overall_status: CaptureStatus;
  missing_count: number;
  needs_review_count: number;
  items: ComplianceMatrixItem[];
}

export interface PacketChecklistItem {
  id: string;
  label: string;
  status: RequirementStatus;
  notes: string;
}

export interface PacketChecklistArtifact {
  kind: "packet_checklist_v1";
  overall_status: CaptureStatus;
  due_date: string | null;
  submission_url: string | null;
  items: PacketChecklistItem[];
}

export interface CaptureReadinessResult {
  bid_no_bid: BidNoBidArtifact;
  compliance_matrix: ComplianceMatrixArtifact;
  packet_checklist: PacketChecklistArtifact;
}

export const CAPTURE_CHECK_TYPES = [
  "bid_no_bid_v1",
  "compliance_matrix_v1",
  "packet_checklist_v1",
] as const;

export type CaptureCheckType = (typeof CAPTURE_CHECK_TYPES)[number];
