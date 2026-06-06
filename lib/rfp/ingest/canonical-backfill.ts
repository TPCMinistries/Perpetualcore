/**
 * Backfill/repair canonical opportunity aliases.
 *
 * Fresh ingest writes canonical aliases as opportunities arrive. This helper is
 * the catch-up path for older imported rows or rows created before canonical
 * clustering existed. It is intentionally idempotent and safe to rerun.
 */

import { logRfpCronExecution } from "@/lib/rfp/cron-log";
import {
  persistCanonicalAliases,
  type OpportunityRowWithId,
} from "@/lib/rfp/ingest/canonicalize";
import type { OpportunityRow } from "@/lib/rfp/ingest/normalize";
import { createAdminClient } from "@/lib/supabase/server";

export const RFP_CANONICAL_BACKFILL_CRON = "rfp-canonical-backfill";
export const DEFAULT_CANONICAL_BACKFILL_MAX = 1_000;
export const DEFAULT_CANONICAL_BACKFILL_SCAN_LIMIT = 20_000;

const PAGE_SIZE = 500;

interface OpportunityDbRow {
  id: string;
  source: string;
  source_id: string | null;
  title: string;
  agency: string | null;
  type: string | null;
  amount_min: number | string | null;
  amount_max: number | string | null;
  deadline: string | null;
  posted_at: string | null;
  brief: string | null;
  keywords: string[] | null;
  geo: string | null;
  url: string | null;
  needs_review: boolean | null;
  last_seen_at: string | null;
  raw_json: unknown;
}

interface AliasRow {
  opp_id: string;
}

export interface CanonicalBackfillResult {
  ok: boolean;
  duration_ms: number;
  scanned_opportunities: number;
  missing_aliases: number;
  backfilled_aliases: number;
  canonicals_seen: number;
  sample_backfilled_opp_ids: string[];
  errors: string[];
  warning: string | null;
}

export interface CanonicalBackfillInput {
  maxBackfill?: number;
  scanLimit?: number;
  logExecution?: boolean;
  cronName?: string;
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

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function toOpportunityRow(row: OpportunityDbRow): OpportunityRowWithId {
  return {
    id: row.id,
    source: row.source as OpportunityRow["source"],
    source_id: row.source_id || row.id,
    title: row.title,
    agency: row.agency,
    type: row.type,
    amount_min: toNumberOrNull(row.amount_min),
    amount_max: toNumberOrNull(row.amount_max),
    deadline: row.deadline,
    posted_at: row.posted_at,
    brief: row.brief,
    keywords: row.keywords ?? [],
    geo: row.geo,
    url: row.url,
    needs_review: row.needs_review ?? false,
    last_seen_at: row.last_seen_at ?? new Date(0).toISOString(),
    raw_json: toRecord(row.raw_json),
  };
}

async function findUnaliasedOpportunities(params: {
  maxBackfill: number;
  scanLimit: number;
}): Promise<{ rows: OpportunityRowWithId[]; scanned: number }> {
  const admin = createAdminClient();
  const rows: OpportunityRowWithId[] = [];
  let scanned = 0;

  for (let start = 0; start < params.scanLimit; start += PAGE_SIZE) {
    const remainingScan = params.scanLimit - start;
    const pageEnd = start + Math.min(PAGE_SIZE, remainingScan) - 1;
    const { data: opportunities, error: opportunityError } = await admin
      .from("rfp_opportunities")
      .select(
        "id, source, source_id, title, agency, type, amount_min, amount_max, deadline, posted_at, brief, keywords, geo, url, needs_review, last_seen_at, raw_json",
      )
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
    const { data: aliases, error: aliasError } = await admin
      .from("rfp_opportunity_aliases")
      .select("opp_id")
      .in("opp_id", oppIds)
      .returns<AliasRow[]>();

    if (aliasError) {
      throw new Error(`alias_scan_failed: ${aliasError.message}`);
    }

    const aliasedOppIds = new Set((aliases ?? []).map((row) => row.opp_id));
    for (const opportunity of page) {
      if (aliasedOppIds.has(opportunity.id)) continue;
      rows.push(toOpportunityRow(opportunity));
      if (rows.length >= params.maxBackfill) {
        return { rows, scanned };
      }
    }

    if (page.length < PAGE_SIZE) break;
  }

  return { rows, scanned };
}

export async function runCanonicalBackfill(
  input: CanonicalBackfillInput = {},
): Promise<CanonicalBackfillResult> {
  const startedAt = Date.now();
  const maxBackfill = clampPositiveInt(
    input.maxBackfill,
    DEFAULT_CANONICAL_BACKFILL_MAX,
    5_000,
  );
  const scanLimit = clampPositiveInt(
    input.scanLimit,
    DEFAULT_CANONICAL_BACKFILL_SCAN_LIMIT,
    250_000,
  );
  const cronName = input.cronName ?? RFP_CANONICAL_BACKFILL_CRON;
  const shouldLog = input.logExecution ?? false;

  try {
    const missing = await findUnaliasedOpportunities({ maxBackfill, scanLimit });
    const result = await persistCanonicalAliases(missing.rows);
    const durationMs = Date.now() - startedAt;
    const hasErrors = result.errors.length > 0;

    if (shouldLog) {
      await logRfpCronExecution({
        cronName,
        durationMs,
        status: hasErrors ? "warning" : "success",
        result: {
          scanned_opportunities: missing.scanned,
          missing_aliases: missing.rows.length,
          backfilled_aliases: result.aliases_upserted,
          canonicals_seen: result.canonicals_seen,
          max_backfill: maxBackfill,
          scan_limit: scanLimit,
        },
        errors: hasErrors ? { errors: result.errors.slice(0, 5) } : null,
      });
    }

    return {
      ok: !hasErrors,
      duration_ms: durationMs,
      scanned_opportunities: missing.scanned,
      missing_aliases: missing.rows.length,
      backfilled_aliases: result.aliases_upserted,
      canonicals_seen: result.canonicals_seen,
      sample_backfilled_opp_ids: missing.rows.slice(0, 25).map((row) => row.id),
      errors: result.errors,
      warning: hasErrors
        ? "Canonical backfill found missing aliases, but one or more writes failed."
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
