/**
 * lib/rfp/feed.ts — Server-side feed query helper for the Discovery UI.
 *
 * Phase 05-04 (Plan): The Discovery feed pulls ranked rfp_opp_matches rows joined
 * with rfp_opportunities. Plan 05-03 wrote the scoring engine; this module is the
 * read-side helper that translates UI filters into a single Supabase query.
 *
 * Why request-scoped createClient (NOT createAdminClient):
 *   The RLS policy on rfp_opp_matches restricts SELECT to rows where the caller
 *   is a member of the row's org (via rfp_user_orgs). createAdminClient bypasses
 *   RLS and would let any authenticated user read any org's matches. We instead
 *   use the cookie-bound createClient so the caller's session enforces per-org
 *   scoping. The explicit .eq('org_id', filters.org_id) is a safety belt + a
 *   hint to the planner to use the (org_id, fit_score DESC) index from 05-03.
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
 */

import { createClient } from "@/lib/supabase/server";
import { tierFor, type FitTier } from "@/lib/rfp/scoring/weights";

// ── Public types ─────────────────────────────────────────────────────────────

export interface FeedFilters {
  /** Required — the org whose matches we're reading. RLS enforces membership. */
  org_id: string;
  /** Optional source codes (e.g. ['sam_gov','grants_gov']). Empty/undefined = all. */
  sources?: string[];
  /** 7 or 30 to filter rows whose deadline falls within N days; null/undef = no filter. */
  deadline_within_days?: 7 | 30 | null;
  /** Minimum opp.amount_max in dollars. null/undef = no filter. */
  min_amount?: number | null;
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
}

export interface FeedPage {
  rows: FeedRow[];
  /** When non-null, pass back as `cursor` in the next request. */
  next_cursor: { fit_score: number; opp_id: string } | null;
}

// ── Internal row-shape (from Supabase) ────────────────────────────────────────
// Keep this loose — the rfp_* tables aren't in database.types.ts yet (per
// repo-wide pattern set in 05-01/02/03).

interface MatchJoinRow {
  opp_id: string;
  fit_score: number;
  chips: string[] | null;
  summary: string | null;
  rfp_opportunities: {
    source: string;
    title: string;
    agency: string | null;
    amount_min: number | null;
    amount_max: number | null;
    deadline: string | null;
    brief: string | null;
    url: string | null;
    needs_review: boolean | null;
  } | null;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function toFeedRow(r: MatchJoinRow): FeedRow | null {
  // If the join didn't resolve the parent opportunity row (shouldn't happen, but
  // RLS or a deleted opp could in theory leave a dangling match), skip the row.
  if (!r.rfp_opportunities) return null;
  const opp = r.rfp_opportunities;
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
  };
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function buildFeedQuery(filters: FeedFilters): Promise<FeedPage> {
  // Request-scoped client — RLS enforces caller membership in filters.org_id.
  const supabase = await createClient();
  const limit = filters.limit ?? 25;

  // Untyped client narrowing — rfp_* tables not in database.types.ts yet (per
  // the 05-03 / lib/rfp/orgs.ts pattern). The `from(table) => any` shape lets
  // PostgREST chain methods (.select/.eq/.in/.gte/.lte/.or/.not/.order/.limit)
  // without TS2589 "instantiation excessively deep".
  const rfp = supabase as unknown as {
    from: (table: string) => any;
  };

  let query = rfp
    .from("rfp_opp_matches")
    .select(
      "opp_id, fit_score, chips, summary, rfp_opportunities ( source, title, agency, amount_min, amount_max, deadline, brief, url, needs_review )"
    )
    .eq("org_id", filters.org_id);

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
    .limit(limit);

  const { data, error } = await query;
  if (error) {
    throw new Error(`feed_query_failed: ${error.message}`);
  }

  const rawRows: MatchJoinRow[] = (data ?? []) as MatchJoinRow[];
  const rows: FeedRow[] = [];
  for (const r of rawRows) {
    const mapped = toFeedRow(r);
    if (mapped) rows.push(mapped);
  }

  // If a source filter caused the related row to be filtered out, the parent
  // match row will still appear with rfp_opportunities === null. The toFeedRow
  // skip above already drops those; we don't need an extra in-memory step.

  const next_cursor =
    rows.length === limit
      ? {
          fit_score: rows[rows.length - 1].fit_score,
          opp_id: rows[rows.length - 1].opp_id,
        }
      : null;

  return { rows, next_cursor };
}
