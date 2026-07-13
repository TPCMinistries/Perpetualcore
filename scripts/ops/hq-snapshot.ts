/**
 * HQ snapshot refresh — standalone entrypoint for weekly-sweep.sh.
 *
 *   npx tsx scripts/ops/hq-snapshot.ts
 *
 * Runs right after the strategist memo lands so the /hq dashboard picks up
 * the fresh weekly memo without waiting for the next daily-brief run. All
 * composition logic lives in lib/ops/hq-snapshot.ts (shared with
 * daily-brief.ts, which also calls it once a day).
 */
import { createManagementExecutor } from '../../lib/ops/executor';
import { pushHqSnapshot } from '../../lib/ops/hq-snapshot';

async function main() {
  const now = new Date().toISOString();
  const runSql = createManagementExecutor();
  await pushHqSnapshot(runSql, now);
  console.error('hq snapshot → pushed');
}

main().catch((err) => {
  console.error('hq-snapshot failed:', err.message);
  process.exit(1);
});
