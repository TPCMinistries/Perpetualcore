import { createAdminClient } from "@/lib/supabase/server";
import {
  listAnalyses,
  type DevelopmentAnalysisRecord,
  type RequestIdentity,
} from "./store";

export type ConfidenceBand = "high" | "moderate" | "low" | "none";

export interface ReviewQueueItem {
  id: string;
  title: string;
  lens: string;
  occurredAt: string;
  createdAt: string;
  reviewStatus: string;
  reviewNote: string | null;
  safetyFlags: string[];
  evidenceCount: number;
  averageConfidence: number | null;
  confidenceBand: ConfidenceBand;
  actionable: boolean;
}

export interface OperationsEvidenceRow {
  analysisId: string;
  confidence: number;
  evidenceQuote: string;
}

export interface QualityDistributionItem {
  key: string;
  label: string;
  count: number;
  percent: number;
}

export interface DevelopmentQualitySnapshot {
  reportCount: number;
  evidenceCount: number;
  evidenceCoverageRate: number;
  evidenceTraceabilityRate: number;
  averageEvidencePerReport: number;
  averageConfidence: number | null;
  reviewCompletionRate: number;
  reviewedCount: number;
  guardrailFlaggedReports: number;
  actionableReviewCount: number;
  confidenceDistribution: QualityDistributionItem[];
  reviewDistribution: QualityDistributionItem[];
  lensDistribution: QualityDistributionItem[];
}

export interface DevelopmentOperationsSnapshot {
  queue: ReviewQueueItem[];
  quality: DevelopmentQualitySnapshot;
}

const reviewLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  needs_revision: "Needs revision",
  rejected: "Rejected",
};

const lensLabels: Record<string, string> = {
  enterprise_meeting: "Team meeting",
  interview_coaching: "Interview coaching",
  interviewer_quality: "Interviewer practice",
  leadership_coaching: "Leadership conversation",
};

function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function confidenceBand(value: number | null): ConfidenceBand {
  if (value === null) return "none";
  if (value >= 0.8) return "high";
  if (value >= 0.6) return "moderate";
  return "low";
}

function distribution(
  values: string[],
  labels: Record<string, string>,
  preferredOrder: string[] = []
): QualityDistributionItem[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);

  return Array.from(counts.entries())
    .map(([key, count]) => ({
      key,
      label: labels[key] || key.replaceAll("_", " "),
      count,
      percent: percent(count, values.length),
    }))
    .sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a.key);
      const bIndex = preferredOrder.indexOf(b.key);
      if (aIndex >= 0 || bIndex >= 0) {
        return (aIndex >= 0 ? aIndex : preferredOrder.length) -
          (bIndex >= 0 ? bIndex : preferredOrder.length);
      }
      return b.count - a.count;
    });
}

export function buildDevelopmentOperationsSnapshot(
  analyses: DevelopmentAnalysisRecord[],
  evidence: OperationsEvidenceRow[]
): DevelopmentOperationsSnapshot {
  const evidenceByAnalysis = new Map<string, OperationsEvidenceRow[]>();
  for (const item of evidence) {
    const existing = evidenceByAnalysis.get(item.analysisId) || [];
    existing.push(item);
    evidenceByAnalysis.set(item.analysisId, existing);
  }

  const queue = analyses
    .map((analysis): ReviewQueueItem => {
      const observations = evidenceByAnalysis.get(analysis.id) || [];
      const averageConfidence = observations.length
        ? observations.reduce((sum, item) => sum + item.confidence, 0) /
          observations.length
        : null;
      return {
        id: analysis.id,
        title: analysis.title,
        lens: analysis.lens,
        occurredAt: analysis.occurred_at,
        createdAt: analysis.created_at,
        reviewStatus: analysis.human_review_status,
        reviewNote: analysis.human_review_note,
        safetyFlags: analysis.safety_flags,
        evidenceCount: observations.length,
        averageConfidence,
        confidenceBand: confidenceBand(averageConfidence),
        actionable:
          analysis.human_review_status === "pending" ||
          analysis.human_review_status === "needs_revision",
      };
    })
    .sort((a, b) => {
      if (a.actionable !== b.actionable) return a.actionable ? -1 : 1;
      if (a.safetyFlags.length !== b.safetyFlags.length) {
        return b.safetyFlags.length - a.safetyFlags.length;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const reviewedCount = analyses.filter(
    (analysis) => analysis.human_review_status !== "pending"
  ).length;
  const reportsWithEvidence = analyses.filter((analysis) =>
    evidenceByAnalysis.has(analysis.id)
  ).length;
  const traceableEvidence = evidence.filter(
    (item) => item.evidenceQuote.trim().length > 0
  ).length;
  const averageConfidence = evidence.length
    ? evidence.reduce((sum, item) => sum + item.confidence, 0) / evidence.length
    : null;
  const confidenceKeys = evidence.map((item) => confidenceBand(item.confidence));
  const confidenceLabels: Record<string, string> = {
    high: "High support (0.80–1.00)",
    moderate: "Moderate support (0.60–0.79)",
    low: "Low support (below 0.60)",
  };

  return {
    queue,
    quality: {
      reportCount: analyses.length,
      evidenceCount: evidence.length,
      evidenceCoverageRate: percent(reportsWithEvidence, analyses.length),
      evidenceTraceabilityRate: percent(traceableEvidence, evidence.length),
      averageEvidencePerReport: analyses.length
        ? Math.round((evidence.length / analyses.length) * 10) / 10
        : 0,
      averageConfidence,
      reviewCompletionRate: percent(reviewedCount, analyses.length),
      reviewedCount,
      guardrailFlaggedReports: analyses.filter(
        (analysis) => analysis.safety_flags.length > 0
      ).length,
      actionableReviewCount: queue.filter((item) => item.actionable).length,
      confidenceDistribution: distribution(
        confidenceKeys,
        confidenceLabels,
        ["high", "moderate", "low"]
      ),
      reviewDistribution: distribution(
        analyses.map((analysis) => analysis.human_review_status),
        reviewLabels,
        ["pending", "needs_revision", "approved", "rejected"]
      ),
      lensDistribution: distribution(
        analyses.map((analysis) => analysis.lens),
        lensLabels
      ),
    },
  };
}

export async function getDevelopmentOperations(
  identity: RequestIdentity,
  limit = 200
): Promise<DevelopmentOperationsSnapshot> {
  const analyses = await listAnalyses(identity, {
    limit: Math.min(Math.max(limit, 1), 250),
  });
  if (analyses.length === 0) return buildDevelopmentOperationsSnapshot([], []);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("hdi_evidence")
    .select("analysis_id,confidence,evidence_quote")
    .eq("organization_id", identity.organizationId)
    .in(
      "analysis_id",
      analyses.map((analysis) => analysis.id)
    );

  if (error) throw new Error(`Unable to load HDI operations data: ${error.message}`);

  const evidence: OperationsEvidenceRow[] = (data || []).map((item) => ({
    analysisId: item.analysis_id as string,
    confidence: Number(item.confidence),
    evidenceQuote: item.evidence_quote as string,
  }));

  return buildDevelopmentOperationsSnapshot(analyses, evidence);
}
