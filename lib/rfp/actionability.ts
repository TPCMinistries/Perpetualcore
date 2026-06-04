export type ActionabilityLevel = "ready" | "workable" | "review" | "blocked";
export type ActionabilityFilter = "ready" | "needs_review" | "missing_info";
export type DiscoverySort = "fit" | "readiness" | "deadline";

export interface ActionabilityInput {
  fitScore: number;
  deadline: string | null;
  needsReview: boolean;
  enrichment: {
    eligibility: string[];
    required_documents: string[];
    submission_method: string | null;
    submission_url: string | null;
    risks: string[];
    missing_fields: string[];
    quality_score: number;
  } | null;
}

export interface ActionabilityResult {
  score: number;
  level: ActionabilityLevel;
  label: string;
  effort: "low" | "medium" | "high";
  reasons: string[];
  blockers: string[];
  missing: string[];
  deadline_days: number | null;
}

export function daysUntilDeadline(iso: string | null, now = Date.now()): number | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.ceil((time - now) / 86_400_000);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function computeOpportunityActionability(
  input: ActionabilityInput,
): ActionabilityResult {
  const deadlineDays = daysUntilDeadline(input.deadline);
  const enrichment = input.enrichment;
  const missing = [...(enrichment?.missing_fields ?? [])];
  const blockers: string[] = [];
  const reasons: string[] = [];

  let score = input.fitScore * 0.58;

  if (enrichment) {
    score += enrichment.quality_score * 0.24;
    if (enrichment.eligibility.length > 0) {
      score += 5;
      reasons.push("Eligibility is structured");
    }
    if (enrichment.required_documents.length > 0) {
      score += 5;
      reasons.push("Required documents are known");
    }
    if (enrichment.submission_method) {
      score += 4;
      reasons.push("Submission path is known");
    }
    if (enrichment.submission_url) score += 2;
    if (enrichment.risks.length > 0) score -= Math.min(10, enrichment.risks.length * 2);
  } else {
    score -= 12;
    missing.push("Source intelligence");
  }

  if (deadlineDays === null) {
    score -= 6;
    missing.push("Deadline");
  } else if (deadlineDays < 0) {
    score -= 35;
    blockers.push("Deadline appears to have passed");
  } else if (deadlineDays <= 7) {
    score -= 12;
    reasons.push("Deadline is urgent");
  } else if (deadlineDays <= 30) {
    score += 5;
    reasons.push("Deadline is actionable");
  } else {
    score += 3;
    reasons.push("Timeline allows planning");
  }

  if (input.needsReview) {
    score -= 8;
    blockers.push("Source row needs human review");
  }

  if ((enrichment?.eligibility.length ?? 0) === 0) {
    missing.push("Eligibility");
  }
  if ((enrichment?.required_documents.length ?? 0) === 0) {
    missing.push("Required documents");
  }
  if (!enrichment?.submission_method) {
    missing.push("Submission method");
  }

  const normalizedScore = clampScore(score);
  const uniqueMissing = Array.from(new Set(missing)).slice(0, 6);
  const uniqueBlockers = Array.from(new Set(blockers)).slice(0, 4);
  const effort: ActionabilityResult["effort"] =
    uniqueMissing.length >= 4 || (enrichment?.required_documents.length ?? 0) >= 6
      ? "high"
      : uniqueMissing.length >= 2
        ? "medium"
        : "low";

  let level: ActionabilityLevel;
  let label: string;
  if (uniqueBlockers.length > 0 || normalizedScore < 45) {
    level = "blocked";
    label = "Do not pursue yet";
  } else if (normalizedScore >= 78 && uniqueMissing.length <= 2) {
    level = "ready";
    label = "Ready to pursue";
  } else if (normalizedScore >= 62) {
    level = "workable";
    label = "Workable pursuit";
  } else {
    level = "review";
    label = "Needs review";
  }

  return {
    score: normalizedScore,
    level,
    label,
    effort,
    reasons: Array.from(new Set(reasons)).slice(0, 5),
    blockers: uniqueBlockers,
    missing: uniqueMissing,
    deadline_days: deadlineDays,
  };
}

export function matchesActionabilityFilter(
  result: ActionabilityResult | null,
  filter: ActionabilityFilter | null | undefined,
): boolean {
  if (!filter) return true;
  if (!result) return filter === "missing_info";
  if (filter === "ready") return result.level === "ready" || result.level === "workable";
  if (filter === "needs_review") return result.level === "review" || result.level === "blocked";
  return result.missing.length > 0;
}
