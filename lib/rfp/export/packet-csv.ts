import type { PacketChecklistArtifact } from "@/lib/rfp/compliance/types";
import { csvDocument } from "@/lib/rfp/export/csv";

export const PACKET_CSV_HEADER = [
  "ID",
  "Packet item",
  "Status",
  "Notes",
  "Due date",
  "Deadline timezone",
  "Submission portal",
  "Submission method",
  "Submission URL",
  "Required forms",
  "Q&A deadlines",
] as const;

export function packetCsvDocument(checklist: PacketChecklistArtifact): string {
  const rows = checklist.items.map((item) => [
    item.id,
    item.label,
    item.status,
    item.notes,
    checklist.due_date,
    checklist.deadline_timezone ?? "",
    checklist.submission_portal ?? "",
    checklist.submission_method ?? "",
    checklist.submission_url,
    (checklist.forms ?? []).join("; "),
    (checklist.question_deadlines ?? []).join("; "),
  ]);
  return csvDocument([[...PACKET_CSV_HEADER], ...rows]);
}
