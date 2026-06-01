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
 * Phase 05-06 — dual mode prefetch:
 *   When the active org has type='dual', the prefetch resolves the user's
 *   underlying nonprofit/forprofit member orgs via listUserOrgs() and either:
 *     (a) Passes dual_org_ids to buildFeedQuery (matching what the API does), OR
 *     (b) Short-circuits with empty rows + empty_reason='no_member_orgs' when
 *         the user has no qualifying underlying member orgs.
 *   The client receives the same response shape it'd get from the API, so
 *   first paint and subsequent fetches stay visually identical.
 *
 * URL filters are read on the server too so the page renders the right view
 * when shared as a deep link. Mode is also read from ?mode=... in dual mode.
 */

import { buildFeedQuery } from "@/lib/rfp/feed";
import { getOpportunityInventoryCount } from "@/lib/rfp/inventory";
import { getOrgForUser, listUserOrgs } from "@/lib/rfp/orgs";
import { getOnboardingState } from "@/lib/rfp/onboarding";
import { OnboardingChecklist } from "@/components/rfp/OnboardingChecklist";
import { DeadlineTracker } from "@/components/rfp/DeadlineTracker";
import { notFound } from "next/navigation";
import { DiscoveryClient } from "./DiscoveryClient";
import type { FilterValues, ModeFilter } from "./parts/FilterPills";

interface DiscoveryPageProps {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseFiltersFromSearch(
  raw: Record<string, string | string[] | undefined>
): FilterValues {
  const query = typeof raw.q === "string" ? raw.q.trim().slice(0, 100) : "";

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

  return { query, sources, deadline_within_days, min_amount };
}

function parseModeFromSearch(
  raw: Record<string, string | string[] | undefined>
): ModeFilter {
  const m = typeof raw.mode === "string" ? raw.mode : null;
  if (m === "nonprofit" || m === "forprofit" || m === "all") return m;
  return "all";
}

export default async function DiscoveryPage({
  params,
  searchParams,
}: DiscoveryPageProps) {
  const { orgId } = await params;
  const sp = await searchParams;
  const initialFilters = parseFiltersFromSearch(sp);
  const initialMode = parseModeFromSearch(sp);

  // Load the active org (also serves as a membership check — getOrgForUser
  // returns null for non-members thanks to RLS). The dashboard layout already
  // does this check, but doing it here too lets us read org.type without
  // duplicating the layout's prop drilling.
  const org = await getOrgForUser(orgId);
  if (!org) {
    // Defense-in-depth — layout would have already 404'd, but if a deep link
    // somehow lands here without membership, we re-enforce.
    notFound();
  }

  const isDualMode = org.type === "dual";

  // For dual mode we need to resolve the underlying org ids upfront so the
  // server prefetch hits the same data the client API would.
  let dualOrgIds: string[] | undefined;
  let initialEmptyReason: "no_member_orgs" | null = null;
  if (isDualMode) {
    const memberOrgs = await listUserOrgs();
    const underlying = memberOrgs.filter((m) => m.rfp_orgs.type !== "dual");
    let filtered: typeof underlying;
    if (initialMode === "nonprofit") {
      filtered = underlying.filter((m) => m.rfp_orgs.type === "nonprofit");
    } else if (initialMode === "forprofit") {
      filtered = underlying.filter((m) => m.rfp_orgs.type === "forprofit");
    } else {
      filtered = underlying;
    }
    if (filtered.length === 0) {
      initialEmptyReason = "no_member_orgs";
    } else {
      dualOrgIds = filtered.map((m) => m.rfp_orgs.id);
    }
  }

  // Server-side first-page prefetch — RLS-bound (request-scoped createClient
  // inside buildFeedQuery). Empty rows just mean "no matches yet" — never an
  // auth error here because the layout already enforced membership.
  let initialRows: Awaited<ReturnType<typeof buildFeedQuery>>["rows"] = [];
  let initialCursor: Awaited<
    ReturnType<typeof buildFeedQuery>
  >["next_cursor"] = null;
  // Skip the prefetch entirely when we already know the dual user has no
  // member orgs — the client will render the empty state immediately and a
  // wasted query would just return [] anyway.
  if (initialEmptyReason !== "no_member_orgs") {
    try {
      const page = await buildFeedQuery({
        org_id: orgId,
        dual_org_ids: dualOrgIds,
        mode_filter: isDualMode ? initialMode : undefined,
        sources: initialFilters.sources.length > 0 ? initialFilters.sources : undefined,
        query: initialFilters.query,
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
  }

  // First-run checklist — auto-hides when all 5 steps complete. Cheap to
  // compute (4 parallel HEAD counts) and the page is already an SSR critical
  // path, so we keep it in the same request.
  const [onboarding, opportunityInventoryCount] = await Promise.all([
    getOnboardingState(orgId),
    getOpportunityInventoryCount(),
  ]);

  return (
    <>
      {onboarding.all_complete ? null : (
        <div className="mx-auto mb-6 max-w-5xl px-6">
          <OnboardingChecklist
            orgId={orgId}
            state={onboarding}
            opportunityInventoryCount={opportunityInventoryCount}
          />
        </div>
      )}
      <DeadlineTracker
        orgId={orgId}
        rows={initialRows.map((r) => ({
          opp_id: r.opp_id,
          title: r.title,
          agency: r.agency,
          deadline: r.deadline,
        }))}
      />
      <DiscoveryClient
        org={org}
        initialRows={initialRows}
        initialCursor={initialCursor}
        initialFilters={initialFilters}
        opportunityInventoryCount={opportunityInventoryCount}
        initialMode={initialMode}
        initialEmptyReason={initialEmptyReason}
      />
    </>
  );
}
