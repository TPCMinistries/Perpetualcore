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
import {
  getRollingBaseline,
  recordBaseline,
  recordDrift,
} from "./scrape/drift";
import type { OpportunityInput, StateCitySourceName } from "./scrape/types";

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
];

/** Anomaly threshold: parsed_count below 50% of rolling baseline triggers drift. */
const COUNT_ANOMALY_FLOOR_PCT = 0.5;

export async function runStateCityIngest(): Promise<StateCityIngestResult[]> {
  const settled = await Promise.allSettled(
    SCRAPERS.map(async ({ source, fetch }) => {
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
    const { source } = SCRAPERS[i];
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
      raw_json: o.raw_json ?? {},
      // 05-01 extension columns. Inserts succeed even without them because the
      // columns are nullable / defaulted; if 05-01 lands first they get
      // populated, if 05-02 lands first these are simply ignored (column
      // doesn't exist yet → Supabase returns an error, which we'd want to
      // surface). To stay forward-compatible, we DO NOT include columns that
      // depend on 05-01 being applied. Once 05-01 lands, the next cron tick
      // will start populating them.
    }));

    // Cast through unknown to bypass the generated Database type — the new
    // columns (last_seen_at) and new source enum values ('nyc_hra', 'nyc_doe')
    // from the 05-01 / 05-02 migrations aren't reflected in
    // lib/supabase/database.types.ts yet. Matches the pattern used in
    // lib/rfp/ingest/run.ts (federal orchestrator).
    const { data, error } = await supabase
      .from("rfp_opportunities")
      .upsert(rows as unknown as never[], {
        onConflict: "source,source_id",
        ignoreDuplicates: false,
      })
      .select("id");

    if (error) {
      result.errors.push(`upsert failed: ${error.message}`);
      await recordDrift({
        source,
        reason: "shape_mismatch",
        details: {
          stage: "upsert",
          message: error.message,
          sample_count: rows.length,
        },
      }).catch(() => {});
    } else {
      type IdRow = { id: string };
      const idRows = (data ?? []) as IdRow[];
      result.upserted = idRows.length;
      result.upserted_ids = idRows.map((r: IdRow) => String(r.id));
    }

    // Touch last_seen_at separately if the column exists. Failure here is
    // non-fatal (column may not exist yet pre-05-01).
    if (rows.length > 0 && !error) {
      const ids = result.upserted_ids;
      if (ids.length > 0) {
        const touch = await supabase
          .from("rfp_opportunities")
          .update({ last_seen_at: now } as never)
          .in("id", ids);
        if (touch.error && !/column .* does not exist/i.test(touch.error.message)) {
          result.errors.push(
            `last_seen_at update failed: ${touch.error.message}`
          );
        }
      }
    }

    results.push(result);
  }

  return results;
}
