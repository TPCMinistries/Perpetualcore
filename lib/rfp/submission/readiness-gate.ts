import type {
  ComplianceMatrixArtifact,
  PacketChecklistArtifact,
} from "@/lib/rfp/compliance/types";
import type { ReviewerResult } from "@/lib/rfp/review/rubric";
import type { SubmissionTaskRow } from "@/lib/rfp/submission/tasks";

export type SubmitGateStatus = "ready" | "not_ready" | "not_run";
export type SubmitGateSeverity = "blocker" | "review" | "complete";

export interface SubmitGateItem {
  key: string;
  label: string;
  severity: SubmitGateSeverity;
  detail: string;
  owner: string;
}

export interface SubmitReadinessGateInput {
  sectionCount: number;
  verifyMarkerCount: number;
  complianceMatrix: ComplianceMatrixArtifact | null;
  packetChecklist: PacketChecklistArtifact | null;
  reviewerResult: ReviewerResult | null;
  tasks: Pick<SubmissionTaskRow, "status" | "priority" | "title" | "owner_label">[];
}

export interface SubmitReadinessGate {
  status: SubmitGateStatus;
  score: number;
  label: string;
  summary: string;
  nextAction: string;
  blockers: SubmitGateItem[];
  reviews: SubmitGateItem[];
  completed: SubmitGateItem[];
  metrics: {
    blockers: number;
    reviews: number;
    completed: number;
    openTasks: number;
    criticalTasks: number;
    missingCompliance: number | null;
    missingPacketItems: number | null;
    reviewerBlockers: number | null;
  };
}

function reviewerBlockerCount(result: ReviewerResult | null): number | null {
  if (!result) return null;
  return result.findings.filter(
    (finding) => finding.severity === "blocker" || finding.severity === "high",
  ).length;
}

function openTasks(input: SubmitReadinessGateInput["tasks"]) {
  return input.filter((task) =>
    task.status === "open" || task.status === "in_progress" || task.status === "blocked",
  );
}

function packetMissingCount(packet: PacketChecklistArtifact | null): number | null {
  if (!packet) return null;
  return packet.items.filter((item) => item.status === "missing").length;
}

function packetReviewCount(packet: PacketChecklistArtifact | null): number {
  if (!packet) return 0;
  return packet.items.filter(
    (item) => item.status === "needs_review" || item.status === "partial",
  ).length;
}

function hasSubmissionPath(packet: PacketChecklistArtifact | null): boolean {
  if (!packet) return false;
  return Boolean(packet.submission_url || packet.submission_portal || packet.submission_method);
}

function pushItem(
  items: SubmitGateItem[],
  key: string,
  label: string,
  severity: SubmitGateSeverity,
  detail: string,
  owner: string,
) {
  items.push({ key, label, severity, detail, owner });
}

export function buildSubmitReadinessGate(
  input: SubmitReadinessGateInput,
): SubmitReadinessGate {
  const items: SubmitGateItem[] = [];
  const reviewerBlockers = reviewerBlockerCount(input.reviewerResult);
  const missingCompliance = input.complianceMatrix?.missing_count ?? null;
  const needsReviewCompliance = input.complianceMatrix?.needs_review_count ?? 0;
  const missingPacketItems = packetMissingCount(input.packetChecklist);
  const needsReviewPacketItems = packetReviewCount(input.packetChecklist);
  const activeTasks = openTasks(input.tasks);
  const criticalTasks = activeTasks.filter((task) => task.priority === "critical");
  const blockedTasks = activeTasks.filter((task) => task.status === "blocked");

  pushItem(
    items,
    "sections",
    "Draft sections",
    input.sectionCount >= 5 ? "complete" : "blocker",
    `${input.sectionCount}/5 canonical sections present.`,
    "Writer",
  );

  pushItem(
    items,
    "verify",
    "VERIFY markers",
    input.verifyMarkerCount === 0 ? "complete" : "blocker",
    input.verifyMarkerCount === 0
      ? "No VERIFY placeholders detected."
      : `${input.verifyMarkerCount} VERIFY placeholder${input.verifyMarkerCount === 1 ? "" : "s"} remain.`,
    "Writer",
  );

  pushItem(
    items,
    "compliance",
    "Compliance matrix",
    missingCompliance === null
      ? "blocker"
      : missingCompliance > 0
        ? "blocker"
        : needsReviewCompliance > 0
          ? "review"
          : "complete",
    missingCompliance === null
      ? "Capture readiness has not been run."
      : `${missingCompliance} missing, ${needsReviewCompliance} needs review.`,
    "Compliance reviewer",
  );

  pushItem(
    items,
    "reviewer",
    "Reviewer pass",
    reviewerBlockers === null
      ? "blocker"
      : reviewerBlockers > 0
        ? "blocker"
        : "complete",
    reviewerBlockers === null
      ? "Reviewer pass has not been run."
      : `${reviewerBlockers} blocker/high finding${reviewerBlockers === 1 ? "" : "s"}.`,
    "Reviewer",
  );

  pushItem(
    items,
    "packet",
    "Packet checklist",
    missingPacketItems === null
      ? "blocker"
      : missingPacketItems > 0
        ? "blocker"
        : needsReviewPacketItems > 0
          ? "review"
          : "complete",
    missingPacketItems === null
      ? "Packet checklist has not been generated."
      : `${missingPacketItems} missing, ${needsReviewPacketItems} needs review.`,
    "Operations",
  );

  pushItem(
    items,
    "submission_path",
    "Submission path",
    hasSubmissionPath(input.packetChecklist) ? "complete" : "blocker",
    hasSubmissionPath(input.packetChecklist)
      ? [
          input.packetChecklist?.submission_portal
            ? `Portal: ${input.packetChecklist.submission_portal}.`
            : null,
          input.packetChecklist?.deadline_timezone
            ? `Timezone: ${input.packetChecklist.deadline_timezone}.`
            : null,
          input.packetChecklist?.forms?.length
            ? `${input.packetChecklist.forms.length} form${input.packetChecklist.forms.length === 1 ? "" : "s"} extracted.`
            : null,
        ]
          .filter(Boolean)
          .join(" ")
      : "Submission portal, method, or URL is not confirmed.",
    "Submission lead",
  );

  pushItem(
    items,
    "tasks",
    "Workroom tasks",
    blockedTasks.length > 0 || criticalTasks.length > 0
      ? "blocker"
      : activeTasks.length > 0
        ? "review"
        : "complete",
    activeTasks.length > 0
      ? `${activeTasks.length} open task${activeTasks.length === 1 ? "" : "s"}; ${criticalTasks.length} critical.`
      : "No open workroom tasks.",
    criticalTasks[0]?.owner_label ?? blockedTasks[0]?.owner_label ?? "Proposal lead",
  );

  const blockers = items.filter((item) => item.severity === "blocker");
  const reviews = items.filter((item) => item.severity === "review");
  const completed = items.filter((item) => item.severity === "complete");
  const artifactsMissing = !input.complianceMatrix || !input.packetChecklist || !input.reviewerResult;
  const score = Math.max(
    0,
    Math.min(100, Math.round((completed.length / items.length) * 100 - blockers.length * 8)),
  );
  const status: SubmitGateStatus =
    blockers.length === 0 && reviews.length === 0
      ? "ready"
      : artifactsMissing
        ? "not_run"
        : "not_ready";
  const firstBlocker = blockers[0] ?? reviews[0] ?? null;

  return {
    status,
    score: status === "ready" ? 100 : score,
    label:
      status === "ready"
        ? "Ready to submit"
        : status === "not_run"
          ? "Readiness not complete"
          : "Not ready to submit",
    summary:
      status === "ready"
        ? "All deterministic submission gates are clear. Run final human QA before portal submission."
        : `${blockers.length} blocker${blockers.length === 1 ? "" : "s"} and ${reviews.length} review item${reviews.length === 1 ? "" : "s"} remain before submission.`,
    nextAction: firstBlocker
      ? `${firstBlocker.label}: ${firstBlocker.detail}`
      : "Export DOCX, compliance CSV, packet CSV, and submission manifest.",
    blockers,
    reviews,
    completed,
    metrics: {
      blockers: blockers.length,
      reviews: reviews.length,
      completed: completed.length,
      openTasks: activeTasks.length,
      criticalTasks: criticalTasks.length,
      missingCompliance,
      missingPacketItems,
      reviewerBlockers,
    },
  };
}
