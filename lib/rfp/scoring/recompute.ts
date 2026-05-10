/**
 * Phase 05-03 — Recompute orchestrators.
 *
 * Two entry points:
 *
 *   1. `scoreNewOpportunitiesForAllActiveOrgs(opportunityIds)` — called by the
 *      federal / state-city cron routes after each ingest. For each newly seen
 *      opportunity, score it against every active org's capture profile and
 *      upsert into rfp_opp_matches. Existing rows are refreshed because the
 *      cron's upsert refreshes last_seen_at; we want their scored_version
 *      incremented too so the feed reflects the latest computation.
 *
 *   2. `recomputeAllForOrg(orgId, opts?)` — called by the per-org API endpoint
 *      (Phase 6) when a capture profile mutates. Iterates every open
 *      opportunity, recomputes the fit score, and upserts. AI summaries OFF
 *      by default (profile changes do not always warrant new prose).
 *
 * Concurrency:
 *   AI summary generation uses a small async pool (limit 3) to stay under
 *   Anthropic rate limits. No new dependency — see `asyncPool` helper below.
 *
 * Idempotency + cache:
 *   `scored_version` increments by 1 on every (opp, org) upsert. The
 *   summary helper consults it to skip duplicate AI work. Upsert conflict
 *   key is the rfp_opp_matches UNIQUE (opp_id, org_id) constraint defined
 *   in supabase/migrations/20260509_rfp_schema.sql.
 *
 * CLAUDE.md rule: all DB writes here go through createAdminClient() because
 * we are running in server / background contexts (cron handlers, fire-and-
 * forget recompute after profile mutations).
 *
 * Alerts:
 *   This module does NOT fire alert deliveries. Per 05-CONTEXT.md, alerts
 *   only fire on cron-discovered new opps and are routed by Plan 05-07
 *   (which subscribes to opp-match inserts). recomputeAllForOrg() is a
 *   refresh path; new prose, no alerts.
 */

import { createAdminClient } from '@/lib/supabase/server';
import {
  scoreOpportunity,
  type OpportunityForScoring,
  type CaptureProfileForScoring,
  type ScoreBreakdown,
} from './score';
import { generateFitSummary } from './summary';

// ── Types ────────────────────────────────────────────────────────────────────

/** Row shape we hydrate from rfp_opportunities for scoring. */
type OppRow = OpportunityForScoring & {
  // No extra fields beyond OpportunityForScoring for now. Keeping the
  // alias makes future column additions explicit at the call site.
};

/** Row shape we read from rfp_orgs.naics for the profile builder. */
interface OrgNaicsRow {
  id: string;
  naics: string[];
}

interface CaptureProfileRow {
  org_id: string;
  version: number;
  profile_json: Record<string, unknown>;
  voice_examples: string[];
}

/** Existing rfp_opp_matches row — just enough to read the cache key. */
interface ExistingMatchRow {
  opp_id: string;
  org_id: string;
  scored_version: number;
}

// ── Tiny async pool (no new dependency) ──────────────────────────────────────

/**
 * Run `worker(item)` over `items` with at most `concurrency` in flight.
 * Returns results in the same order as the input array.
 *
 * Why local: package.json does not include p-limit / p-map, and per
 * CLAUDE.md we don't add new deps without asking. ~15 lines beats a
 * dependency for this purpose.
 */
async function asyncPool<T, R>(
  concurrency: number,
  items: readonly T[],
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  async function runner(): Promise<void> {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      out[i] = await worker(items[i], i);
    }
  }
  const runners: Promise<void>[] = [];
  const n = Math.max(1, Math.min(concurrency, items.length));
  for (let k = 0; k < n; k++) runners.push(runner());
  await Promise.all(runners);
  return out;
}

// ── DB helpers ───────────────────────────────────────────────────────────────

/**
 * Untyped admin handle for rfp_* tables — `lib/supabase/database.types.ts`
 * doesn't reflect the rfp schema yet (regen deferred to post-Phase-5 per
 * the codebase convention). Matches the pattern in
 * lib/rfp/ingest/run-state-city.ts and lib/rfp/orgs.ts.
 */
function rfpAdmin(): { from: (table: string) => any } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAdminClient() as unknown as { from: (table: string) => any };
}

/** Hydrate the opportunity rows needed for scoring. */
async function loadOpportunities(opportunityIds: string[]): Promise<OppRow[]> {
  if (opportunityIds.length === 0) return [];
  const supabase = rfpAdmin();
  const { data, error } = await supabase
    .from('rfp_opportunities')
    .select(
      'id, source, title, agency, amount_min, amount_max, deadline, brief, keywords, geo'
    )
    .in('id', opportunityIds);
  if (error) {
    console.error('[scoring/recompute] loadOpportunities failed:', error.message);
    return [];
  }
  return ((data ?? []) as unknown as OppRow[]).map((r) => ({
    ...r,
    keywords: Array.isArray(r.keywords) ? r.keywords : [],
  }));
}

/** Distinct active org IDs — any org with at least one user_orgs row. */
async function loadActiveOrgIds(): Promise<string[]> {
  const supabase = rfpAdmin();
  const { data, error } = await supabase
    .from('rfp_user_orgs')
    .select('org_id');
  if (error) {
    console.error('[scoring/recompute] loadActiveOrgIds failed:', error.message);
    return [];
  }
  const seen = new Set<string>();
  for (const row of (data ?? []) as Array<{ org_id: string }>) {
    if (row?.org_id) seen.add(row.org_id);
  }
  return [...seen];
}

/** Load latest capture profile per org (returns a Map for O(1) lookup). */
export async function loadLatestProfile(
  orgId: string
): Promise<CaptureProfileForScoring | null> {
  const supabase = rfpAdmin();
  // org row gives us NAICS + (eventually) past_funders via past wins.
  const [{ data: orgRow }, { data: profileRow }] = await Promise.all([
    supabase
      .from('rfp_orgs')
      .select('id, naics')
      .eq('id', orgId)
      .maybeSingle(),
    supabase
      .from('rfp_capture_profiles')
      .select('org_id, version, profile_json, voice_examples')
      .eq('org_id', orgId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const naics =
    Array.isArray((orgRow as OrgNaicsRow | null)?.naics)
      ? (orgRow as OrgNaicsRow).naics
      : [];
  const profile = profileRow as CaptureProfileRow | null;

  // Profile-pending case: no row in rfp_capture_profiles yet. Return null
  // so scoreOpportunity falls into its empty-profile fallback.
  if (!profile) {
    if (naics.length === 0) return null;
    return {
      naics,
      capacity_keywords: [],
      geo_focus: [],
      typical_award_band: null,
      past_funders: [],
    };
  }

  // Pull the bits we use from profile_json. The Phase 6 capture flow
  // owns this shape; for now we read defensively and degrade gracefully
  // when fields are missing.
  const pj = (profile.profile_json ?? {}) as Record<string, unknown>;
  const capacity_keywords = Array.isArray(pj['capacity_keywords'])
    ? (pj['capacity_keywords'] as unknown[]).filter(
        (s): s is string => typeof s === 'string'
      )
    : [];
  const geo_focus = Array.isArray(pj['geo_focus'])
    ? (pj['geo_focus'] as unknown[]).filter(
        (s): s is string => typeof s === 'string'
      )
    : [];
  const past_funders = Array.isArray(pj['past_funders'])
    ? (pj['past_funders'] as unknown[]).filter(
        (s): s is string => typeof s === 'string'
      )
    : [];

  let typical_award_band: { min: number; max: number } | null = null;
  const band = pj['typical_award_band'];
  if (band && typeof band === 'object') {
    const min = (band as Record<string, unknown>)['min'];
    const max = (band as Record<string, unknown>)['max'];
    if (typeof min === 'number' && typeof max === 'number' && max >= min) {
      typical_award_band = { min, max };
    }
  }

  return {
    naics,
    capacity_keywords,
    geo_focus,
    typical_award_band,
    past_funders,
  };
}

/**
 * Look up existing (opp, org) matches so the orchestrator can compute the
 * next scored_version and decide whether to call the AI summary.
 *
 * Returns a Map keyed `${opp_id}::${org_id}` → existing row.
 */
export async function loadExistingScoredVersions(
  orgIds: readonly string[],
  oppIds: readonly string[]
): Promise<Map<string, ExistingMatchRow>> {
  if (orgIds.length === 0 || oppIds.length === 0) return new Map();
  const supabase = rfpAdmin();
  const { data, error } = await supabase
    .from('rfp_opp_matches')
    .select('opp_id, org_id, scored_version')
    .in('org_id', orgIds as string[])
    .in('opp_id', oppIds as string[]);
  if (error) {
    console.error(
      '[scoring/recompute] loadExistingScoredVersions failed:',
      error.message
    );
    return new Map();
  }
  const out = new Map<string, ExistingMatchRow>();
  for (const row of (data ?? []) as ExistingMatchRow[]) {
    out.set(`${row.opp_id}::${row.org_id}`, row);
  }
  return out;
}

/**
 * Upsert a batch of computed matches. Conflict key is the rfp_opp_matches
 * UNIQUE (opp_id, org_id) constraint — supabase upsert with onConflict.
 */
async function upsertMatches(
  rows: Array<{
    opp_id: string;
    org_id: string;
    fit_score: number;
    score_breakdown: ScoreBreakdown;
    chips: string[];
    summary: string | null;
    scored_version: number;
  }>
): Promise<{ upserted: number; error: string | null }> {
  if (rows.length === 0) return { upserted: 0, error: null };
  const supabase = rfpAdmin();
  // Cast through never[] to bypass the Database type (rfp_* tables not yet
  // in lib/supabase/database.types.ts). Matches the pattern used by the
  // federal + state/city orchestrators.
  const { data, error } = await supabase
    .from('rfp_opp_matches')
    .upsert(rows as unknown as never[], {
      onConflict: 'opp_id,org_id',
      ignoreDuplicates: false,
    })
    .select('opp_id');
  if (error) {
    return { upserted: 0, error: error.message };
  }
  return { upserted: (data ?? []).length || rows.length, error: null };
}

// ── Public orchestrators ─────────────────────────────────────────────────────

/**
 * Cron hand-off entry. Score newly upserted opportunities against every
 * active org's capture profile.
 *
 * Pattern:
 *   1. Load opp rows for the given IDs.
 *   2. Load distinct active org IDs (from rfp_user_orgs).
 *   3. For each org, load its capture profile + NAICS.
 *   4. For each (opp, org) pair: scoreOpportunity → optionally summary →
 *      compute next scored_version → upsert.
 *
 * Never throws. Per-pair errors are logged and skipped.
 */
export async function scoreNewOpportunitiesForAllActiveOrgs(
  opportunityIds: string[]
): Promise<{ scored: number; orgs: number }> {
  if (opportunityIds.length === 0) return { scored: 0, orgs: 0 };

  // 1. Load opportunity rows
  const opps = await loadOpportunities(opportunityIds);
  if (opps.length === 0) return { scored: 0, orgs: 0 };

  // 2. Load active orgs
  const orgIds = await loadActiveOrgIds();
  if (orgIds.length === 0) return { scored: 0, orgs: 0 };

  // 3. Load profiles per org (with bounded concurrency; rfp_capture_profiles
  //    reads are cheap but we don't need to hammer the connection pool).
  const profiles = await asyncPool(5, orgIds, async (orgId) => {
    try {
      return { orgId, profile: await loadLatestProfile(orgId) };
    } catch (e) {
      console.error(
        `[scoring/recompute] profile load failed for org ${orgId}:`,
        e instanceof Error ? e.message : String(e)
      );
      return { orgId, profile: null };
    }
  });

  // 4. Load existing scored_versions so we can increment correctly + skip
  //    redundant AI summary calls.
  const existing = await loadExistingScoredVersions(orgIds, opps.map((o) => o.id));

  // 5. Build the cross-product of (opp, org) pairs to score.
  type Pair = {
    opp: OppRow;
    orgId: string;
    profile: CaptureProfileForScoring | null;
  };
  const pairs: Pair[] = [];
  for (const opp of opps) {
    for (const { orgId, profile } of profiles) {
      pairs.push({ opp, orgId, profile });
    }
  }

  // 6. Score + (optional) summary. AI calls go through asyncPool(3) to stay
  //    under Anthropic rate limits; the deterministic scoreOpportunity call
  //    is synchronous and cheap, so we don't bother pooling it.
  const computed = await asyncPool(3, pairs, async ({ opp, orgId, profile }) => {
    try {
      const breakdown = scoreOpportunity(opp, profile);
      const cacheKey = `${opp.id}::${orgId}`;
      const prev = existing.get(cacheKey);
      const scored_version = (prev?.scored_version ?? 0) + 1;

      // AI summary on every new score for cron hand-off — this is the path
      // where the user gets fresh prose for newly-discovered opps. Summary
      // helper returns null on error / missing key (we persist null then).
      const summary = await generateFitSummary(opp, profile, breakdown);

      return {
        opp_id: opp.id,
        org_id: orgId,
        fit_score: breakdown.fit_score,
        score_breakdown: breakdown,
        chips: breakdown.chips,
        summary,
        scored_version,
      };
    } catch (e) {
      console.error(
        `[scoring/recompute] score pair failed (opp=${opp.id}, org=${orgId}):`,
        e instanceof Error ? e.message : String(e)
      );
      return null;
    }
  });

  // 7. Upsert in one batch
  const rows = computed.filter(
    (r): r is NonNullable<typeof r> => r !== null
  );
  const { upserted, error } = await upsertMatches(rows);
  if (error) {
    console.error('[scoring/recompute] upsert batch failed:', error);
  }

  return { scored: upserted, orgs: orgIds.length };
}

/**
 * Per-org recompute. Used by Phase 6's capture-profile-mutation endpoint.
 * Scopes to "live" opportunities only (deadline IS NULL OR deadline > now())
 * so we don't pay compute to score rotting opps.
 *
 * AI summaries OFF by default — profile changes do not always warrant new
 * prose. The endpoint allows opting in via { ai_summaries: true } body.
 *
 * Skips alert delivery entirely per 05-CONTEXT.md: alerts only fire on
 * cron-discovered new opps; this is a refresh path.
 */
export async function recomputeAllForOrg(
  orgId: string,
  opts?: { aiSummaries?: boolean }
): Promise<{ scored: number }> {
  const supabase = rfpAdmin();
  const profile = await loadLatestProfile(orgId);

  // Pull live opportunities. Open-ended deadlines (NULL) included — the
  // feed may surface them even without a deadline.
  const nowIso = new Date().toISOString();
  const { data: oppRows, error } = await supabase
    .from('rfp_opportunities')
    .select(
      'id, source, title, agency, amount_min, amount_max, deadline, brief, keywords, geo'
    )
    .or(`deadline.is.null,deadline.gt.${nowIso}`);
  if (error) {
    console.error('[scoring/recompute] live-opp load failed:', error.message);
    return { scored: 0 };
  }

  const opps = ((oppRows ?? []) as unknown as OppRow[]).map((r) => ({
    ...r,
    keywords: Array.isArray(r.keywords) ? r.keywords : [],
  }));
  if (opps.length === 0) return { scored: 0 };

  // Load existing versions to increment scored_version cleanly.
  const existing = await loadExistingScoredVersions([orgId], opps.map((o) => o.id));

  const ai = opts?.aiSummaries === true;

  const computed = await asyncPool(
    ai ? 3 : 8, // pure scoring tolerates higher concurrency than AI
    opps,
    async (opp) => {
      try {
        const breakdown = scoreOpportunity(opp, profile);
        const cacheKey = `${opp.id}::${orgId}`;
        const prev = existing.get(cacheKey);
        const scored_version = (prev?.scored_version ?? 0) + 1;

        let summary: string | null = null;
        if (ai) {
          summary = await generateFitSummary(opp, profile, breakdown);
        }

        return {
          opp_id: opp.id,
          org_id: orgId,
          fit_score: breakdown.fit_score,
          score_breakdown: breakdown,
          chips: breakdown.chips,
          summary,
          scored_version,
        };
      } catch (e) {
        console.error(
          `[scoring/recompute] recompute pair failed (opp=${opp.id}, org=${orgId}):`,
          e instanceof Error ? e.message : String(e)
        );
        return null;
      }
    }
  );

  const rows = computed.filter(
    (r): r is NonNullable<typeof r> => r !== null
  );
  // If aiSummaries was false, keep existing summary text on rows — don't
  // overwrite with null. The upsert as-written would set summary=null on
  // every row, so split the path:
  //   - aiSummaries=true → upsert everything (including null on errors)
  //   - aiSummaries=false → upsert without the summary column
  if (!ai) {
    // Strip summary so PostgREST leaves the existing column untouched.
    // (supabase-js merges by column name; omitted column = no UPDATE.)
    type RowWithoutSummary = Omit<(typeof rows)[number], 'summary'>;
    const stripped: RowWithoutSummary[] = rows.map(
      ({ summary: _omit, ...rest }) => rest
    );
    const { upserted, error: upErr } = await upsertMatches(
      stripped as unknown as Parameters<typeof upsertMatches>[0]
    );
    if (upErr) console.error('[scoring/recompute] upsert (no-ai) failed:', upErr);
    return { scored: upserted };
  }

  const { upserted, error: upErr } = await upsertMatches(rows);
  if (upErr) console.error('[scoring/recompute] upsert (ai) failed:', upErr);
  return { scored: upserted };
}
