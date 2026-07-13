import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { Capability, Finding, OpsCtx } from '../types';

/**
 * compliance-watch — reads the entity/deadline ledger and turns it into findings.
 *
 * Machine-reads `ops-findings/compliance-ledger.md` (memory `compliance-ledger`),
 * a hand/agent-maintained markdown file with a `## DEADLINES` table
 * (`| YYYY-MM-DD | item | severity-at-breach | action |`) and an
 * `## Open regulatory gates` bullet list. Pure text parsing — no SQL, no
 * external calls — so a malformed ledger degrades to a single warn finding
 * rather than throwing.
 */

const OPS_DIR = path.join(os.homedir(), 'dev', 'LDC-Command-Center-Vault', '_claude', 'memory', 'ops-findings');
const LEDGER_PATH = path.join(OPS_DIR, 'compliance-ledger.md');
const DAY_MS = 86_400_000;

/** Lines between a `## Heading` (matched by `headingRe`) and the next `##` heading. */
function extractSection(md: string, headingRe: RegExp): string[] {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => headingRe.test(l));
  if (start === -1) return [];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^##\s/.test(l));
  return end === -1 ? rest : rest.slice(0, end);
}

interface DeadlineRow {
  date: string;
  item: string;
  severity: string;
  action: string;
}

/** Parses `| date | item | severity | action |` rows; skips the header and separator rows. */
function parseDeadlines(md: string): DeadlineRow[] {
  const section = extractSection(md, /^##\s*DEADLINES/i);
  const rows: DeadlineRow[] = [];
  for (const line of section) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim());
    const inner = cells.slice(1, -1);
    if (inner.length < 4) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(inner[0])) continue; // skips header + `---` separator
    rows.push({ date: inner[0], item: inner[1], severity: inner[2].toLowerCase(), action: inner[3] });
  }
  return rows;
}

function countOpenGates(md: string): number {
  const section = extractSection(md, /^##\s*Open regulatory gates/i);
  return section.filter((l) => l.trim().startsWith('- ')).length;
}

export const complianceWatch: Capability = {
  id: 'compliance-watch',
  label: 'COMPLIANCE WATCH',
  cadence: '0 7 * * *',
  destructive: false,
  run: async (ctx: OpsCtx): Promise<Finding[]> => {
    let md: string;
    try {
      md = await fs.readFile(LEDGER_PATH, 'utf8');
    } catch (err) {
      return [
        {
          severity: 'warn',
          project: 'Compliance Ledger',
          summary: 'compliance-ledger.md missing — compliance-watch degraded',
          detail: (err as Error).message.slice(0, 200),
        },
      ];
    }

    let rows: DeadlineRow[];
    let gateCount: number;
    try {
      rows = parseDeadlines(md);
      gateCount = countOpenGates(md);
    } catch (err) {
      return [
        {
          severity: 'warn',
          project: 'Compliance Ledger',
          summary: 'compliance-ledger.md unparseable — compliance-watch degraded',
          detail: (err as Error).message.slice(0, 200),
        },
      ];
    }

    if (rows.length === 0) {
      return [
        {
          severity: 'warn',
          project: 'Compliance Ledger',
          summary: 'No DEADLINES table rows found — compliance-watch degraded',
          detail: 'Expected a "## DEADLINES" section with a `| date | item | severity | action |` table.',
        },
      ];
    }

    const findings: Finding[] = [];
    const now = Date.parse(ctx.now);

    for (const row of rows) {
      const due = Date.parse(`${row.date}T00:00:00Z`);
      if (Number.isNaN(due)) continue;
      const daysUntil = Math.floor((due - now) / DAY_MS);
      const breached = daysUntil < 0;
      const isLedgerCrit = row.severity.startsWith('crit');

      let severity: Finding['severity'] | null = null;
      if (breached) severity = 'critical';
      else if (daysUntil <= 3 && isLedgerCrit) severity = 'critical';
      else if (daysUntil <= 7) severity = 'warn';
      else if (daysUntil <= 14) severity = 'info';

      if (!severity) continue; // more than 14 days out — not surfaced yet

      const when = breached ? `${Math.abs(daysUntil)}d overdue (was ${row.date})` : `due ${row.date} (${daysUntil}d out)`;
      findings.push({
        severity,
        project: 'Compliance',
        summary: `${row.item} — ${when}`,
        detail: `Ledger severity-at-breach: ${row.severity}. Action: ${row.action}`,
      });
    }

    findings.push({
      severity: 'info',
      project: 'Compliance',
      summary: `${gateCount} open regulatory gate${gateCount === 1 ? '' : 's'} (no fixed date — reviewed weekly)`,
    });

    return findings;
  },
};
