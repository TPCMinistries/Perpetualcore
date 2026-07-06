import type { Capability, Finding, MetricRow } from './types';
import type { DbTarget, Row } from './types';

/**
 * Deck push — mirrors ops results into the Brain DB so the Sage /deck HUD can
 * read them. The vault markdown written by writeback.ts stays CANONICAL
 * (memory-architecture rule); deck_* tables are a derived view for the tile UI.
 *
 * Writes go through the same Management API executor the capabilities use for
 * reads — no service-role key needed on this machine, just the keychain PAT.
 */

const BRAIN: DbTarget = {
  key: 'brain',
  label: 'LDC Brain AI',
  projectRef: 'hgxxxmtfmvguotkowxbu',
  hasUserData: false,
  tier: 'core',
};

/** SQL text literal — single-quote escape. Values never contain untrusted input
 *  beyond our own findings text, but escape defensively anyway. */
function lit(v: string | null | undefined): string {
  if (v === null || v === undefined) return 'null';
  return `'${v.replace(/'/g, "''")}'`;
}

function jsonLit(v: unknown): string {
  return `${lit(JSON.stringify(v))}::jsonb`;
}

export type RunSql = (target: DbTarget, sql: string) => Promise<Row[]>;

/** Replace a capability's findings with this run's set (one live run per cap). */
export async function pushFindings(
  runSql: RunSql,
  cap: Capability,
  findings: Finding[],
  now: string,
): Promise<void> {
  const del = `delete from public.deck_findings where capability = ${lit(cap.id)};`;
  await runSql(BRAIN, del);
  if (findings.length === 0) {
    // keep an explicit all-clear row so the tile can show "ok · last run <date>"
    findings = [{ severity: 'ok', project: 'all', summary: 'No findings' }];
  }
  // chunk inserts to keep statements small
  const chunk = 50;
  for (let i = 0; i < findings.length; i += chunk) {
    const values = findings
      .slice(i, i + chunk)
      .map(
        (f) =>
          `(${lit(cap.id)}, ${lit(cap.label)}, ${lit(now)}, ${lit(f.project)}, ` +
          `${lit(f.severity)}, ${lit(f.summary)}, ${lit(f.detail)}, ${lit(f.fixHint)})`,
      )
      .join(',\n');
    await runSql(
      BRAIN,
      `insert into public.deck_findings
         (capability, capability_label, run_at, project, severity, summary, detail, fix_hint)
       values ${values};`,
    );
  }
}

/** Upsert a snapshot doc (fleet, needs_you, rollup). */
export async function pushSnapshot(runSql: RunSql, kind: string, data: unknown): Promise<void> {
  await runSql(
    BRAIN,
    `insert into public.deck_snapshots (kind, data, updated_at)
     values (${lit(kind)}, ${jsonLit(data)}, now())
     on conflict (kind) do update set data = excluded.data, updated_at = now();`,
  );
}

/** Upsert daily metric points (idempotent on re-run within a day). */
export async function pushMetrics(runSql: RunSql, rows: MetricRow[]): Promise<void> {
  if (rows.length === 0) return;
  const chunk = 50;
  for (let i = 0; i < rows.length; i += chunk) {
    const values = rows
      .slice(i, i + chunk)
      .map(
        (r) =>
          `(${lit(r.day)}, ${lit(r.source)}, ${lit(r.segment)}, ${lit(r.metric)}, ` +
          `${Number.isFinite(r.value) ? r.value : 0}, ${jsonLit(r.meta ?? {})})`,
      )
      .join(',\n');
    await runSql(
      BRAIN,
      `insert into public.deck_metrics (day, source, segment, metric, value, meta)
       values ${values}
       on conflict (day, source, segment, metric)
         do update set value = excluded.value, meta = excluded.meta, captured_at = now();`,
    );
  }
}

export { BRAIN as BRAIN_TARGET };
