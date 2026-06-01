/**
 * lib/rfp/admin-metrics.ts — Platform-operator queries for /admin/rfp.
 *
 * All queries use createAdminClient() because the admin dashboard reads
 * across every tenant and bypasses RLS by design. The caller is
 * responsible for gating (see lib/rfp/admin.ts).
 *
 * Performance: each helper is a single round-trip. The page composes them
 * in parallel via Promise.all().
 */

import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export interface PlatformTotals {
  orgs: number;
  proposals: number;
  proposals_7d: number;
  reviewer_runs: number;
  vault_chunks: number;
  opportunities: number;
  ai_cost_30d_usd: number;
}

export interface OrgRow {
  id: string;
  name: string;
  type: string;
  created_at: string;
  members: number;
  proposals: number;
  proposals_7d: number;
  ai_cost_30d_usd: number;
}

export interface ScraperHealthRow {
  source: string;
  last_baseline_parsed: number | null;
  last_baseline_at: string | null;
  opportunities_total: number;
  open_drift_events: number;
  last_drift_at: string | null;
  last_drift_reason: string | null;
}

export interface OpenDriftRow {
  id: string;
  source: string;
  reason: string;
  details: Json;
  created_at: string;
}

export interface CronRunRow {
  cron_name: string;
  executed_at: string;
  status: string | null;
  duration_ms: number | null;
}

export interface AuditRow {
  id: string;
  created_at: string;
  org_id: string | null;
  org_name: string | null;
  agent: string;
  model: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  cost_usd: number | null;
  session_id: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function toNumeric(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function loadPlatformTotals(): Promise<PlatformTotals> {
  const admin = createAdminClient();
  const sevenDaysAgo = isoDaysAgo(7);
  const thirtyDaysAgo = isoDaysAgo(30);

  const [
    orgs,
    proposals,
    proposals7d,
    reviewerRuns,
    vaultChunks,
    opportunities,
    aiCostRows,
  ] = await Promise.all([
    admin.from("rfp_orgs").select("id", { count: "exact", head: true }),
    admin.from("rfp_proposals").select("id", { count: "exact", head: true }),
    admin
      .from("rfp_proposals")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    admin
      .from("rfp_agent_sessions")
      .select("id", { count: "exact", head: true })
      .eq("agent", "reviewer_v1"),
    admin.from("rfp_vault_artifacts").select("id", { count: "exact", head: true }),
    admin.from("rfp_opportunities").select("id", { count: "exact", head: true }),
    admin
      .from("rfp_agent_sessions")
      .select("cost_usd")
      .gte("created_at", thirtyDaysAgo)
      .returns<{ cost_usd: number | string | null }[]>(),
  ]);

  const ai_cost_30d_usd = (aiCostRows.data ?? []).reduce(
    (sum, r) => sum + toNumeric(r.cost_usd),
    0,
  );

  return {
    orgs: orgs.count ?? 0,
    proposals: proposals.count ?? 0,
    proposals_7d: proposals7d.count ?? 0,
    reviewer_runs: reviewerRuns.count ?? 0,
    vault_chunks: vaultChunks.count ?? 0,
    opportunities: opportunities.count ?? 0,
    ai_cost_30d_usd,
  };
}

export async function loadOrgBreakdown(limit = 50): Promise<OrgRow[]> {
  const admin = createAdminClient();
  const sevenDaysAgo = isoDaysAgo(7);
  const thirtyDaysAgo = isoDaysAgo(30);

  // 1) Orgs (sorted by created_at desc, capped).
  const { data: orgs } = await admin
    .from("rfp_orgs")
    .select("id, name, type, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<{ id: string; name: string; type: string; created_at: string }[]>();

  if (!orgs || orgs.length === 0) return [];
  const orgIds = orgs.map((o) => o.id);

  // 2) Aggregate counts in parallel. PostgREST doesn't expose GROUP BY in
  // the JS client, so we fetch the relevant rows and aggregate in Node.
  // Acceptable at platform scale (handful of orgs, tens of thousands of
  // session rows worst-case). Trade complexity for query simplicity.
  const [memberRowsRes, proposalRowsRes, costRowsRes] = await Promise.all([
    admin
      .from("rfp_user_orgs")
      .select("org_id")
      .in("org_id", orgIds)
      .returns<{ org_id: string }[]>(),
    admin
      .from("rfp_proposals")
      .select("org_id, created_at")
      .in("org_id", orgIds)
      .returns<{ org_id: string; created_at: string }[]>(),
    admin
      .from("rfp_agent_sessions")
      .select("org_id, cost_usd")
      .in("org_id", orgIds)
      .gte("created_at", thirtyDaysAgo)
      .returns<{ org_id: string; cost_usd: number | string | null }[]>(),
  ]);

  const memberCounts = new Map<string, number>();
  for (const r of memberRowsRes.data ?? []) {
    memberCounts.set(r.org_id, (memberCounts.get(r.org_id) ?? 0) + 1);
  }

  const proposalCounts = new Map<string, number>();
  const proposalCounts7d = new Map<string, number>();
  for (const r of proposalRowsRes.data ?? []) {
    proposalCounts.set(r.org_id, (proposalCounts.get(r.org_id) ?? 0) + 1);
    if (r.created_at >= sevenDaysAgo) {
      proposalCounts7d.set(r.org_id, (proposalCounts7d.get(r.org_id) ?? 0) + 1);
    }
  }

  const costSums = new Map<string, number>();
  for (const r of costRowsRes.data ?? []) {
    if (!r.org_id) continue;
    costSums.set(r.org_id, (costSums.get(r.org_id) ?? 0) + toNumeric(r.cost_usd));
  }

  return orgs.map((o) => ({
    ...o,
    members: memberCounts.get(o.id) ?? 0,
    proposals: proposalCounts.get(o.id) ?? 0,
    proposals_7d: proposalCounts7d.get(o.id) ?? 0,
    ai_cost_30d_usd: costSums.get(o.id) ?? 0,
  }));
}

const KNOWN_SOURCES = [
  "sam_gov",
  "grants_gov",
  "simpler_grants",
  "sbir",
  "fed_register",
  "ny_state",
  "nyc_dycd",
  "nyc_doe",
  "nyc_hra",
  "nyc_passport",
  "ca_grants",
] as const;

export async function loadScraperHealth(): Promise<ScraperHealthRow[]> {
  const admin = createAdminClient();

  const [oppsRes, baselineRes, driftRes] = await Promise.all([
    admin
      .from("rfp_opportunities")
      .select("source")
      .returns<{ source: string | null }[]>(),
    admin
      .from("rfp_source_baseline")
      .select("source, parsed_count, recorded_at")
      .order("recorded_at", { ascending: false })
      .returns<
        {
          source: string;
          parsed_count: number | null;
          recorded_at: string;
        }[]
      >(),
    admin
      .from("rfp_source_drift")
      .select("source, reason, created_at, resolved_at")
      .order("created_at", { ascending: false })
      .returns<
        {
          source: string;
          reason: string | null;
          created_at: string;
          resolved_at: string | null;
        }[]
      >(),
  ]);

  const oppsBySource = new Map<string, number>();
  for (const r of oppsRes.data ?? []) {
    const s = r.source ?? "unknown";
    oppsBySource.set(s, (oppsBySource.get(s) ?? 0) + 1);
  }

  const latestBaseline = new Map<
    string,
    { parsed_count: number | null; recorded_at: string }
  >();
  for (const r of baselineRes.data ?? []) {
    if (!latestBaseline.has(r.source)) {
      latestBaseline.set(r.source, {
        parsed_count: r.parsed_count,
        recorded_at: r.recorded_at,
      });
    }
  }

  const openDriftBySource = new Map<string, number>();
  const lastDriftBySource = new Map<
    string,
    { created_at: string; reason: string | null }
  >();
  for (const r of driftRes.data ?? []) {
    if (!r.resolved_at) {
      openDriftBySource.set(r.source, (openDriftBySource.get(r.source) ?? 0) + 1);
    }
    if (!lastDriftBySource.has(r.source)) {
      lastDriftBySource.set(r.source, {
        created_at: r.created_at,
        reason: r.reason,
      });
    }
  }

  // Build the row set from the union of (KNOWN_SOURCES, observed sources).
  // Observed sources catch anything new before we update the canonical list.
  const observed = new Set<string>([
    ...KNOWN_SOURCES,
    ...oppsBySource.keys(),
    ...latestBaseline.keys(),
    ...lastDriftBySource.keys(),
  ]);

  return Array.from(observed)
    .sort()
    .map((source) => {
      const baseline = latestBaseline.get(source);
      const lastDrift = lastDriftBySource.get(source);
      return {
        source,
        last_baseline_parsed: baseline?.parsed_count ?? null,
        last_baseline_at: baseline?.recorded_at ?? null,
        opportunities_total: oppsBySource.get(source) ?? 0,
        open_drift_events: openDriftBySource.get(source) ?? 0,
        last_drift_at: lastDrift?.created_at ?? null,
        last_drift_reason: lastDrift?.reason ?? null,
      };
    });
}

export async function loadOpenDriftRows(limit = 25): Promise<OpenDriftRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("rfp_source_drift")
    .select("id, source, reason, details, created_at")
    .is("resolved_at", null)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<OpenDriftRow[]>();

  return data ?? [];
}

export async function loadRecentCronRuns(limit = 10): Promise<CronRunRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("cron_executions")
    .select("cron_name, executed_at, status, duration_ms")
    .ilike("cron_name", "%rfp%")
    .order("executed_at", { ascending: false })
    .limit(limit)
    .returns<CronRunRow[]>();
  return data ?? [];
}

export async function loadRecentAudit(limit = 50): Promise<AuditRow[]> {
  const admin = createAdminClient();

  const { data: sessions } = await admin
    .from("rfp_agent_sessions")
    .select(
      "id, created_at, org_id, agent, model, tokens_in, tokens_out, cost_usd, session_id",
    )
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<
      Omit<AuditRow, "org_name">[]
    >();

  if (!sessions || sessions.length === 0) return [];

  // Resolve org names in a second query so we don't fight PostgREST joins.
  const orgIds = Array.from(
    new Set(sessions.map((s) => s.org_id).filter((v): v is string => !!v)),
  );
  const orgNames = new Map<string, string>();
  if (orgIds.length > 0) {
    const { data: orgs } = await admin
      .from("rfp_orgs")
      .select("id, name")
      .in("id", orgIds)
      .returns<{ id: string; name: string }[]>();
    for (const o of orgs ?? []) orgNames.set(o.id, o.name);
  }

  return sessions.map((s) => ({
    ...s,
    cost_usd: toNumeric(s.cost_usd),
    org_name: s.org_id ? (orgNames.get(s.org_id) ?? null) : null,
  }));
}
