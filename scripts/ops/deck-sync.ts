/**
 * Deck sync — the fast loop behind the Sage /deck HUD.
 *
 *   npx tsx scripts/ops/deck-sync.ts
 *
 * Every run (launchd com.lorenzo.deck-sync, every 10 min):
 *   1. Fleet scan       → deck_snapshots.fleet      (git state across repos)
 *   2. Needs-You digest → deck_snapshots.needs_you   (handoff action items)
 *   3. Drain intents    → deck_intents status=queued (deck buttons → capability runs)
 *
 * Read-only against every repo and DB except the deck_* tables themselves.
 * Capabilities are findings-only by contract — nothing here can mutate state.
 */
import { createManagementExecutor } from '../../lib/ops/executor';
import { scanFleet } from '../../lib/ops/fleet';
import { extractNeedsYou } from '../../lib/ops/needs-you';
import { pushSnapshot, BRAIN_TARGET } from '../../lib/ops/deck-push';
import { getCapability } from '../../lib/ops/registry';
import { runCapability } from '../../lib/ops/runner';

interface IntentRow {
  id: string;
  intent: string;
}

async function drainIntents(runSql: ReturnType<typeof createManagementExecutor>): Promise<number> {
  const queued = (await runSql(
    BRAIN_TARGET,
    `update public.deck_intents
       set status = 'running', started_at = now()
     where id in (
       select id from public.deck_intents
       where status = 'queued' order by created_at limit 3
     )
     returning id, intent;`,
  )) as unknown as IntentRow[];

  for (const row of queued) {
    const cap = getCapability(row.intent);
    if (!cap) {
      await runSql(
        BRAIN_TARGET,
        `update public.deck_intents set status = 'error', finished_at = now(),
           error = 'unknown capability' where id = '${row.id}';`,
      );
      continue;
    }
    try {
      const result = await runCapability(cap, { runSql });
      const summary = {
        worst: result.worst,
        critical: result.findings.filter((f) => f.severity === 'critical').length,
        warn: result.findings.filter((f) => f.severity === 'warn').length,
        report: result.reportPath,
      };
      await runSql(
        BRAIN_TARGET,
        `update public.deck_intents set status = 'done', finished_at = now(),
           result = '${JSON.stringify(summary).replace(/'/g, "''")}'::jsonb
         where id = '${row.id}';`,
      );
    } catch (err) {
      await runSql(
        BRAIN_TARGET,
        `update public.deck_intents set status = 'error', finished_at = now(),
           error = '${String((err as Error).message).replace(/'/g, "''").slice(0, 500)}'
         where id = '${row.id}';`,
      );
    }
  }
  return queued.length;
}

async function main() {
  const runSql = createManagementExecutor();

  const fleet = scanFleet();
  await pushSnapshot(runSql, 'fleet', { repos: fleet });
  console.error(`fleet: ${fleet.length} repos (${fleet.filter((r) => r.dirty > 0).length} dirty)`);

  const needsYou = await extractNeedsYou();
  await pushSnapshot(runSql, 'needs_you', { items: needsYou });
  console.error(`needs-you: ${needsYou.length} items`);

  const drained = await drainIntents(runSql);
  console.error(`intents drained: ${drained}`);
}

main().catch((err) => {
  console.error('deck-sync failed:', err.message);
  process.exit(1);
});
