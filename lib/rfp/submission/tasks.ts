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
import type { PackageExtraction } from "@/lib/rfp/package/extract";

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
  | "enrichment"
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

export interface SubmissionTaskEnrichment {
  eligibility: string[];
  required_documents: string[];
  submission_method: string | null;
  submission_url: string | null;
  contact: string | null;
  matching_funds: string | null;
  funding_method: string | null;
  award_range: string | null;
  timeline: string[];
  risks: string[];
  missing_fields: string[];
  quality_score: number;
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

export function parsePackageRequirements(value: unknown): PackageExtraction | null {
  if (!isObject(value) || value.kind !== "package_requirements_v1") return null;
  if (!Array.isArray(value.requirements)) return null;
  return value as unknown as PackageExtraction;
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

function slugPart(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
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
  enrichment?: SubmissionTaskEnrichment | null;
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
      owner_label: item.owner_label || item.owner_section || "Compliance reviewer",
      priority: item.priority === "low"
        ? "medium"
        : item.priority ?? (item.response_status === "missing" ? "critical" : "high"),
      due_date: params.dueDate,
      evidence: item.source_excerpt || item.evidence || item.source,
      created_by: params.userId,
    });
  }

  const packageExtraction = parsePackageRequirements(
    checksByType.get("package_requirements_v1"),
  );
  for (const item of packageExtraction?.requirements ?? []) {
    tasks.push({
      proposal_id: params.proposalId,
      source_type: "compliance",
      source_id: `package:${item.id}`,
      title: `Package ${item.category} requirement`,
      detail: item.requirement,
      owner_label:
        item.owner_hint ??
        (item.category === "budget"
          ? "Finance / Operations"
          : item.category === "submission"
            ? "Submission lead"
            : item.category === "attachment"
              ? "Operations"
              : "Proposal lead"),
      priority: item.priority ?? "high",
      due_date: params.dueDate,
      evidence: item.source_excerpt ?? item.source ?? "",
      created_by: params.userId,
    });
  }

  for (const [index, form] of (packageExtraction?.forms ?? []).entries()) {
    tasks.push({
      proposal_id: params.proposalId,
      source_type: "compliance",
      source_id: `package-form:${index}:${slugPart(form)}`,
      title: `Complete required form: ${shortText(form, 72)}`,
      detail: "Confirm the current template is complete, signed if required, and included in the final submission packet.",
      owner_label: /budget|424a/i.test(form) ? "Finance / Operations" : "Operations",
      priority: /sf-424|assurance|certification|budget/i.test(form) ? "critical" : "high",
      due_date: params.dueDate,
      evidence: packageExtraction?.submission_url ?? packageExtraction?.source_url ?? "",
      created_by: params.userId,
    });
  }

  for (const [index, deadline] of (packageExtraction?.question_deadlines ?? []).entries()) {
    tasks.push({
      proposal_id: params.proposalId,
      source_type: "compliance",
      source_id: `package-question-deadline:${index}:${slugPart(deadline)}`,
      title: "Track Q&A or clarification deadline",
      detail: deadline,
      owner_label: "Proposal lead",
      priority: "high",
      due_date: params.dueDate,
      evidence: packageExtraction?.submission_url ?? packageExtraction?.source_url ?? "",
      created_by: params.userId,
    });
  }

  if (packageExtraction?.submission_method || packageExtraction?.submission_portal) {
    tasks.push({
      proposal_id: params.proposalId,
      source_type: "compliance",
      source_id: "package-submission-method",
      title: "Verify submission account, portal, and upload rules",
      detail: shortText(
        [
          packageExtraction.submission_portal
            ? `Portal: ${packageExtraction.submission_portal}.`
            : null,
          packageExtraction.submission_method,
          packageExtraction.deadline_timezone
            ? `Deadline timezone: ${packageExtraction.deadline_timezone}.`
            : null,
        ]
          .filter(Boolean)
          .join(" "),
      ),
      owner_label: "Submission lead",
      priority: "critical",
      due_date: params.dueDate,
      evidence: packageExtraction.submission_url ?? packageExtraction.source_url ?? "",
      created_by: params.userId,
    });
  }

  const packet = parsePacketChecklist(checksByType.get("packet_checklist_v1"));
  if (packet) {
    for (const item of packet.items) {
      if (item.status === "met") continue;
      tasks.push({
        proposal_id: params.proposalId,
        source_type: "packet",
        source_id: item.id,
        title: `Prepare ${item.label}`,
        detail: item.notes,
        owner_label: /submission|portal|source/i.test(item.id)
          ? "Submission lead"
          : /budget|match|award|financial/i.test(`${item.id} ${item.label}`)
            ? "Finance / Operations"
            : "Operations",
        priority: item.status === "missing" || /submission-method|required-form|match-rule/i.test(item.id)
          ? "critical"
          : "medium",
        due_date: packet.due_date ?? params.dueDate,
        evidence: packet.submission_url ?? "",
        created_by: params.userId,
      });
    }
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

  const enrichment = params.enrichment;
  if (enrichment) {
    enrichment.eligibility.slice(0, 6).forEach((item, index) => {
      tasks.push({
        proposal_id: params.proposalId,
        source_type: "enrichment",
        source_id: `eligibility:${index}:${slugPart(item)}`,
        title: "Verify eligibility",
        detail: item,
        owner_label: "Proposal lead",
        priority: "critical",
        due_date: params.dueDate,
        evidence: "",
        created_by: params.userId,
      });
    });

    enrichment.required_documents.slice(0, 10).forEach((item, index) => {
      tasks.push({
        proposal_id: params.proposalId,
        source_type: "enrichment",
        source_id: `required-doc:${index}:${slugPart(item)}`,
        title: `Prepare ${shortText(item, 72)}`,
        detail: "Add this document to the submission packet or mark it waived with evidence.",
        owner_label: /budget|financial|audit|insurance/i.test(item)
          ? "Finance / Operations"
          : "Operations",
        priority: /sam|uei|501|certification|audit|budget/i.test(item)
          ? "critical"
          : "high",
        due_date: params.dueDate,
        evidence: "",
        created_by: params.userId,
      });
    });

    if (enrichment.submission_method || enrichment.submission_url) {
      tasks.push({
        proposal_id: params.proposalId,
        source_type: "enrichment",
        source_id: "submission-path",
        title: "Confirm submission portal and method",
        detail: shortText(
          [
            enrichment.submission_method,
            enrichment.submission_url ? `Source: ${enrichment.submission_url}` : null,
          ]
            .filter(Boolean)
            .join(" "),
        ),
        owner_label: "Submission lead",
        priority: "critical",
        due_date: params.dueDate,
        evidence: enrichment.submission_url ?? "",
        created_by: params.userId,
      });
    }

    if (enrichment.contact) {
      tasks.push({
        proposal_id: params.proposalId,
        source_type: "enrichment",
        source_id: "funder-contact",
        title: "Confirm funder contact or Q&A channel",
        detail: shortText(enrichment.contact),
        owner_label: "Proposal lead",
        priority: "medium",
        due_date: params.dueDate,
        evidence: "",
        created_by: params.userId,
      });
    }

    enrichment.risks.slice(0, 6).forEach((risk, index) => {
      tasks.push({
        proposal_id: params.proposalId,
        source_type: "enrichment",
        source_id: `risk:${index}:${slugPart(risk)}`,
        title: "Resolve capture risk",
        detail: risk,
        owner_label: "Proposal lead",
        priority: /deadline|eligibility|submission/i.test(risk)
          ? "critical"
          : "high",
        due_date: params.dueDate,
        evidence: "",
        created_by: params.userId,
      });
    });

    enrichment.missing_fields.slice(0, 6).forEach((field, index) => {
      tasks.push({
        proposal_id: params.proposalId,
        source_type: "enrichment",
        source_id: `missing-field:${index}:${slugPart(field)}`,
        title: `Fill capture gap: ${field}`,
        detail: "The source payload did not provide this field clearly. Open the source package and record the answer before final review.",
        owner_label: "Proposal lead",
        priority: "high",
        due_date: params.dueDate,
        evidence: "",
        created_by: params.userId,
      });
    });
  }

  return tasks;
}
