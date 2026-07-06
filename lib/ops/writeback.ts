import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { Capability, Finding, Severity } from './types';
import { worstSeverity } from './types';

/**
 * Write-back — the part that makes this an agent with memory, not a dashboard.
 *
 * Findings land as MARKDOWN IN THE VAULT (canonical, git-synced), matching the
 * locked decision in memory `memory-architecture`: if a fact matters, it lands
 * as markdown first. Mnemosyne / graphify / any future HUD tile are DERIVED views
 * of these files — never the source of truth.
 *
 * Two files per run:
 *   - _claude/memory/ops-findings/<cap>-<date>.md   full report (append history)
 *   - _claude/memory/ops-findings/ops-status.md      one-line-per-capability rollup
 *                                                    (this is what a HUD tile reads)
 */

const VAULT = path.join(os.homedir(), 'dev', 'LDC-Command-Center-Vault');
const OPS_DIR = path.join(VAULT, '_claude', 'memory', 'ops-findings');

const ICON: Record<Severity, string> = { ok: '🟢', info: '🔵', warn: '🟡', critical: '🔴' };

function severityRank(f: Finding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { ok: 0, info: 0, warn: 0, critical: 0 };
  for (const x of f) counts[x.severity]++;
  return counts;
}

function renderReport(cap: Capability, findings: Finding[], now: string): string {
  const worst = worstSeverity(findings);
  const counts = severityRank(findings);
  const day = now.slice(0, 10);

  const lines: string[] = [
    '---',
    `name: ${cap.id}-${day}`,
    `description: ${cap.label} ops sweep ${day} — worst=${worst} (${counts.critical} critical, ${counts.warn} warn)`,
    'metadata:',
    '  type: reference',
    '  source: ops-runner',
    '---',
    '',
    `# ${cap.label} — ${day}`,
    '',
    `Run at ${now} · worst severity **${ICON[worst]} ${worst.toUpperCase()}** · ` +
      `${counts.critical} critical · ${counts.warn} warn · ${counts.ok} ok`,
    '',
  ];

  // group by severity, critical first
  const order: Severity[] = ['critical', 'warn', 'info', 'ok'];
  for (const sev of order) {
    const group = findings.filter((f) => f.severity === sev);
    if (group.length === 0) continue;
    lines.push(`## ${ICON[sev]} ${sev.toUpperCase()} (${group.length})`, '');
    for (const f of group) {
      lines.push(`- **${f.project}** — ${f.summary}`);
      if (f.detail) lines.push(`  - ${f.detail}`);
      if (f.fixHint) lines.push(`  - _fix:_ ${f.fixHint}`);
    }
    lines.push('');
  }

  lines.push('> Findings only — nothing was changed. Arm a fix explicitly to act.', '');
  return lines.join('\n');
}

async function updateStatus(cap: Capability, findings: Finding[], now: string): Promise<void> {
  const statusPath = path.join(OPS_DIR, 'ops-status.md');
  const worst = worstSeverity(findings);
  const counts = severityRank(findings);
  const day = now.slice(0, 10);
  const line =
    `| ${cap.label} | ${ICON[worst]} ${worst} | ${counts.critical} | ${counts.warn} | ` +
    `${day} | [[${cap.id}-${day}]] |`;

  let existing = '';
  try {
    existing = await fs.readFile(statusPath, 'utf8');
  } catch {
    existing =
      '# Ops Status — Command Deck rollup\n\n' +
      'One line per capability. A HUD tile reads this file. Derived from the dated reports.\n\n' +
      '| Capability | Worst | Crit | Warn | Last run | Report |\n' +
      '|---|---|---|---|---|---|\n';
  }

  // replace any existing row for this capability, else append (no trailing blanks)
  const rows = existing.replace(/\n+$/, '').split('\n');
  const marker = `| ${cap.label} |`;
  const idx = rows.findIndex((r) => r.startsWith(marker));
  if (idx >= 0) rows[idx] = line;
  else rows.push(line);
  await fs.writeFile(statusPath, rows.join('\n') + '\n', 'utf8');
}

/** Persist a run's findings to the vault. Returns the report path. */
export async function writeFindings(cap: Capability, findings: Finding[], now: string): Promise<string> {
  await fs.mkdir(OPS_DIR, { recursive: true });
  const reportPath = path.join(OPS_DIR, `${cap.id}-${now.slice(0, 10)}.md`);
  await fs.writeFile(reportPath, renderReport(cap, findings, now), 'utf8');
  await updateStatus(cap, findings, now);
  return reportPath;
}
