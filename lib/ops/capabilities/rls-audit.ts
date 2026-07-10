import type { Capability, DbTarget, Finding, OpsCtx, Row } from '../types';
import { CONNECTED_TARGETS } from '../targets';

/**
 * RLS SWEEP — read-only audit of every connected DB for the two systemic holes
 * documented in memory:
 *
 *   1. `USING(true)` permissive policies exposing data to anon/authenticated
 *      (memory: ecosystem-supabase-security-sweep — Workforce + TPC).
 *   2. The "self-grant-admin" hole: an UPDATE/ALL policy with NO `WITH CHECK`
 *      on a table that has a privilege column (role / is_admin / tier / plan).
 *      A user passes the USING check to select their own row, then rewrites
 *      their own role because nothing checks the NEW values.
 *      (memory: sog-audit-and-privilege-escalation — "likely in ALL apps").
 *   3. Base tables in app schemas with RLS switched OFF entirely.
 *
 * Pure: all I/O goes through `ctx.runSql`. No storage/trigger/render opinions.
 */

/**
 * Privilege columns split by confidence — learned from the first live TPC run.
 * STRONG columns almost always gate auth → a missing WITH CHECK is critical.
 * AMBIGUOUS columns (esp. bare `role`) are often non-auth enums (chat-message
 * role, team role) → flag as a warn to verify, not a critical, to cut false alarms.
 */
const STRONG_PRIV_COLUMNS = ['is_admin', 'is_superadmin', 'is_staff', 'beta_tier', 'account_type'];
const AMBIGUOUS_PRIV_COLUMNS = ['role', 'tier', 'plan'];
const PRIV_COLUMNS = [...STRONG_PRIV_COLUMNS, ...AMBIGUOUS_PRIV_COLUMNS];

/**
 * columns that mark a table as holding user-scoped / PII data. Used to separate a
 * REAL leak (`USING(true)` on a user-data table) from an intended public content
 * table (`USING(true)` on devotionals/badges/scriptures). Discovered during the
 * first live run against TPC — most `USING(true)` SELECTs there are public content.
 */
const USER_SCOPED_COLUMNS = ['user_id', 'member_id', 'owner_id', 'email', 'phone', 'stripe_customer_id', 'auth_id', 'profile_id'];

/** app schemas we audit; system + supabase-internal schemas are excluded */
const EXCLUDED_SCHEMAS = `('pg_catalog','information_schema','pg_toast','auth','storage','vault','extensions','graphql','graphql_public','realtime','supabase_functions','supabase_migrations','net','pgsodium','pgsodium_masks','_analytics','_realtime','cron')`;

const Q_RLS_STATE = `
  select n.nspname as schema, c.relname as tbl,
         c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relkind = 'r' and n.nspname not in ${EXCLUDED_SCHEMAS}
  order by 1, 2;`;

const Q_POLICIES = `
  select schemaname as schema, tablename as tbl, policyname as policy,
         cmd, permissive, roles::text as roles,
         qual, with_check
  from pg_policies
  where schemaname not in ${EXCLUDED_SCHEMAS}
  order by 1, 2;`;

const Q_PRIV_COLUMNS = `
  select table_schema as schema, table_name as tbl, lower(column_name) as col
  from information_schema.columns
  where table_schema not in ${EXCLUDED_SCHEMAS}
    and lower(column_name) in (${PRIV_COLUMNS.map((c) => `'${c}'`).join(',')});`;

const Q_USER_SCOPED_COLUMNS = `
  select table_schema as schema, table_name as tbl, column_name as col
  from information_schema.columns
  where table_schema not in ${EXCLUDED_SCHEMAS}
    and lower(column_name) in (${USER_SCOPED_COLUMNS.map((c) => `'${c}'`).join(',')});`;

/**
 * Tables protected by a BEFORE UPDATE privilege-guard trigger. This is how the
 * whole ecosystem actually closed the self-grant hole (SECURITY INVOKER trigger
 * that RAISEs when a non-service role changes is_admin/role/tier — see memory
 * sog-audit-and-privilege-escalation). A guarded table with no WITH CHECK is NOT
 * a live hole, so we must not flag it critical. Match the guard by its signature:
 * a BEFORE-UPDATE trigger whose function body touches a privilege column AND raises.
 */
const Q_GUARD_TRIGGERS = `
  select distinct n.nspname as schema, c.relname as tbl
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  join pg_proc p on p.oid = t.tgfoid
  where not t.tgisinternal
    and (t.tgtype & 2) <> 0    -- BEFORE
    and (t.tgtype & 16) <> 0   -- UPDATE
    and n.nspname not in ${EXCLUDED_SCHEMAS}
    and pg_get_functiondef(p.oid) ~* '(is_admin|is_super|is_premium|is_founder|privilege|\\mrole\\M|\\mtier\\M)'
    and pg_get_functiondef(p.oid) ~* 'raise';`;

function norm(v: unknown): string {
  return String(v ?? '').trim().toLowerCase();
}

/** roles string that includes public/anon/authenticated = reachable by users */
function isUserFacing(roles: string): boolean {
  const r = norm(roles);
  return r.includes('public') || r.includes('anon') || r.includes('authenticated');
}

/**
 * roles reachable by the UNAUTHENTICATED anon key = a true public leak (the
 * anon key ships in the browser bundle). `public` is the catch-all role that
 * includes anon; `authenticated`-only is NOT anon-reachable. This split is the
 * verify-first lesson from the 2026-06 ecosystem sweep encoded permanently:
 * a USING(true) reachable only by {authenticated} is intra-app horizontal
 * access (real only if the app hands users JWTs), not a public exposure — so
 * it's a warn to verify, not a critical. Prevents the guard crying wolf.
 */
function isAnonReachable(roles: string): boolean {
  const r = norm(roles);
  return r.includes('public') || r.includes('anon');
}

async function auditTarget(ctx: OpsCtx, target: DbTarget): Promise<Finding[]> {
  const findings: Finding[] = [];
  const project = target.label;

  let rlsState: Row[];
  let policies: Row[];
  let privCols: Row[];
  let userCols: Row[];
  let guardRows: Row[];
  try {
    [rlsState, policies, privCols, userCols, guardRows] = await Promise.all([
      ctx.runSql(target, Q_RLS_STATE),
      ctx.runSql(target, Q_POLICIES),
      ctx.runSql(target, Q_PRIV_COLUMNS),
      ctx.runSql(target, Q_USER_SCOPED_COLUMNS),
      ctx.runSql(target, Q_GUARD_TRIGGERS),
    ]);
  } catch (err) {
    findings.push({
      severity: 'warn',
      project,
      summary: `Could not sweep ${project} — ${(err as Error).message}`,
      detail: `ref=${target.projectRef}`,
    });
    return findings;
  }

  // index of tables that carry a privilege column / user-scoped column.
  // strong = almost certainly an auth gate; ambiguous = verify (may be a non-auth enum)
  const strongSet = new Set(STRONG_PRIV_COLUMNS);
  const strongPrivTables = new Set(
    privCols.filter((r) => strongSet.has(norm(r.col))).map((r) => `${norm(r.schema)}.${norm(r.tbl)}`),
  );
  const anyPrivTables = new Set(privCols.map((r) => `${norm(r.schema)}.${norm(r.tbl)}`));
  const userTables = new Set(userCols.map((r) => `${norm(r.schema)}.${norm(r.tbl)}`));
  // tables whose self-grant surface is already closed by a BEFORE UPDATE guard trigger
  const guardedTables = new Set(guardRows.map((r) => `${norm(r.schema)}.${norm(r.tbl)}`));

  // 1. RLS switched off entirely on a base table
  for (const r of rlsState) {
    if (r.rls_enabled === false) {
      const stakes = target.hasUserData ? 'critical' : 'warn';
      findings.push({
        severity: stakes,
        project,
        summary: `RLS DISABLED on ${r.schema}.${r.tbl}`,
        detail: `Table has no row-level security. ${target.hasUserData ? 'This DB holds user data.' : 'Internal DB.'}`,
        fixHint: `ALTER TABLE ${r.schema}.${r.tbl} ENABLE ROW LEVEL SECURITY; ALTER TABLE ${r.schema}.${r.tbl} FORCE ROW LEVEL SECURITY; then add scoped policies.`,
      });
    }
  }

  // 2 + 3. Policy-level holes
  for (const p of policies) {
    const table = `${norm(p.schema)}.${norm(p.tbl)}`;
    const cmd = norm(p.cmd); // all | select | insert | update | delete
    const qual = norm(p.qual);
    const withCheck = p.with_check; // null | string
    const userFacing = isUserFacing(String(p.roles ?? ''));

    // Two DIFFERENT always-true holes, on two different clauses:
    //   USING(true)      → can TARGET any existing row  (matters for SELECT/UPDATE/DELETE/ALL)
    //   WITH CHECK(true) → accepts any WRITTEN row       (matters for INSERT/UPDATE/ALL)
    // A null clause is NOT "true": INSERT normally has a null USING, and that's fine.
    const permissive = norm(p.permissive) !== 'false'; // pg_policies: 'PERMISSIVE'|'RESTRICTIVE'
    const usingTrue = qual === 'true';
    const checkTrue = norm(withCheck) === 'true';

    // WITH CHECK(true) — accepts any WRITTEN row. Only a full open door when the
    // USING side is ALSO permissive (that case is caught below as USING(true)).
    // With a restrictive USING, it just means allowed users can write arbitrary
    // column values (e.g. forge owner_id) — a verify-warn, not a critical.
    if (permissive && checkTrue && userFacing && !usingTrue && (cmd === 'insert' || cmd === 'update' || cmd === 'all')) {
      findings.push({
        severity: 'warn',
        project,
        summary: `WITH CHECK(true) on ${p.schema}.${p.tbl} (${p.policy}, ${cmd.toUpperCase()})`,
        detail: `${p.cmd} accepts any written row, reachable by ${p.roles}. For INSERT this is often intended (anon telemetry); for UPDATE it lets an allowed user forge column values (e.g. owner_id). Verify.`,
        fixHint: `Pin the owner in WITH CHECK, e.g. WITH CHECK (user_id = auth.uid()).`,
      });
    }

    if (permissive && usingTrue && userFacing) {
      const userScoped = userTables.has(table);
      // anon/public-reachable = true public leak (critical); authenticated-only =
      // intra-app horizontal access to verify (warn), not a public exposure.
      const anonReachable = isAnonReachable(String(p.roles ?? ''));
      const reach = anonReachable ? 'critical' : 'warn';
      const reachNote = anonReachable
        ? `reachable by the anon key (${p.roles}) — public exposure.`
        : `reachable only by {authenticated} (${p.roles}) — intra-app horizontal access; a real leak only if the app issues user JWTs. Verify, don't assume public.`;
      if (cmd === 'update' || cmd === 'delete' || cmd === 'all') {
        // always-true USING lets them TARGET any row for modify/delete
        findings.push({
          severity: reach,
          project,
          summary: `USING(true) ${cmd.toUpperCase()} on ${p.schema}.${p.tbl} (${p.policy})`,
          detail: `Permissive ${p.cmd} with an always-true qualifier, ${reachNote} Any reachable role can target every row.`,
          fixHint: `Replace with an owner predicate, e.g. USING (user_id = auth.uid()).`,
        });
      } else if (cmd === 'select' && userScoped) {
        // always-true READ on a table that holds user data = leak (the SoG pattern)
        findings.push({
          severity: reach,
          project,
          summary: `USING(true) READ on user-data table ${p.schema}.${p.tbl} (${p.policy})`,
          detail: `Always-true SELECT on a table with user-scoped columns, ${reachNote} Every user's rows are exposed to reachable roles.`,
          fixHint: `Scope the read, e.g. USING (user_id = auth.uid()).`,
        });
      } else {
        // always-true READ on a table with no user columns = likely intended public content
        findings.push({
          severity: 'info',
          project,
          summary: `Public-read ${p.schema}.${p.tbl} (${p.policy}) — verify intended`,
          detail: `Always-true SELECT, but no user-scoped columns detected — likely public content (reference/CMS). Confirm it holds nothing sensitive.`,
        });
      }
    }

    // self-grant-admin: UPDATE/ALL with no WITH CHECK on a table that has a priv column
    const noCheck = withCheck === null || withCheck === undefined;
    if ((cmd === 'update' || cmd === 'all') && noCheck && userFacing && anyPrivTables.has(table)) {
      const strong = strongPrivTables.has(table);
      const guarded = guardedTables.has(table);
      if (guarded) {
        // a BEFORE UPDATE privilege-guard trigger already blocks escalation — not a hole
        findings.push({
          severity: 'info',
          project,
          summary: `${p.schema}.${p.tbl} (${p.policy}) — no WITH CHECK but guarded by a privilege trigger`,
          detail: `Missing WITH CHECK, but a BEFORE UPDATE trigger raises on privilege/tier changes by non-service roles (the ecosystem's SoG guard). Self-grant is blocked; consider also pinning WITH CHECK belt-and-suspenders.`,
        });
      } else {
        findings.push({
          severity: strong ? 'critical' : 'warn',
          project,
          summary: strong
            ? `No WITH CHECK on ${p.schema}.${p.tbl} (${p.policy}) — self-grant-admin risk`
            : `No WITH CHECK on ${p.schema}.${p.tbl} (${p.policy}) — verify privilege column`,
          detail: strong
            ? `${p.cmd} policy has a USING clause but no WITH CHECK, and ${p.tbl} carries an auth-gating column, and NO privilege-guard trigger was found. A user who can select their row can rewrite their own privilege. This is the SoG pattern (memory: sog-audit-and-privilege-escalation).`
            : `${p.cmd} policy has no WITH CHECK and ${p.tbl} has a '${AMBIGUOUS_PRIV_COLUMNS.join("'/'")}' column — but that may be a non-auth enum (e.g. chat-message role). Verify before treating as a hole.`,
          fixHint: `Add WITH CHECK pinning the privilege column, e.g. WITH CHECK (user_id = auth.uid() AND beta_tier = old_tier), or block privilege changes in the policy.`,
        });
      }
    }
  }

  // roll-up: clean DB still gets an OK line so the tile can go green
  if (findings.length === 0) {
    findings.push({
      severity: 'ok',
      project,
      summary: `${project}: no USING(true), no missing-WITH-CHECK, RLS on all tables`,
    });
  }

  return findings;
}

export const rlsAudit: Capability = {
  id: 'rls-audit',
  label: 'RLS SWEEP',
  cadence: '0 9 * * 1', // Mondays 09:00 — weekly
  destructive: false,
  async run(ctx: OpsCtx): Promise<Finding[]> {
    const results = await Promise.all(CONNECTED_TARGETS.map((t) => auditTarget(ctx, t)));
    return results.flat();
  },
};
