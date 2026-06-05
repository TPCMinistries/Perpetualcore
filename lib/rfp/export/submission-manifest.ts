import type {
  BidNoBidArtifact,
  ComplianceMatrixArtifact,
  PacketChecklistArtifact,
} from "@/lib/rfp/compliance/types";
import type { SubmissionTaskRow } from "@/lib/rfp/submission/tasks";

export interface ManifestProposal {
  title: string;
  status: string;
  due_date: string | null;
}

export interface ManifestOpportunity {
  title: string | null;
  agency: string | null;
  url: string | null;
}

export interface ManifestSection {
  section_type: string;
  label: string;
  content: string | null;
}

export interface SubmissionManifestInput {
  proposal: ManifestProposal;
  opportunity: ManifestOpportunity | null;
  bidNoBid: BidNoBidArtifact | null;
  complianceMatrix: ComplianceMatrixArtifact | null;
  packetChecklist: PacketChecklistArtifact | null;
  sections: ManifestSection[];
  tasks: SubmissionTaskRow[];
}

export const SUBMISSION_MANIFEST_HEADER = [
  "Area",
  "ID",
  "Title",
  "Status",
  "Priority",
  "Owner",
  "Due date",
  "Detail",
  "Evidence / source",
  "Submission URL",
] as const;

function words(text: string | null | undefined): number {
  return (text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function shortText(text: string | null | undefined, max = 420): string {
  const normalized = (text ?? "").replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trim()}...`;
}

function openTaskStatus(status: SubmissionTaskRow["status"]): boolean {
  return status === "open" || status === "in_progress" || status === "blocked";
}

export function buildSubmissionManifestRows(
  input: SubmissionManifestInput,
): Array<Array<string | number | boolean | null | undefined>> {
  const packet = input.packetChecklist;
  const compliance = input.complianceMatrix;
  const openTasks = input.tasks.filter((task) => openTaskStatus(task.status));
  const criticalTasks = openTasks.filter((task) => task.priority === "critical");
  const missingCompliance = compliance?.missing_count ?? null;
  const packetGaps = packet
    ? packet.items.filter((item) => item.status !== "met").length
    : null;

  const rows: Array<Array<string | number | boolean | null | undefined>> = [
    [
      "Snapshot",
      "proposal",
      input.proposal.title,
      input.proposal.status,
      "",
      "",
      input.proposal.due_date,
      [
        input.opportunity?.title ? `Opportunity: ${input.opportunity.title}` : null,
        input.opportunity?.agency ? `Funder: ${input.opportunity.agency}` : null,
        input.bidNoBid
          ? `Bid/no-bid: ${input.bidNoBid.recommendation} (${input.bidNoBid.score}/100)`
          : "Bid/no-bid not generated",
        missingCompliance === null
          ? "Compliance not generated"
          : `${missingCompliance} missing compliance items`,
        packetGaps === null ? "Packet checklist not generated" : `${packetGaps} packet gaps`,
        `${openTasks.length} open tasks`,
        `${criticalTasks.length} critical open tasks`,
      ]
        .filter(Boolean)
        .join("; "),
      input.opportunity?.url ?? "",
      packet?.submission_url ?? input.opportunity?.url ?? "",
    ],
  ];

  if (packet) {
    rows.push([
      "Submission Path",
      "submission",
      packet.submission_portal ?? "Submission path",
      packet.overall_status,
      packet.overall_status === "fail" ? "critical" : "high",
      "Submission lead",
      packet.due_date,
      [
        packet.submission_method,
        packet.deadline_timezone ? `Timezone: ${packet.deadline_timezone}` : null,
        (packet.forms?.length ?? 0) > 0 ? `Forms: ${packet.forms?.join("; ")}` : null,
        (packet.question_deadlines?.length ?? 0) > 0
          ? `Q&A: ${packet.question_deadlines?.join("; ")}`
          : null,
      ]
        .filter(Boolean)
        .join("; "),
      packet.submission_url ?? "",
      packet.submission_url ?? "",
    ]);

    for (const item of packet.items) {
      rows.push([
        "Packet Checklist",
        item.id,
        item.label,
        item.status,
        item.status === "missing" ? "critical" : item.status === "needs_review" ? "high" : "medium",
        /submission|portal|source/i.test(item.id)
          ? "Submission lead"
          : /budget|match|award|financial/i.test(`${item.id} ${item.label}`)
            ? "Finance / Operations"
            : "Operations",
        packet.due_date,
        item.notes,
        packet.submission_url ?? "",
        packet.submission_url ?? "",
      ]);
    }
  }

  if (compliance) {
    for (const item of compliance.items) {
      rows.push([
        "Compliance Matrix",
        item.id,
        item.requirement,
        item.response_status,
        item.priority ?? (item.response_status === "missing" ? "critical" : "high"),
        item.owner_label ?? item.owner_section,
        input.proposal.due_date,
        item.evidence,
        item.source_excerpt ?? item.source,
        packet?.submission_url ?? input.opportunity?.url ?? "",
      ]);
    }
  }

  for (const task of input.tasks) {
    rows.push([
      "Workroom Task",
      task.source_id,
      task.title,
      task.status,
      task.priority,
      task.owner_label,
      task.due_date,
      task.detail,
      task.evidence,
      packet?.submission_url ?? input.opportunity?.url ?? "",
    ]);
  }

  for (const section of input.sections) {
    rows.push([
      "Draft Section",
      section.section_type,
      section.label,
      words(section.content) > 0 ? "drafted" : "missing",
      words(section.content) > 0 ? "medium" : "high",
      "Writer",
      input.proposal.due_date,
      `${words(section.content)} words`,
      shortText(section.content, 320),
      packet?.submission_url ?? input.opportunity?.url ?? "",
    ]);
  }

  return rows;
}
