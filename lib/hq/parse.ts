import type { Finding } from '@/lib/ops/types';

/**
 * Small, dependency-free markdown parsers over the deterministic report
 * shapes lib/ops/capabilities/*.ts already write (portfolio-pnl.md,
 * strategist-memo.md, compliance-watch findings). These are read-only
 * projections for display — never a source of truth.
 */

/** Lines between a `## Heading` (matched by headingRe) and the next `##` heading. */
function extractSection(md: string, headingRe: RegExp): string[] {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => headingRe.test(l));
  if (start === -1) return [];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^##\s/.test(l));
  return end === -1 ? rest : rest.slice(0, end);
}

function bulletLines(section: string[]): string[] {
  return section.filter((l) => l.trim().startsWith('- ')).map((l) => l.trim().replace(/^-\s*/, ''));
}

function parseBulletSection(md: string | null, headingRe: RegExp): string[] {
  if (!md) return [];
  const bullets = bulletLines(extractSection(md, headingRe));
  return bullets.filter((b) => !/^(none this week|nothing (queued|due within 14 days))\.?$/i.test(b));
}

export interface PnlHeadline {
  mrr: string | null;
  gross7d: string | null;
  mercuryBalance: string | null;
}

/** Parses the `> **Headline:** Portfolio MRR $X · 7d gross $Y · Mercury balance $Z` line. */
export function parsePnlHeadline(pnlMd: string | null): PnlHeadline | null {
  if (!pnlMd) return null;
  const line = pnlMd.split('\n').find((l) => /^\s*>\s*\*\*Headline:\*\*/.test(l));
  if (!line) return null;
  const text = line.replace(/^\s*>\s*\*\*Headline:\*\*\s*/, '');
  const parts = text.split('·').map((p) => p.trim());
  return {
    mrr: parts[0]?.replace(/^Portfolio MRR\s*/i, '') || null,
    gross7d: parts[1]?.replace(/^7d gross\s*/i, '') || null,
    mercuryBalance: parts[2]?.replace(/^Mercury balance\s*/i, '') || null,
  };
}

export interface PnlEngineRow {
  engine: string;
  account: string;
  mrr: string;
  gross7d: string;
  lifetime: string;
}

/** Parses the `## Per-engine rollup` markdown table in portfolio-pnl.md. */
export function parsePnlEngineRows(pnlMd: string | null): PnlEngineRow[] {
  if (!pnlMd) return [];
  const section = extractSection(pnlMd, /^##\s*Per-engine rollup/i);
  const rows: PnlEngineRow[] = [];
  for (const line of section) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim());
    const inner = cells.slice(1, -1);
    if (inner.length < 5) continue;
    if (inner[0] === 'Engine' || /^-+$/.test(inner[0])) continue; // header + separator rows
    rows.push({ engine: inner[0], account: inner[1], mrr: inner[2], gross7d: inner[3], lifetime: inner[4] });
  }
  return rows;
}

export type EngineCallType = 'DOUBLE' | 'HOLD' | 'KILL';

export interface EngineCall {
  engine: string;
  call: EngineCallType | null;
  reasoning: string;
}

/** Parses `## Engine Calls` bullets: `- <Engine>: DOUBLE|HOLD|KILL — reasoning`. */
export function parseEngineCalls(memoMd: string | null): EngineCall[] {
  if (!memoMd) return [];
  const section = extractSection(memoMd, /^##\s*Engine Calls/i);
  return bulletLines(section).map((raw) => {
    const m = raw.match(/^([^:]+):\s*(DOUBLE|HOLD|KILL)\s*—\s*(.+)$/i);
    if (!m) return { engine: raw, call: null, reasoning: '' };
    return { engine: m[1].trim(), call: m[2].toUpperCase() as EngineCallType, reasoning: m[3].trim() };
  });
}

export function parseNeedsLorenzo(memoMd: string | null): string[] {
  return parseBulletSection(memoMd, /^##\s*Needs Lorenzo/i);
}

export function parseMarketingDirectives(memoMd: string | null): string[] {
  return parseBulletSection(memoMd, /^##\s*Marketing Reallocation Directives/i);
}

export function parseComplianceDue14d(memoMd: string | null): string[] {
  return parseBulletSection(memoMd, /^##\s*Compliance/i);
}

export function parseMemoHeadline(memoMd: string | null): string | null {
  if (!memoMd) return null;
  const line = memoMd.split('\n').find((l) => /^\s*>\s*Headline:/i.test(l));
  return line ? line.replace(/^\s*>\s*Headline:\s*/i, '').trim() : null;
}

/** Compliance findings due within 7 days (compliance-watch's own critical/warn thresholds). */
export function complianceDueSoon(items: Finding[] | null): Finding[] {
  if (!items) return [];
  return items.filter((f) => f.severity === 'critical' || f.severity === 'warn');
}

/** Extracts a "Nd out" / "Nd overdue" countdown from a compliance-watch Finding summary, if present. */
export function parseCountdown(summary: string): { days: number; overdue: boolean } | null {
  const m = summary.match(/(\d+)d\s+(overdue|out)/i);
  if (!m) return null;
  return { days: parseInt(m[1], 10), overdue: m[2].toLowerCase() === 'overdue' };
}
