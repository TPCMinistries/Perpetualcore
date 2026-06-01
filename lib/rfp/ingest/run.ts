/**
 * Federal Discovery ingest orchestrator.
 *
 * Runs all four federal-source fetchers in parallel via Promise.allSettled,
 * normalizes each input to the rfp_opportunities row shape, and upserts in
 * a single batch per source onto (source, source_id) — idempotent on re-run.
 *
 * Design contract:
 *   - One fetcher rejecting NEVER breaks the run; the orchestrator records the
 *     error per source and continues with the others.
 *   - Per-record normalization failures are logged and counted; the rest of
 *     that source's batch still upserts.
 *   - upsert with `ignoreDuplicates: false` so `last_seen_at` and any drifted
 *     fields (title, amount, deadline) update on existing rows.
 *
 * Used by:
 *   app/api/cron/rfp-discovery-federal/route.ts (Vercel Cron, every 6h)
 */

import { createAdminClient } from "@/lib/supabase/server";
import {
  type OpportunityInput,
  normalizeOpportunity,
  type OpportunityRow,
} from "@/lib/rfp/ingest/normalize";
import { fetchSamGovOpportunities } from "@/lib/rfp/ingest/sam-gov";
import { fetchGrantsGovOpportunities } from "@/lib/rfp/ingest/grants-gov";
import { fetchSimplerGrantsOpportunities } from "@/lib/rfp/ingest/simpler-grants";
import { fetchSbirOpportunities } from "@/lib/rfp/ingest/sbir";
import { fetchFederalRegisterOpportunities } from "@/lib/rfp/ingest/federal-register";

export interface IngestSourceResult {
  source:
    | "sam_gov"
    | "grants_gov"
    | "simpler_grants"
    | "sbir_gov"
    | "fed_register";
  fetched: number;
  upserted: number;
  /**
   * Opportunity IDs that were upserted in this run.
   * Phase 05-03 scoring (lib/rfp/scoring/recompute.ts) consumes these to score
   * only the freshly seen opps; existing rows are not re-scored unless the
   * org's capture profile changes (handled separately by recomputeAllForOrg).
   */
  upserted_ids: string[];
  errors: string[];
}

export type IngestRunResult = IngestSourceResult[];

interface FetcherSpec {
  name: IngestSourceResult["source"];
  run: () => Promise<OpportunityInput[]>;
}

/**
 * Normalize a batch and return both the row set and any per-record errors.
 * Per-record errors do NOT abort the batch.
 */
function normalizeBatch(
  inputs: OpportunityInput[]
): { rows: OpportunityRow[]; errors: string[] } {
  const rows: OpportunityRow[] = [];
  const errors: string[] = [];
  for (const input of inputs) {
    try {
      rows.push(normalizeOpportunity(input));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`normalize: ${msg} (source_id=${input.source_id ?? "?"})`);
    }
  }
  return { rows, errors };
}

/**
 * Upsert a batch of opportunity rows for a single source.
 * Conflict key: (source, source_id) — defined by the UNIQUE constraint in
 * supabase/migrations/20260509_rfp_schema.sql.
 *
 * Returns the count of rows the database accepted. Supabase upsert returns
 * the upserted rows; we use that count as the truth.
 */
async function upsertBatch(rows: OpportunityRow[]): Promise<{
  upserted: number;
  upserted_ids: string[];
  errors: string[];
}> {
  if (rows.length === 0) return { upserted: 0, upserted_ids: [], errors: [] };

  // Cast through `{ from: (table: string) => any }` because rfp_* tables
  // are not yet in lib/supabase/database.types.ts (regen deferred per
  // CLAUDE.md). Without the cast, `.from("rfp_opportunities")` fails the
  // generated literal-table-name overload (TS2769 / TS2589). Mirrors the
  // pattern in lib/rfp/ingest/run-state-city.ts and lib/rfp/scoring/recompute.ts.
  const supabase = createAdminClient() as unknown as {
    from: (table: string) => any;
  };

  const { data, error } = await supabase
    .from("rfp_opportunities")
    .upsert(rows as unknown as never[], {
      onConflict: "source,source_id",
      ignoreDuplicates: false,
    })
    .select("id");

  if (error) {
    return { upserted: 0, upserted_ids: [], errors: [`upsert: ${error.message}`] };
  }

  // Surface the upserted IDs so the cron route can hand them to Phase 05-03
  // scoring. The cast above loses supabase-js's type for `data`; narrow inline.
  type IdRow = { id: string };
  const idRows = (data ?? []) as unknown as IdRow[];
  const upserted_ids = idRows.map((r) => String(r.id));

  return { upserted: idRows.length || rows.length, upserted_ids, errors: [] };
}

/**
 * Run all federal-source fetchers in parallel, normalize, upsert.
 *
 * Returns one IngestSourceResult per source. Never throws.
 */
export async function runFederalIngest(): Promise<IngestRunResult> {
  const fetchers: FetcherSpec[] = [
    { name: "sam_gov", run: () => fetchSamGovOpportunities() },
    { name: "grants_gov", run: () => fetchGrantsGovOpportunities() },
    { name: "simpler_grants", run: () => fetchSimplerGrantsOpportunities() },
    { name: "sbir_gov", run: () => fetchSbirOpportunities() },
    { name: "fed_register", run: () => fetchFederalRegisterOpportunities() },
  ];

  const settled = await Promise.allSettled(fetchers.map((f) => f.run()));

  const results: IngestRunResult = [];

  for (let i = 0; i < fetchers.length; i++) {
    const spec = fetchers[i];
    const outcome = settled[i];

    if (outcome.status === "rejected") {
      const reason =
        outcome.reason instanceof Error
          ? outcome.reason.message
          : String(outcome.reason);
      console.error(`[error] ${spec.name}: fetcher rejected — ${reason}`);
      results.push({
        source: spec.name,
        fetched: 0,
        upserted: 0,
        upserted_ids: [],
        errors: [`fetcher rejected: ${reason}`],
      });
      continue;
    }

    const inputs = outcome.value;
    const { rows, errors: normErrors } = normalizeBatch(inputs);
    const { upserted, upserted_ids, errors: upsertErrors } = await upsertBatch(rows);

    results.push({
      source: spec.name,
      fetched: inputs.length,
      upserted,
      upserted_ids,
      errors: [...normErrors, ...upsertErrors],
    });
  }

  return results;
}
