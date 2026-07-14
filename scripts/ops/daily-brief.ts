/**
 * Daily operating brief — the "one page at 7am".
 *
 *   npx tsx scripts/ops/daily-brief.ts
 *
 * Freshens the pulse (revenue-pulse + pipeline + portfolio-pnl), then gathers metrics + security
 * rollup + fleet + needs-you and composes a deterministic brief to the vault
 * (canonical) and deck_snapshots.daily_brief (for the Sage /deck tile). Every
 * source is isolated with allSettled — one failure degrades that section only.
 */
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createManagementExecutor } from '../../lib/ops/executor';
import { runCapability } from '../../lib/ops/runner';
import { getCapability } from '../../lib/ops/registry';
import { scanFleet } from '../../lib/ops/fleet';
import { extractNeedsYou } from '../../lib/ops/needs-you';
import { pushSnapshot, BRAIN_TARGET } from '../../lib/ops/deck-push';
import { pushHqSnapshot } from '../../lib/ops/hq-snapshot';
import { composeBrief, renderBriefTelegram, type RevenuePoint, type SecurityRollup, type TaskLite } from '../../lib/ops/brief';
import { sendOpsTelegram } from '../../lib/ops/telegram';
import { HEADLINE_PROJECT } from '../../lib/ops/capabilities/portfolio-pnl';
import { SPEED_TO_LEAD_HEADLINE } from '../../lib/ops/capabilities/speed-to-lead';
import { REACTIVATION_HEADLINE } from '../../lib/ops/capabilities/reactivation';
import type { Finding, Row } from '../../lib/ops/types';

const OPS_DIR = path.join(os.homedir(), 'dev', 'LDC-Command-Center-Vault', '_claude', 'memory', 'ops-findings');

// Owner Telegram chat (Lorenzo). Override with OPS_BRIEF_CHAT_ID if needed. Not a secret.
const BRIEF_CHAT_ID = process.env.OPS_BRIEF_CHAT_ID || '6460142816';

async function settled<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (err) {
    console.error(`brief section failed (continuing): ${(err as Error).message}`);
    return fallback;
  }
}

async function readSecurityRollup(): Promise<SecurityRollup | null> {
  try {
    const md = await fs.readFile(path.join(OPS_DIR, 'ops-status.md'), 'utf8');
    const row = md.split('\n').find((l) => /rls sweep/i.test(l) && l.includes('|'));
    if (!row) return null;
    const cells = row.split('|').map((c) => c.trim());
    // | Capability | Worst | Crit | Warn | Last run | Report |
    // worst cell looks like "🔴 critical" — take the first token (avoids surrogate-pair regex issues)
    const worstIcon = cells[2].split(/\s+/)[0] || '🔵';
    return { worstIcon, crit: parseInt(cells[3], 10) || 0, warn: parseInt(cells[4], 10) || 0, day: cells[5] || '' };
  } catch {
    return null;
  }
}

async function main() {
  const now = new Date().toISOString();
  const runSql = createManagementExecutor();

  // 1) freshen the pulse (each capability isolated)
  const pulseCap = getCapability('revenue-pulse');
  const pipelineCap = getCapability('pipeline');
  const pnlCap = getCapability('portfolio-pnl');
  const pulseFindings: Finding[] = pulseCap
    ? await settled(runCapability(pulseCap, { runSql, now }).then((r) => r.findings), [])
    : [];
  const pipelineFindings: Finding[] = pipelineCap
    ? await settled(runCapability(pipelineCap, { runSql, now }).then((r) => r.findings), [])
    : [];
  const pnlFindings: Finding[] = pnlCap
    ? await settled(runCapability(pnlCap, { runSql, now }).then((r) => r.findings), [])
    : [];
  const pnlHeadline = pnlFindings.find((f) => f.project === HEADLINE_PROJECT)?.summary ?? null;

  // Revenue Crew — speed-to-lead + reactivation (queued outbound, never auto-sent)
  const stlCap = getCapability('speed-to-lead');
  const reactivationCap = getCapability('reactivation');
  const stlFindings: Finding[] = stlCap
    ? await settled(runCapability(stlCap, { runSql, now }).then((r) => r.findings), [])
    : [];
  const reactivationFindings: Finding[] = reactivationCap
    ? await settled(runCapability(reactivationCap, { runSql, now }).then((r) => r.findings), [])
    : [];
  const stlHeadline = stlFindings.find((f) => f.project === SPEED_TO_LEAD_HEADLINE)?.summary ?? null;
  const reactivationHeadline = reactivationFindings.find((f) => f.project === REACTIVATION_HEADLINE)?.summary ?? null;
  const revenueCrewParts = [stlHeadline, reactivationHeadline].filter((s): s is string => s !== null);
  const revenueCrewLine = revenueCrewParts.length ? revenueCrewParts.join(' · ') : null;

  // 2) today's metrics + cumulative gross
  const revenue: RevenuePoint[] = await settled(
    runSql(
      BRAIN_TARGET,
      `select source, segment, metric, value::float8 as value
         from public.deck_metrics where day = current_date`,
    ).then((rows) =>
      (rows as Row[]).map((r) => ({
        source: String(r.source),
        segment: String(r.segment),
        metric: String(r.metric),
        value: Number(r.value) || 0,
      })),
    ),
    [],
  );
  const cumulative = await settled(
    runSql(
      BRAIN_TARGET,
      `select coalesce(sum(value),0)::float8 as gross, min(day)::text as first_day
         from public.deck_metrics where metric = 'gross_usd_24h'`,
    ).then((rows) => {
      const r = (rows as Row[])[0];
      return { gross: Number(r?.gross) || 0, firstDay: (r?.first_day as string) || null };
    }),
    { gross: 0, firstDay: null },
  );

  // 3) security, fleet, needs-you
  const security = await settled(readSecurityRollup(), null);
  const fleet = await settled(Promise.resolve(scanFleet()), []);
  const needsYou = await settled(extractNeedsYou(), []);

  // 3b) open tasks — the one live personal source (calendar/email dormant until Google reconnects)
  const tasks: TaskLite[] = await settled(
    runSql(
      BRAIN_TARGET,
      `select title, priority, due_date,
              (due_date is not null and due_date < now()) as overdue,
              (due_date::date = current_date) as due_today
         from public.tasks
        where coalesce(status,'') not in ('completed','archived','cancelled')
          and coalesce(snoozed_until, now()) <= now()
        order by (priority = 'high') desc, due_date asc nulls last, created_at desc
        limit 12`,
    ).then((rows) =>
      (rows as Row[]).map((r) => ({
        title: String(r.title ?? 'Untitled task'),
        priority: (r.priority as string) ?? null,
        dueDate: (r.due_date as string) ?? null,
        overdue: r.overdue === true,
        dueToday: r.due_today === true,
      })),
    ),
    [],
  );

  // 4) compose + persist
  const briefInput = {
    now,
    revenue,
    cumulativeGrossUsd: revenue.length || cumulative.gross ? cumulative.gross : null,
    firstMetricDay: cumulative.firstDay,
    pulseFindings,
    pipelineFindings,
    security,
    fleet,
    needsYou,
    tasks,
    pnlHeadline,
    revenueCrewLine,
  };
  const md = composeBrief(briefInput);

  await fs.mkdir(OPS_DIR, { recursive: true });
  const briefPath = path.join(OPS_DIR, `operator-brief-${now.slice(0, 10)}.md`);
  await fs.writeFile(briefPath, md, 'utf8');
  console.error(`brief → ${briefPath}`);

  // Telegram delivery — the one morning message. Isolated: a Telegram outage
  // never blocks the vault write or the deck snapshot.
  const sent = await settled(sendOpsTelegram(BRIEF_CHAT_ID, renderBriefTelegram(briefInput)), false);
  console.error(sent ? 'brief → telegram ✓' : 'brief → telegram skipped/failed');

  // deck snapshot for the Sage /deck tile — never let a deck outage fail the brief
  try {
    await pushSnapshot(runSql, 'daily_brief', { markdown: md, generatedAt: now });
  } catch (err) {
    console.error(`deck snapshot failed (brief still written): ${(err as Error).message}`);
  }

  // hq snapshot for Perpetual Core's own /hq dashboard — same isolation posture
  await pushHqSnapshot(runSql, now);
  console.error('hq snapshot → pushed');
}

main().catch((err) => {
  console.error('daily-brief failed:', err.message);
  process.exit(1);
});
