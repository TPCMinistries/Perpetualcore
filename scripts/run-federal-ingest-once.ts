#!/usr/bin/env tsx
/**
 * One-off Federal RFP Discovery runner.
 *
 * Calls the existing orchestrator (lib/rfp/ingest/run.ts → runFederalIngest)
 * directly, bypassing the cron HTTP route so we don't need CRON_SECRET or
 * `next dev`. Used to populate SAM.gov / Grants.gov / Simpler / SBIR /
 * Federal Register / NIH after wiring a fresh SAM_GOV_API_KEY.
 *
 * Usage:
 *   pnpm exec tsx scripts/run-federal-ingest-once.ts
 *
 * Disposable dev utility. Prod automation is the cron route.
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const { runFederalIngest } = await import("../lib/rfp/ingest/run");

  const startedAt = Date.now();
  console.log("[runner] starting runFederalIngest…");
  const results = await runFederalIngest();
  const duration_ms = Date.now() - startedAt;

  console.log("\n=== Per-source results ===");
  for (const r of results) {
    console.log(
      `  ${r.source.padEnd(14)}  fetched=${String(r.fetched).padStart(4)}  upserted=${String(r.upserted).padStart(4)}  errors=${r.errors.length}`
    );
    for (const e of r.errors) console.log(`    err: ${e}`);
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
