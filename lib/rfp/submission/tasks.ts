import { SECTION_SPECS, SECTION_TYPES, type SectionType } from "@/lib/rfp/draft/sections";
import type {
  ComplianceMatrixArtifact,
  PacketChecklistArtifact,
} from "@/lib/rfp/compliance/types";
import {
  REVIEWER_FINDINGS_SECTION_TYPE,
  ReviewerResultSchema,
  type ReviewerResult,
} from "@/lib/rfp/review/rubric";

export type SubmissionTaskStatus =
  | "open"
  | "in_progress"
  | "blocked"
  | "resolved"
  | "waived";

export type SubmissionTaskPriority = "low" | "medium" | "high" | "critical";

export type SubmissionTaskSource =
  | "verify_marker"
  | "compliance"
  | "packet"
  | "reviewer"
  | "manual";

export interface SubmissionTaskRow {
  id: string;
  proposal_id: string;
  source_type: SubmissionTaskSource;
  source_id: string;
  title: string;
  detail: string;
  owner_label: string;
  status: SubmissionTaskStatus;
  priority: SubmissionTaskPriority;
  due_date: string | null;
  notes: string;
  evidence: string;
  created_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionTaskInsert {
  proposal_id: string;
  source_type: SubmissionTaskSource;
  source_id: string;
  title: string;
  detail: string;
  owner_label: string;
  priority: SubmissionTaskPriority;
  due_date: string | null;
  evidence: string;
  created_by: string | null;
}

interface SectionRow {
  id: string;
  section_type: string;
  content: string | null;
}

interface ComplianceCheckRow {
  check_type: string;
  details_json: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseComplianceMatrix(value: unknown): ComplianceMatrixArtifact | null {
  if (!isObject(value) || value.kind !== "compliance_matrix_v1") return null;
  if (!Array.isArray(value.items)) return null;
  return value as unknown as ComplianceMatrixArtifact;
}

export function parsePacketChecklist(value: unknown): PacketChecklistArtifact | null {
  if (!isObject(value) || value.kind !== "packet_checklist_v1") return null;
  if (!Array.isArray(value.items)) return null;
  return value as unknown as PacketChecklistArtifact;
}

export function parseReviewerResult(content: string | null): ReviewerResult | null {
  if (!content) return null;
  try {
    return ReviewerResultSchema.parse(JSON.parse(content));
  } catch {
    return null;
  }
}

function sectionLabel(sectionType: string): string {
  if (SECTION_TYPES.includes(sectionType as SectionType)) {
    return SECTION_SPECS[sectionType as SectionType].label;
  }
  return sectionType.replace(/_/g, " ");
}

function shortText(text: string, max = 220): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trim()}...`;
}

function extractVerifyMarkers(content: string): string[] {
  const markers: string[] = [];
  const re = /\[VERIFY:?\s*([^\]]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    markers.push(match[1]?.trim() || "Unspecified claim");
  }
  return markers;
}

export function buildSubmissionTasks(params: {
  proposalId: string;
  dueDate: string | null;
  userId: string | null;
  sections: SectionRow[];
  checks: ComplianceCheckRow[];
}): SubmissionTaskInsert[] {
  const tasks: SubmissionTaskInsert[] = [];
  const checksByType = new Map<string, unknown>();
  for (const check of params.checks) {
    if (!checksByType.has(check.check_type)) {
      checksByType.set(check.check_type, check.details_json);
    }
  }

  for (const section of params.sections) {
    if (!SECTION_TYPES.includes(section.section_type as SectionType)) continue;
    const markers = extractVerifyMarkers(section.content ?? "");
    markers.forEach((marker, index) => {
      tasks.push({
        proposal_id: params.proposalId,
        source_type: "verify_marker",
        source_id: `${section.id}:${index}`,
        title: `Resolve VERIFY marker in ${sectionLabel(section.section_type)}`,
        detail: marker,
        owner_label: "Writer",
        priority: "high",
        due_date: params.dueDate,
        evidence: "",
        created_by: params.userId,
      });
    });
  }

  const compliance = parseComplianceMatrix(checksByType.get("compliance_matrix_v1"));
  for (const item of compliance?.items ?? []) {
    if (item.response_status === "met") continue;
    tasks.push({
      proposal_id: params.proposalId,
      source_type: "compliance",
      source_id: item.id,
      title: `Close ${item.category} requirement`,
      detail: item.requirement,
      owner_label: item.owner_section || "Compliance reviewer",
      priority: item.response_status === "missing" ? "critical" : "high",
      due_date: params.dueDate,
      evidence: item.evidence || item.source,
      created_by: params.userId,
    });
  }

  const packet = parsePacketChecklist(checksByType.get("packet_checklist_v1"));
  for (const item of packet?.items ?? []) {
    if (item.status === "met") continue;
    tasks.push({
      proposal_id: params.proposalId,
      source_type: "packet",
      source_id: item.id,
      title: `Prepare ${item.label}`,
      detail: item.notes,
      owner_label: "Operations",
      priority: item.status === "missing" ? "critical" : "medium",
      due_date: packet.due_date ?? params.dueDate,
      evidence: packet.submission_url ?? "",
      created_by: params.userId,
    });
  }

  const reviewerSection = params.sections.find(
    (section) => section.section_type === REVIEWER_FINDINGS_SECTION_TYPE,
  );
  const review = parseReviewerResult(reviewerSection?.content ?? null);
  for (const [index, finding] of (review?.findings ?? []).entries()) {
    if (finding.severity !== "blocker" && finding.severity !== "high") continue;
    tasks.push({
      proposal_id: params.proposalId,
      source_type: "reviewer",
      source_id: `${finding.section_type}:${finding.category}:${index}`,
      title: `Fix reviewer ${finding.severity}: ${finding.category.replace(/_/g, " ")}`,
      detail: shortText(`${finding.finding} ${finding.suggestion}`),
      owner_label: finding.section_type === "global"
        ? "Proposal lead"
        : sectionLabel(finding.section_type),
      priority: finding.severity === "blocker" ? "critical" : "high",
      due_date: params.dueDate,
      evidence: finding.excerpt ?? "",
      created_by: params.userId,
    });
  }

  return tasks;
}
