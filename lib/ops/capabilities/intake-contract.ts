import type { Capability, Finding, OpsCtx, Row } from '../types';
import { BRAIN_TARGET } from '../deck-push';
import { INTAKE_CONTRACTS } from '../../intake/contracts';

/**
 * intake-contract — proves the public forms can actually store what they send.
 *
 * revenue-probes fetches the public pages and asserts 2xx. On 2026-08-08 that
 * check passed every night while BOTH purchase paths returned 5xx to real
 * visitors: the pages rendered fine, the writes behind them did not. A 200 on
 * the page says nothing about whether a submission survives.
 *
 * Rather than POST synthetic submissions (which would fire real Resend mail on
 * every run), this checks the contract between code and schema — the thing that
 * actually broke. For every public intake path it asserts:
 *
 *   1. the target table exists,
 *   2. every column the route writes exists on it, and
 *   3. every value the route can submit satisfies that column's CHECK constraint.
 *
 * All three of the 08-08 failures violate one of those and would have been
 * caught the first night this ran:
 *   - early_access            → table missing            (rule 1)
 *   - package-intake → leads  → 7 phantom columns        (rule 2)
 *   - contact-sales           → plan values vs CHECK     (rule 3)
 *
 * The declarations live in lib/intake/contracts.ts and are imported by the
 * routes themselves, so this checks the values the routes really accept.
 *
 * Read-only: it queries catalogs and runs the CHECK expression against literals
 * in a SELECT. It never writes.
 */

function q(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export const intakeContract: Capability = {
  id: 'intake-contract',
  label: 'INTAKE CONTRACT',
  cadence: '0 7 * * *',
  destructive: false,
  run: async (ctx: OpsCtx): Promise<Finding[]> => {
    const findings: Finding[] = [];

    for (const contract of INTAKE_CONTRACTS) {
      // 1. table exists
      const tableRows = (await ctx.runSql(
        BRAIN_TARGET,
        `select to_regclass('public.${contract.table}') is not null as ok`,
      )) as Row[];

      if (!tableRows[0]?.ok) {
        findings.push({
          severity: 'critical',
          project: 'Intake',
          summary: `${contract.label}: table public.${contract.table} does not exist`,
          detail: `Every submission to ${contract.route} fails. This is how /api/early-access silently discarded every signup.`,
          fixHint: `Create public.${contract.table} (RLS on, revoke anon/authenticated) or stop writing to it.`,
        });
        continue;
      }

      // 2. every written column exists
      const colRows = (await ctx.runSql(
        BRAIN_TARGET,
        `select column_name from information_schema.columns
          where table_schema='public' and table_name=${q(contract.table)}`,
      )) as Row[];
      const actual = new Set(colRows.map((r) => String(r.column_name)));
      const missing = contract.columns.filter((c) => !actual.has(c));

      if (missing.length) {
        findings.push({
          severity: 'critical',
          project: 'Intake',
          summary: `${contract.label}: ${missing.length} column(s) do not exist — ${missing.join(', ')}`,
          detail: `Postgres rejects the whole INSERT with 42703, so ${contract.route} cannot store anything.`,
          fixHint: 'Map these onto real columns, or move them into a jsonb column such as metadata.',
        });
      }

      // 3. every submittable value satisfies the column's CHECK constraint
      for (const e of contract.enums ?? []) {
        if (!actual.has(e.column)) continue;

        const checks = (await ctx.runSql(
          BRAIN_TARGET,
          `select pg_get_constraintdef(oid) as def
             from pg_constraint
            where conrelid = 'public.${contract.table}'::regclass
              and contype = 'c'
              and pg_get_constraintdef(oid) ilike ${q(`%${e.column}%`)}`,
        )) as Row[];

        for (const row of checks) {
          const def = String(row.def ?? '');
          // Evaluate the constraint body against each literal the route can send.
          const body = def.replace(/^CHECK\s*/i, '');
          const rejected: string[] = [];

          for (const value of e.values) {
            const sql = `select (${body.replace(
              new RegExp(`\\b${e.column}\\b`, 'g'),
              `${q(value)}::text`,
            )}) as ok`;
            try {
              const res = (await ctx.runSql(BRAIN_TARGET, sql)) as Row[];
              if (res[0]?.ok !== true) rejected.push(value);
            } catch {
              // A constraint this substitution cannot evaluate is not evidence
              // of a fault; skip rather than cry wolf.
            }
          }

          if (rejected.length) {
            findings.push({
              severity: 'critical',
              project: 'Intake',
              summary: `${contract.label}: ${rejected.length}/${e.values.length} submittable ${e.column} values violate the CHECK`,
              detail:
                `Rejected: ${rejected.join(', ')}. Any visitor choosing one of these gets an error, not a saved record. ` +
                `This is exactly how /contact-sales 503'd on every submission for months.`,
              fixHint: `Widen the CHECK on public.${contract.table}.${e.column} to cover the values the form offers.`,
            });
          }
        }
      }
    }

    if (findings.length === 0) {
      findings.push({
        severity: 'ok',
        project: 'Intake',
        summary: `All ${INTAKE_CONTRACTS.length} intake contracts satisfied — every public form can store what it sends`,
      });
    }

    return findings;
  },
};
