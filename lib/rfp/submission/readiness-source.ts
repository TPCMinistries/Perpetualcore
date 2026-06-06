import { createAdminClient } from "@/lib/supabase/server";
import { SECTION_TYPES, type SectionType } from "@/lib/rfp/draft/sections";
import {
  REVIEWER_FINDINGS_SECTION_TYPE,
  ReviewerResultSchema,
} from "@/lib/rfp/review/rubric";
import {
  buildSubmitReadinessGate,
  type SubmitReadinessGate,
} from "@/lib/rfp/submission/readiness-gate";
import type {
  ComplianceMatrixArtifact,
  PacketChecklistArtifact,
} from "@/lib/rfp/compliance/types";
import type { SubmissionTaskRow } from "@/lib/rfp/submission/tasks";

interface SectionRow {
  section_type: string;
  content: string | null;
}

interface ComplianceCheckRow {
  check_type: string;
  details_json: unknown;
}

interface ReadinessSourceResult {
  gate: SubmitReadinessGate;
  generatedAt: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseComplianceMatrix(value: unknown): ComplianceMatrixArtifact | null {
  if (!isObject(value) || value.kind !== "compliance_matrix_v1") return null;
  if (!Array.isArray(value.items)) return null;
  return value as unknown as ComplianceMatrixArtifact;
}

function parsePacketChecklist(value: unknown): PacketChecklistArtifact | null {
  if (!isObject(value) || value.kind !== "packet_checklist_v1") return null;
  if (!Array.isArray(value.items)) return null;
  return value as unknown as PacketChecklistArtifact;
}

function countVerifyMarkers(sections: SectionRow[]): number {
  return sections.reduce((total, section) => {
    const matches = section.content?.match(/\[VERIFY:?\s*[^\]]+\]/g) ?? [];
    return total + matches.length;
  }, 0);
}

export async function loadSubmitReadinessGate(
  proposalId: string,
): Promise<ReadinessSourceResult> {
  const admin = createAdminClient();
  const [sectionsRes, checksRes, tasksRes] = await Promise.all([
    admin
      .from("rfp_proposal_sections")
      .select("section_type, content")
      .eq("proposal_id", proposalId)
      .returns<SectionRow[]>(),
    admin
      .from("rfp_compliance_checks")
      .select("check_type, details_json")
      .eq("proposal_id", proposalId)
      .in("check_type", ["compliance_matrix_v1", "packet_checklist_v1"])
      .order("created_at", { ascending: false })
      .returns<ComplianceCheckRow[]>(),
    admin
      .from("rfp_submission_tasks")
      .select("status, priority, title, owner_label")
      .eq("proposal_id", proposalId)
      .returns<Pick<SubmissionTaskRow, "status" | "priority" | "title" | "owner_label">[]>(),
  ]);

  if (sectionsRes.error || checksRes.error || tasksRes.error) {
    const detail = (sectionsRes.error ?? checksRes.error ?? tasksRes.error)?.message.slice(
      0,
      200,
    );
    throw new Error(detail ?? "submit_gate_load_failed");
  }

  const checksByType = new Map<string, unknown>();
  for (const row of checksRes.data ?? []) {
    if (!checksByType.has(row.check_type)) {
      checksByType.set(row.check_type, row.details_json);
    }
  }

  const sections = sectionsRes.data ?? [];
  const canonicalSections = sections.filter((section) =>
    SECTION_TYPES.includes(section.section_type as SectionType),
  );
  const reviewerSection = sections.find(
    (section) => section.section_type === REVIEWER_FINDINGS_SECTION_TYPE,
  );
  let reviewerResult = null;
  if (reviewerSection?.content) {
    try {
      reviewerResult = ReviewerResultSchema.parse(JSON.parse(reviewerSection.content));
    } catch {
      reviewerResult = null;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    gate: buildSubmitReadinessGate({
      sectionCount: canonicalSections.length,
      verifyMarkerCount: countVerifyMarkers(canonicalSections),
      complianceMatrix: parseComplianceMatrix(checksByType.get("compliance_matrix_v1")),
      packetChecklist: parsePacketChecklist(checksByType.get("packet_checklist_v1")),
      reviewerResult,
      tasks: tasksRes.data ?? [],
    }),
  };
}
