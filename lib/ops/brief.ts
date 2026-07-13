import type { Finding } from './types';
import type { FleetRepo } from './fleet';
import type { NeedsYouItem } from './needs-you';

/**
 * Brief composer — deterministic (launchd-safe, no LLM). Turns the morning's
 * gathered signals into one markdown page: the three moves that matter, then
 * revenue / pipeline / security / fleet / needs-you sections.
 *
 * Deterministic ranking for "Top 3 moves" (highest first):
 *   1. security criticals   2. revenue anomalies (failed payments / bad key)
 *   3. stale deals by value 4. freshest needs-you asks   5. unpushed/dirty repos
 * Every section degrades to a one-line "unavailable/none" — a missing source
 * never blanks the brief.
 */

export interface RevenuePoint {
  source: string; // 'stripe:perpetualcore' | 'supabase:workforce' | 'crm'
  segment: string;
  metric: string;
  value: number;
}

export interface SecurityRollup {
  worstIcon: string;
  crit: number;
  warn: number;
  day: string;
}

export interface TaskLite {
  title: string;
  priority: string | null;
  dueDate: string | null; // ISO or null
  overdue: boolean;
  dueToday: boolean;
}

export interface BriefInput {
  now: string;
  revenue: RevenuePoint[];
  cumulativeGrossUsd: number | null;
  firstMetricDay: string | null;
  pulseFindings: Finding[];
  pipelineFindings: Finding[];
  security: SecurityRollup | null;
  fleet: FleetRepo[];
  needsYou: NeedsYouItem[];
  tasks: TaskLite[];
  /** one-line headline from the portfolio-pnl capability's first Finding, or null if unavailable */
  pnlHeadline: string | null;
}

interface Move {
  weight: number;
  text: string;
}

function usd(v: number): string {
  return `$${(Math.round(v * 100) / 100).toLocaleString('en-US')}`;
}

function rankMoves(i: BriefInput): string[] {
  const moves: Move[] = [];

  if (i.security && i.security.crit > 0) {
    moves.push({
      weight: 100 + i.security.crit,
      text: `Security: ${i.security.crit} RLS critical${i.security.crit > 1 ? 's' : ''} still open (${i.security.day}) — clear the staged items.`,
    });
  }
  for (const f of i.pulseFindings) {
    if (f.severity === 'warn' && /failed payment|expires|invalid|could not read stripe/i.test(f.summary)) {
      moves.push({ weight: 90, text: `${f.project}: ${f.summary}` });
    }
  }
  const stale = i.pipelineFindings
    .filter((f) => f.severity === 'warn' && /stale deal/i.test(f.summary))
    .slice(0, 2);
  for (const f of stale) moves.push({ weight: 70, text: `${f.project}: ${f.summary}` });

  const overdue = i.tasks.filter((t) => t.overdue);
  if (overdue.length) {
    const lead = overdue[0].title;
    moves.push({
      weight: 60,
      text: overdue.length === 1 ? `Overdue task: ${lead}` : `${overdue.length} overdue tasks — top: ${lead}`,
    });
  }

  const fresh = i.needsYou.slice(0, 2);
  for (const n of fresh) moves.push({ weight: 50, text: `${n.text}  _(${n.source})_` });

  const unpushed = i.fleet.filter((r) => (r.unpushed ?? 0) > 0).sort((a, b) => (b.unpushed ?? 0) - (a.unpushed ?? 0))[0];
  if (unpushed) {
    moves.push({ weight: 30, text: `${unpushed.label}: ${unpushed.unpushed} unpushed commit(s) on ${unpushed.branch}.` });
  }

  moves.sort((a, b) => b.weight - a.weight);
  const top = moves.slice(0, 3).map((m) => m.text);
  return top.length ? top : ['Nothing urgent surfaced — a clean morning. Ship the next thing on the roadmap.'];
}

/**
 * Telegram rendering — a phone-glanceable plain-text digest of the SAME signals
 * as composeBrief. Plain text (no Markdown) so $, %, _ and branch names survive
 * Telegram's parser. Kept short: Top-3 + revenue one-liner + security + up to 3
 * needs-you. The full page always lives in the vault + /deck.
 */
export function renderBriefTelegram(i: BriefInput): string {
  const day = i.now.slice(0, 10);
  const out: string[] = [`☀️ Operator Brief — ${day}`, '', 'TOP 3 MOVES'];
  rankMoves(i).forEach((t, n) => out.push(`${n + 1}. ${t.replace(/[*_`]/g, '')}`));
  out.push('');

  // Revenue — one compact line per stripe source + cumulative toward $1M
  const stripe = i.revenue.filter((r) => r.source.startsWith('stripe:') && r.metric === 'gross_usd_24h');
  if (stripe.length) {
    out.push('💰 Revenue (24h): ' + stripe.map((p) => `${p.source.replace('stripe:', '')} ${usd(p.value)}`).join(' · '));
  } else {
    const badKey = i.pulseFindings.find((f) => /could not read stripe|no stripe secrets/i.test(f.summary));
    out.push('💰 Revenue (24h): ' + (badKey ? '⚠ Stripe not reading' : 'none recorded'));
  }
  if (i.cumulativeGrossUsd !== null) {
    out.push(`   Recorded gross: ${usd(i.cumulativeGrossUsd)} → $1M by Dec 2026`);
  }

  // Portfolio P&L headline (bank + Stripe truth, separate from the 24h pulse above)
  if (i.pnlHeadline) {
    out.push(`📊 Portfolio: ${i.pnlHeadline.replace(/[*_`]/g, '')}`);
  }

  // Security
  if (i.security) {
    out.push(`🛡️ Security: ${i.security.worstIcon} ${i.security.crit} crit / ${i.security.warn} warn`);
  }

  // Tasks one-liner
  if (i.tasks.length) {
    const od = i.tasks.filter((t) => t.overdue).length;
    out.push(`✅ Tasks: ${i.tasks.length} open${od ? ` (${od} overdue)` : ''}`);
  }

  // Fleet one-liner
  const dirty = i.fleet.filter((r) => r.dirty > 0 || (r.unpushed ?? 0) > 0);
  out.push(dirty.length ? `🗂️ Fleet: ${dirty.length} repo(s) dirty/unpushed` : '🗂️ Fleet: all clean ✅');

  // Needs you (top 3)
  if (i.needsYou.length) {
    out.push('', '📌 NEEDS YOU');
    for (const n of i.needsYou.slice(0, 3)) out.push(`• ${n.text.replace(/[*_`]/g, '')}`);
  }

  out.push('', 'Full brief → vault + sage.perpetualcore.com/deck');
  return out.join('\n');
}

export function composeBrief(i: BriefInput): string {
  const day = i.now.slice(0, 10);
  const L: string[] = [
    '---',
    `name: operator-brief-${day}`,
    `description: Operator morning brief ${day}`,
    'metadata:',
    '  type: reference',
    '  source: daily-brief',
    '---',
    '',
    `# Operator Brief — ${day}`,
    '',
    '## Top 3 moves today',
    ...rankMoves(i).map((t, n) => `${n + 1}. ${t}`),
    '',
  ];

  // Revenue — grouped by source, segments never lumped
  L.push('## Revenue (last 24h)');
  const stripe = i.revenue.filter((r) => r.source.startsWith('stripe:'));
  if (stripe.length === 0) {
    const badKey = i.pulseFindings.find((f) => /could not read stripe|no stripe secrets/i.test(f.summary));
    L.push(badKey ? `- ⚠ Stripe not reading — ${badKey.summary}` : '- No Stripe revenue recorded in the last 24h.');
  } else {
    const bySource = new Map<string, RevenuePoint[]>();
    for (const r of stripe) {
      const arr = bySource.get(r.source) ?? [];
      arr.push(r);
      bySource.set(r.source, arr);
    }
    for (const [src, pts] of bySource) {
      L.push(`- **${src.replace('stripe:', '')}**`);
      for (const p of pts.filter((p) => p.metric === 'gross_usd_24h')) {
        L.push(`  - ${p.segment}: ${usd(p.value)} gross`);
      }
      const mrr = pts.filter((p) => p.metric === 'mrr_usd').reduce((s, p) => s + p.value, 0);
      if (mrr > 0) L.push(`  - MRR: ${usd(mrr)}`);
    }
  }
  if (i.cumulativeGrossUsd !== null) {
    L.push(
      `- **Recorded gross since ${i.firstMetricDay ?? day}: ${usd(i.cumulativeGrossUsd)}** ` +
        `(toward $1,000,000 by Dec 2026)`,
    );
  }
  // Signups
  const signups = i.revenue.filter((r) => r.metric === 'new_users_24h' && r.value > 0);
  if (signups.length) {
    L.push('- New signups (24h): ' + signups.map((s) => `${s.source.replace('supabase:', '')} +${s.value}`).join(' · '));
  }
  L.push('');

  // Portfolio P&L — bank + Stripe truth (point-in-time, separate from the 24h pulse above)
  L.push('## Portfolio P&L');
  L.push(i.pnlHeadline ? `- ${i.pnlHeadline}` : '- No portfolio-pnl snapshot found — run `npx tsx scripts/ops/run.ts portfolio-pnl`.');
  L.push('');

  // Pipeline
  L.push('## Pipeline');
  const crm = i.revenue.filter((r) => r.source === 'crm' && r.metric === 'pipeline_usd');
  if (crm.length === 0) {
    L.push('- CRM not deployed yet — pipeline dormant (WS3 lights it up).');
  } else {
    for (const p of crm.sort((a, b) => b.value - a.value)) L.push(`- ${p.segment}: ${usd(p.value)}`);
  }
  L.push('');

  // Tasks — the one live personal source (calendar/email dormant until Google reconnects)
  L.push('## Tasks');
  if (i.tasks.length === 0) {
    L.push('- No open tasks.');
  } else {
    const overdue = i.tasks.filter((t) => t.overdue);
    const today = i.tasks.filter((t) => t.dueToday && !t.overdue);
    const rest = i.tasks.filter((t) => !t.overdue && !t.dueToday);
    for (const t of overdue) L.push(`- 🔴 overdue — ${t.title}${t.priority ? ` (${t.priority})` : ''}`);
    for (const t of today) L.push(`- ⏰ today — ${t.title}${t.priority ? ` (${t.priority})` : ''}`);
    for (const t of rest.slice(0, Math.max(0, 8 - overdue.length - today.length))) {
      L.push(`- ${t.title}${t.priority ? ` (${t.priority})` : ''}`);
    }
    if (i.tasks.length > 8) L.push(`- …and ${i.tasks.length - 8} more open`);
  }
  L.push('');

  // Security
  L.push('## Security');
  if (i.security) {
    L.push(`- RLS sweep: ${i.security.worstIcon} ${i.security.crit} critical / ${i.security.warn} warn (${i.security.day})`);
  } else {
    L.push('- No RLS rollup found — run `npx tsx scripts/ops/run.ts rls-audit`.');
  }
  L.push('');

  // Fleet
  L.push('## Fleet — uncommitted / unpushed');
  const dirty = i.fleet.filter((r) => r.dirty > 0 || (r.unpushed ?? 0) > 0);
  if (dirty.length === 0) {
    L.push('- All repos clean and pushed. ✅');
  } else {
    for (const r of dirty.sort((a, b) => (b.unpushed ?? 0) - (a.unpushed ?? 0) || b.dirty - a.dirty)) {
      const bits = [];
      if (r.dirty > 0) bits.push(`${r.dirty} dirty`);
      if ((r.unpushed ?? 0) > 0) bits.push(`${r.unpushed} unpushed`);
      L.push(`- **${r.label}** (${r.branch}): ${bits.join(', ')} · last: "${r.lastCommitSubject}"`);
    }
  }
  L.push('');

  // Needs you
  L.push('## Needs you');
  if (i.needsYou.length === 0) {
    L.push('- No open asks in recent handoffs.');
  } else {
    for (const n of i.needsYou.slice(0, 8)) L.push(`- ${n.text}  _(${n.source})_`);
  }
  L.push('', '> Deterministic brief — findings only, nothing was changed.', '');

  return L.join('\n');
}
