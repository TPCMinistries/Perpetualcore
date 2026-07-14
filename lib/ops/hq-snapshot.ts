import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { RunSql } from './deck-push';
import { pushSnapshot } from './deck-push';
import { runCapability } from './runner';
import { complianceWatch } from './capabilities/compliance-watch';
import { pullVerdictsToLedger, syncHqQueue } from './queue-sync';
import type { Finding } from './types';

/**
 * HQ snapshot — composes the `hq` deck_snapshots doc the app/hq dashboard
 * (Perpetual Core's own command center) reads. Mirrors daily-brief.ts's degrade
 * posture: every source is isolated, a missing/unreadable source becomes `null`
 * rather than failing the whole push. Called from two places:
 *   - scripts/ops/daily-brief.ts (daily, after the daily_brief push)
 *   - scripts/ops/hq-snapshot.ts (weekly-sweep.sh, right after strategist runs)
 */

const VAULT = path.join(os.homedir(), 'dev', 'LDC-Command-Center-Vault');
const OPS_DIR = path.join(VAULT, '_claude', 'memory', 'ops-findings');
const MOMENTS_PATH = path.join(
  os.homedir(),
  'ORGANIZED',
  '01_PROJECTS',
  'ACTIVE',
  'creator-studio',
  'data',
  'brain',
  'moments.jsonl',
);

interface MomentEntry {
  id: string;
  ts: string;
  project: string;
  brand?: string;
  what: string;
  whyItMatters: string;
  proof: string;
  status: string;
  source: string;
}

async function readFileOrNull(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

/** Most recent `<prefix>-YYYY-MM-DD.md` file's content in the vault ops-findings dir, or null. */
async function latestDatedOrNull(prefix: string): Promise<string | null> {
  let files: string[];
  try {
    files = await fs.readdir(OPS_DIR);
  } catch {
    return null;
  }
  const re = new RegExp(`^${prefix}-(\\d{4}-\\d{2}-\\d{2})\\.md$`);
  const dated = files
    .map((f) => ({ f, m: f.match(re) }))
    .filter((x): x is { f: string; m: RegExpMatchArray } => x.m !== null)
    .sort((a, b) => (a.m[1] < b.m[1] ? 1 : -1));
  if (dated.length === 0) return null;
  return readFileOrNull(path.join(OPS_DIR, dated[0].f));
}

function tailLines(text: string, n: number): string {
  return text.replace(/\n+$/, '').split('\n').slice(-n).join('\n');
}

interface Revenue2026 {
  totalUsd: number;
  breakdown: string[];
  asOf: string;
}

/**
 * Parses the owner-attested manual-revenue ledger's summary block: the
 * "Ecosystem known total 2026: ≈ $100,960." line becomes the headline
 * number, and the bold summary lines become the breakdown. Null when the
 * ledger or its total line is missing — the KPI card simply doesn't render.
 */
async function readRevenue2026(now: string): Promise<Revenue2026 | null> {
  const raw = await readFileOrNull(path.join(OPS_DIR, 'manual-revenue.md'));
  if (raw === null) return null;
  const totalMatch = raw.match(/Ecosystem known total 2026:[^$]*\$([\d,]+(?:\.\d+)?)/i);
  if (!totalMatch) return null;
  const totalUsd = Number(totalMatch[1].replace(/,/g, ''));
  if (!Number.isFinite(totalUsd)) return null;
  const breakdown = [...raw.matchAll(/^\*\*([^*]+)\*\*(.*)$/gm)]
    .map((m) => `${m[1]}${m[2]}`.replace(/\*\*/g, '').trim())
    .filter((line) => !/Ecosystem known total/i.test(line));
  return { totalUsd, breakdown, asOf: now.slice(0, 10) };
}

async function readMomentsTail(n: number): Promise<MomentEntry[] | null> {
  const raw = await readFileOrNull(MOMENTS_PATH);
  if (raw === null) return null;
  const entries: MomentEntry[] = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line) as MomentEntry);
    } catch {
      // one malformed line shouldn't kill the whole tail
    }
  }
  return entries.slice(-n);
}

/** Composes and pushes the `hq` snapshot. Isolated end-to-end — never throws. */
export async function pushHqSnapshot(runSql: RunSql, now: string): Promise<void> {
  // Pull Lorenzo's decided hq_queue verdicts into the vault ledger FIRST, so
  // the decision_ledger_tail read below already reflects them.
  try {
    await pullVerdictsToLedger(runSql);
  } catch (err) {
    console.error(`hq snapshot: pullVerdictsToLedger failed (continuing): ${(err as Error).message}`);
  }

  const pnl_md = await readFileOrNull(path.join(OPS_DIR, 'portfolio-pnl.md'));
  const strategist_memo_md = await readFileOrNull(path.join(OPS_DIR, 'strategist-memo.md'));

  const ledgerRaw = await readFileOrNull(path.join(OPS_DIR, 'decision-ledger.md'));
  const decision_ledger_tail = ledgerRaw ? tailLines(ledgerRaw, 40) : null;

  let compliance: Finding[] | null = null;
  try {
    const result = await runCapability(complianceWatch, { runSql, now });
    compliance = result.findings;
  } catch (err) {
    console.error(`hq snapshot: compliance-watch failed (continuing): ${(err as Error).message}`);
  }

  // Latest revenue-probes report IF one already exists — never run the probes
  // capability from here (it creates real Stripe checkout sessions and must
  // stay a weekly, explicit step).
  const probes = await latestDatedOrNull('revenue-probes');

  const content_calendar_md = await readFileOrNull(path.join(OPS_DIR, 'content', 'CALENDAR.md'));

  const moments_tail = await readMomentsTail(15);

  const revenue_2026 = await readRevenue2026(now);

  try {
    await syncHqQueue(runSql, now, compliance);
  } catch (err) {
    console.error(`hq snapshot: syncHqQueue failed (continuing): ${(err as Error).message}`);
  }

  try {
    await pushSnapshot(runSql, 'hq', {
      generated_at: now,
      pnl_md,
      strategist_memo_md,
      decision_ledger_tail,
      compliance,
      probes,
      content_calendar_md,
      moments_tail,
      revenue_2026,
    });
  } catch (err) {
    console.error(`hq snapshot push failed: ${(err as Error).message}`);
  }
}
