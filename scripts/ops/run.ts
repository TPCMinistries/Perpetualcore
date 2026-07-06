/**
 * Headless ops runner — the "agent runs a skill on its own" entry point.
 *
 *   SUPABASE_ACCESS_TOKEN=... npx tsx scripts/ops/run.ts rls-audit
 *
 * Runs a capability by id, writes findings to the vault, prints a summary.
 * Wire this to cron (Vercel cron route or a CronCreate schedule) to make the
 * sweep happen without you.
 */
import { getCapability, CAPABILITIES } from '../../lib/ops/registry';
import { runCapability } from '../../lib/ops/runner';

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error('usage: tsx scripts/ops/run.ts <capability-id>');
    console.error('available:', CAPABILITIES.map((c) => c.id).join(', '));
    process.exit(1);
  }
  const cap = getCapability(id);
  if (!cap) {
    console.error(`unknown capability "${id}". available: ${CAPABILITIES.map((c) => c.id).join(', ')}`);
    process.exit(1);
  }

  console.error(`▶ running ${cap.label} (${cap.id})…`);
  const result = await runCapability(cap);

  const crit = result.findings.filter((f) => f.severity === 'critical');
  const warn = result.findings.filter((f) => f.severity === 'warn');
  console.error(`\n${cap.label}: worst=${result.worst} · ${crit.length} critical · ${warn.length} warn`);
  for (const f of [...crit, ...warn]) {
    console.error(`  ${f.severity === 'critical' ? '🔴' : '🟡'} [${f.project}] ${f.summary}`);
  }
  console.error(`\n📝 report → ${result.reportPath}`);
}

main().catch((err) => {
  console.error('ops run failed:', err.message);
  process.exit(1);
});
