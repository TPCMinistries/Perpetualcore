import type { SubmissionTaskRow } from "@/lib/rfp/submission/tasks";
import type {
  BidNoBidArtifact,
  ComplianceMatrixArtifact,
  PacketChecklistArtifact,
} from "@/lib/rfp/compliance/types";
import type { ReviewerResult } from "@/lib/rfp/review/rubric";

interface PursuitActionSummaryProps {
  dueDate: string | null;
  bidNoBid: BidNoBidArtifact | null;
  complianceMatrix: ComplianceMatrixArtifact | null;
  packetChecklist: PacketChecklistArtifact | null;
  reviewerResult: ReviewerResult | null;
  verifyMarkerCount: number;
  sectionCount: number;
  tasks: SubmissionTaskRow[];
}

type ActionTone = "ready" | "warn" | "danger" | "neutral";

interface ActionItem {
  label: string;
  detail: string;
  tone: ActionTone;
}

const TONE_CLASS: Record<ActionTone, string> = {
  ready: "border-emerald-500/35 bg-emerald-500/10 text-emerald-100",
  warn: "border-amber-500/35 bg-amber-500/10 text-amber-100",
  danger: "border-rose-500/35 bg-rose-500/10 text-rose-100",
  neutral: "border-zinc-700 bg-zinc-900/80 text-zinc-200",
};

const PRIORITY_RANK = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
} as const;

function formatDate(iso: string | null): string {
  if (!iso) return "No deadline stored";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Invalid deadline";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const deadline = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(deadline.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = deadline.getTime() - today.getTime();
  return Math.ceil(diff / 86_400_000);
}

function countReviewerBlockers(result: ReviewerResult | null): number {
  return (result?.findings ?? []).filter(
    (finding) => finding.severity === "blocker" || finding.severity === "high",
  ).length;
}

function countPacketGaps(packet: PacketChecklistArtifact | null): number {
  return (packet?.items ?? []).filter((item) => item.status !== "met").length;
}

function openTasks(tasks: SubmissionTaskRow[]): SubmissionTaskRow[] {
  return tasks
    .filter(
      (task) =>
        task.status === "open" ||
        task.status === "in_progress" ||
        task.status === "blocked",
    )
    .sort((a, b) => {
      if (a.status === "blocked" && b.status !== "blocked") return -1;
      if (b.status === "blocked" && a.status !== "blocked") return 1;
      const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.created_at.localeCompare(b.created_at);
    });
}

function buildActions(params: {
  bidNoBid: BidNoBidArtifact | null;
  complianceMatrix: ComplianceMatrixArtifact | null;
  packetChecklist: PacketChecklistArtifact | null;
  reviewerResult: ReviewerResult | null;
  verifyMarkerCount: number;
  sectionCount: number;
  openTaskCount: number;
}): ActionItem[] {
  const actions: ActionItem[] = [];
  const reviewerBlockers = countReviewerBlockers(params.reviewerResult);
  const complianceGaps = params.complianceMatrix?.missing_count ?? 0;
  const packetGaps = countPacketGaps(params.packetChecklist);

  if (!params.bidNoBid || !params.complianceMatrix || !params.packetChecklist) {
    actions.push({
      label: "Run capture readiness",
      detail: "Generate bid decision, compliance matrix, and packet checklist.",
      tone: "warn",
    });
  }

  if (!params.reviewerResult) {
    actions.push({
      label: "Run reviewer pass",
      detail: "Score the draft against the funder brief and surface funder-facing risks.",
      tone: "warn",
    });
  }

  if (params.sectionCount < 5) {
    actions.push({
      label: "Complete missing sections",
      detail: `${params.sectionCount}/5 canonical proposal sections are present.`,
      tone: "danger",
    });
  }

  if (params.verifyMarkerCount > 0) {
    actions.push({
      label: "Resolve VERIFY markers",
      detail: `${params.verifyMarkerCount} placeholder claim${params.verifyMarkerCount === 1 ? "" : "s"} still need evidence.`,
      tone: "danger",
    });
  }

  if (reviewerBlockers > 0) {
    actions.push({
      label: "Fix reviewer blockers",
      detail: `${reviewerBlockers} blocker/high reviewer finding${reviewerBlockers === 1 ? "" : "s"} need revision.`,
      tone: "danger",
    });
  }

  if (complianceGaps > 0 || packetGaps > 0) {
    actions.push({
      label: "Close compliance and packet gaps",
      detail: `${complianceGaps} missing requirement${complianceGaps === 1 ? "" : "s"} and ${packetGaps} packet item${packetGaps === 1 ? "" : "s"} need work.`,
      tone: "warn",
    });
  }

  if (params.openTaskCount > 0) {
    actions.push({
      label: "Work the submission queue",
      detail: `${params.openTaskCount} task${params.openTaskCount === 1 ? "" : "s"} remain open or blocked in the workroom.`,
      tone: "neutral",
    });
  }

  if (actions.length === 0) {
    actions.push({
      label: "Export and final-review",
      detail: "No deterministic blockers detected. Export the packet and perform human review.",
      tone: "ready",
    });
  }

  return actions.slice(0, 4);
}

function decisionLabel(bidNoBid: BidNoBidArtifact | null): string {
  if (!bidNoBid) return "Not scored";
  if (bidNoBid.recommendation === "pursue") return `Pursue · ${bidNoBid.score}`;
  if (bidNoBid.recommendation === "maybe") return `Review · ${bidNoBid.score}`;
  return `Pass · ${bidNoBid.score}`;
}

function reviewerLabel(result: ReviewerResult | null): string {
  if (!result) return "Not run";
  return `${result.overall_score}/100`;
}

export function PursuitActionSummary({
  dueDate,
  bidNoBid,
  complianceMatrix,
  packetChecklist,
  reviewerResult,
  verifyMarkerCount,
  sectionCount,
  tasks,
}: PursuitActionSummaryProps) {
  const open = openTasks(tasks);
  const blockedCount = open.filter((task) => task.status === "blocked").length;
  const daysLeft = daysUntil(dueDate);
  const actions = buildActions({
    bidNoBid,
    complianceMatrix,
    packetChecklist,
    reviewerResult,
    verifyMarkerCount,
    sectionCount,
    openTaskCount: open.length,
  });
  const topTasks = open.slice(0, 3);

  return (
    <section className="mt-8 overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-900 bg-zinc-900/70 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">
              Pursuit command
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Live operating view for the proposal: decision, deadline pressure,
              reviewer risk, and the next work items that move this toward submission.
            </p>
          </div>
          <div className="rounded-md border border-zinc-800 bg-zinc-950 px-4 py-2 text-right">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
              Deadline
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">
              {daysLeft === null
                ? formatDate(dueDate)
                : daysLeft < 0
                  ? `${Math.abs(daysLeft)}d overdue`
                  : daysLeft === 0
                    ? "Due today"
                    : `${daysLeft}d left`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid border-b border-zinc-900 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Bid decision" value={decisionLabel(bidNoBid)} />
        <Metric label="Reviewer" value={reviewerLabel(reviewerResult)} />
        <Metric
          label="Compliance gaps"
          value={complianceMatrix ? String(complianceMatrix.missing_count) : "Not run"}
          danger={(complianceMatrix?.missing_count ?? 0) > 0}
        />
        <Metric label="Open tasks" value={String(open.length)} danger={open.length > 0} />
        <Metric label="Blocked" value={String(blockedCount)} danger={blockedCount > 0} />
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-b border-zinc-900 p-5 lg:border-b-0 lg:border-r">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500">
            Next moves
          </p>
          <div className="mt-3 grid gap-2">
            {actions.map((action) => (
              <div
                key={`${action.label}:${action.detail}`}
                className={`rounded-md border p-3 transition-colors duration-200 ${TONE_CLASS[action.tone]}`}
              >
                <p className="text-sm font-semibold">{action.label}</p>
                <p className="mt-1 text-[12px] leading-relaxed opacity-80">
                  {action.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500">
            Priority queue
          </p>
          {topTasks.length === 0 ? (
            <p className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              No open workroom tasks. Final human review and export are the next step.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-900 overflow-hidden rounded-md border border-zinc-800">
              {topTasks.map((task) => (
                <li key={task.id} className="bg-zinc-950 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-zinc-100">{task.title}</p>
                    <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                      {task.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
                    {task.owner_label}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="border-r border-zinc-900 px-5 py-4 last:border-r-0">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-2 text-sm font-semibold tabular-nums ${
          danger ? "text-amber-200" : "text-zinc-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
