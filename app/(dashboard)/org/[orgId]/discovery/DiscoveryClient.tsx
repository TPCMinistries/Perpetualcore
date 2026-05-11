"use client";

/**
 * DiscoveryClient — client-side orchestrator for the Discovery feed.
 *
 * Owns:
 *   - Filter state (sources / deadline_within_days / min_amount)
 *   - Mode state (Phase 05-06 — dual-org users only)
 *   - Pagination state (rows, cursor, loading)
 *   - Selection state (which row's detail is open)
 *   - URL search-param sync (filters become bookmarkable / shareable)
 *
 * Re-fetch policy:
 *   - Filters or mode change → reset to page 1, replace rows
 *   - Scroll to bottom (FeedList sentinel) → append next page
 *   - Selection change → DetailPane fetches single-opp detail; list stays put
 *     (scroll position preserved because the list's scrollable container
 *      doesn't unmount when selection changes).
 *
 * Dual-mode (Phase 05-06):
 *   When the active org's type === 'dual', the API call includes `dual=true`
 *   and the current `mode` (all/nonprofit/forprofit). The response may include
 *   an `empty_reason: 'no_member_orgs'` discriminator when the user has a dual
 *   lens but no underlying nonprofit/forprofit member orgs matching the mode;
 *   we render a specific empty state with a /orgs/new CTA in that case.
 *
 * Auto-select: on mount, if no row is selected and we got initial rows from
 * the server prefetch, we pick the first one so DetailPane shows content
 * immediately.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FilterPills,
  type FilterValues,
  type ModeFilter,
} from "./parts/FilterPills";
import { FeedList } from "./parts/FeedList";
import { DetailPane } from "./parts/DetailPane";
import { QuickImportBar } from "@/components/rfp/quick-import-bar";
import type { FeedRow } from "@/lib/rfp/feed";
import type { RfpOrg } from "@/lib/rfp/orgs";

interface InitialCursor {
  fit_score: number;
  opp_id: string;
}

interface DiscoveryClientProps {
  /**
   * Active org. Phase 05-04 passed only orgId; Phase 05-06 needs the org's
   * type to decide whether to enable the Mode pill + dual API calls.
   */
  org: RfpOrg;
  initialRows: FeedRow[];
  initialCursor: InitialCursor | null;
  initialFilters: FilterValues;
  /** Initial Mode selection — only meaningful when org.type === 'dual'. */
  initialMode?: ModeFilter;
  /**
   * Initial empty_reason from the server prefetch (when the dual user has no
   * matching underlying member orgs). When set, the empty state renders
   * immediately on first paint without a flicker.
   */
  initialEmptyReason?: "no_member_orgs" | null;
}

interface FeedApiResponse {
  rows: FeedRow[];
  next_cursor: InitialCursor | null;
  empty_reason?: "no_member_orgs";
  mode?: ModeFilter;
}

function filtersToSearchParams(
  filters: FilterValues,
  mode: ModeFilter,
  isDualMode: boolean
): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.sources.length > 0) p.set("sources", filters.sources.join(","));
  if (filters.deadline_within_days !== null) {
    p.set("deadline_within_days", String(filters.deadline_within_days));
  }
  if (filters.min_amount !== null) {
    p.set("min_amount", String(filters.min_amount));
  }
  // Mode is only meaningful in dual mode, and we only emit non-default to keep URLs clean.
  if (isDualMode && mode !== "all") {
    p.set("mode", mode);
  }
  return p;
}

function encodeCursor(c: InitialCursor): string {
  return Buffer.from(JSON.stringify(c), "utf-8").toString("base64");
}

// Browser fallback for Buffer (Next bundles the polyfill, but be explicit).
function safeEncodeCursor(c: InitialCursor): string {
  try {
    if (typeof Buffer !== "undefined") return encodeCursor(c);
  } catch {
    // fall through
  }
  return btoa(JSON.stringify(c));
}

export function DiscoveryClient({
  org,
  initialRows,
  initialCursor,
  initialFilters,
  initialMode = "all",
  initialEmptyReason = null,
}: DiscoveryClientProps) {
  const router = useRouter();
  const orgId = org.id;
  const isDualMode = org.type === "dual";

  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [mode, setMode] = useState<ModeFilter>(initialMode);
  const [rows, setRows] = useState<FeedRow[]>(initialRows);
  const [cursor, setCursor] = useState<InitialCursor | null>(initialCursor);
  const [selected, setSelected] = useState<FeedRow | null>(
    initialRows[0] ?? null
  );
  const [loading, setLoading] = useState(false);
  const [emptyReason, setEmptyReason] = useState<"no_member_orgs" | null>(
    initialEmptyReason
  );

  // Track the latest filter "request" so out-of-order fetches don't race.
  const filterReqId = useRef(0);

  // Build the API URL from filters + mode + optional cursor
  const buildUrl = useCallback(
    (f: FilterValues, m: ModeFilter, c: InitialCursor | null) => {
      const p = new URLSearchParams();
      p.set("org_id", orgId);
      if (f.sources.length > 0) p.set("sources", f.sources.join(","));
      if (f.deadline_within_days !== null) {
        p.set("deadline_within_days", String(f.deadline_within_days));
      }
      if (f.min_amount !== null) p.set("min_amount", String(f.min_amount));
      if (isDualMode) {
        p.set("dual", "true");
        p.set("mode", m);
      }
      if (c) p.set("cursor", safeEncodeCursor(c));
      return `/api/rfp/opps?${p.toString()}`;
    },
    [orgId, isDualMode]
  );

  // Sync filters + mode → URL search params. scroll:false avoids a jump.
  useEffect(() => {
    const p = filtersToSearchParams(filters, mode, isDualMode);
    const qs = p.toString();
    const next = qs ? `?${qs}` : "";
    router.replace(`/org/${orgId}/discovery${next}`, { scroll: false });
  }, [filters, mode, isDualMode, orgId, router]);

  // Re-fetch from page 1 whenever filters OR mode change.
  // Skip the very first run (the server already pre-fetched with initialFilters).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const reqId = ++filterReqId.current;
    setLoading(true);
    fetch(buildUrl(filters, mode, null))
      .then((r) => r.json() as Promise<FeedApiResponse>)
      .then((data) => {
        // Drop stale responses
        if (reqId !== filterReqId.current) return;
        setRows(data.rows ?? []);
        setCursor(data.next_cursor ?? null);
        setSelected(data.rows?.[0] ?? null);
        setEmptyReason(data.empty_reason ?? null);
      })
      .catch(() => {
        if (reqId !== filterReqId.current) return;
        setRows([]);
        setCursor(null);
        setSelected(null);
        setEmptyReason(null);
      })
      .finally(() => {
        if (reqId === filterReqId.current) setLoading(false);
      });
  }, [buildUrl, filters, mode]);

  // Append the next page (infinite scroll)
  const loadMore = useCallback(() => {
    if (!cursor || loading) return;
    setLoading(true);
    fetch(buildUrl(filters, mode, cursor))
      .then((r) => r.json() as Promise<FeedApiResponse>)
      .then((data) => {
        setRows((prev) => [...prev, ...(data.rows ?? [])]);
        setCursor(data.next_cursor ?? null);
      })
      .catch(() => {
        // leave cursor as-is; let the user retry by scrolling again
      })
      .finally(() => setLoading(false));
  }, [buildUrl, cursor, filters, mode, loading]);

  const selectedOppId = useMemo(() => selected?.opp_id ?? null, [selected]);

  // When the dual user has no underlying member orgs matching the mode, the
  // API returns empty_reason='no_member_orgs'. Render an actionable empty
  // state inside the list pane instead of the generic "No opportunities yet"
  // placeholder — the user's blocker isn't lack of scored opps, it's lack of
  // member orgs to score against.
  const showNoMemberOrgsState =
    isDualMode && emptyReason === "no_member_orgs" && rows.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-zinc-950 text-zinc-100">
      {/* Header: Quick Import (Plan 05-05) + filter pills */}
      <div className="shrink-0 px-4 lg:px-6 py-3 border-b border-zinc-900 space-y-3">
        <QuickImportBar orgId={orgId} />
        <FilterPills
          value={filters}
          onChange={setFilters}
          isDualMode={isDualMode}
          mode={mode}
          onModeChange={setMode}
        />
      </div>

      {/* Split: list left, detail right */}
      <div className="flex-1 min-h-0 grid grid-cols-[minmax(360px,40%)_1fr]">
        <div className="min-h-0 border-r border-zinc-900">
          {showNoMemberOrgsState ? (
            <div className="flex h-full items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <p className="text-zinc-300 italic font-serif text-lg mb-2">
                  No member orgs in{" "}
                  {mode === "all" ? "either side" : mode === "nonprofit" ? "nonprofit" : "for-profit"}.
                </p>
                <p className="text-zinc-500 text-sm">
                  This dual lens shows opportunities scored for the underlying
                  nonprofit and for-profit orgs you belong to. You&apos;re not
                  currently a member of any matching org.
                </p>
                <Link
                  href="/orgs/new"
                  className="mt-4 inline-flex text-emerald-300 hover:text-emerald-200 text-sm uppercase tracking-wide font-mono"
                >
                  + Create or join an org
                </Link>
              </div>
            </div>
          ) : (
            <FeedList
              rows={rows}
              selectedOppId={selectedOppId}
              onSelect={setSelected}
              hasMore={cursor !== null}
              loading={loading}
              onLoadMore={loadMore}
              showOrgBadge={isDualMode}
              activeOrgId={orgId}
            />
          )}
        </div>
        <div className="min-h-0">
          <DetailPane orgId={orgId} selected={selected} />
        </div>
      </div>
    </div>
  );
}
