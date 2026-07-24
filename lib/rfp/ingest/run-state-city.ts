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
  /** Every ID touched by the upsert, retained for manual recovery workflows. */
  upserted_ids: string[];
  /** IDs created during this ingest run and eligible for scheduled scoring. */
  scoring_candidate_ids: string[];
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
  source: string
): source is StateCitySourceName {
  return SCRAPERS.some((scraper) => scraper.source === source);
}

/** Anomaly threshold: parsed_count below 50% of rolling baseline triggers drift. */
const COUNT_ANOMALY_FLOOR_PCT = 0.5;
const UPSERT_BATCH_SIZE = 50;
const MIN_ADAPTIVE_BATCH_SIZE = 12;
const DB_RETRY_ATTEMPTS = 3;
const DB_RETRY_BASE_DELAY_MS = 350;
const MAX_ADAPTIVE_ATTEMPTS = 15;

interface SupabaseMutationResult<T> {
  data: T[] | null;
  error: { code?: string; message?: string } | null;
}

interface AdaptiveMutationResult<T> {
  data: T[];
  error: { code?: string; message?: string } | null;
  attempts: number;
  failedBatchSize: number | null;
  timedOut: boolean;
}

interface AdaptiveMutationOptions {
  minBatchSize?: number;
  maxAttempts?: number;
  retryAttempts?: number;
  retryBaseDelayMs?: number;
}

export function chunkStateCityMutationRows<T>(
  rows: T[],
  batchSize = UPSERT_BATCH_SIZE
): T[][] {
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error("batchSize must be a positive integer");
  }

  const batches: T[][] = [];
  for (let start = 0; start < rows.length; start += batchSize) {
    batches.push(rows.slice(start, start + batchSize));
  }
  return batches;
}

function isDatabaseTimeout(error: {
  code?: string;
  message?: string;
}): boolean {
  const message = error.message ?? "";
  return (
    error.code === "57014" ||
    error.code === "55P03" ||
    /statement timeout|lock timeout|canceling statement due to statement timeout/i.test(
      message
    )
  );
}

function normalizeMutationError(error: unknown): {
  code?: string;
  message?: string;
} {
  if (error instanceof Error) return { message: error.message };
  return { message: String(error) };
}

/**
 * Execute one logical mutation batch with bounded pressure relief.
 *
 * Statement/lock timeouts are not retried at the same size: the batch is split
 * in half until another split would create a batch smaller than minBatchSize.
 * Other failures retain the ordinary bounded retry used for transient network
 * and gateway errors. Successful child batches are returned even if a later
 * child fails, allowing callers to count partial, idempotent progress.
 */
export async function runAdaptiveStateCityMutation<TInput, TOutput>(
  rows: TInput[],
  operation: (
    batch: TInput[]
  ) => Promise<SupabaseMutationResult<TOutput>>,
  options: AdaptiveMutationOptions = {}
): Promise<AdaptiveMutationResult<TOutput>> {
  const minBatchSize = options.minBatchSize ?? MIN_ADAPTIVE_BATCH_SIZE;
  const maxAttempts = options.maxAttempts ?? MAX_ADAPTIVE_ATTEMPTS;
  const retryAttempts = options.retryAttempts ?? DB_RETRY_ATTEMPTS;
  const retryBaseDelayMs =
    options.retryBaseDelayMs ?? DB_RETRY_BASE_DELAY_MS;

  if (minBatchSize < 1 || maxAttempts < 1 || retryAttempts < 1) {
    throw new Error("adaptive mutation limits must be positive integers");
  }

  let attempts = 0;

  const execute = async (
    batch: TInput[]
  ): Promise<AdaptiveMutationResult<TOutput>> => {
    let lastError: { code?: string; message?: string } | null = null;

    for (let retry = 1; retry <= retryAttempts; retry++) {
      if (attempts >= maxAttempts) {
        return {
          data: [],
          error: { message: "adaptive mutation attempt limit reached" },
          attempts,
          failedBatchSize: batch.length,
          timedOut: false,
        };
      }

      attempts += 1;
      let mutation: SupabaseMutationResult<TOutput>;
      try {
        mutation = await operation(batch);
      } catch (error) {
        mutation = { data: null, error: normalizeMutationError(error) };
      }

      if (!mutation.error) {
        return {
          data: mutation.data ?? [],
          error: null,
          attempts,
          failedBatchSize: null,
          timedOut: false,
        };
      }

      lastError = mutation.error;
      if (isDatabaseTimeout(mutation.error)) {
        // Only split when both resulting batches stay at or above the floor.
        if (batch.length >= minBatchSize * 2) {
          const midpoint = Math.floor(batch.length / 2);
          const left = await execute(batch.slice(0, midpoint));
          if (left.error) return left;

          const right = await execute(batch.slice(midpoint));
          return {
            data: [...left.data, ...right.data],
            error: right.error,
            attempts,
            failedBatchSize: right.failedBatchSize,
            timedOut: right.timedOut,
          };
        }

        return {
          data: [],
          error: mutation.error,
          attempts,
          failedBatchSize: batch.length,
          timedOut: true,
        };
      }

      if (retry < retryAttempts) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryBaseDelayMs * retry)
        );
      }
    }

    return {
      data: [],
      error: lastError ?? { message: "unknown database error" },
      attempts,
      failedBatchSize: batch.length,
      timedOut: false,
    };
  };

  return execute(rows);
}

export function buildStateCityUpsertRows(
  opportunities: OpportunityInput[],
  lastSeenAt: string
) {
  return opportunities.map((o) => ({
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
    last_seen_at: lastSeenAt,
  }));
}

export function selectStateCityScoringCandidateIds(
  rows: Array<{ id: string; created_at: string }>,
  ingestStartedAt: string
): string[] {
  const threshold = Date.parse(ingestStartedAt);
  if (!Number.isFinite(threshold)) {
    throw new Error("ingestStartedAt must be a valid timestamp");
  }

  return Array.from(
    new Set(
      rows
        .filter((row) => {
          const createdAt = Date.parse(row.created_at);
          return Number.isFinite(createdAt) && createdAt >= threshold;
        })
        .map((row) => String(row.id))
    )
  );
}

export async function runStateCityIngest(options?: {
  sources?: StateCitySourceName[];
}): Promise<StateCityIngestResult[]> {
  // Capture the boundary before any source fetch begins. Existing rows retain
  // their original created_at through upsert; newly inserted rows receive the
  // database default after this timestamp.
  const ingestStartedAt = new Date().toISOString();
  const requestedSources = new Set(options?.sources ?? []);
  const scrapers =
    requestedSources.size > 0
      ? SCRAPERS.filter(({ source }) => requestedSources.has(source))
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
      scoring_candidate_ids: [],
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
    const rows = buildStateCityUpsertRows(opportunities, now);

    type IdRow = { id: string; created_at: string };
    const idRows: IdRow[] = [];
    let upsertError: string | null = null;
    let failedBatchSize: number | null = null;
    let adaptiveAttempts = 0;
    let timedOut = false;

    for (const batch of chunkStateCityMutationRows(rows)) {
      const mutation = await runAdaptiveStateCityMutation<
        (typeof rows)[number],
        IdRow
      >(batch, (adaptiveBatch) =>
        supabase
          .from("rfp_opportunities")
          .upsert(adaptiveBatch as unknown as never[], {
            onConflict: "source,source_id",
            ignoreDuplicates: false,
          })
          .select("id,created_at")
      );
      const { data, error } = mutation;
      adaptiveAttempts += mutation.attempts;
      idRows.push(...data);

      if (error) {
        timedOut = mutation.timedOut;
        failedBatchSize = mutation.failedBatchSize;
        upsertError = timedOut
          ? "database statement or lock timeout"
          : "database mutation failed";
        result.errors.push(
          `upsert failed: ${upsertError} (failed_batch_size=${failedBatchSize ?? batch.length}, attempts=${adaptiveAttempts})`
        );
        break;
      }
    }

    result.upserted = idRows.length;
    result.upserted_ids = idRows.map((r: IdRow) => String(r.id));
    result.scoring_candidate_ids = selectStateCityScoringCandidateIds(
      idRows,
      ingestStartedAt
    );

    if (upsertError) {
      await recordDrift({
        source,
        reason: "database_error",
        details: {
          stage: "upsert",
          message: upsertError,
          sample_count: rows.length,
          initial_batch_size: UPSERT_BATCH_SIZE,
          failed_batch_size: failedBatchSize,
          mutation_attempts: adaptiveAttempts,
          successfully_upserted: result.upserted,
          timeout: timedOut,
        },
      }).catch(() => {});
    }

    results.push(result);
  }

  return results;
}
