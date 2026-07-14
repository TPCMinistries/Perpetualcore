/**
 * Content slot writer — the CLI agents/scripts use to publish, queue, or
 * revert a content_slots version.
 *
 *   npx tsx scripts/ops/slot-write.ts --slot pc-press-feed --author press-director \
 *     --rationale "why" --json '{"type":"moments","items":[...]}'
 *   npx tsx scripts/ops/slot-write.ts --slot pc-press-feed --author press-director \
 *     --rationale "why" --file /path/to/content.json
 *   npx tsx scripts/ops/slot-write.ts --revert pc-press-feed --author lorenzo --rationale "why"
 *
 * Governance: every write is versioned (content_slot_versions), never
 * destructive. A locked slot's write lands as status='queued' and does NOT
 * go live — Lorenzo promotes it by hand. Every write appends a
 * decision-ledger line per the content-slots charter amendment (Amendment 1).
 */
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createManagementExecutor } from '../../lib/ops/executor';
import { BRAIN_TARGET, type RunSql } from '../../lib/ops/deck-push';
import type { SlotContent } from '../../lib/slots/read';

const LEDGER_PATH = path.join(
  os.homedir(),
  'dev',
  'LDC-Command-Center-Vault',
  '_claude',
  'memory',
  'ops-findings',
  'decision-ledger.md',
);

/** SQL text literal — single-quote escape (matches lib/ops/deck-push.ts). */
function lit(v: string | null | undefined): string {
  if (v === null || v === undefined) return 'null';
  return `'${v.replace(/'/g, "''")}'`;
}

/** Dollar-quoted JSON literal so quotes/newlines in content never break SQL escaping. */
function jsonLit(v: unknown): string {
  const json = JSON.stringify(v);
  const tag = '$slotjson$';
  const safe = json.includes(tag) ? json.split('$').join('') : json;
  return `${tag}${safe}${tag}::jsonb`;
}

interface Args {
  slot?: string;
  revert?: string;
  author?: string;
  rationale?: string;
  json?: string;
  file?: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--slot':
        out.slot = next();
        break;
      case '--revert':
        out.revert = next();
        break;
      case '--author':
        out.author = next();
        break;
      case '--rationale':
        out.rationale = next();
        break;
      case '--json':
        out.json = next();
        break;
      case '--file':
        out.file = next();
        break;
      default:
        throw new Error(`unknown arg: ${a}`);
    }
  }
  return out;
}

/** Structural validation against the SlotContent union — fails loudly on mismatch. */
function validateSlotContent(raw: unknown): SlotContent {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('content must be a JSON object');
  }
  const o = raw as Record<string, unknown>;

  if (o.type === 'moments') {
    if (!Array.isArray(o.items)) throw new Error('moments content requires an "items" array');
    o.items.forEach((item, i) => {
      if (typeof item !== 'object' || item === null) throw new Error(`items[${i}] must be an object`);
      const it = item as Record<string, unknown>;
      if (typeof it.ts !== 'string') throw new Error(`items[${i}].ts must be a string`);
      if (typeof it.project !== 'string') throw new Error(`items[${i}].project must be a string`);
      if (typeof it.what !== 'string') throw new Error(`items[${i}].what must be a string`);
      if (it.whyItMatters !== undefined && typeof it.whyItMatters !== 'string')
        throw new Error(`items[${i}].whyItMatters must be a string`);
      if (it.proof !== undefined && typeof it.proof !== 'string')
        throw new Error(`items[${i}].proof must be a string`);
    });
    if (o.heading !== undefined && typeof o.heading !== 'string') throw new Error('heading must be a string');
    return raw as SlotContent;
  }

  if (o.type === 'banner') {
    if (typeof o.headline !== 'string') throw new Error('banner content requires a string "headline"');
    if (o.body !== undefined && typeof o.body !== 'string') throw new Error('body must be a string');
    if (o.cta !== undefined) {
      if (typeof o.cta !== 'object' || o.cta === null) throw new Error('cta must be an object');
      const cta = o.cta as Record<string, unknown>;
      if (typeof cta.label !== 'string' || typeof cta.href !== 'string')
        throw new Error('cta requires string "label" and "href"');
    }
    return raw as SlotContent;
  }

  throw new Error(`unknown content type "${String(o.type)}" — must be "moments" or "banner"`);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function appendLedger(line: string): Promise<void> {
  await fs.appendFile(LEDGER_PATH, `\n${line}\n`, 'utf8');
}

async function loadContent(args: Args): Promise<unknown> {
  if (args.json) return JSON.parse(args.json);
  if (args.file) return JSON.parse(await fs.readFile(args.file, 'utf8'));
  throw new Error('provide content via --json \'<inline>\' or --file <path>');
}

interface SlotRow {
  key: string;
  locked: boolean;
  current_version: number;
}

async function getSlotRow(runSql: RunSql, key: string): Promise<SlotRow | null> {
  const rows = await runSql(
    BRAIN_TARGET,
    `select key, locked, current_version from public.content_slots where key = ${lit(key)};`,
  );
  return rows.length > 0 ? (rows[0] as unknown as SlotRow) : null;
}

async function doWrite(args: Args): Promise<void> {
  if (!args.slot) throw new Error('--slot <key> is required');
  if (!args.author) throw new Error('--author <name> is required');
  if (!args.rationale) throw new Error('--rationale "<why>" is required');

  const content = validateSlotContent(await loadContent(args));

  const runSql = createManagementExecutor();
  const slotRow = await getSlotRow(runSql, args.slot);
  if (!slotRow) throw new Error(`no content_slots row for key "${args.slot}"`);

  const nextVersion = slotRow.current_version + 1;
  const status = slotRow.locked ? 'queued' : 'live';

  await runSql(
    BRAIN_TARGET,
    `insert into public.content_slot_versions (slot_key, version, content, author, rationale, status)
     values (${lit(args.slot)}, ${nextVersion}, ${jsonLit(content)}, ${lit(args.author)}, ${lit(args.rationale)}, ${lit(status)});`,
  );

  if (status === 'live') {
    if (slotRow.current_version > 0) {
      await runSql(
        BRAIN_TARGET,
        `update public.content_slot_versions set status = 'superseded'
         where slot_key = ${lit(args.slot)} and version = ${slotRow.current_version} and status = 'live';`,
      );
    }
    await runSql(
      BRAIN_TARGET,
      `update public.content_slots set current_version = ${nextVersion}, updated_at = now()
       where key = ${lit(args.slot)};`,
    );
  }

  await appendLedger(
    `**${today()} · ${args.author} (autonomous, per charter Amendment 1)** — ` +
      `SLOT WRITE: ${args.slot} v${nextVersion} ${status === 'live' ? 'live' : 'QUEUED for Lorenzo'}. ` +
      `Rationale: ${args.rationale}.`,
  );

  console.error(`✓ ${args.slot} v${nextVersion} → ${status}`);
  if (status === 'queued') {
    console.error(`  slot is locked — this write is queued, not live. Lorenzo promotes it by hand.`);
  }
  console.error(`  revert: npx tsx scripts/ops/slot-write.ts --revert ${args.slot} --author <name> --rationale "<why>"`);
}

async function doRevert(args: Args): Promise<void> {
  const key = args.revert!;
  if (!args.author) throw new Error('--author <name> is required');
  if (!args.rationale) throw new Error('--rationale "<why>" is required');

  const runSql = createManagementExecutor();
  const slotRow = await getSlotRow(runSql, key);
  if (!slotRow) throw new Error(`no content_slots row for key "${key}"`);
  if (slotRow.current_version === 0) throw new Error(`"${key}" has no live version to revert`);

  const priorRows = await runSql(
    BRAIN_TARGET,
    `select version from public.content_slot_versions
     where slot_key = ${lit(key)} and version < ${slotRow.current_version} and status = 'superseded'
     order by version desc limit 1;`,
  );
  if (priorRows.length === 0)
    throw new Error(`"${key}" v${slotRow.current_version} has no prior live version to revert to`);
  const priorVersion = (priorRows[0] as { version: number }).version;

  await runSql(
    BRAIN_TARGET,
    `update public.content_slot_versions set status = 'reverted'
     where slot_key = ${lit(key)} and version = ${slotRow.current_version} and status = 'live';`,
  );
  await runSql(
    BRAIN_TARGET,
    `update public.content_slot_versions set status = 'live'
     where slot_key = ${lit(key)} and version = ${priorVersion};`,
  );
  await runSql(
    BRAIN_TARGET,
    `update public.content_slots set current_version = ${priorVersion}, updated_at = now()
     where key = ${lit(key)};`,
  );

  await appendLedger(
    `**${today()} · ${args.author} (autonomous, per charter Amendment 1)** — ` +
      `SLOT WRITE: ${key} reverted v${slotRow.current_version} → v${priorVersion} live. ` +
      `Rationale: ${args.rationale}.`,
  );

  console.error(`✓ ${key} reverted → v${priorVersion} live`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.revert) {
    await doRevert(args);
  } else {
    await doWrite(args);
  }
}

main().catch((err) => {
  console.error('slot-write failed:', err.message);
  process.exit(1);
});
