#!/usr/bin/env tsx
/**
 * One-off State/City RFP Discovery runner.
 *
 * Calls the existing orchestrator (lib/rfp/ingest/run-state-city.ts) directly,
 * bypassing the cron HTTP route so we don't need CRON_SECRET or `next dev`.
 *
 * Usage:
 *   pnpm exec tsx scripts/run-state-city-ingest-once.ts
 *
 * Disposable. Do not check into prod automation — that's what the cron route
 * is for.
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load env BEFORE importing anything that reads process.env at module init time.
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  // Dynamic import so env is fully loaded before the module evaluates.
  const { runStateCityIngest } = await import(
    "../lib/rfp/ingest/run-state-city"
  );

  const startedAt = Date.now();
  console.log("[runner] starting runStateCityIngest…");
  const results = await runStateCityIngest();
  const duration_ms = Date.now() - startedAt;

  console.log("\n=== Per-source results ===");
  for (const r of results) {
    console.log(
      `  ${r.source.padEnd(10)}  fetched=${String(r.fetched).padStart(4)}  upserted=${String(r.upserted).padStart(4)}  errors=${r.errors.length}`
    );
    for (const e of r.errors) {
      console.log(`    err: ${e}`);
    }
  }

  const totals = results.reduce(
    (acc, r) => {
      acc.fetched += r.fetched;
      acc.upserted += r.upserted;
      acc.errors += r.errors.length;
      return acc;
    },
    { fetched: 0, upserted: 0, errors: 0 }
  );
  console.log(
    `\n=== Totals: fetched=${totals.fetched} upserted=${totals.upserted} errors=${totals.errors} duration=${duration_ms}ms ===`
  );
}

main().catch((e) => {
  console.error("[runner] fatal:", e);
  process.exit(1);
});
