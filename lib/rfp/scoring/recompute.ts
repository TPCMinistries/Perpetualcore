/**
 * Phase 05-03 — Recompute orchestrators.
 *
 * Two entry points:
 *
 *   1. `scoreNewOpportunitiesForAllActiveOrgs(opportunityIds)` — called by the
 *      federal / state-city cron routes after each ingest. For each newly seen
 *      opportunity, score missing (opportunity, org) pairs against every active
 *      org's capture profile and upsert into rfp_opp_matches. Existing match
 *      rows are left alone during ingest refreshes; profile edits use
 *      recomputeAllForOrg() when a full recalculation is actually needed.
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
 * Alerts (Plan 05-07):
 *   `scoreNewOpportunitiesForAllActiveOrgs` fires alerts after upsert via
 *   `maybeDispatchAlert` for every match row with fit_score >= 80 (system
 *   default threshold; each user's actual threshold is applied inside the
 *   dispatcher). recomputeAllForOrg() is silent per 05-CONTEXT.md — profile
 *   changes shouldn't flood users with alerts on every capacity-fact edit.
 *   Alert failures are non-fatal: scoring writes still land even if dispatch
 *   throws.
 */

import { createAdminClient } from '@/lib/supabase/server';
import {
  scoreOpportunity,
  type OpportunityForScoring,
  type CaptureProfileForScoring,
  type ScoreBreakdown,
} from './score';
import { generateExplainedSummary } from './summary';
import { guardedLLMCall, BudgetExceededError } from '@/lib/rfp/ai/guardrail';
import { maybeDispatchAlert } from '@/lib/rfp/alerts/dispatch';
import { DEFAULT_THRESHOLD } from '@/lib/rfp/alerts/prefs';
import { checkDisqualifiers, type DisqualifierFlag } from './disqualifiers';
import { mapToDimensions, type ExplainedDimensions } from './dimensions';
import { upsertFitEvidence, type FitEvidenceRow, type FitEvidenceDimension } from './evidence-store';
import { retrieveVaultChunks } from '@/lib/rfp/vault/retrieve';

// ── Types ────────────────────────────────────────────────────────────────────

/** Row shape we hydrate from rfp_opportunities for scoring. */
type OppRow = OpportunityForScoring & {
  // No extra fields beyond OpportunityForScoring for now. Keeping the
  // alias makes future column additions explicit at the call site.
};

/**
 * Extended opp fields needed for disqualifier checks (SCORE-04).
 * These columns exist as of Phase 14 but are NOT in OpportunityForScoring
 * (that type is score.ts's domain; we don't modify it here).
 * The select() queries that hydrate OppRow are extended to include these fields.
 */
interface OppDisqualifierFields {
  set_aside_code: string | null;
  eligibility_types: string[] | null;
  naics_codes: string[] | null;
}

/** OppRow extended with disqualifier columns fetched from DB. Exported for the rescore endpoint. */
export type OppRowExtended = OppRow & OppDisqualifierFields;

/** Row shape we read from rfp_orgs.naics for the profile builder. */
interface OrgNaicsRow {
  id: string;
  naics: string[];
}

/**
 * Org row extended with type — needed by checkDisqualifiers (SCORE-04).
 * rfp_orgs.type is always populated on org creation.
 */
interface OrgNaicsTypeRow extends OrgNaicsRow {
  type: 'nonprofit' | 'forprofit' | 'dual';
}

/**
 * Org context needed for scoreOnePairV2 — profile + org.type.
 * org.type lives in rfp_orgs; profile lives in rfp_capture_profiles.
 * We combine them here rather than extending CaptureProfileForScoring
 * (which is score.ts's domain — per plan, define a local type instead).
 * Exported for the on-demand rescore endpoint.
 */
export interface OrgForScoring {
  orgId: string;
  profile: CaptureProfileForScoring | null;
  type: 'nonprofit' | 'forprofit' | 'dual';
  naics: string[];
}

/**
 * Extended breakdown persisted to score_breakdown JSONB (Pattern 6).
 * Adds Phase 18 v2 fields on top of the base ScoreBreakdown.
 */
interface ScoreBreakdownV2 extends ScoreBreakdown {
  dimensions: ExplainedDimensions;
  disqualifiers: DisqualifierFlag[];
  vault_hit_count: number;
  scored_at_v2: string; // ISO sentinel — distinguishes v2 rows from v1
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

const MATCH_UPSERT_BATCH_SIZE = 500;

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
  return createAdminClient() as unknown as { from: (table: string) => any };
}

/** Hydrate the opportunity rows needed for scoring (includes Phase 18 disqualifier fields). */
async function loadOpportunities(opportunityIds: string[]): Promise<OppRowExtended[]> {
  if (opportunityIds.length === 0) return [];
  const supabase = rfpAdmin();
  const rows: OppRowExtended[] = [];
  const batchSize = 100;

  for (let start = 0; start < opportunityIds.length; start += batchSize) {
    const batch = opportunityIds.slice(start, start + batchSize);
    const { data, error } = await supabase
      .from('rfp_opportunities')
      // Phase 18: extended with set_aside_code, eligibility_types, naics_codes
      // so checkDisqualifiers receives real data and SCORE-04 fires in production.
      .select(
        'id, source, title, agency, amount_min, amount_max, deadline, brief, keywords, geo, set_aside_code, eligibility_types, naics_codes'
      )
      .in('id', batch);
    if (error) {
      console.error(
        '[scoring/recompute] loadOpportunities failed:',
        error.message
      );
      continue;
    }
    rows.push(...((data ?? []) as unknown as OppRowExtended[]));
  }

  return rows.map((r) => ({
    ...r,
    keywords: Array.isArray(r.keywords) ? r.keywords : [],
    set_aside_code: r.set_aside_code ?? null,
    eligibility_types: Array.isArray(r.eligibility_types) ? r.eligibility_types : null,
    naics_codes: Array.isArray(r.naics_codes) ? r.naics_codes : null,
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
    return loadFallbackOrgIds();
  }
  const seen = new Set<string>();
  for (const row of (data ?? []) as Array<{ org_id: string }>) {
    if (row?.org_id) seen.add(row.org_id);
  }
  if (seen.size > 0) return [...seen];

  console.warn(
    '[scoring/recompute] no active org memberships found; falling back to rfp_orgs'
  );
  return loadFallbackOrgIds();
}

async function loadFallbackOrgIds(): Promise<string[]> {
  const supabase = rfpAdmin();
  const { data, error } = await supabase.from('rfp_orgs').select('id');
  if (error) {
    console.error('[scoring/recompute] loadFallbackOrgIds failed:', error.message);
    return [];
  }
  return Array.from(
    new Set(
      ((data ?? []) as Array<{ id: string }>)
        .map((row) => row.id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )
  );
}

/**
 * Load latest capture profile per org.
 *
 * Phase 18: now returns OrgForScoring which carries the org's type alongside the
 * profile — needed by checkDisqualifiers. The return type changed from
 * `CaptureProfileForScoring | null` to `OrgForScoring`. Callers that need only
 * the profile extract `.profile`.
 */
export async function loadLatestProfile(
  orgId: string
): Promise<OrgForScoring> {
  const supabase = rfpAdmin();
  // Phase 18: extended select to include 'type' so checkDisqualifiers receives real data.
  const [{ data: orgRow }, { data: profileRow }] = await Promise.all([
    supabase
      .from('rfp_orgs')
      .select('id, naics, type')
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

  const typedOrgRow = orgRow as OrgNaicsTypeRow | null;
  const naics =
    Array.isArray(typedOrgRow?.naics)
      ? typedOrgRow!.naics
      : [];
  const orgType: 'nonprofit' | 'forprofit' | 'dual' = typedOrgRow?.type ?? 'nonprofit';
  const profile = profileRow as CaptureProfileRow | null;

  // Profile-pending case: no row in rfp_capture_profiles yet.
  if (!profile) {
    if (naics.length === 0) {
      return { orgId, profile: null, type: orgType, naics };
    }
    return {
      orgId,
      type: orgType,
      naics,
      profile: {
        naics,
        capacity_keywords: [],
        geo_focus: [],
        typical_award_band: null,
        past_funders: [],
      },
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
    orgId,
    type: orgType,
    naics,
    profile: {
      naics,
      capacity_keywords,
      geo_focus,
      typical_award_band,
      past_funders,
    },
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
  const out = new Map<string, ExistingMatchRow>();
  const batchSize = 100;

  for (let start = 0; start < oppIds.length; start += batchSize) {
    const batch = oppIds.slice(start, start + batchSize);
    const { data, error } = await supabase
      .from('rfp_opp_matches')
      .select('opp_id, org_id, scored_version')
      .in('org_id', orgIds as string[])
      .in('opp_id', batch as string[]);
    if (error) {
      console.error(
        '[scoring/recompute] loadExistingScoredVersions failed:',
        error.message
      );
      continue;
    }
    for (const row of (data ?? []) as ExistingMatchRow[]) {
      out.set(`${row.opp_id}::${row.org_id}`, row);
    }
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
  const deduped = Array.from(
    new Map(rows.map((row) => [`${row.opp_id}::${row.org_id}`, row])).values(),
  );
  const supabase = rfpAdmin();
  let upserted = 0;

  for (let start = 0; start < deduped.length; start += MATCH_UPSERT_BATCH_SIZE) {
    const batch = deduped.slice(start, start + MATCH_UPSERT_BATCH_SIZE);
    // Cast through never[] to bypass the Database type (rfp_* tables not yet
    // in lib/supabase/database.types.ts). Matches the pattern used by the
    // federal + state/city orchestrators.
    const { data, error } = await supabase
      .from('rfp_opp_matches')
      .upsert(batch as unknown as never[], {
        onConflict: 'opp_id,org_id',
        ignoreDuplicates: false,
      })
      .select('opp_id');
    if (error) {
      return { upserted, error: error.message };
    }
    upserted += (data ?? []).length || batch.length;
  }

  return { upserted, error: null };
}

// ── Phase 18: Shared v2 pair scorer ──────────────────────────────────────────

/** Result type for scoreOnePairV2 */
export interface ScoreOnePairV2Result {
  row: {
    opp_id: string;
    org_id: string;
    fit_score: number;
    score_breakdown: ScoreBreakdownV2;
    chips: string[];
    summary: string | null;
    scored_version: number;
  };
  evidenceRows: FitEvidenceRow[];
  skippedBudget: boolean;
}

/**
 * Shared Phase 18 v2 scorer for a single (opp, org) pair.
 *
 * Used by BOTH the cron path (scoreNewOpportunitiesForAllActiveOrgs) AND the
 * per-org path (recomputeAllForOrg) AND the on-demand rescore endpoint.
 * Centralizing here ensures both paths produce the same vault-grounded output
 * and prevents the Pitfall 5 divergence (per-org path had an ungated summary call).
 *
 * Steps:
 * 1. scoreOpportunity (deterministic, unchanged)
 * 2. checkDisqualifiers (pure fn, no AI/DB)
 * 3. guardedLLMCall wraps vault retrieve + generateExplainedSummary
 *    (so embed + LLM cost are both captured under 'scoring_v2' agent)
 * 4. On BudgetExceededError: set skippedBudget=true, use deterministic fallback,
 *    still upsert chips + scores (only the LLM narrative is omitted).
 * 5. Build ScoreBreakdownV2 (includes v1 fields + dimensions + disqualifiers + vault sentinel)
 * 6. Build FitEvidenceRow[] from cited_excerpts (caller persists these)
 *
 * NOTE: at beachhead scale (≤10 orgs) per-pair embedding is acceptable.
 * TODO: cache opp embedding at N>20 orgs (see 18-RESEARCH.md Open Q1)
 *
 * @param opp          Extended opp row including set_aside_code/eligibility_types/naics_codes
 * @param org          Org context including type + naics for disqualifier checks
 * @param scoredVersion The scored_version value to assign to the new match row
 */
export async function scoreOnePairV2(
  opp: OppRowExtended,
  org: OrgForScoring,
  scoredVersion: number
): Promise<ScoreOnePairV2Result> {
  // 1. Deterministic base score (unchanged).
  const base = scoreOpportunity(opp, org.profile);

  // 2. Disqualifier checks (pure, no AI).
  const disqualifiers = checkDisqualifiers(
    {
      set_aside_code: opp.set_aside_code ?? null,
      eligibility_types: opp.eligibility_types ?? null,
      naics_codes: opp.naics_codes ?? null,
    },
    { type: org.type, naics: org.naics }
  );

  // 3. Vault retrieve + LLM summarize — ALL wrapped in ONE guardedLLMCall so
  //    embedding cost (embed.ts) and summary cost (summary.ts) are both captured.
  let summaryText: string | null = null;
  let dims = mapToDimensions(base, 0, disqualifiers);
  const evidenceRows: FitEvidenceRow[] = [];
  let vaultHitCount = 0;
  let skippedBudget = false;

  try {
    const guarded = await guardedLLMCall(org.orgId, async () => {
      // Retrieve vault chunks (embed call happens inside retrieveVaultChunks).
      const chunks = await retrieveVaultChunks(
        org.orgId,
        `${opp.title} ${opp.agency ?? ''} ${(opp.brief ?? '').slice(0, 300)}`,
        { k: 5 }
      );

      // Map to dimensions with vault hit count.
      const localDims = mapToDimensions(base, chunks.length, disqualifiers);

      // Generate cited summary.
      const summary = await generateExplainedSummary(opp, org.profile, localDims, chunks);

      return {
        agent: 'scoring_v2' as const,
        model: 'claude-sonnet-4-5', // primary model used by generateExplainedSummary
        tokensIn: summary.tokensIn,
        tokensOut: summary.tokensOut,
        costUsd: summary.costUsd,
        _summary: summary,
        _dims: localDims,
        _chunks: chunks,
      };
    });

    dims = guarded._dims;
    vaultHitCount = guarded._chunks.length;
    summaryText = guarded._summary.text;

    // 6. Build evidence rows from cited_excerpts.
    // Map each cited excerpt to a FitEvidenceRow per relevant dimension.
    // We attribute citations to all dimensions they contribute to (simplest: assign to
    // mission_fit as the primary; future phases can map per-chunk to dimension).
    const dimensionForChunk = (idx: number): FitEvidenceDimension => {
      // Simple round-robin across dimensions: first chunk = mission_fit,
      // second = track_record, third = capacity, others cycle.
      // This is a reasonable heuristic at beachhead scale.
      const dims_order: FitEvidenceDimension[] = [
        'mission_fit', 'track_record', 'capacity', 'funder_relationship', 'eligibility',
      ];
      return dims_order[idx % dims_order.length];
    };

    for (const cited of guarded._summary.cited_excerpts) {
      // Find the matching chunk to get similarity score.
      const matchedChunk = guarded._chunks.find((c) => c.doc_id === cited.artifact_id);
      const similarity = matchedChunk?.similarity_score ?? 0;
      const chunkIdx = guarded._chunks.findIndex((c) => c.doc_id === cited.artifact_id);
      const dimension = dimensionForChunk(chunkIdx >= 0 ? chunkIdx : 0);

      evidenceRows.push({
        opp_id: opp.id,
        org_id: org.orgId,
        scored_version: scoredVersion,
        dimension,
        artifact_id: matchedChunk?.id ?? cited.artifact_id,
        artifact_doc_id: cited.artifact_id,
        artifact_title: cited.artifact_title,
        artifact_type: matchedChunk?.doc_type ?? 'other',
        excerpt: cited.excerpt.slice(0, 200),
        similarity,
      });
    }
  } catch (err: unknown) {
    if (err instanceof BudgetExceededError) {
      // Over-budget: set skip flag, use deterministic fallback (no LLM prose).
      // Chips + scores still upsert — only the vault narrative is omitted.
      console.warn(
        `[scoring/recompute] org over AI budget, skipping v2 vault scoring: ${org.orgId}`
      );
      skippedBudget = true;
      // dims stays at mapToDimensions(base, 0, disqualifiers) — computed above.
      // summaryText stays null, evidenceRows stays [].
    } else {
      // Non-budget error — re-throw to outer catch so real failures still surface.
      throw err;
    }
  }

  // 5. Build extended score_breakdown.
  const score_breakdown: ScoreBreakdownV2 = {
    ...base,
    dimensions: dims,
    disqualifiers,
    vault_hit_count: vaultHitCount,
    scored_at_v2: new Date().toISOString(),
  };

  return {
    row: {
      opp_id: opp.id,
      org_id: org.orgId,
      fit_score: base.fit_score,
      score_breakdown,
      chips: base.chips,
      summary: summaryText,
      scored_version: scoredVersion,
    },
    evidenceRows,
    skippedBudget,
  };
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
 *      compute first scored_version → upsert.
 *
 * Never throws. Per-pair errors are logged and skipped.
 */
export async function scoreNewOpportunitiesForAllActiveOrgs(
  opportunityIds: string[]
): Promise<{ scored: number; orgs: number }> {
  if (opportunityIds.length === 0) return { scored: 0, orgs: 0 };

  // 1. Load opportunity rows (now includes set_aside_code, eligibility_types, naics_codes)
  const opps = await loadOpportunities(opportunityIds);
  if (opps.length === 0) return { scored: 0, orgs: 0 };

  // 2. Load active orgs
  const orgIds = await loadActiveOrgIds();
  if (orgIds.length === 0) return { scored: 0, orgs: 0 };

  // 3. Load profiles per org (with bounded concurrency; rfp_capture_profiles
  //    reads are cheap but we don't need to hammer the connection pool).
  //    Phase 18: loadLatestProfile now returns OrgForScoring (includes org.type + naics).
  const orgContexts = await asyncPool(5, orgIds, async (orgId) => {
    try {
      return await loadLatestProfile(orgId);
    } catch (e) {
      console.error(
        `[scoring/recompute] profile load failed for org ${orgId}:`,
        e instanceof Error ? e.message : String(e)
      );
      return { orgId, profile: null, type: 'nonprofit' as const, naics: [] };
    }
  });

  // 4. Load existing scored_versions so ingest refreshes only score new gaps.
  const existing = await loadExistingScoredVersions(orgIds, opps.map((o) => o.id));

  // 5. Build the cross-product of missing (opp, org) pairs to score.
  type Pair = {
    opp: OppRowExtended;
    org: OrgForScoring;
  };
  const pairs: Pair[] = [];
  for (const opp of opps) {
    for (const org of orgContexts) {
      if (existing.has(`${opp.id}::${org.orgId}`)) continue;
      pairs.push({ opp, org });
    }
  }
  if (pairs.length === 0) return { scored: 0, orgs: orgIds.length };

  // 6. Score via shared scoreOnePairV2 — vault + disqualifiers + evidence.
  //    Concurrency pool 3 to stay under Anthropic + OpenAI rate limits.
  //    Over-budget orgs produce skippedBudget=true rows (chips/scores still upsert).
  const allEvidenceRows: FitEvidenceRow[] = [];
  const computed = await asyncPool(3, pairs, async ({ opp, org }) => {
    try {
      const cacheKey = `${opp.id}::${org.orgId}`;
      const prev = existing.get(cacheKey);
      const scoredVersion = (prev?.scored_version ?? 0) + 1;

      const result = await scoreOnePairV2(opp, org, scoredVersion);
      allEvidenceRows.push(...result.evidenceRows);
      return result.row;
    } catch (e) {
      console.error(
        `[scoring/recompute] score pair failed (opp=${opp.id}, org=${org.orgId}):`,
        e instanceof Error ? e.message : String(e)
      );
      return null;
    }
  });

  // 7. Upsert match rows in one batch
  const rows = computed.filter(
    (r): r is NonNullable<typeof r> => r !== null
  );
  const { upserted, error } = await upsertMatches(
    rows as unknown as Parameters<typeof upsertMatches>[0]
  );
  if (error) {
    console.error('[scoring/recompute] upsert batch failed:', error);
  }

  // 7b. Persist evidence rows (vault citations per dimension).
  if (allEvidenceRows.length > 0) {
    const { error: evErr } = await upsertFitEvidence(allEvidenceRows);
    if (evErr) {
      console.error('[scoring/recompute] evidence upsert failed (non-fatal):', evErr);
    }
  }

  // 8. Plan 05-07 — fire alerts for newly-high-fit matches.
  //
  // Only the cron path (this function) dispatches alerts; recomputeAllForOrg
  // is silent because profile-driven recomputes would flood the user every
  // time they edit their capacity facts. We use DEFAULT_THRESHOLD (80) as the
  // floor here — every per-user dispatcher then applies the user's actual
  // threshold (60-100, user-tunable).
  //
  // Wrapped in try/catch — alert delivery is non-fatal. Concurrency capped at
  // 3 so we don't fan out hundreds of HTTP calls synchronously inside one
  // cron lambda; each call already iterates per-org-member sequentially.
  try {
    const alertable = rows.filter((r) => r.fit_score >= DEFAULT_THRESHOLD);
    if (alertable.length > 0) {
      await asyncPool(3, alertable, async (row) => {
        try {
          await maybeDispatchAlert({
            oppId: row.opp_id,
            matchOrgId: row.org_id,
            fit_score: row.fit_score,
          });
        } catch (e) {
          console.error(
            `[scoring/recompute] alert dispatch failed (opp=${row.opp_id}, org=${row.org_id}):`,
            e instanceof Error ? e.message : String(e)
          );
        }
      });
    }
  } catch (e) {
    console.error(
      '[scoring/recompute] alert fan-out failed (non-fatal):',
      e instanceof Error ? e.message : String(e)
    );
  }

  return { scored: upserted, orgs: orgIds.length };
}

/**
 * Recovery/backfill entry. Scores missing opportunity/org pairs without vault
 * retrieval, LLM summaries, evidence writes, or alert dispatch.
 *
 * This is intentionally narrower than scoreNewOpportunitiesForAllActiveOrgs:
 * coverage repair must be able to fill deterministic match rows even when an
 * external AI provider is unavailable or out of budget.
 */
export async function scoreMissingOpportunitiesForAllActiveOrgsNoAi(
  opportunityIds: string[]
): Promise<{ scored: number; orgs: number }> {
  if (opportunityIds.length === 0) return { scored: 0, orgs: 0 };

  const opps = await loadOpportunities(opportunityIds);
  if (opps.length === 0) return { scored: 0, orgs: 0 };

  const orgIds = await loadActiveOrgIds();
  if (orgIds.length === 0) return { scored: 0, orgs: 0 };

  const orgContexts = await asyncPool(5, orgIds, async (orgId) => {
    try {
      return await loadLatestProfile(orgId);
    } catch (e) {
      console.error(
        `[scoring/recompute] profile load failed for org ${orgId}:`,
        e instanceof Error ? e.message : String(e)
      );
      return { orgId, profile: null, type: 'nonprofit' as const, naics: [] };
    }
  });

  const existing = await loadExistingScoredVersions(orgIds, opps.map((o) => o.id));

  type Pair = {
    opp: OppRowExtended;
    org: OrgForScoring;
  };
  const pairs: Pair[] = [];
  for (const opp of opps) {
    for (const org of orgContexts) {
      if (existing.has(`${opp.id}::${org.orgId}`)) continue;
      pairs.push({ opp, org });
    }
  }
  if (pairs.length === 0) return { scored: 0, orgs: orgIds.length };

  const computed = await asyncPool(8, pairs, async ({ opp, org }) => {
    try {
      const cacheKey = `${opp.id}::${org.orgId}`;
      const prev = existing.get(cacheKey);
      const scored_version = (prev?.scored_version ?? 0) + 1;
      const breakdown = scoreOpportunity(opp, org.profile);
      return {
        opp_id: opp.id,
        org_id: org.orgId,
        fit_score: breakdown.fit_score,
        score_breakdown: breakdown,
        chips: breakdown.chips,
        summary: null,
        scored_version,
      };
    } catch (e) {
      console.error(
        `[scoring/recompute] deterministic score pair failed (opp=${opp.id}, org=${org.orgId}):`,
        e instanceof Error ? e.message : String(e)
      );
      return null;
    }
  });

  const rows = computed.filter((r): r is NonNullable<typeof r> => r !== null);
  const { upserted, error } = await upsertMatches(rows);
  if (error) {
    throw new Error(`deterministic_upsert_failed: ${error}`);
  }

  return { scored: upserted, orgs: orgIds.length };
}

/**
 * Per-org recompute. Used by Phase 6's capture-profile-mutation endpoint.
 * Scopes to "live" opportunities only (deadline IS NULL OR deadline > now())
 * so we don't pay compute to score rotting opps.
 *
 * Phase 18: now routes through scoreOnePairV2 (shared path with cron) so
 * the per-org path is budget-guarded and produces vault-grounded scores.
 * The old ungated generateFitSummary call has been removed — both paths
 * now use scoreOnePairV2 which wraps the LLM block in ONE guardedLLMCall.
 *
 * AI summaries ON when opts.aiSummaries=true (default: true for Phase 18 —
 * vault scoring always attempts the LLM; budget guard handles over-limit orgs).
 *
 * Skips alert delivery entirely per 05-CONTEXT.md: alerts only fire on
 * cron-discovered new opps; this is a refresh path.
 */
export async function recomputeAllForOrg(
  orgId: string,
  opts?: { aiSummaries?: boolean; includeExpired?: boolean }
): Promise<{ scored: number }> {
  const supabase = rfpAdmin();
  // Phase 18: loadLatestProfile now returns OrgForScoring (includes org.type + naics).
  const org = await loadLatestProfile(orgId);

  // Pull opportunities in pages. Supabase/PostgREST caps unbounded selects, so
  // a real backfill must use range pagination.
  const nowIso = new Date().toISOString();
  const oppRows: OppRowExtended[] = [];
  const pageSize = 1_000;
  for (let start = 0; ; start += pageSize) {
    let query = supabase
      .from('rfp_opportunities')
      // Phase 18: extended with set_aside_code, eligibility_types, naics_codes
      // so checkDisqualifiers receives real data and SCORE-04 fires in production.
      .select(
        'id, source, title, agency, amount_min, amount_max, deadline, brief, keywords, geo, set_aside_code, eligibility_types, naics_codes'
      )
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(start, start + pageSize - 1);

    if (opts?.includeExpired !== true) {
      query = query.or(`deadline.is.null,deadline.gt.${nowIso}`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[scoring/recompute] opp page load failed:', error.message);
      break;
    }

    const page = ((data ?? []) as unknown as OppRowExtended[]).map((r) => ({
      ...r,
      keywords: Array.isArray(r.keywords) ? r.keywords : [],
      set_aside_code: r.set_aside_code ?? null,
      eligibility_types: Array.isArray(r.eligibility_types) ? r.eligibility_types : null,
      naics_codes: Array.isArray(r.naics_codes) ? r.naics_codes : null,
    }));
    oppRows.push(...page);
    if (page.length < pageSize) break;
  }

  const opps = oppRows;
  if (opps.length === 0) return { scored: 0 };

  // Load existing versions to increment scored_version cleanly.
  const existing = await loadExistingScoredVersions([orgId], opps.map((o) => o.id));

  // Phase 18: aiSummaries defaults to true (scoreOnePairV2 always attempts vault scoring).
  // Set to false to skip LLM (pure deterministic rescore without AI prose).
  const ai = opts?.aiSummaries !== false; // default: true

  if (!ai) {
    // Pure deterministic path — no vault, no LLM. Skip summary column.
    const computed = await asyncPool(8, opps, async (opp) => {
      try {
        const breakdown = scoreOpportunity(opp, org.profile);
        const cacheKey = `${opp.id}::${orgId}`;
        const prev = existing.get(cacheKey);
        const scored_version = (prev?.scored_version ?? 0) + 1;
        return {
          opp_id: opp.id,
          org_id: orgId,
          fit_score: breakdown.fit_score,
          score_breakdown: breakdown,
          chips: breakdown.chips,
          scored_version,
        };
      } catch (e) {
        console.error(
          `[scoring/recompute] recompute pair failed (opp=${opp.id}, org=${orgId}):`,
          e instanceof Error ? e.message : String(e)
        );
        return null;
      }
    });
    const rows = computed.filter((r): r is NonNullable<typeof r> => r !== null);
    const { upserted, error: upErr } = await upsertMatches(
      rows as unknown as Parameters<typeof upsertMatches>[0]
    );
    if (upErr) console.error('[scoring/recompute] upsert (no-ai) failed:', upErr);
    return { scored: upserted };
  }

  // AI path — use scoreOnePairV2 (vault + disqualifiers + LLM, budget-guarded).
  const allEvidenceRows: FitEvidenceRow[] = [];
  const computed = await asyncPool(
    3, // vault + LLM concurrency limit
    opps,
    async (opp) => {
      try {
        const cacheKey = `${opp.id}::${orgId}`;
        const prev = existing.get(cacheKey);
        const scoredVersion = (prev?.scored_version ?? 0) + 1;

        const result = await scoreOnePairV2(opp, org, scoredVersion);
        allEvidenceRows.push(...result.evidenceRows);
        return result.row;
      } catch (e) {
        console.error(
          `[scoring/recompute] recompute pair failed (opp=${opp.id}, org=${orgId}):`,
          e instanceof Error ? e.message : String(e)
        );
        return null;
      }
    }
  );

  const rows = computed.filter((r): r is NonNullable<typeof r> => r !== null);
  const { upserted, error: upErr } = await upsertMatches(
    rows as unknown as Parameters<typeof upsertMatches>[0]
  );
  if (upErr) console.error('[scoring/recompute] upsert (ai) failed:', upErr);

  // Persist evidence rows (vault citations per dimension).
  if (allEvidenceRows.length > 0) {
    const { error: evErr } = await upsertFitEvidence(allEvidenceRows);
    if (evErr) {
      console.error('[scoring/recompute] evidence upsert failed (non-fatal):', evErr);
    }
  }

  return { scored: upserted };
}
