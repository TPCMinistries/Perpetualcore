import * as crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { RunSql } from './deck-push';
import type { DbTarget, Finding, Row } from './types';
import { extractNeedsYou } from './needs-you';
import { parseNeedsLorenzo, complianceDueSoon } from '@/lib/hq/parse';

/**
 * Queue sync — feeds the `/hq` queue (public.hq_queue) from the three sources
 * that already ask Lorenzo for a verdict, and pulls his verdicts back into the
 * vault's canonical decision ledger. Two directions, one file:
 *
 *   syncHqQueue          vault/agent sources  -> hq_queue (upsert, never
 *                        touches status/verdict columns on an existing row)
 *   pullVerdictsToLedger hq_queue (decided)   -> decision-ledger.md (append),
 *                        then marks those rows synced_to_ledger
 *
 * The ledger stays canonical (memory `memory-architecture`); hq_queue is a
 * derived, actionable view of the same asks for the /hq dashboard.
 */

const BRAIN: DbTarget = {
  key: 'brain',
  label: 'LDC Brain AI',
  projectRef: 'hgxxxmtfmvguotkowxbu',
  hasUserData: false,
  tier: 'core',
};

const OPS_DIR = path.join(os.homedir(), 'dev', 'LDC-Command-Center-Vault', '_claude', 'memory', 'ops-findings');
const LEDGER_PATH = path.join(OPS_DIR, 'decision-ledger.md');

/** SQL text literal — single-quote escape, matching deck-push.ts's `lit`. */
function lit(v: string | null | undefined): string {
  if (v === null || v === undefined) return 'null';
  return `'${v.replace(/'/g, "''")}'`;
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** First 16 hex chars of sha1(`${source}|${normalized title}`) — stable across re-runs. */
function queueId(source: string, title: string): string {
  return crypto.createHash('sha1').update(`${source}|${normalizeTitle(title)}`).digest('hex').slice(0, 16);
}

interface QueueItem {
  source: string;
  title: string;
  detail: string | null;
  severity: string;
}

async function readFileOrNull(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

async function upsertQueueItems(runSql: RunSql, items: QueueItem[], now: string): Promise<void> {
  if (items.length === 0) return;
  const chunk = 50;
  for (let i = 0; i < items.length; i += chunk) {
    const values = items
      .slice(i, i + chunk)
      .map((it) => {
        const id = queueId(it.source, it.title);
        return `(${lit(id)}, ${lit(it.source)}, ${lit(it.title)}, ${lit(it.detail)}, ${lit(it.severity)}, ${lit(now)}, ${lit(now)})`;
      })
      .join(',\n');
    await runSql(
      BRAIN,
      `insert into public.hq_queue (id, source, title, detail, severity, first_seen, last_seen)
       values ${values}
       on conflict (id) do update set last_seen = now(), detail = excluded.detail;`,
    );
  }
}

/**
 * Composes hq_queue items from the strategist memo's "Needs Lorenzo" asks,
 * compliance-watch findings due within 7 days, and handoff needs-you bullets,
 * then upserts them. Each source is isolated — one failing never blocks the
 * others or the upsert of what was already gathered.
 */
export async function syncHqQueue(runSql: RunSql, now: string, complianceFindings: Finding[] | null): Promise<void> {
  const items: QueueItem[] = [];

  try {
    const memoMd = await readFileOrNull(path.join(OPS_DIR, 'strategist-memo.md'));
    for (const bullet of parseNeedsLorenzo(memoMd)) {
      items.push({ source: 'strategist', title: bullet, detail: null, severity: 'high' });
    }
  } catch (err) {
    console.error(`queue-sync: strategist source failed (continuing): ${(err as Error).message}`);
  }

  try {
    for (const f of complianceDueSoon(complianceFindings)) {
      items.push({ source: 'compliance', title: f.summary, detail: f.detail ?? null, severity: f.severity });
    }
  } catch (err) {
    console.error(`queue-sync: compliance source failed (continuing): ${(err as Error).message}`);
  }

  try {
    const handoffItems = await extractNeedsYou(new Date(now));
    for (const h of handoffItems) {
      const severity = /blockers?\b/i.test(h.heading) ? 'high' : 'info';
      items.push({
        source: 'handoff',
        title: h.text,
        detail: `${h.heading} — ${h.source} (${h.fileDate})`,
        severity,
      });
    }
  } catch (err) {
    console.error(`queue-sync: handoff source failed (continuing): ${(err as Error).message}`);
  }

  try {
    await upsertQueueItems(runSql, items, now);
  } catch (err) {
    console.error(`queue-sync: upsert failed: ${(err as Error).message}`);
  }
}

const VERDICT_LABEL: Record<string, string> = { approved: 'APPROVED', dismissed: 'DISMISSED', snoozed: 'SNOOZED' };

/**
 * Pulls hq_queue rows Lorenzo has decided (approved/dismissed/snoozed) but
 * that haven't been synced yet, appends one entry per row to the vault's
 * canonical decision-ledger.md (append-only, never rewritten), then marks
 * those rows synced_to_ledger. If the ledger write fails, rows are left
 * unsynced so the next run retries rather than silently losing the verdict.
 */
export async function pullVerdictsToLedger(runSql: RunSql): Promise<void> {
  let rows: Row[];
  try {
    rows = await runSql(
      BRAIN,
      `select id, source, title, verdict_note, status, decided_at
         from public.hq_queue
        where status in ('approved','dismissed','snoozed') and synced_to_ledger = false;`,
    );
  } catch (err) {
    console.error(`queue-sync: verdict pull query failed (continuing): ${(err as Error).message}`);
    return;
  }
  if (rows.length === 0) return;

  const entries: string[] = [];
  const ids: string[] = [];
  for (const r of rows) {
    const status = String(r.status ?? '');
    const verdict = VERDICT_LABEL[status] ?? status.toUpperCase();
    const day = r.decided_at ? String(r.decided_at).slice(0, 10) : new Date().toISOString().slice(0, 10);
    const title = String(r.title ?? '');
    const note = r.verdict_note ? String(r.verdict_note) : '—';
    const source = String(r.source ?? 'hq');
    entries.push(`**${day} · Lorenzo (via HQ)** — VERDICT: ${verdict} — ${title}. Note: ${note}. Source: ${source}.`);
    ids.push(String(r.id));
  }

  try {
    await fs.mkdir(OPS_DIR, { recursive: true });
    await fs.appendFile(LEDGER_PATH, entries.join('\n\n') + '\n\n', 'utf8');
  } catch (err) {
    console.error(`queue-sync: ledger append failed (continuing, rows left unsynced): ${(err as Error).message}`);
    return;
  }

  try {
    const idList = ids.map((id) => lit(id)).join(', ');
    await runSql(BRAIN, `update public.hq_queue set synced_to_ledger = true where id in (${idList});`);
  } catch (err) {
    console.error(`queue-sync: marking synced_to_ledger failed (continuing): ${(err as Error).message}`);
  }
}
