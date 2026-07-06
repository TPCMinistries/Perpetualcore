/**
 * lib/rfp/feed.ts — Server-side feed query helper for the Discovery UI.
 *
 * Phase 05-04 (Plan): The Discovery feed pulls ranked rfp_opp_matches rows joined
 * with rfp_opportunities. Plan 05-03 wrote the scoring engine; this module is the
 * read-side helper that translates UI filters into a single Supabase query.
 *
 * Phase 05-06 (Plan): Extended for dual-mode users. When `dual_org_ids` is
 * provided, the query unions rfp_opp_matches across multiple orgs the caller
 * owns (verified upstream by the API route before reaching this helper). Rows
 * are deduplicated by opp_id keeping the highest fit_score, so the same opp
 * scored against both a nonprofit and a for-profit org collapses to one row
 * surfaced under whichever org best matched. The selected org's name/type is
 * carried back via `scored_for_org_name`/`scored_for_org_type` for the row badge.
 *
 * Why request-scoped createClient (NOT createAdminClient):
 *   The RLS policy on rfp_opp_matches restricts SELECT to rows where the caller
 *   is a member of the row's org (via rfp_user_orgs). createAdminClient bypasses
 *   RLS and would let any authenticated user read any org's matches. We instead
 *   use the cookie-bound createClient so the caller's session enforces per-org
 *   scoping. In dual mode the same RLS guard applies: passing dual_org_ids the
 *   user isn't a member of would silently return zero rows for those — but the
 *   API route already gates membership before calling us.
 *
 * Stable keyset pagination:
 *   Order is (fit_score DESC, opp_id ASC). The opp_id tiebreaker makes pagination
 *   stable even when multiple rows share a fit_score (common at the 90 / 70 / 50
 *   tier boundaries from weights.ts).
 *
 * Source-filter approach:
 *   PostgREST's nested-table filtering (.filter('rfp_opportunities.source', 'in', ...))
 *   works but the join becomes an "inner" join in practice, which is what we want
 *   (rows whose opportunity row doesn't match the source filter must drop). If
 *   relational-table filtering ever changes, we can fall back to in-memory filter
 *   at this scale (≤25 rows/page).
 *
 * Deadline filter:
 *   "deadline_within_days = 7|30" means dl IS NOT NULL AND dl >= now AND dl <= now+N
 *   We DO NOT show rows with already-past deadlines (no value to the user).
 *
 * Dual-mode dedup + over-fetch:
 *   When dual_org_ids is set, we fetch limit*2 rows to compensate for opp_id
 *   collisions that collapse during dedup. After dedup we slice to `limit`. This
 *   keeps the keyset cursor stable: the dedup happens AFTER ordering, so the
 *   last surviving row's (fit_score, opp_id) is still monotonically decreasing
 *   relative to the next page. The 2× ratio is conservative — in the worst case
 *   every opp is duplicated (dual user with identical scores on both sides),
 *   we'd still return at least `limit` rows. Mode filtering happens upstream in
 *   the API route by pre-filtering dual_org_ids; this helper just receives the
 *   already-resolved set.
 */

import { createClient } from "@/lib/supabase/server";
import { tierFor, type FitTier } from "@/lib/rfp/scoring/weights";
import {
  loadCanonicalMetadataForOpps,
  type OpportunityCanonicalMetadata,
} from "@/lib/rfp/canonical-read";
import {
  computeOpportunityActionability,
  matchesActionabilityFilter,
  type ActionabilityFilter,
  type ActionabilityResult,
  type DiscoverySort,
} from "@/lib/rfp/actionability";

// ── Public types ─────────────────────────────────────────────────────────────

export type FeedModeFilter = "all" | "nonprofit" | "forprofit";

export interface FeedFilters {
  /** Required — the active org (used as default scope when dual_org_ids is empty). */
  org_id: string;
  /**
   * Dual-mode: when non-empty, query rfp_opp_matches with `.in('org_id', dual_org_ids)`
   * instead of `.eq('org_id', org_id)`. Caller (the API route) is responsible for
   * confirming the user is a member of each org and that the active `org_id` has
   * type='dual'. RLS still applies — non-member org_ids silently contribute zero rows.
   */
  dual_org_ids?: string[];
  /**
   * Mode discriminator surfaced to the caller for telemetry/empty-state copy. The
   * actual mode → org-type filtering is applied UPSTREAM (the API route resolves
   * which orgs in dual_org_ids match the requested mode). This field is here so
   * the helper can be invoked directly from server prefetch with the right shape.
   */
  mode_filter?: FeedModeFilter;
  /** Optional source codes (e.g. ['sam_gov','grants_gov']). Empty/undefined = all. */
  sources?: string[];
  /** Optional keyword search against opportunity title, agency, and brief. */
  query?: string;
  /** 7 or 30 to filter rows whose deadline falls within N days; null/undef = no filter. */
  deadline_within_days?: 7 | 30 | null;
  /** Minimum opp.amount_max in dollars. null/undef = no filter. */
  min_amount?: number | null;
  actionability?: ActionabilityFilter | null;
  sort?: DiscoverySort;
  /** Keyset cursor: { fit_score, opp_id } from the previous page's last row. */
  cursor?: { fit_score: number; opp_id: string } | null;
  /** Page size — default 25. */
  limit?: number;
}

export interface FeedRow {
  opp_id: string;
  source: string;
  title: string;
  agency: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  brief: string | null;
  url: string | null;
  fit_score: number;
  tier: FitTier;
  chips: string[];
  summary: string | null;
  needs_review: boolean;
  triage_status: "untriaged" | "watch" | "pursuing" | "passed";
  triage_note: string | null;
  /**
   * The org this row was scored against. In single-org mode this equals the
   * active org. In dual mode it's the underlying nonprofit/forprofit org that
   * produced the highest fit_score for this opp. The FeedRow component renders
   * a small badge when this differs from the active org (dual mode signal).
   */
  scored_for_org_id: string;
  scored_for_org_name: string;
  scored_for_org_type: "nonprofit" | "forprofit" | "dual";
  canonical: OpportunityCanonicalMetadata | null;
  actionability: ActionabilityResult | null;
}

export interface FeedPage {
  rows: FeedRow[];
  /** When non-null, pass back as `cursor` in the next request. */
  next_cursor: { fit_score: number; opp_id: string } | null;
}

// ── Internal row-shape (from Supabase) ────────────────────────────────────────

interface OrgJoinShape {
  id: string;
  name: string;
  type: "nonprofit" | "forprofit" | "dual";
}

interface OppJoinShape {
  source: string;
  title: string;
  agency: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  brief: string | null;
  url: string | null;
  needs_review: boolean | null;
}

interface EnrichmentShape {
  opp_id: string;
  eligibility: string[] | null;
  required_documents: string[] | null;
  submission_method: string | null;
  submission_url: string | null;
  risks: string[] | null;
  missing_fields: string[] | null;
  quality_score: number | null;
}

interface MatchJoinRow {
  opp_id: string;
  org_id: string;
  fit_score: number;
  chips: string[] | null;
  summary: string | null;
  triage_status: "untriaged" | "watch" | "pursuing" | "passed" | null;
  triage_note: string | null;
  rfp_opportunities: OppJoinShape | null;
  rfp_orgs: OrgJoinShape | null;
}

interface OppSearchRow {
  id: string;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function toFeedRow(r: MatchJoinRow): FeedRow | null {
  // If the join didn't resolve the parent opportunity row (shouldn't happen, but
  // RLS or a deleted opp could in theory leave a dangling match), skip the row.
  if (!r.rfp_opportunities) return null;
  const opp = r.rfp_opportunities;

  // Org join is best-effort — in single-org mode the row's org_id IS the active
  // org, so we synthesize a placeholder if the nested select didn't return it
  // (rfp_orgs could be filtered by RLS in edge cases, though the caller is by
  // definition a member). Single-org callers don't read this field anyway.
  const org: OrgJoinShape = r.rfp_orgs ?? {
    id: r.org_id,
    name: "",
    type: "nonprofit",
  };

  return {
    opp_id: r.opp_id,
    source: opp.source,
    title: opp.title,
    agency: opp.agency,
    amount_min: opp.amount_min,
    amount_max: opp.amount_max,
    deadline: opp.deadline,
    brief: opp.brief,
    url: opp.url,
    fit_score: r.fit_score,
    tier: tierFor(r.fit_score),
    chips: r.chips ?? [],
    summary: r.summary,
    needs_review: opp.needs_review ?? false,
    triage_status: r.triage_status ?? "untriaged",
    triage_note: r.triage_note,
    scored_for_org_id: org.id,
    scored_for_org_name: org.name,
    scored_for_org_type: org.type,
    canonical: null,
    actionability: null,
  };
}

function escapeIlike(input: string): string {
  return input
    .replace(/[(),]/g, " ")
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_")
    .trim();
}

function hasLiveDeadline(row: FeedRow): boolean {
  if (!row.deadline) return false;
  const deadline = new Date(row.deadline).getTime();
  return Number.isFinite(deadline) && deadline >= Date.now();
}

function isBetterCanonicalRow(candidate: FeedRow, current: FeedRow): boolean {
  if (candidate.fit_score !== current.fit_score) {
    return candidate.fit_score > current.fit_score;
  }

  const candidateLive = hasLiveDeadline(candidate);
  const currentLive = hasLiveDeadline(current);
  if (candidateLive !== currentLive) return candidateLive;

  const candidatePrimary =
    candidate.canonical?.canonical_primary_opp_id === candidate.opp_id;
  const currentPrimary =
    current.canonical?.canonical_primary_opp_id === current.opp_id;
  if (candidatePrimary !== currentPrimary) return candidatePrimary;

  const candidateAliasCount = candidate.canonical?.source_aliases.length ?? 0;
  const currentAliasCount = current.canonical?.source_aliases.length ?? 0;
  if (candidateAliasCount !== currentAliasCount) {
    return candidateAliasCount > currentAliasCount;
  }

  return candidate.opp_id < current.opp_id;
}

function collapseCanonicalRows(rows: FeedRow[], limit: number): FeedRow[] {
  const byCanonical = new Map<string, FeedRow>();

  for (const row of rows) {
    const key = row.canonical?.canonical_id ?? row.opp_id;
    const current = byCanonical.get(key);
    if (!current || isBetterCanonicalRow(row, current)) {
      byCanonical.set(key, row);
    }
  }

  return Array.from(byCanonical.values()).slice(0, limit);
}

function sortFeedRows(rows: FeedRow[], sort: DiscoverySort): FeedRow[] {
  return [...rows].sort((a, b) => {
    if (sort === "readiness") {
      const readinessDelta =
        (b.actionability?.score ?? -1) - (a.actionability?.score ?? -1);
      if (readinessDelta !== 0) return readinessDelta;
    }

    if (sort === "deadline") {
      const aTime = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
      const aLive = Number.isFinite(aTime) && aTime >= Date.now();
      const bLive = Number.isFinite(bTime) && bTime >= Date.now();
      if (aLive !== bLive) return aLive ? -1 : 1;
      if (aTime !== bTime) return aTime - bTime;
    }

    if (b.fit_score !== a.fit_score) return b.fit_score - a.fit_score;
    return a.opp_id.localeCompare(b.opp_id);
  });
}

async function loadEnrichmentsForRows(
  rfp: ReturnType<typeof createClient>,
  oppIds: string[],
): Promise<Map<string, EnrichmentShape>> {
  if (oppIds.length === 0) return new Map();
  const { data, error } = await rfp
    .from("rfp_opportunity_enrichments")
    .select(
      "opp_id, eligibility, required_documents, submission_method, submission_url, risks, missing_fields, quality_score",
    )
    .in("opp_id", oppIds);

  if (error) {
    console.error("[rfp/feed] enrichment metadata unavailable", error);
    return new Map();
  }

  return new Map(
    ((data ?? []) as EnrichmentShape[]).map((row) => [row.opp_id, row]),
  );
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function buildFeedQuery(filters: FeedFilters): Promise<FeedPage> {
  // Request-scoped client — RLS enforces caller membership in every org_id we hit.
  const supabase = await createClient();
  const limit = filters.limit ?? 25;
  const sort = filters.sort ?? "fit";
  const dualMode =
    Array.isArray(filters.dual_org_ids) && filters.dual_org_ids.length > 0;

  // Over-fetch so dual-org and canonical duplicate collapse still return dense
  // pages. We slice back to `limit` after dedup/canonical grouping.
  const fetchLimit =
    filters.actionability || sort !== "fit"
      ? Math.min(100, limit * 4)
      : dualMode
        ? limit * 3
        : limit * 2;

  // Narrow the complex dynamic feed query to avoid TS2589
  // "instantiation excessively deep" on long PostgREST chains.
  const rfp = supabase as unknown as {
    from: (table: string) => any;
  };

  const keyword = escapeIlike(filters.query?.trim().slice(0, 100) ?? "");
  let keywordOppIds: string[] | null = null;
  if (keyword.length > 0) {
    const pattern = `%${keyword}%`;
    const { data: oppRows, error: oppSearchError } = await rfp
      .from("rfp_opportunities")
      .select("id")
      .or(
        `title.ilike.${pattern},agency.ilike.${pattern},brief.ilike.${pattern}`
      )
      .limit(1000);

    if (oppSearchError) {
      throw new Error(`feed_keyword_search_failed: ${oppSearchError.message}`);
    }

    keywordOppIds = ((oppRows ?? []) as OppSearchRow[]).map((row) => row.id);
    if (keywordOppIds.length === 0) {
      return { rows: [], next_cursor: null };
    }
  }

  let query = rfp
    .from("rfp_opp_matches")
    .select(
      "opp_id, org_id, fit_score, chips, summary, triage_status, triage_note, rfp_opportunities ( source, title, agency, amount_min, amount_max, deadline, brief, url, needs_review ), rfp_orgs ( id, name, type )"
    );

  // Org scope: dual_org_ids takes precedence; falls back to single org_id.
  if (dualMode) {
    query = query.in("org_id", filters.dual_org_ids as string[]);
  } else {
    query = query.eq("org_id", filters.org_id);
  }

  if (keywordOppIds) {
    query = query.in("opp_id", keywordOppIds);
  }

  // Deadline filter — bounded window relative to "now"
  if (
    filters.deadline_within_days === 7 ||
    filters.deadline_within_days === 30
  ) {
    const now = new Date();
    const upper = new Date(
      now.getTime() + filters.deadline_within_days * 24 * 60 * 60 * 1000
    );
    // Use related-table filter syntax: not-null + range on rfp_opportunities.deadline.
    query = query
      .not("rfp_opportunities.deadline", "is", null)
      .gte("rfp_opportunities.deadline", now.toISOString())
      .lte("rfp_opportunities.deadline", upper.toISOString());
  }

  // Source filter — `.in()` against the related table
  if (filters.sources && filters.sources.length > 0) {
    query = query.in("rfp_opportunities.source", filters.sources);
  }

  // Min-amount filter against opp.amount_max
  if (typeof filters.min_amount === "number" && filters.min_amount > 0) {
    query = query.gte("rfp_opportunities.amount_max", filters.min_amount);
  }

  // Keyset cursor: rows after (fit_score, opp_id) in the (DESC, ASC) ordering
  if (filters.cursor) {
    const { fit_score, opp_id } = filters.cursor;
    // (fit_score < C.fit_score) OR (fit_score == C.fit_score AND opp_id > C.opp_id)
    query = query.or(
      `fit_score.lt.${fit_score},and(fit_score.eq.${fit_score},opp_id.gt.${opp_id})`
    );
  }

  query = query
    .order("fit_score", { ascending: false })
    .order("opp_id", { ascending: true })
    .limit(fetchLimit);

  const { data, error } = await query;
  if (error) {
    throw new Error(`feed_query_failed: ${error.message}`);
  }

  const rawRows: MatchJoinRow[] = (data ?? []) as MatchJoinRow[];

  // In dual mode, dedup by opp_id keeping the row with the highest fit_score.
  // Iteration order matches the DESC sort, so the first occurrence of an opp_id
  // already has the highest score — but we compare explicitly to be safe against
  // any future ordering changes.
  let workingRows: MatchJoinRow[];
  if (dualMode) {
    const byOpp = new Map<string, MatchJoinRow>();
    for (const r of rawRows) {
      const existing = byOpp.get(r.opp_id);
      if (!existing || r.fit_score > existing.fit_score) {
        byOpp.set(r.opp_id, r);
      }
    }
    // Re-emit in DESC(fit_score), ASC(opp_id) order to keep cursor monotonic.
    workingRows = Array.from(byOpp.values()).sort((a, b) => {
      if (b.fit_score !== a.fit_score) return b.fit_score - a.fit_score;
      return a.opp_id < b.opp_id ? -1 : a.opp_id > b.opp_id ? 1 : 0;
    });
  } else {
    workingRows = rawRows;
  }

  const rows: FeedRow[] = [];
  for (const r of workingRows) {
    const mapped = toFeedRow(r);
    if (mapped) rows.push(mapped);
  }

  if (rows.length > 0) {
    const oppIds = rows.map((row) => row.opp_id);
    const [canonicalByOpp, enrichmentByOpp] = await Promise.all([
      loadCanonicalMetadataForOpps(rfp, oppIds),
      loadEnrichmentsForRows(rfp, oppIds),
    ]);
    for (const row of rows) {
      row.canonical = canonicalByOpp.get(row.opp_id) ?? null;
      const enrichment = enrichmentByOpp.get(row.opp_id) ?? null;
      row.actionability = computeOpportunityActionability({
        fitScore: row.fit_score,
        deadline: row.deadline,
        needsReview: row.needs_review,
        enrichment: enrichment
          ? {
              eligibility: enrichment.eligibility ?? [],
              required_documents: enrichment.required_documents ?? [],
              submission_method: enrichment.submission_method,
              submission_url: enrichment.submission_url,
              risks: enrichment.risks ?? [],
              missing_fields: enrichment.missing_fields ?? [],
              quality_score: enrichment.quality_score ?? 0,
            }
          : null,
      });
    }
  }

  const actionableRows = rows.filter((row) =>
    matchesActionabilityFilter(row.actionability, filters.actionability),
  );
  const collapsedRows = collapseCanonicalRows(
    sortFeedRows(actionableRows, sort),
    limit,
  );

  // If a source filter caused the related row to be filtered out, the parent
  // match row will still appear with rfp_opportunities === null. The toFeedRow
  // skip above already drops those; we don't need an extra in-memory step.

  // Cursor advances from the fetched window, while returned rows are collapsed.
  // This prevents duplicate aliases from producing repeated visible rows across
  // pages.
  const next_cursor =
    workingRows.length === fetchLimit && collapsedRows.length > 0
      ? {
          fit_score: workingRows[workingRows.length - 1].fit_score,
          opp_id: workingRows[workingRows.length - 1].opp_id,
        }
      : null;

  return { rows: collapsedRows, next_cursor };
}
