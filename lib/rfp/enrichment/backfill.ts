/**
 * Backfill/repair opportunity enrichments.
 *
 * Detail pages can generate enrichment on demand, but production discovery
 * should not wait for the first user click to structure eligibility, documents,
 * submission method, and source-depth risks. This helper precomputes missing
 * enrichment rows and is safe to rerun.
 */

import { logRfpCronExecution } from "@/lib/rfp/cron-log";
import {
  generateOpportunityEnrichment,
  type OpportunityEnrichment,
  type OpportunityForEnrichment,
} from "@/lib/rfp/enrichment/generate";
import { createAdminClient } from "@/lib/supabase/server";

export const RFP_ENRICHMENT_BACKFILL_CRON = "rfp-enrichment-backfill";
export const DEFAULT_ENRICHMENT_BACKFILL_MAX = 1_000;
export const DEFAULT_ENRICHMENT_BACKFILL_SCAN_LIMIT = 20_000;

const PAGE_SIZE = 500;
const OPPORTUNITY_COLUMNS =
  "id, source, title, agency, amount_min, amount_max, deadline, posted_at, brief, url, raw_json";

interface OpportunityDbRow {
  id: string;
  source: string;
  title: string;
  agency: string | null;
  amount_min: number | string | null;
  amount_max: number | string | null;
  deadline: string | null;
  posted_at: string | null;
  brief: string | null;
  url: string | null;
  raw_json: unknown;
}

interface EnrichmentKeyRow {
  opp_id: string;
}

export interface EnrichmentBackfillResult {
  ok: boolean;
  duration_ms: number;
  scanned_opportunities: number;
  missing_enrichments: number;
  enriched: number;
  average_quality_score: number | null;
  sample_enriched_opp_ids: string[];
  errors: string[];
  warning: string | null;
}

export interface EnrichmentBackfillInput {
  maxBackfill?: number;
  scanLimit?: number;
  logExecution?: boolean;
  cronName?: string;
}

interface UpsertResult {
  data: Array<{ opp_id: string; quality_score: number | string | null }> | null;
  error: { message: string } | null;
}

function clampPositiveInt(value: number | undefined, fallback: number, max: number): number {
  if (!Number.isFinite(value) || !value || value <= 0) return fallback;
  return Math.min(Math.floor(value), max);
}

function toNumberOrNull(value: number | string | null): number | null {
  if (value === null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toOpportunity(row: OpportunityDbRow): OpportunityForEnrichment {
  return {
    id: row.id,
    source: row.source,
    title: row.title,
    agency: row.agency,
    amount_min: toNumberOrNull(row.amount_min),
    amount_max: toNumberOrNull(row.amount_max),
    deadline: row.deadline,
    posted_at: row.posted_at,
    brief: row.brief,
    url: row.url,
    raw_json: row.raw_json,
  };
}

function toDbRow(enrichment: OpportunityEnrichment): Record<string, unknown> {
  return {
    opp_id: enrichment.opp_id,
    source: enrichment.source,
    eligibility: enrichment.eligibility,
    required_documents: enrichment.required_documents,
    submission_method: enrichment.submission_method,
    submission_url: enrichment.submission_url,
    contact: enrichment.contact,
    matching_funds: enrichment.matching_funds,
    funding_method: enrichment.funding_method,
    award_range: enrichment.award_range,
    timeline: enrichment.timeline,
    risks: enrichment.risks,
    missing_fields: enrichment.missing_fields,
    quality_score: enrichment.quality_score,
    raw: enrichment.raw,
    updated_at: new Date().toISOString(),
  };
}

function averageQuality(rows: OpportunityEnrichment[]): number | null {
  if (rows.length === 0) return null;
  const total = rows.reduce((sum, row) => sum + row.quality_score, 0);
  return Math.round((total / rows.length) * 10) / 10;
}

async function findMissingEnrichmentOpportunities(params: {
  maxBackfill: number;
  scanLimit: number;
}): Promise<{ rows: OpportunityForEnrichment[]; scanned: number }> {
  const admin = createAdminClient();
  const missing: OpportunityForEnrichment[] = [];
  let scanned = 0;

  for (let start = 0; start < params.scanLimit; start += PAGE_SIZE) {
    const remainingScan = params.scanLimit - start;
    const pageEnd = start + Math.min(PAGE_SIZE, remainingScan) - 1;
    const { data: opportunities, error: opportunityError } = await admin
      .from("rfp_opportunities")
      .select(OPPORTUNITY_COLUMNS)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(start, pageEnd)
      .returns<OpportunityDbRow[]>();

    if (opportunityError) {
      throw new Error(`opportunity_scan_failed: ${opportunityError.message}`);
    }

    const page = opportunities ?? [];
    if (page.length === 0) break;
    scanned += page.length;

    const oppIds = page.map((row) => row.id);
    const { data: existing, error: enrichmentError } = await admin
      .from("rfp_opportunity_enrichments")
      .select("opp_id")
      .in("opp_id", oppIds)
      .returns<EnrichmentKeyRow[]>();

    if (enrichmentError) {
      throw new Error(`enrichment_scan_failed: ${enrichmentError.message}`);
    }

    const enrichedOppIds = new Set((existing ?? []).map((row) => row.opp_id));
    for (const opportunity of page) {
      if (enrichedOppIds.has(opportunity.id)) continue;
      missing.push(toOpportunity(opportunity));
      if (missing.length >= params.maxBackfill) {
        return { rows: missing, scanned };
      }
    }

    if (page.length < PAGE_SIZE) break;
  }

  return { rows: missing, scanned };
}

export async function runEnrichmentBackfill(
  input: EnrichmentBackfillInput = {},
): Promise<EnrichmentBackfillResult> {
  const startedAt = Date.now();
  const maxBackfill = clampPositiveInt(
    input.maxBackfill,
    DEFAULT_ENRICHMENT_BACKFILL_MAX,
    5_000,
  );
  const scanLimit = clampPositiveInt(
    input.scanLimit,
    DEFAULT_ENRICHMENT_BACKFILL_SCAN_LIMIT,
    250_000,
  );
  const cronName = input.cronName ?? RFP_ENRICHMENT_BACKFILL_CRON;
  const shouldLog = input.logExecution ?? false;

  try {
    const missing = await findMissingEnrichmentOpportunities({ maxBackfill, scanLimit });
    const enrichments = missing.rows.map((opportunity) =>
      generateOpportunityEnrichment(opportunity),
    );

    let enriched = 0;
    const errors: string[] = [];
    if (enrichments.length > 0) {
      const admin = createAdminClient() as unknown as {
        from: (table: "rfp_opportunity_enrichments") => {
          upsert: (
            rows: Record<string, unknown>[],
            options: { onConflict: string },
          ) => {
            select: (columns: string) => Promise<UpsertResult>;
          };
        };
      };

      const { data, error } = await admin
        .from("rfp_opportunity_enrichments")
        .upsert(enrichments.map(toDbRow), { onConflict: "opp_id" })
        .select("opp_id, quality_score");

      if (error) {
        errors.push(`enrichment_upsert_failed: ${error.message}`);
      } else {
        enriched = data?.length ?? enrichments.length;
      }
    }

    const durationMs = Date.now() - startedAt;
    const hasErrors = errors.length > 0;
    const avgQuality = averageQuality(enrichments);

    if (shouldLog) {
      await logRfpCronExecution({
        cronName,
        durationMs,
        status: hasErrors ? "warning" : "success",
        result: {
          scanned_opportunities: missing.scanned,
          missing_enrichments: missing.rows.length,
          enriched,
          average_quality_score: avgQuality,
          max_backfill: maxBackfill,
          scan_limit: scanLimit,
        },
        errors: hasErrors ? { errors: errors.slice(0, 5) } : null,
      });
    }

    return {
      ok: !hasErrors,
      duration_ms: durationMs,
      scanned_opportunities: missing.scanned,
      missing_enrichments: missing.rows.length,
      enriched,
      average_quality_score: avgQuality,
      sample_enriched_opp_ids: missing.rows.slice(0, 25).map((row) => row.id),
      errors,
      warning: hasErrors
        ? "Enrichment backfill found missing rows, but one or more writes failed."
        : null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    if (shouldLog) {
      await logRfpCronExecution({
        cronName,
        durationMs: Date.now() - startedAt,
        status: "error",
        errors: { message: message.slice(0, 200) },
      });
    }
    throw err;
  }
}
