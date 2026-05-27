import type {
  ComplianceMatrixArtifact,
  PacketChecklistArtifact,
} from "@/lib/rfp/compliance/types";
import type { ReviewerResult } from "@/lib/rfp/review/rubric";

interface SubmissionPlanPanelProps {
  dueDate: string | null;
  complianceMatrix: ComplianceMatrixArtifact | null;
  packetChecklist: PacketChecklistArtifact | null;
  reviewerResult: ReviewerResult | null;
  verifyMarkerCount: number;
  sectionCount: number;
}

type PlanStatus = "done" | "active" | "blocked" | "pending";

interface PlanStep {
  label: string;
  owner: string;
  timing: string;
  status: PlanStatus;
  detail: string;
}

const STATUS_CLASS: Record<PlanStatus, string> = {
  done: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  active: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
  blocked: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  pending: "border-zinc-700 bg-zinc-900 text-zinc-400",
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const deadline = new Date(iso);
  if (Number.isNaN(deadline.getTime())) return null;
  const today = new Date();
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const end = Date.UTC(
    deadline.getFullYear(),
    deadline.getMonth(),
    deadline.getDate(),
  );
  return Math.ceil((end - start) / 86_400_000);
}

function formatDueDate(iso: string | null): string {
  if (!iso) return "No deadline stored";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Invalid deadline";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(status: PlanStatus): string {
  if (status === "done") return "Done";
  if (status === "active") return "Do Now";
  if (status === "blocked") return "Blocked";
  return "Pending";
}

function reviewerBlockerCount(result: ReviewerResult | null): number {
  return (result?.findings ?? []).filter(
    (finding) => finding.severity === "blocker" || finding.severity === "high",
  ).length;
}

function packetCounts(packet: PacketChecklistArtifact | null): {
  missing: number;
  needsReview: number;
} {
  const items = packet?.items ?? [];
  return {
    missing: items.filter((item) => item.status === "missing").length,
    needsReview: items.filter(
      (item) => item.status === "partial" || item.status === "needs_review",
    ).length,
  };
}

function timingLabel(days: number | null, offset: number): string {
  if (days === null) return "Set deadline";
  const target = Math.max(days - offset, 0);
  if (target === 0) return "Today";
  return `T-${target}d`;
}

function buildPlan({
  daysRemaining,
  complianceMatrix,
  packetChecklist,
  reviewerResult,
  verifyMarkerCount,
  sectionCount,
}: {
  daysRemaining: number | null;
  complianceMatrix: ComplianceMatrixArtifact | null;
  packetChecklist: PacketChecklistArtifact | null;
  reviewerResult: ReviewerResult | null;
  verifyMarkerCount: number;
  sectionCount: number;
}): PlanStep[] {
  const missingCompliance = complianceMatrix?.missing_count ?? 0;
  const reviewerBlockers = reviewerBlockerCount(reviewerResult);
  const packet = packetCounts(packetChecklist);
  const hasCapture = Boolean(complianceMatrix && packetChecklist);
  const draftComplete = sectionCount >= 5;
  const draftBlocked = verifyMarkerCount > 0 || reviewerBlockers > 0;
  const packetBlocked = missingCompliance > 0 || packet.missing > 0;

  return [
    {
      label: "Run capture and reviewer checks",
      owner: "Proposal lead",
      timing: timingLabel(daysRemaining, 7),
      status: hasCapture && reviewerResult ? "done" : "active",
      detail: hasCapture && reviewerResult
        ? "Capture readiness and reviewer pass are available."
        : "Generate the compliance matrix, packet checklist, and reviewer findings before editing toward submission.",
    },
    {
      label: "Finalize narrative draft",
      owner: "Writer",
      timing: timingLabel(daysRemaining, 5),
      status: !draftComplete
        ? "active"
        : draftBlocked
          ? "blocked"
          : "done",
      detail: !draftComplete
        ? `${sectionCount}/5 core sections exist. Finish the missing sections before packet assembly.`
        : draftBlocked
          ? `${verifyMarkerCount} VERIFY markers and ${reviewerBlockers} high reviewer flags need resolution.`
          : "All core sections exist with no high reviewer flags or VERIFY markers detected.",
    },
    {
      label: "Close compliance gaps",
      owner: "Compliance reviewer",
      timing: timingLabel(daysRemaining, 4),
      status: !hasCapture
        ? "pending"
        : missingCompliance > 0
          ? "blocked"
          : "done",
      detail: !hasCapture
        ? "Run capture readiness to produce requirement-level coverage."
        : missingCompliance > 0
          ? `${missingCompliance} required items are still marked missing in the compliance matrix.`
          : "No missing compliance requirements detected.",
    },
    {
      label: "Collect attachments and forms",
      owner: "Operations",
      timing: timingLabel(daysRemaining, 3),
      status: !packetChecklist
        ? "pending"
        : packetBlocked
          ? "blocked"
          : packet.needsReview > 0
            ? "active"
            : "done",
      detail: !packetChecklist
        ? "Run capture readiness to generate the submission packet checklist."
        : packetBlocked
          ? `${packet.missing} packet items are missing.`
          : packet.needsReview > 0
            ? `${packet.needsReview} packet items need final review.`
            : "Submission packet checklist is clear.",
    },
    {
      label: "Export, QA, and submit",
      owner: "Submitter",
      timing: timingLabel(daysRemaining, 1),
      status: draftBlocked || packetBlocked || !hasCapture || !reviewerResult
        ? "pending"
        : "active",
      detail: "Export DOCX plus CSV matrices, run one human QA pass, then submit through the source portal.",
    },
  ];
}

export function SubmissionPlanPanel({
  dueDate,
  complianceMatrix,
  packetChecklist,
  reviewerResult,
  verifyMarkerCount,
  sectionCount,
}: SubmissionPlanPanelProps) {
  const deadline = packetChecklist?.due_date ?? dueDate;
  const daysRemaining = daysUntil(deadline);
  const steps = buildPlan({
    daysRemaining,
    complianceMatrix,
    packetChecklist,
    reviewerResult,
    verifyMarkerCount,
    sectionCount,
  });
  const urgent =
    daysRemaining !== null &&
    daysRemaining <= 3 &&
    steps.some((step) => step.status === "blocked" || step.status === "active");

  return (
    <section className="mt-8 rounded-md border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300">
            Submission plan
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Deadline-aware work plan for moving from draft to submitted packet.
          </p>
        </div>
        <div
          className={`rounded-md border px-4 py-2 text-center font-mono ${
            urgent
              ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
              : "border-zinc-700 bg-zinc-900 text-zinc-300"
          }`}
        >
          <div className="text-[9px] uppercase tracking-[0.22em] opacity-80">
            Due
          </div>
          <div className="mt-0.5 text-[12px] font-semibold uppercase tracking-[0.12em]">
            {daysRemaining === null
              ? "Unset"
              : daysRemaining < 0
                ? `${Math.abs(daysRemaining)}d late`
                : daysRemaining === 0
                  ? "Today"
                  : `${daysRemaining}d left`}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
          Deadline
        </p>
        <p className="mt-1 text-sm text-zinc-100">{formatDueDate(deadline)}</p>
      </div>

      <ol className="mt-4 divide-y divide-zinc-900 overflow-hidden rounded-md border border-zinc-800">
        {steps.map((step) => (
          <li key={step.label} className="grid gap-3 bg-zinc-950/70 p-4 md:grid-cols-[120px_1fr_120px]">
            <div>
              <span
                className={`inline-flex rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] ${STATUS_CLASS[step.status]}`}
              >
                {statusLabel(step.status)}
              </span>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600">
                {step.timing}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-100">{step.label}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
                {step.detail}
              </p>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500 md:text-right">
              {step.owner}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
