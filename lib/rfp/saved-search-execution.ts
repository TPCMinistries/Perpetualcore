import type { RfpSavedSearch } from "./saved-searches";
import {
  computeOpportunityActionability,
  matchesActionabilityFilter,
} from "@/lib/rfp/actionability";

export interface SavedSearchOpportunity {
  source: string;
  title: string;
  agency: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  brief: string | null;
  url: string | null;
  created_at: string;
  needs_review: boolean | null;
}

interface SavedSearchEnrichmentRow {
  opp_id: string;
  eligibility: string[] | null;
  required_documents: string[] | null;
  submission_method: string | null;
  submission_url: string | null;
  risks: string[] | null;
  missing_fields: string[] | null;
  quality_score: number | null;
}

export interface SavedSearchMatchRow {
  opp_id: string;
  fit_score: number;
  chips: string[] | null;
  summary: string | null;
  rfp_opportunities: SavedSearchOpportunity | null;
}

export interface SavedSearchPreview {
  matches_now: number;
  new_since_last_run: number;
}

type RfpClient = { from: (table: string) => any };

export function defaultSavedSearchSince(now = new Date()): string {
  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

export function dueSince(search: RfpSavedSearch, now = new Date()): string | null {
  const lastRun = search.last_run_at ? new Date(search.last_run_at) : null;
  if (!lastRun || Number.isNaN(lastRun.getTime())) return defaultSavedSearchSince(now);

  const elapsed = now.getTime() - lastRun.getTime();
  const day = 24 * 60 * 60 * 1000;
  const required =
    search.alert_frequency === "instant"
      ? 60 * 60 * 1000
      : search.alert_frequency === "daily"
        ? day
        : 7 * day;
  return elapsed >= required ? lastRun.toISOString() : null;
}

export function matchesSavedSearchFilters(
  row: SavedSearchMatchRow,
  search: RfpSavedSearch,
  opts?: {
    sinceIso?: string | null;
    enrichmentByOpp?: Map<string, SavedSearchEnrichmentRow>;
  },
): boolean {
  const opp = row.rfp_opportunities;
  if (!opp) return false;

  if (opts?.sinceIso) {
    const createdAt = new Date(opp.created_at).getTime();
    const since = new Date(opts.sinceIso).getTime();
    if (!Number.isFinite(createdAt) || createdAt < since) return false;
  }

  const { filters } = search;
  if (filters.sources.length > 0 && !filters.sources.includes(opp.source as never)) {
    return false;
  }
  if (filters.min_amount && (!opp.amount_max || opp.amount_max < filters.min_amount)) {
    return false;
  }
  if (filters.deadline_within_days) {
    if (!opp.deadline) return false;
    const deadline = new Date(opp.deadline);
    const upper = new Date(
      Date.now() + filters.deadline_within_days * 24 * 60 * 60 * 1000,
    );
    if (deadline < new Date() || deadline > upper) return false;
  }
  const q = filters.query.trim().toLowerCase();
  if (q) {
    const haystack = [opp.title, opp.agency, opp.brief]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (filters.actionability) {
    const enrichment = opts?.enrichmentByOpp?.get(row.opp_id) ?? null;
    const actionability = computeOpportunityActionability({
      fitScore: row.fit_score,
      deadline: opp.deadline,
      needsReview: opp.needs_review ?? false,
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
    if (!matchesActionabilityFilter(actionability, filters.actionability)) {
      return false;
    }
  }
  return true;
}

async function loadSavedSearchEnrichments(
  client: RfpClient,
  oppIds: string[],
): Promise<Map<string, SavedSearchEnrichmentRow>> {
  if (oppIds.length === 0) return new Map();
  const { data, error } = await client
    .from("rfp_opportunity_enrichments")
    .select(
      "opp_id, eligibility, required_documents, submission_method, submission_url, risks, missing_fields, quality_score",
    )
    .in("opp_id", oppIds);

  if (error) {
    console.error("[rfp saved-search] enrichment load failed", error);
    return new Map();
  }

  return new Map(
    ((data ?? []) as SavedSearchEnrichmentRow[]).map((row) => [row.opp_id, row]),
  );
}

export async function loadSavedSearchMatches(args: {
  client: RfpClient;
  search: RfpSavedSearch;
  sinceIso?: string | null;
  excludeOppIds?: Set<string>;
  limit?: number;
}): Promise<SavedSearchMatchRow[]> {
  const { data, error } = await args.client
    .from("rfp_opp_matches")
    .select(
      "opp_id, fit_score, chips, summary, rfp_opportunities ( source, title, agency, amount_min, amount_max, deadline, brief, url, created_at, needs_review )",
    )
    .eq("org_id", args.search.org_id)
    .gte("fit_score", args.search.min_fit_score)
    .order("fit_score", { ascending: false })
    .limit(args.limit ?? 500);

  if (error) {
    throw new Error(`saved_search_match_load_failed: ${error.message}`);
  }

  const exclude = args.excludeOppIds ?? new Set<string>();
  const rows = (data ?? []) as SavedSearchMatchRow[];
  const enrichmentByOpp = args.search.filters.actionability
    ? await loadSavedSearchEnrichments(
        args.client,
        rows.map((row) => row.opp_id),
      )
    : undefined;
  return rows.filter(
    (row) =>
      !exclude.has(row.opp_id) &&
      matchesSavedSearchFilters(row, args.search, {
        sinceIso: args.sinceIso,
        enrichmentByOpp,
      }),
  );
}

export async function buildSavedSearchPreview(args: {
  client: RfpClient;
  search: RfpSavedSearch;
  now?: Date;
}): Promise<SavedSearchPreview> {
  const now = args.now ?? new Date();
  const sinceIso = args.search.last_run_at ?? defaultSavedSearchSince(now);
  const rows = await loadSavedSearchMatches({
    client: args.client,
    search: args.search,
    limit: 1_000,
  });
  const newRows = rows.filter((row) =>
    matchesSavedSearchFilters(row, args.search, { sinceIso }),
  );
  return {
    matches_now: rows.length,
    new_since_last_run: newRows.length,
  };
}
