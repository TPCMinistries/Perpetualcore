/**
 * Phase 05-02 — State/City Discovery Orchestrator
 *
 * Runs the four NY/NYC scrapers in parallel via `Promise.allSettled`, upserts
 * the resulting OpportunityInput[] to `rfp_opportunities` idempotently, and
 * emits drift events for parse failures and count anomalies (>50% drop from
 * the rolling 3-run baseline).
 *
 * Pattern mirrors 05-01's `runFederalIngest` so the cron route layer is
 * symmetric. Each source is independent — one source's HTTP failure does not
 * abort the others.
 *
 * Count anomaly logic (orchestrator-side, not scraper-side) per plan Task 2g:
 *   - For each source with parsed_count >= 1, read the rolling baseline
 *     (avg of last 3 successful runs).
 *   - If baseline is non-null AND parsed_count < baseline * 0.5, record a
 *     `count_anomaly` drift event. The records ARE still upserted — drift is
 *     a signal, not a gate.
 *   - Always call `recordBaseline` on success so the rolling window self-heals
 *     if a source legitimately shrinks long-term.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { fetchNyStateOpportunities } from "./scrape/ny-state";
import { fetchNycDycdOpportunities } from "./scrape/nyc-dycd";
import { fetchNycHraOpportunities } from "./scrape/nyc-hra";
import { fetchNycDoeOpportunities } from "./scrape/nyc-doe";
import { fetchCaGrantOpportunities } from "./scrape/ca-grants";
import { fetchNjStartOpportunities } from "./scrape/nj-start";
import { fetchCtCtsourceOpportunities } from "./scrape/ct-ctsource";
import { fetchPaEMarketplaceOpportunities } from "./scrape/pa-emarketplace";
import {
  getRollingBaseline,
  recordBaseline,
  recordDrift,
} from "./scrape/drift";
import type { OpportunityInput, StateCitySourceName } from "./scrape/types";

export type { StateCitySourceName } from "./scrape/types";

export interface StateCityIngestResult {
  source: StateCitySourceName;
  fetched: number;
  upserted: number;
  errors: string[];
  upserted_ids: string[];
}

/** Scrapers to run, paired with their canonical source name. */
const SCRAPERS: Array<{
  source: StateCitySourceName;
  fetch: () => Promise<OpportunityInput[]>;
}> = [
  { source: "ny_state", fetch: fetchNyStateOpportunities },
  { source: "nyc_dycd", fetch: fetchNycDycdOpportunities },
  { source: "nyc_hra", fetch: fetchNycHraOpportunities },
  { source: "nyc_doe", fetch: fetchNycDoeOpportunities },
  { source: "ca_grants", fetch: fetchCaGrantOpportunities },
  { source: "nj_grants", fetch: fetchNjStartOpportunities },
  { source: "ct_grants", fetch: fetchCtCtsourceOpportunities },
  { source: "pa_grants", fetch: fetchPaEMarketplaceOpportunities },
];

export function isStateCityIngestSource(
  source: string,
): source is StateCitySourceName {
  return SCRAPERS.some((scraper) => scraper.source === source);
}

/** Anomaly threshold: parsed_count below 50% of rolling baseline triggers drift. */
const COUNT_ANOMALY_FLOOR_PCT = 0.5;
const UPSERT_BATCH_SIZE = 50;
const LAST_SEEN_BATCH_SIZE = 500;
const DB_RETRY_ATTEMPTS = 3;
const DB_RETRY_BASE_DELAY_MS = 350;

interface SupabaseMutationResult<T> {
  data: T[] | null;
  error: { message?: string } | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDbMutationWithRetry<T>(
  operation: () => Promise<SupabaseMutationResult<T>>,
): Promise<SupabaseMutationResult<T>> {
  let lastError: { message?: string } | null = null;

  for (let attempt = 1; attempt <= DB_RETRY_ATTEMPTS; attempt++) {
    try {
      const result = await operation();
      if (!result.error) return result;
      lastError = result.error;
    } catch (err) {
      lastError = {
        message: err instanceof Error ? err.message : String(err),
      };
    }

    if (attempt < DB_RETRY_ATTEMPTS) {
      await sleep(DB_RETRY_BASE_DELAY_MS * attempt);
    }
  }

  return { data: null, error: lastError ?? { message: "unknown database error" } };
}

export async function runStateCityIngest(options?: {
  sources?: StateCitySourceName[];
}): Promise<StateCityIngestResult[]> {
  const requestedSources = new Set(options?.sources ?? []);
  const scrapers =
    requestedSources.size > 0
      ? SCRAPERS.filter((scraper) => requestedSources.has(scraper.source))
      : SCRAPERS;
  const settled = await Promise.allSettled(
    scrapers.map(async ({ source, fetch }) => {
      const opportunities = await fetch();
      return { source, opportunities };
    })
  );

  // Cast through `any`-typed `from()` for the rfp_* tables — they are not yet
  // present in lib/supabase/database.types.ts (will be regen'd post-Phase-5).
  // Same approach as lib/rfp/ingest/scrape/drift.ts (getRfpClient).
  const supabase = createAdminClient() as unknown as {
    from: (table: string) => any;
  };
  const results: StateCityIngestResult[] = [];

  for (let i = 0; i < settled.length; i++) {
    const { source } = scrapers[i];
    const settledResult = settled[i];

    const result: StateCityIngestResult = {
      source,
      fetched: 0,
      upserted: 0,
      errors: [],
      upserted_ids: [],
    };

    if (settledResult.status === "rejected") {
      // Should never happen — scrapers catch their own errors and call
      // recordDrift internally — but if a refactor breaks that contract,
      // surface it here so the orchestrator does not silently lose data.
      const reason =
        settledResult.reason instanceof Error
          ? settledResult.reason.message
          : String(settledResult.reason);
      result.errors.push(`scraper rejected: ${reason}`);
      await recordDrift({
        source,
        reason: "fetch_error",
        details: {
          orchestrator_caught: true,
          message: reason,
        },
      }).catch(() => {});
      results.push(result);
      continue;
    }

    const opportunities = settledResult.value.opportunities;
    result.fetched = opportunities.length;

    if (opportunities.length === 0) {
      // Drift was already recorded by the scraper. Nothing to upsert.
      results.push(result);
      continue;
    }

    // Count-anomaly check BEFORE upsert (per plan Task 2g) — but never gate
    // the upsert on the result. Records always land; drift is purely signal.
    try {
      const baseline = await getRollingBaseline(source);
      if (
        baseline !== null &&
        opportunities.length < baseline * COUNT_ANOMALY_FLOOR_PCT
      ) {
        await recordDrift({
          source,
          reason: "count_anomaly",
          details: {
            parsed: opportunities.length,
            baseline,
            drop_pct: 1 - opportunities.length / baseline,
            threshold_pct: COUNT_ANOMALY_FLOOR_PCT,
          },
        });
      }
    } catch (e: unknown) {
      result.errors.push(
        `baseline check failed: ${e instanceof Error ? e.message : String(e)}`
      );
    }

    // Always record the new baseline on success — self-healing rolling window.
    try {
      await recordBaseline(source, opportunities.length);
    } catch (e: unknown) {
      result.errors.push(
        `recordBaseline failed: ${e instanceof Error ? e.message : String(e)}`
      );
    }

    // Upsert idempotently on (source, source_id). last_seen_at is owned by
    // 05-01's extension migration; we set it on every row so withdrawn opps
    // can be detected by a future cleanup cron (out of scope for 05-02).
    const now = new Date().toISOString();
    const rows = opportunities.map((o) => ({
      source: o.source,
      source_id: o.source_id,
      title: o.title,
      agency: o.agency ?? null,
      type: o.type ?? null,
      amount_min: o.amount_min ?? null,
      amount_max: o.amount_max ?? null,
      deadline: o.deadline ?? null,
      posted_at: o.posted_at ?? null,
      brief: o.brief ?? null,
      keywords: o.keywords ?? [],
      geo: o.geo ?? null,
      url: o.url ?? null,
      needs_review: o.needs_review ?? false,
      raw_json: o.raw_json ?? {},
    }));

    type IdRow = { id: string };
    const idRows: IdRow[] = [];
    let upsertError: string | null = null;

    // Chunk upserts so large public datasets like California Grants do not
    // hit Postgres statement timeouts while refreshing ~2K records.
    for (let start = 0; start < rows.length; start += UPSERT_BATCH_SIZE) {
      const batch = rows.slice(start, start + UPSERT_BATCH_SIZE);
      const { data, error } = await runDbMutationWithRetry<IdRow>(() =>
        supabase
          .from("rfp_opportunities")
          .upsert(batch as unknown as never[], {
            onConflict: "source,source_id",
            ignoreDuplicates: false,
          })
          .select("id"),
      );

      if (error) {
        upsertError = error.message ?? "unknown database error";
        result.errors.push(`upsert failed: ${upsertError}`);
        break;
      }

      idRows.push(...(((data ?? []) as unknown as IdRow[]) ?? []));
    }

    if (upsertError) {
      await recordDrift({
        source,
        reason: "shape_mismatch",
        details: {
          stage: "upsert",
          message: upsertError,
          sample_count: rows.length,
          batch_size: UPSERT_BATCH_SIZE,
        },
      }).catch(() => {});
    } else {
      result.upserted = idRows.length;
      result.upserted_ids = idRows.map((r: IdRow) => String(r.id));
    }

    // Touch last_seen_at separately if the column exists. Failure here is
    // non-fatal (column may not exist yet pre-05-01).
    if (rows.length > 0 && !upsertError) {
      const ids = result.upserted_ids;
      if (ids.length > 0) {
        for (let start = 0; start < ids.length; start += LAST_SEEN_BATCH_SIZE) {
          const batch = ids.slice(start, start + LAST_SEEN_BATCH_SIZE);
          const touch = await runDbMutationWithRetry<never>(() =>
            supabase
              .from("rfp_opportunities")
              .update({ last_seen_at: now } as never)
              .in("id", batch),
          );
          if (
            touch.error &&
            !/column .* does not exist/i.test(
              touch.error.message ?? "unknown database error",
            )
          ) {
            const touchError = touch.error.message ?? "unknown database error";
            result.errors.push(
              `last_seen_at update failed: ${touchError}`
            );
            break;
          }
        }
      }
    }

    results.push(result);
  }

  return results;
}
