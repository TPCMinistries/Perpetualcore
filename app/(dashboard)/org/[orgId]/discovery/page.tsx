/**
 * /org/[orgId]/discovery — Discovery feed page.
 *
 * Server component. Auth is inherited from `(dashboard)/org/[orgId]/layout.tsx`
 * (which calls getOrgForUser and notFound()s on non-membership). So by the time
 * we get here, the caller IS a member of orgId.
 *
 * Server-side prefetch:
 *   buildFeedQuery is called with the user's auth cookies in scope (request-
 *   scoped createClient inside the helper). This means the prefetch respects
 *   RLS exactly the same way the client-side /api/rfp/opps fetch will. We do
 *   NOT pass an admin client — RLS enforces per-user membership even on the
 *   server prefetch.
 *
 * URL filters are read on the server too so the page renders the right view
 * when shared as a deep link.
 */

import { buildFeedQuery } from "@/lib/rfp/feed";
import { DiscoveryClient } from "./DiscoveryClient";
import type { FilterValues } from "./parts/FilterPills";

interface DiscoveryPageProps {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseFiltersFromSearch(
  raw: Record<string, string | string[] | undefined>
): FilterValues {
  const sources = typeof raw.sources === "string"
    ? raw.sources.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const dl = typeof raw.deadline_within_days === "string"
    ? raw.deadline_within_days
    : null;
  const deadline_within_days: FilterValues["deadline_within_days"] =
    dl === "7" ? 7 : dl === "30" ? 30 : null;

  const minRaw = typeof raw.min_amount === "string" ? raw.min_amount : null;
  const min_amount = minRaw && Number.isFinite(Number(minRaw)) && Number(minRaw) > 0
    ? Math.round(Number(minRaw))
    : null;

  return { sources, deadline_within_days, min_amount };
}

export default async function DiscoveryPage({
  params,
  searchParams,
}: DiscoveryPageProps) {
  const { orgId } = await params;
  const sp = await searchParams;
  const initialFilters = parseFiltersFromSearch(sp);

  // Server-side first-page prefetch — RLS-bound (request-scoped createClient
  // inside buildFeedQuery). Empty rows just mean "no matches yet" — never an
  // auth error here because the layout already enforced membership.
  let initialRows: Awaited<ReturnType<typeof buildFeedQuery>>["rows"] = [];
  let initialCursor: Awaited<
    ReturnType<typeof buildFeedQuery>
  >["next_cursor"] = null;
  try {
    const page = await buildFeedQuery({
      org_id: orgId,
      sources: initialFilters.sources.length > 0 ? initialFilters.sources : undefined,
      deadline_within_days: initialFilters.deadline_within_days,
      min_amount: initialFilters.min_amount,
      limit: 25,
    });
    initialRows = page.rows;
    initialCursor = page.next_cursor;
  } catch (e) {
    // Render an empty feed rather than a 500 — the client will retry on filter change.
    console.error("[discovery/page] prefetch failed", e);
  }

  return (
    <DiscoveryClient
      orgId={orgId}
      initialRows={initialRows}
      initialCursor={initialCursor}
      initialFilters={initialFilters}
    />
  );
}
