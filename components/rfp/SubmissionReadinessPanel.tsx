import type {
  BidNoBidArtifact,
  ComplianceMatrixArtifact,
  PacketChecklistArtifact,
} from "@/lib/rfp/compliance/types";
import type { ReviewerResult } from "@/lib/rfp/review/rubric";
import {
  buildSubmitReadinessGate,
  type SubmitGateSeverity,
} from "@/lib/rfp/submission/readiness-gate";
import type { SubmissionTaskRow } from "@/lib/rfp/submission/tasks";

interface SubmissionReadinessPanelProps {
  bidNoBid: BidNoBidArtifact | null;
  complianceMatrix: ComplianceMatrixArtifact | null;
  packetChecklist: PacketChecklistArtifact | null;
  reviewerResult: ReviewerResult | null;
  verifyMarkerCount: number;
  sectionCount: number;
  tasks: SubmissionTaskRow[];
}

const GATE_CLASS = {
  ready: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  not_ready: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  not_run: "border-amber-500/40 bg-amber-500/10 text-amber-200",
} as const;

const DOT_CLASS: Record<SubmitGateSeverity, string> = {
  complete: "bg-emerald-400",
  review: "bg-amber-400",
  blocker: "bg-rose-400",
};

export function SubmissionReadinessPanel({
  complianceMatrix,
  packetChecklist,
  reviewerResult,
  verifyMarkerCount,
  sectionCount,
  tasks,
}: SubmissionReadinessPanelProps) {
  const gate = buildSubmitReadinessGate({
    sectionCount,
    verifyMarkerCount,
    complianceMatrix,
    packetChecklist,
    reviewerResult,
    tasks,
  });
  const visibleItems = [...gate.blockers, ...gate.reviews, ...gate.completed].slice(0, 8);

  return (
    <section className="mt-8 rounded-md border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">
            Ready to submit gate
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            {gate.summary}
          </p>
        </div>
        <div className={`rounded-md border px-4 py-2 text-center font-mono ${GATE_CLASS[gate.status]}`}>
          <div className="text-[9px] uppercase tracking-[0.22em] opacity-80">
            {gate.label}
          </div>
          <div className="mt-0.5 text-2xl font-semibold tabular-nums">
            {gate.score}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Blockers" value={String(gate.metrics.blockers)} danger={gate.metrics.blockers > 0} />
        <Metric label="Review" value={String(gate.metrics.reviews)} danger={gate.metrics.reviews > 0} />
        <Metric label="Open tasks" value={String(gate.metrics.openTasks)} danger={gate.metrics.openTasks > 0} />
        <Metric label="Critical tasks" value={String(gate.metrics.criticalTasks)} danger={gate.metrics.criticalTasks > 0} />
      </div>

      <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-900/60 p-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500">
          Next action
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-100">{gate.nextAction}</p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {visibleItems.map((item) => (
          <div key={item.key} className="rounded-md border border-zinc-800 bg-zinc-950/80 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-zinc-100">{item.label}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">{item.detail}</p>
              </div>
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${DOT_CLASS[item.severity]}`} />
            </div>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
              {item.owner}
            </p>
          </div>
        ))}
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
    <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>
      <p className={`mt-2 text-xl font-semibold tabular-nums ${danger ? "text-rose-300" : "text-zinc-100"}`}>
        {value}
      </p>
    </div>
  );
}
