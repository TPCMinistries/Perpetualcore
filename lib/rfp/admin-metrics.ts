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
import { dueSince } from "@/lib/rfp/saved-search-execution";
import { normalizeSavedSearchRow, type RfpSavedSearch } from "@/lib/rfp/saved-searches";

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

export interface SavedSearchAlertMetrics {
  saved_searches: number;
  alerts_enabled: number;
  due_now: number;
  sent_24h: number;
  sent_7d: number;
  last_sent_at: string | null;
}

export interface SavedSearchAlertRow {
  id: string;
  search_id: string;
  search_name: string | null;
  org_id: string;
  org_name: string | null;
  opp_id: string;
  opp_title: string | null;
  email: string;
  sent_at: string;
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

export async function loadSavedSearchAlertMetrics(): Promise<SavedSearchAlertMetrics> {
  const admin = createAdminClient();
  const now = new Date();
  const oneDayAgo = isoDaysAgo(1);
  const sevenDaysAgo = isoDaysAgo(7);

  const [allSearchesRes, enabledSearchesRes, sent24Res, sent7Res, latestSentRes] =
    await Promise.all([
      admin.from("rfp_saved_searches").select("id", { count: "exact", head: true }),
      admin
        .from("rfp_saved_searches")
        .select(
          "id, org_id, created_by, name, filters, mode, is_shared, alert_enabled, alert_frequency, min_fit_score, last_run_at, created_at, updated_at",
          { count: "exact" },
        )
        .eq("alert_enabled", true)
        .returns<unknown[]>(),
      admin
        .from("rfp_saved_search_alert_log")
        .select("id", { count: "exact", head: true })
        .gte("sent_at", oneDayAgo),
      admin
        .from("rfp_saved_search_alert_log")
        .select("id", { count: "exact", head: true })
        .gte("sent_at", sevenDaysAgo),
      admin
        .from("rfp_saved_search_alert_log")
        .select("sent_at")
        .order("sent_at", { ascending: false })
        .limit(1)
        .returns<{ sent_at: string }[]>(),
    ]);

  const searches = (enabledSearchesRes.data ?? [])
    .map((row): RfpSavedSearch | null => {
      try {
        return normalizeSavedSearchRow(row);
      } catch {
        return null;
      }
    })
    .filter((row): row is RfpSavedSearch => row !== null);

  return {
    saved_searches: allSearchesRes.count ?? 0,
    alerts_enabled: enabledSearchesRes.count ?? searches.length,
    due_now: searches.filter((search) => dueSince(search, now) !== null).length,
    sent_24h: sent24Res.count ?? 0,
    sent_7d: sent7Res.count ?? 0,
    last_sent_at: latestSentRes.data?.[0]?.sent_at ?? null,
  };
}

export async function loadRecentSavedSearchAlerts(
  limit = 25,
): Promise<SavedSearchAlertRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("rfp_saved_search_alert_log")
    .select("id, search_id, org_id, user_id, opp_id, email, sent_at")
    .order("sent_at", { ascending: false })
    .limit(limit)
    .returns<
      {
        id: string;
        search_id: string;
        org_id: string;
        user_id: string;
        opp_id: string;
        email: string;
        sent_at: string;
      }[]
    >();

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const searchIds = Array.from(new Set(rows.map((row) => row.search_id)));
  const orgIds = Array.from(new Set(rows.map((row) => row.org_id)));
  const oppIds = Array.from(new Set(rows.map((row) => row.opp_id)));

  const [searchesRes, orgsRes, oppsRes] = await Promise.all([
    admin
      .from("rfp_saved_searches")
      .select("id, name")
      .in("id", searchIds)
      .returns<{ id: string; name: string }[]>(),
    admin
      .from("rfp_orgs")
      .select("id, name")
      .in("id", orgIds)
      .returns<{ id: string; name: string }[]>(),
    admin
      .from("rfp_opportunities")
      .select("id, title")
      .in("id", oppIds)
      .returns<{ id: string; title: string }[]>(),
  ]);

  const searchNames = new Map((searchesRes.data ?? []).map((row) => [row.id, row.name]));
  const orgNames = new Map((orgsRes.data ?? []).map((row) => [row.id, row.name]));
  const oppTitles = new Map((oppsRes.data ?? []).map((row) => [row.id, row.title]));

  return rows.map((row) => ({
    id: row.id,
    search_id: row.search_id,
    search_name: searchNames.get(row.search_id) ?? null,
    org_id: row.org_id,
    org_name: orgNames.get(row.org_id) ?? null,
    opp_id: row.opp_id,
    opp_title: oppTitles.get(row.opp_id) ?? null,
    email: row.email,
    sent_at: row.sent_at,
  }));
}
