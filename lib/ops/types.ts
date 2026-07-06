/**
 * Ops plane — shared contract.
 *
 * This is the "one capability, two wrappers" spine. A Capability is a pure
 * unit of ops work: given a context (which knows how to run SQL and what time
 * it is), it returns a list of Findings. It has NO opinion about where results
 * are stored, how they're triggered, or how they're rendered.
 *
 * The SAME capability is wrapped two ways:
 *   - Authoring:  the `/rls-audit` Claude Code skill calls it interactively.
 *   - Runtime:    `runner.ts` calls it headless, writes findings to the vault,
 *                 and (later) a Sage HUD tile reads the resulting markdown.
 *
 * Karpathy #2 (simplicity): the contract is deliberately tiny. Add fields only
 * when a real capability needs them.
 */

export type Severity = 'ok' | 'info' | 'warn' | 'critical';

/** A single ops target — one Supabase project / database. */
export interface DbTarget {
  /** stable slug, e.g. 'tpc' */
  key: string;
  /** human label, e.g. 'TPC Ministries' */
  label: string;
  /** Supabase project ref, or null if not yet connected (skipped, not failed) */
  projectRef: string | null;
  /** does this DB hold real user/PII data? raises the stakes of a finding */
  hasUserData: boolean;
  /** ecosystem tier for prioritisation */
  tier: 'core' | 'main' | 'ancillary' | 'client';
}

/** One row returned by a target's SQL executor. Loosely typed on purpose. */
export type Row = Record<string, unknown>;

/**
 * Execution context injected into a capability. This is the seam that makes the
 * capability pure + testable: swap `runSql` for the Management API in prod, an
 * MCP call when driven from Claude Code, or a fixture in tests.
 */
export interface OpsCtx {
  /** run read-only SQL against a target; returns rows. Throws on error. */
  runSql: (target: DbTarget, sql: string) => Promise<Row[]>;
  /** ISO timestamp, injected so capabilities never call Date.now() themselves */
  now: string;
}

/** A single audit result. Findings are the atomic unit that renders on a tile. */
export interface Finding {
  severity: Severity;
  /** target label the finding belongs to */
  project: string;
  /** one-line statement — this is what shows on a HUD tile */
  summary: string;
  /** optional deeper detail (schema.table.policy, SQL, etc.) */
  detail?: string;
  /** what an "ARM & APPLY" intent would do — never auto-run */
  fixHint?: string;
}

/**
 * A Capability = one skill's logic as a pure function.
 * `destructive: false` means findings-only (dry-run). Nothing in this slice is
 * ever destructive — matches the sage `ARMED to dry_run, executes nothing` stance.
 */
export interface Capability {
  /** stable id, e.g. 'rls-audit' */
  id: string;
  /** Command Deck tile label, e.g. 'RLS SWEEP' */
  label: string;
  /** cron expression for scheduled runs, or null = manual/voice only */
  cadence: string | null;
  /** true would mean it mutates state; every capability here is read-only */
  destructive: boolean;
  /** the work */
  run: (ctx: OpsCtx) => Promise<Finding[]>;
}

/** worst severity wins — used to colour a tile / roll up a run */
export function worstSeverity(findings: Finding[]): Severity {
  const order: Severity[] = ['ok', 'info', 'warn', 'critical'];
  return findings.reduce<Severity>(
    (worst, f) => (order.indexOf(f.severity) > order.indexOf(worst) ? f.severity : worst),
    'ok',
  );
}
