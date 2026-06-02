import type {
  BidNoBidArtifact,
  ComplianceMatrixArtifact,
  PacketChecklistArtifact,
} from "@/lib/rfp/compliance/types";
import type { ReviewerResult } from "@/lib/rfp/review/rubric";
import type { SubmissionTaskRow } from "@/lib/rfp/submission/tasks";

export type ReadinessTone = "ready" | "warn" | "danger" | "neutral";
export type ReadinessStatus = "not_started" | "blocked" | "in_progress" | "ready" | "submitted";

export interface PursuitReadinessInput {
  proposalStatus?: string | null;
  dueDate?: string | null;
  sectionCount?: number;
  verifyMarkerCount?: number;
  hasPackage?: boolean;
  bidNoBid?: BidNoBidArtifact | null;
  complianceMatrix?: ComplianceMatrixArtifact | null;
  packetChecklist?: PacketChecklistArtifact | null;
  reviewerResult?: ReviewerResult | null;
  tasks?: Pick<SubmissionTaskRow, "status" | "priority" | "title">[];
}

export interface ReadinessCheck {
  key: string;
  label: string;
  status: "complete" | "warning" | "blocked" | "missing";
  detail: string;
}

export interface PursuitReadiness {
  score: number;
  status: ReadinessStatus;
  tone: ReadinessTone;
  label: string;
  nextAction: string;
  blockers: string[];
  checks: ReadinessCheck[];
  metrics: {
    openTasks: number;
    blockedTasks: number;
    criticalTasks: number;
    complianceGaps: number | null;
    packetGaps: number | null;
    reviewerBlockers: number | null;
    daysLeft: number | null;
  };
}

function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const due = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.ceil((due.getTime() - start.getTime()) / 86_400_000);
}

function countReviewerBlockers(result?: ReviewerResult | null): number | null {
  if (!result) return null;
  return result.findings.filter(
    (finding) => finding.severity === "blocker" || finding.severity === "high",
  ).length;
}

function packetGaps(packet?: PacketChecklistArtifact | null): number | null {
  if (!packet) return null;
  return packet.items.filter((item) => item.status !== "met").length;
}

function taskMetrics(tasks: PursuitReadinessInput["tasks"]) {
  const rows = tasks ?? [];
  const open = rows.filter((task) =>
    ["open", "in_progress", "blocked"].includes(task.status),
  );
  return {
    openTasks: open.length,
    blockedTasks: open.filter((task) => task.status === "blocked").length,
    criticalTasks: open.filter((task) => task.priority === "critical").length,
    topTask: open.find((task) => task.status === "blocked" || task.priority === "critical")?.title ?? open[0]?.title ?? null,
  };
}

function addScore(current: number, condition: boolean, value: number): number {
  return condition ? current + value : current;
}

export function parseBidNoBid(value: unknown): BidNoBidArtifact | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (raw.kind !== "bid_no_bid_v1") return null;
  if (
    raw.recommendation !== "pursue" &&
    raw.recommendation !== "maybe" &&
    raw.recommendation !== "pass"
  ) {
    return null;
  }
  if (typeof raw.score !== "number") return null;
  return raw as unknown as BidNoBidArtifact;
}

export function countVerifyMarkersFromSections(
  sections: Array<{ content: string | null }>,
): number {
  return sections.reduce((total, section) => {
    const matches = section.content?.match(/\[VERIFY:?\s*[^\]]+\]/g) ?? [];
    return total + matches.length;
  }, 0);
}

export function buildPursuitReadiness(input: PursuitReadinessInput): PursuitReadiness {
  const proposalStatus = input.proposalStatus ?? null;
  const submitted = proposalStatus === "submitted" || proposalStatus === "won";
  const closed = proposalStatus === "lost" || proposalStatus === "withdrawn";
  const hasProposal = Boolean(proposalStatus);
  const task = taskMetrics(input.tasks);
  const complianceGaps = input.complianceMatrix?.missing_count ?? null;
  const complianceReview = input.complianceMatrix?.needs_review_count ?? 0;
  const packetMissing = packetGaps(input.packetChecklist);
  const reviewerBlockers = countReviewerBlockers(input.reviewerResult);
  const verifyMarkerCount = input.verifyMarkerCount ?? 0;
  const sectionCount = input.sectionCount ?? 0;
  const daysLeft = daysUntil(input.dueDate);

  const checks: ReadinessCheck[] = [
    {
      key: "workroom",
      label: "Workroom",
      status: hasProposal ? "complete" : "missing",
      detail: hasProposal ? "Draft workroom exists." : "Start the pursuit workflow.",
    },
    {
      key: "package",
      label: "Source package",
      status: input.hasPackage ? "complete" : "warning",
      detail: input.hasPackage
        ? "Solicitation package has been imported."
        : "Import the solicitation package for stronger requirements.",
    },
    {
      key: "sections",
      label: "Draft sections",
      status: sectionCount >= 5 ? "complete" : hasProposal ? "blocked" : "missing",
      detail: hasProposal
        ? `${sectionCount}/5 canonical sections present.`
        : "Draft sections are created by the pursuit workflow.",
    },
    {
      key: "verify",
      label: "Evidence markers",
      status: verifyMarkerCount === 0 ? "complete" : "blocked",
      detail:
        verifyMarkerCount === 0
          ? "No VERIFY markers detected."
          : `${verifyMarkerCount} VERIFY marker${verifyMarkerCount === 1 ? "" : "s"} need evidence.`,
    },
    {
      key: "compliance",
      label: "Compliance",
      status:
        complianceGaps === null
          ? "missing"
          : complianceGaps > 0
            ? "blocked"
            : complianceReview > 0
              ? "warning"
              : "complete",
      detail:
        complianceGaps === null
          ? "Run capture readiness."
          : `${complianceGaps} missing, ${complianceReview} need review.`,
    },
    {
      key: "reviewer",
      label: "Reviewer",
      status:
        reviewerBlockers === null
          ? "missing"
          : reviewerBlockers > 0
            ? "blocked"
            : "complete",
      detail:
        reviewerBlockers === null
          ? "Run reviewer pass."
          : `${reviewerBlockers} blocker/high finding${reviewerBlockers === 1 ? "" : "s"}.`,
    },
    {
      key: "tasks",
      label: "Work queue",
      status:
        task.blockedTasks > 0 || task.criticalTasks > 0
          ? "blocked"
          : task.openTasks > 0
            ? "warning"
            : hasProposal
              ? "complete"
              : "missing",
      detail:
        task.openTasks > 0
          ? `${task.openTasks} open task${task.openTasks === 1 ? "" : "s"}.`
          : hasProposal
            ? "No open workroom tasks."
            : "No work queue yet.",
    },
    {
      key: "deadline",
      label: "Deadline",
      status:
        daysLeft === null
          ? "warning"
          : daysLeft < 0
            ? "blocked"
            : daysLeft <= 7
              ? "warning"
              : "complete",
      detail:
        daysLeft === null
          ? "Deadline not listed."
          : daysLeft < 0
            ? `${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"} overdue.`
            : daysLeft === 0
              ? "Due today."
              : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left.`,
    },
  ];

  const blockers = checks
    .filter((check) => check.status === "blocked" || check.status === "missing")
    .map((check) => `${check.label}: ${check.detail}`);

  let score = 0;
  score = addScore(score, hasProposal, 15);
  score = addScore(score, input.hasPackage === true, 10);
  score = addScore(score, sectionCount >= 5, 15);
  score = addScore(score, verifyMarkerCount === 0 && hasProposal, 10);
  score = addScore(score, complianceGaps !== null, 10);
  score = addScore(score, complianceGaps === 0, 15);
  score = addScore(score, reviewerBlockers !== null, 10);
  score = addScore(score, reviewerBlockers === 0, 10);
  score = addScore(score, task.openTasks === 0 && hasProposal, 10);
  score = Math.max(0, Math.min(100, submitted ? 100 : closed ? Math.min(score, 50) : score));

  const hardBlocked =
    !hasProposal ||
    sectionCount < 5 ||
    verifyMarkerCount > 0 ||
    (complianceGaps ?? 0) > 0 ||
    (reviewerBlockers ?? 0) > 0 ||
    task.blockedTasks > 0 ||
    task.criticalTasks > 0 ||
    (daysLeft !== null && daysLeft < 0);

  const nextAction = !hasProposal
    ? "Start pursuit workflow"
    : sectionCount < 5
      ? "Regenerate or complete draft sections"
      : !input.hasPackage
        ? "Import solicitation package"
        : complianceGaps === null
          ? "Run capture readiness"
          : reviewerBlockers === null
            ? "Run reviewer pass"
            : verifyMarkerCount > 0
              ? "Resolve VERIFY markers"
              : (complianceGaps ?? 0) > 0 || (packetMissing ?? 0) > 0
                ? "Close compliance and packet gaps"
                : task.topTask
                  ? task.topTask
                  : "Export packet and final-review";

  const status: ReadinessStatus = submitted
    ? "submitted"
    : !hasProposal
      ? "not_started"
      : hardBlocked
        ? "blocked"
        : score >= 85
          ? "ready"
          : "in_progress";

  const tone: ReadinessTone =
    status === "ready" || status === "submitted"
      ? "ready"
      : status === "blocked"
        ? "danger"
        : status === "not_started"
          ? "neutral"
          : "warn";

  const label =
    status === "submitted"
      ? "Submitted"
      : status === "ready"
        ? "Submission-ready"
        : status === "blocked"
          ? "Blocked"
          : status === "not_started"
            ? "Not started"
            : "In progress";

  return {
    score,
    status,
    tone,
    label,
    nextAction,
    blockers: blockers.slice(0, 6),
    checks,
    metrics: {
      openTasks: task.openTasks,
      blockedTasks: task.blockedTasks,
      criticalTasks: task.criticalTasks,
      complianceGaps,
      packetGaps: packetMissing,
      reviewerBlockers,
      daysLeft,
    },
  };
}
