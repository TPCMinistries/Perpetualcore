import type { ScraperHealthRow } from "@/lib/rfp/admin-metrics";

export type SourceReadinessStatus = "live" | "degraded" | "planned" | "blocked";
export type SourceReadinessPriority = "p0" | "p1" | "p2";
export type SourceReadinessCategory =
  | "federal"
  | "state"
  | "city"
  | "foundation"
  | "corporate"
  | "research"
  | "import";

export interface SourceReadinessTarget {
  source: string;
  label: string;
  category: SourceReadinessCategory;
  status: SourceReadinessStatus;
  priority: SourceReadinessPriority;
  targetScale: string;
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
  p0Remaining: number;
}

export const RFP_SOURCE_READINESS_TARGETS: SourceReadinessTarget[] = [
  {
    source: "sam_gov",
    label: "SAM.gov Contract Opportunities",
    category: "federal",
    status: "live",
    priority: "p0",
    targetScale: "Federal RFPs and contract notices",
    nextStep: "Keep parser drift at zero and enrich NAICS/agency fields.",
  },
  {
    source: "grants_gov",
    label: "Grants.gov",
    category: "federal",
    status: "live",
    priority: "p0",
    targetScale: "Federal grant opportunities",
    nextStep: "Verify daily ingest volume against Grants.gov published counts.",
  },
  {
    source: "simpler_grants",
    label: "Simpler Grants",
    category: "federal",
    status: "live",
    priority: "p0",
    targetScale: "Federal grant API search",
    nextStep: "Keep as a cross-check against Grants.gov records.",
  },
  {
    source: "sbir",
    label: "SBIR/STTR",
    category: "federal",
    status: "live",
    priority: "p0",
    targetScale: "Innovation and research solicitations",
    nextStep: "Normalize agency program phases and award ranges.",
  },
  {
    source: "ny_state",
    label: "New York State Contract Reporter",
    category: "state",
    status: "live",
    priority: "p0",
    targetScale: "New York State procurement",
    nextStep: "Repair source drift and confirm renewal cadence.",
  },
  {
    source: "nyc_dycd",
    label: "NYC DYCD",
    category: "city",
    status: "live",
    priority: "p0",
    targetScale: "Youth and community development RFPs",
    nextStep: "Keep agency-specific parsing stable.",
  },
  {
    source: "nyc_doe",
    label: "NYC DOE",
    category: "city",
    status: "live",
    priority: "p0",
    targetScale: "Education procurement and grants",
    nextStep: "Add school/program taxonomy tags.",
  },
  {
    source: "nyc_hra",
    label: "NYC HRA",
    category: "city",
    status: "live",
    priority: "p0",
    targetScale: "Human services procurement",
    nextStep: "Confirm deadlines and attachment extraction.",
  },
  {
    source: "nyc_passport",
    label: "NYC PASSPort",
    category: "city",
    status: "live",
    priority: "p0",
    targetScale: "NYC citywide procurement",
    nextStep: "Stabilize source coverage and duplicate matching.",
  },
  {
    source: "foundation_url",
    label: "Manual foundation/imported opportunities",
    category: "import",
    status: "live",
    priority: "p0",
    targetScale: "User-imported foundation and private grants",
    nextStep: "Add structured extraction from imported opportunity pages.",
  },
  {
    source: "ca_grants",
    label: "California Grants Portal",
    category: "state",
    status: "planned",
    priority: "p0",
    targetScale: "High-volume state grant catalog",
    nextStep: "Build connector, baseline count, and dedupe rules.",
  },
  {
    source: "nj_grants",
    label: "New Jersey grants and procurement",
    category: "state",
    status: "planned",
    priority: "p0",
    targetScale: "Regional nonprofit and workforce expansion",
    nextStep: "Inventory official state sources and select canonical feed.",
  },
  {
    source: "ct_grants",
    label: "Connecticut grants and procurement",
    category: "state",
    status: "planned",
    priority: "p1",
    targetScale: "Regional nonprofit and workforce expansion",
    nextStep: "Inventory official state sources and select canonical feed.",
  },
  {
    source: "pa_grants",
    label: "Pennsylvania grants and procurement",
    category: "state",
    status: "planned",
    priority: "p1",
    targetScale: "Regional nonprofit and workforce expansion",
    nextStep: "Inventory official state sources and select canonical feed.",
  },
  {
    source: "fed_register",
    label: "Federal Register funding notices",
    category: "federal",
    status: "live",
    priority: "p1",
    targetScale: "NOFO and policy notices",
    nextStep: "Watch precision and add broader NOFO query terms after QA.",
  },
  {
    source: "nih_grants",
    label: "NIH Guide",
    category: "research",
    status: "planned",
    priority: "p1",
    targetScale: "Biomedical and public health funding",
    nextStep: "Parse NIH Guide opportunities and map activity codes.",
  },
  {
    source: "nsf_grants",
    label: "NSF funding search",
    category: "research",
    status: "planned",
    priority: "p1",
    targetScale: "STEM education and research funding",
    nextStep: "Build source connector and program taxonomy.",
  },
  {
    source: "irs_990_foundations",
    label: "IRS 990 foundation intelligence",
    category: "foundation",
    status: "planned",
    priority: "p1",
    targetScale: "Funder discovery, not open RFP inventory",
    nextStep: "Ingest funder profiles separately from opportunity records.",
  },
  {
    source: "candid_foundation_directory",
    label: "Candid/Foundation Directory",
    category: "foundation",
    status: "blocked",
    priority: "p1",
    targetScale: "Private foundation prospecting",
    nextStep: "Resolve licensing/API terms before ingesting any proprietary data.",
  },
  {
    source: "corporate_foundations",
    label: "Corporate foundation programs",
    category: "corporate",
    status: "planned",
    priority: "p2",
    targetScale: "CSR and corporate giving programs",
    nextStep: "Start with curated target list and manual QA before automation.",
  },
  {
    source: "bank_cra",
    label: "Bank CRA and community grants",
    category: "corporate",
    status: "planned",
    priority: "p2",
    targetScale: "CRA-aligned community investment programs",
    nextStep: "Create curated source list by geography and funding area.",
  },
];

const TARGETS_BY_SOURCE = new Map(
  RFP_SOURCE_READINESS_TARGETS.map((target) => [target.source, target]),
);

function fallbackTarget(source: string): SourceReadinessTarget {
  return {
    source,
    label: source,
    category: "import",
    status: "planned",
    priority: "p2",
    targetScale: "Observed source outside canonical catalog",
    nextStep: "Classify this source and add it to the scale catalog.",
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
      ...RFP_SOURCE_READINESS_TARGETS.map((target) => target.source),
      ...observedSources,
    ]),
  );

  return sourceKeys
    .map((source) => {
      const target = TARGETS_BY_SOURCE.get(source) ?? fallbackTarget(source);
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
  return rows.reduce<SourceReadinessSummary>(
    (summary, row) => {
      summary.totalSources += 1;
      summary.indexed += row.indexed;
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
      p0Remaining: 0,
    },
  );
}
