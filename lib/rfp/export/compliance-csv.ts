import type { ComplianceMatrixArtifact } from "@/lib/rfp/compliance/types";
import { csvDocument } from "@/lib/rfp/export/csv";

export const COMPLIANCE_CSV_HEADER = [
  "ID",
  "Category",
  "Priority",
  "Requirement",
  "Source",
  "Source excerpt",
  "Response status",
  "Owner",
  "Phase",
  "Evidence",
] as const;

export function complianceCsvDocument(matrix: ComplianceMatrixArtifact): string {
  const rows = matrix.items.map((item) => [
    item.id,
    item.category,
    item.priority ?? "",
    item.requirement,
    item.source,
    item.source_excerpt ?? "",
    item.response_status,
    item.owner_label ?? item.owner_section,
    item.phase ?? "",
    item.evidence,
  ]);
  return csvDocument([[...COMPLIANCE_CSV_HEADER], ...rows]);
}
