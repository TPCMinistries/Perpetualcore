import type {
  BidNoBidArtifact,
  ComplianceMatrixArtifact,
  PacketChecklistArtifact,
} from "@/lib/rfp/compliance/types";
import type { ReviewerResult } from "@/lib/rfp/review/rubric";

interface SubmissionReadinessPanelProps {
  bidNoBid: BidNoBidArtifact | null;
  complianceMatrix: ComplianceMatrixArtifact | null;
  packetChecklist: PacketChecklistArtifact | null;
  reviewerResult: ReviewerResult | null;
  verifyMarkerCount: number;
  sectionCount: number;
}

function tone(score: number): string {
  if (score >= 80) return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  if (score >= 65) return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  return "border-rose-500/40 bg-rose-500/10 text-rose-200";
}

function countReviewerBlockers(result: ReviewerResult | null): number {
  return (result?.findings ?? []).filter(
    (finding) => finding.severity === "blocker" || finding.severity === "high",
  ).length;
}

function checklistStatus(packet: PacketChecklistArtifact | null): {
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

export function SubmissionReadinessPanel({
  bidNoBid,
  complianceMatrix,
  packetChecklist,
  reviewerResult,
  verifyMarkerCount,
  sectionCount,
}: SubmissionReadinessPanelProps) {
  const reviewerBlockers = countReviewerBlockers(reviewerResult);
  const packet = checklistStatus(packetChecklist);
  const missingRequirements = complianceMatrix?.missing_count ?? null;
  const readinessScore = Math.min(
    bidNoBid?.score ?? 0,
    reviewerResult?.overall_score ?? 0,
  );
  const hasReadiness = Boolean(bidNoBid || reviewerResult);
  const canSubmit =
    hasReadiness &&
    reviewerBlockers === 0 &&
    verifyMarkerCount === 0 &&
    (missingRequirements ?? 0) === 0 &&
    packet.missing === 0;

  const nextAction = !bidNoBid
    ? "Run capture readiness"
    : !reviewerResult
      ? "Run reviewer pass"
      : verifyMarkerCount > 0
        ? "Resolve VERIFY markers"
        : reviewerBlockers > 0
          ? "Fix reviewer blockers"
          : (missingRequirements ?? 0) > 0 || packet.missing > 0
            ? "Complete missing packet items"
            : "Export DOCX and submit";

  return (
    <section className="mt-8 rounded-md border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">
            Submission readiness
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            {canSubmit
              ? "No deterministic blockers detected. Final human review is still required before submission."
              : "This draft is not submission-ready yet. Work the next action, then export the packet."}
          </p>
        </div>
        <div
          className={`rounded-md border px-4 py-2 text-center font-mono ${
            hasReadiness ? tone(readinessScore) : "border-zinc-700 bg-zinc-900 text-zinc-300"
          }`}
        >
          <div className="text-[9px] uppercase tracking-[0.22em] opacity-80">
            Status
          </div>
          <div className="mt-0.5 text-[13px] font-semibold uppercase tracking-[0.12em]">
            {canSubmit ? "Ready" : "Open"}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Sections" value={`${sectionCount}/5`} />
        <Metric label="VERIFY markers" value={String(verifyMarkerCount)} danger={verifyMarkerCount > 0} />
        <Metric
          label="Compliance gaps"
          value={missingRequirements === null ? "Not run" : String(missingRequirements)}
          danger={(missingRequirements ?? 0) > 0}
        />
        <Metric
          label="Reviewer blockers"
          value={reviewerResult ? String(reviewerBlockers) : "Not run"}
          danger={reviewerBlockers > 0}
        />
      </div>

      <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-900/60 p-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500">
          Next action
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-100">{nextAction}</p>
        {packetChecklist ? (
          <p className="mt-2 text-[12px] text-zinc-500">
            Packet items: {packet.missing} missing, {packet.needsReview} need review.
          </p>
        ) : null}
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
