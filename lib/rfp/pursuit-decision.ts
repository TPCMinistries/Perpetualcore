import type { BidNoBidArtifact, CaptureRecommendation } from "@/lib/rfp/compliance/types";

export type PursuitDecisionAction = "pursue" | "watch" | "archive";

export interface PursuitDecisionInput {
  fitScore: number;
  deadline: string | null;
  amountMax: number | null;
  needsReview?: boolean | null;
  enrichmentQuality?: number | null;
  bidNoBid?: BidNoBidArtifact | null;
}

export interface PursuitDecisionSignal {
  label: string;
  detail: string;
  tone: "ready" | "warn" | "danger" | "neutral";
}

export interface PursuitDecisionSummary {
  recommendation: CaptureRecommendation;
  score: number;
  label: string;
  detail: string;
  confidence: "source-light" | "estimated" | "readiness";
  signals: PursuitDecisionSignal[];
  nextActions: string[];
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const due = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.ceil((due.getTime() - start.getTime()) / 86_400_000);
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function recommendationLabel(recommendation: CaptureRecommendation): string {
  if (recommendation === "pursue") return "Pursue";
  if (recommendation === "maybe") return "Review";
  return "Pass";
}

export function defaultPursuitCommand(action: PursuitDecisionAction): {
  triageStatus: "watch" | "pursuing" | "passed";
  stage: "evaluating" | "drafting" | "closed";
  priority: "low" | "medium" | "high";
} {
  if (action === "pursue") {
    return { triageStatus: "pursuing", stage: "evaluating", priority: "high" };
  }
  if (action === "watch") {
    return { triageStatus: "watch", stage: "evaluating", priority: "medium" };
  }
  return { triageStatus: "passed", stage: "closed", priority: "low" };
}

export function buildPursuitDecisionSummary(
  input: PursuitDecisionInput,
): PursuitDecisionSummary {
  if (input.bidNoBid) {
    return {
      recommendation: input.bidNoBid.recommendation,
      score: clampScore(input.bidNoBid.score),
      label: recommendationLabel(input.bidNoBid.recommendation),
      detail: "Based on the generated capture-readiness bid/no-bid analysis.",
      confidence: "readiness",
      signals: [
        ...input.bidNoBid.drivers.slice(0, 3).map((driver) => ({
          label: "Driver",
          detail: driver,
          tone: "ready" as const,
        })),
        ...input.bidNoBid.risks.slice(0, 3).map((risk) => ({
          label: "Risk",
          detail: risk,
          tone: "warn" as const,
        })),
      ],
      nextActions: input.bidNoBid.next_actions.slice(0, 4),
    };
  }

  const deadlineDays = daysUntil(input.deadline);
  const sourceDepth = input.enrichmentQuality ?? null;
  let score = input.fitScore;
  const signals: PursuitDecisionSignal[] = [];
  const nextActions: string[] = [];

  if (deadlineDays === null) {
    score -= 8;
    signals.push({
      label: "Deadline",
      detail: "Deadline is not listed; confirm timing at the source.",
      tone: "warn",
    });
    nextActions.push("Confirm deadline and timezone.");
  } else if (deadlineDays < 0) {
    score = Math.min(score, 35);
    signals.push({
      label: "Deadline",
      detail: "Deadline appears to have passed.",
      tone: "danger",
    });
    nextActions.push("Check the source for extensions before pursuing.");
  } else if (deadlineDays <= 7) {
    score -= 20;
    signals.push({
      label: "Deadline",
      detail: `${deadlineDays === 0 ? "Due today" : `${deadlineDays} days left`}; only pursue with reusable material.`,
      tone: "danger",
    });
    nextActions.push("Decide immediately and assign a submission owner.");
  } else if (deadlineDays <= 21) {
    score -= 6;
    signals.push({
      label: "Deadline",
      detail: `${deadlineDays} days left; workable but needs active management.`,
      tone: "warn",
    });
    nextActions.push("Create the workroom and source-package checklist.");
  } else {
    signals.push({
      label: "Deadline",
      detail: `${deadlineDays} days left; enough room for review and packet assembly.`,
      tone: "ready",
    });
  }

  if ((input.amountMax ?? 0) >= 1_000_000) {
    score += 4;
    signals.push({
      label: "Award",
      detail: "Large award ceiling; worth deeper eligibility review.",
      tone: "ready",
    });
  } else if (input.amountMax === null) {
    signals.push({
      label: "Award",
      detail: "Award amount is not structured yet.",
      tone: "neutral",
    });
  }

  if (input.needsReview) {
    score -= 8;
    signals.push({
      label: "Source",
      detail: "Source was flagged for human review.",
      tone: "warn",
    });
    nextActions.push("Open the source and verify extracted fields.");
  }

  if (sourceDepth !== null && sourceDepth < 55) {
    score -= 6;
    signals.push({
      label: "Capture depth",
      detail: "Source extraction is shallow; import the full package before drafting.",
      tone: "warn",
    });
    nextActions.push("Import solicitation package for requirements extraction.");
  }

  const finalScore = clampScore(score);
  const recommendation: CaptureRecommendation =
    finalScore >= 78 ? "pursue" : finalScore >= 55 ? "maybe" : "pass";
  const label = recommendationLabel(recommendation);
  const detail =
    recommendation === "pursue"
      ? "Strong enough to move into an active pursuit."
      : recommendation === "maybe"
        ? "Worth watching or reviewing before assigning drafting time."
        : "Low priority unless new information improves the fit.";

  return {
    recommendation,
    score: finalScore,
    label,
    detail,
    confidence: sourceDepth === null || sourceDepth < 60 ? "source-light" : "estimated",
    signals: signals.slice(0, 6),
    nextActions:
      nextActions.length > 0
        ? nextActions.slice(0, 4)
        : ["Open a pursuit workroom and run capture readiness."],
  };
}
