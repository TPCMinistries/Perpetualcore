import type { ScraperHealthRow } from "@/lib/rfp/admin-metrics";
import {
  getRfpSourceCatalogEntry,
  RFP_SOURCE_CATALOG,
  type RfpSourceCatalogEntry,
  type RfpSourceCategory,
  type RfpSourceIngestMode,
  type RfpSourcePriority,
} from "@/lib/rfp/source-catalog";

export type SourceReadinessStatus = "live" | "degraded" | "planned" | "blocked";
export type SourceReadinessPriority = RfpSourcePriority;
export type SourceReadinessCategory = RfpSourceCategory;

export interface SourceReadinessTarget {
  source: string;
  label: string;
  category: SourceReadinessCategory;
  status: SourceReadinessStatus;
  priority: SourceReadinessPriority;
  ingestMode: RfpSourceIngestMode;
  geography: string;
  targetScale: string;
  targetIndexedEstimate: number | null;
  canonicalUrl: string | null;
  nextStep: string;
}

export interface SourceReadinessRow extends SourceReadinessTarget {
  indexed: number;
  openDrift: number;
  lastBaselineAt: string | null;
  lastBaselineParsed: number | null;
  lastDriftAt: string | null;
  lastDriftReason: string | null;
  effectiveStatus: SourceReadinessStatus;
}

export interface SourceReadinessSummary {
  totalSources: number;
  live: number;
  degraded: number;
  planned: number;
  blocked: number;
  indexed: number;
  targetIndexedEstimate: number;
  indexedCoveragePercent: number | null;
  p0Remaining: number;
}

function toReadinessTarget(entry: RfpSourceCatalogEntry): SourceReadinessTarget {
  return {
    source: entry.source,
    label: entry.label,
    category: entry.category,
    status: entry.status,
    priority: entry.priority,
    ingestMode: entry.ingestMode,
    geography: entry.geography,
    targetScale: entry.targetScale,
    targetIndexedEstimate: entry.targetIndexedEstimate,
    canonicalUrl: entry.canonicalUrl,
    nextStep: entry.nextStep,
  };
}

function deriveStatus(
  target: SourceReadinessTarget,
  health: ScraperHealthRow | undefined,
): SourceReadinessStatus {
  if (!health) return target.status;
  if (health.open_drift_events > 0) return "degraded";
  if (health.opportunities_total > 0 || health.last_baseline_at) return "live";
  return target.status;
}

export function buildSourceReadiness(
  scraperHealth: ScraperHealthRow[],
): SourceReadinessRow[] {
  const healthBySource = new Map(scraperHealth.map((row) => [row.source, row]));
  const observedSources = scraperHealth.map((row) => row.source);
  const sourceKeys = Array.from(
    new Set([
      ...RFP_SOURCE_CATALOG.map((target) => target.source),
      ...observedSources,
    ]),
  );

  return sourceKeys
    .map((source) => {
      const target = toReadinessTarget(getRfpSourceCatalogEntry(source));
      const health = healthBySource.get(source);
      return {
        ...target,
        indexed: health?.opportunities_total ?? 0,
        openDrift: health?.open_drift_events ?? 0,
        lastBaselineAt: health?.last_baseline_at ?? null,
        lastBaselineParsed: health?.last_baseline_parsed ?? null,
        lastDriftAt: health?.last_drift_at ?? null,
        lastDriftReason: health?.last_drift_reason ?? null,
        effectiveStatus: deriveStatus(target, health),
      };
    })
    .sort((a, b) => {
      const priorityOrder = { p0: 0, p1: 1, p2: 2 };
      const statusOrder = { degraded: 0, live: 1, planned: 2, blocked: 3 };
      return (
        statusOrder[a.effectiveStatus] - statusOrder[b.effectiveStatus] ||
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        a.category.localeCompare(b.category) ||
        a.label.localeCompare(b.label)
      );
    });
}

export function summarizeSourceReadiness(
  rows: SourceReadinessRow[],
): SourceReadinessSummary {
  const summary = rows.reduce<SourceReadinessSummary>(
    (summary, row) => {
      summary.totalSources += 1;
      summary.indexed += row.indexed;
      summary.targetIndexedEstimate += row.targetIndexedEstimate ?? 0;
      summary[row.effectiveStatus] += 1;
      if (row.priority === "p0" && row.effectiveStatus !== "live") {
        summary.p0Remaining += 1;
      }
      return summary;
    },
    {
      totalSources: 0,
      live: 0,
      degraded: 0,
      planned: 0,
      blocked: 0,
      indexed: 0,
      targetIndexedEstimate: 0,
      indexedCoveragePercent: null,
      p0Remaining: 0,
    },
  );

  summary.indexedCoveragePercent =
    summary.targetIndexedEstimate > 0
      ? Math.min(100, (summary.indexed / summary.targetIndexedEstimate) * 100)
      : null;

  return summary;
}
