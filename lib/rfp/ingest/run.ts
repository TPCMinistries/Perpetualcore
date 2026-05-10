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

export interface IngestSourceResult {
  source: "sam_gov" | "grants_gov" | "simpler_grants" | "sbir_gov";
  fetched: number;
  upserted: number;
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
  errors: string[];
}> {
  if (rows.length === 0) return { upserted: 0, errors: [] };

  const supabase = createAdminClient();

  // Cast through unknown to bypass the generated Database type — the new
  // columns from 20260510_rfp_opportunities_extensions.sql aren't reflected
  // in lib/supabase/database.types.ts yet (Phase 5 doesn't regen types).
  const { data, error } = await supabase
    .from("rfp_opportunities")
    .upsert(rows as unknown as never[], {
      onConflict: "source,source_id",
      ignoreDuplicates: false,
    })
    .select("id");

  if (error) {
    return { upserted: 0, errors: [`upsert: ${error.message}`] };
  }

  return { upserted: data?.length ?? rows.length, errors: [] };
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
        errors: [`fetcher rejected: ${reason}`],
      });
      continue;
    }

    const inputs = outcome.value;
    const { rows, errors: normErrors } = normalizeBatch(inputs);
    const { upserted, errors: upsertErrors } = await upsertBatch(rows);

    results.push({
      source: spec.name,
      fetched: inputs.length,
      upserted,
      errors: [...normErrors, ...upsertErrors],
    });
  }

  return results;
}
