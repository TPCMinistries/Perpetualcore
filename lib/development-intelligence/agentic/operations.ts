export type AgentRunStatus = "planned" | "running" | "review_ready" | "failed";
export type AgentRunReviewStatus =
  | "pending"
  | "approved"
  | "needs_revision"
  | "rejected";

export interface AgentRunLifecycleRecord {
  id: string;
  organizationId: string;
  status: AgentRunStatus;
  humanReviewStatus: AgentRunReviewStatus;
  rawContentStored: boolean;
  synthesis: unknown;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface LifecycleValidation {
  allowed: boolean;
  reason: string | null;
}

const runTransitions: Record<AgentRunStatus, ReadonlySet<AgentRunStatus>> = {
  planned: new Set(["running", "failed"]),
  running: new Set(["review_ready", "failed"]),
  review_ready: new Set(),
  failed: new Set(),
};

const prohibitedNormalizedKeys = new Set([
  "transcript",
  "transcriptsegments",
  "rawtranscript",
  "sourcetext",
  "rawcontent",
  "recording",
  "audio",
  "video",
  "media",
]);

function normalizeKey(key: string): string {
  return key.toLocaleLowerCase().replaceAll(/[^a-z0-9]/g, "");
}

export function validateRunStatusTransition(
  current: AgentRunStatus,
  next: AgentRunStatus
): LifecycleValidation {
  if (runTransitions[current].has(next)) return { allowed: true, reason: null };
  return {
    allowed: false,
    reason: `Agent run cannot transition from ${current} to ${next}`,
  };
}

export function findRawContentPaths(value: unknown): string[] {
  const matches: string[] = [];
  const inspect = (candidate: unknown, path: string): void => {
    if (!candidate || typeof candidate !== "object") return;
    if (Array.isArray(candidate)) {
      candidate.forEach((item, index) => inspect(item, `${path}[${index}]`));
      return;
    }
    for (const [key, nested] of Object.entries(candidate)) {
      const nestedPath = path ? `${path}.${key}` : key;
      if (prohibitedNormalizedKeys.has(normalizeKey(key))) matches.push(nestedPath);
      inspect(nested, nestedPath);
    }
  };
  inspect(value, "");
  return matches;
}

function hasMinimizedSynthesis(value: unknown): boolean {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length > 0 &&
      findRawContentPaths(value).length === 0
  );
}

export function validateHumanReviewTransition(
  run: AgentRunLifecycleRecord,
  next: Exclude<AgentRunReviewStatus, "pending">,
  reviewerId: string,
  reviewedAt: string
): LifecycleValidation {
  if (run.status !== "review_ready") {
    return { allowed: false, reason: "Only a review-ready run can be reviewed" };
  }
  if (run.humanReviewStatus !== "pending") {
    return { allowed: false, reason: "A completed human review is immutable" };
  }
  if (!reviewerId.trim() || !reviewedAt.trim()) {
    return { allowed: false, reason: "Reviewer identity and timestamp are required" };
  }
  if (Number.isNaN(Date.parse(reviewedAt))) {
    return { allowed: false, reason: "Review timestamp must be valid" };
  }
  if (run.rawContentStored || !hasMinimizedSynthesis(run.synthesis)) {
    return {
      allowed: false,
      reason: "Review requires a minimized synthesis with no raw content",
    };
  }
  if (!(["approved", "needs_revision", "rejected"] as const).includes(next)) {
    return { allowed: false, reason: "Unsupported human review outcome" };
  }
  return { allowed: true, reason: null };
}

export function isEnterpriseEligibleAgentRun(
  run: AgentRunLifecycleRecord,
  organizationId: string
): boolean {
  return (
    run.organizationId === organizationId &&
    run.status === "review_ready" &&
    run.humanReviewStatus === "approved" &&
    run.reviewedBy !== null &&
    run.reviewedAt !== null &&
    !Number.isNaN(Date.parse(run.reviewedAt)) &&
    run.rawContentStored === false &&
    hasMinimizedSynthesis(run.synthesis)
  );
}

export interface AgentRunOrganizationSummary {
  total: number;
  planned: number;
  running: number;
  reviewReady: number;
  failed: number;
  pendingReview: number;
  approved: number;
  needsRevision: number;
  rejected: number;
  enterpriseEligible: number;
  rawContentViolations: number;
}

export function summarizeAgentRunsForOrganization(
  runs: AgentRunLifecycleRecord[],
  organizationId: string
): AgentRunOrganizationSummary {
  const scoped = runs.filter((run) => run.organizationId === organizationId);
  return {
    total: scoped.length,
    planned: scoped.filter((run) => run.status === "planned").length,
    running: scoped.filter((run) => run.status === "running").length,
    reviewReady: scoped.filter((run) => run.status === "review_ready").length,
    failed: scoped.filter((run) => run.status === "failed").length,
    pendingReview: scoped.filter((run) => run.humanReviewStatus === "pending").length,
    approved: scoped.filter((run) => run.humanReviewStatus === "approved").length,
    needsRevision: scoped.filter(
      (run) => run.humanReviewStatus === "needs_revision"
    ).length,
    rejected: scoped.filter((run) => run.humanReviewStatus === "rejected").length,
    enterpriseEligible: scoped.filter((run) =>
      isEnterpriseEligibleAgentRun(run, organizationId)
    ).length,
    rawContentViolations: scoped.filter(
      (run) => run.rawContentStored || findRawContentPaths(run.synthesis).length > 0
    ).length,
  };
}
