"use client";

/**
 * DiscoveryClient — client-side orchestrator for the Discovery feed.
 *
 * Owns:
 *   - Filter state (sources / deadline_within_days / min_amount)
 *   - Pagination state (rows, cursor, loading)
 *   - Selection state (which row's detail is open)
 *   - URL search-param sync (filters become bookmarkable / shareable)
 *
 * Re-fetch policy:
 *   - Filters change → reset to page 1, replace rows
 *   - Scroll to bottom (FeedList sentinel) → append next page
 *   - Selection change → DetailPane fetches single-opp detail; list stays put
 *     (scroll position preserved because the list's scrollable container
 *      doesn't unmount when selection changes).
 *
 * Auto-select: on mount, if no row is selected and we got initial rows from
 * the server prefetch, we pick the first one so DetailPane shows content
 * immediately.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FilterPills, type FilterValues } from "./parts/FilterPills";
import { FeedList } from "./parts/FeedList";
import { DetailPane } from "./parts/DetailPane";
import { QuickImportBar } from "@/components/rfp/quick-import-bar";
import type { FeedRow } from "@/lib/rfp/feed";

interface InitialCursor {
  fit_score: number;
  opp_id: string;
}

interface DiscoveryClientProps {
  orgId: string;
  initialRows: FeedRow[];
  initialCursor: InitialCursor | null;
  initialFilters: FilterValues;
}

interface FeedApiResponse {
  rows: FeedRow[];
  next_cursor: InitialCursor | null;
}

function filtersToSearchParams(filters: FilterValues): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.sources.length > 0) p.set("sources", filters.sources.join(","));
  if (filters.deadline_within_days !== null) {
    p.set("deadline_within_days", String(filters.deadline_within_days));
  }
  if (filters.min_amount !== null) {
    p.set("min_amount", String(filters.min_amount));
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
  orgId,
  initialRows,
  initialCursor,
  initialFilters,
}: DiscoveryClientProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [rows, setRows] = useState<FeedRow[]>(initialRows);
  const [cursor, setCursor] = useState<InitialCursor | null>(initialCursor);
  const [selected, setSelected] = useState<FeedRow | null>(
    initialRows[0] ?? null
  );
  const [loading, setLoading] = useState(false);

  // Track the latest filter "request" so out-of-order fetches don't race.
  const filterReqId = useRef(0);

  // Build the API URL from filters + optional cursor
  const buildUrl = useCallback(
    (f: FilterValues, c: InitialCursor | null) => {
      const p = filtersToSearchParams(f);
      p.set("org_id", orgId);
      if (c) p.set("cursor", safeEncodeCursor(c));
      return `/api/rfp/opps?${p.toString()}`;
    },
    [orgId]
  );

  // Sync filters → URL search params. scroll:false avoids a jump.
  useEffect(() => {
    const p = filtersToSearchParams(filters);
    const qs = p.toString();
    const next = qs ? `?${qs}` : "";
    router.replace(`/org/${orgId}/discovery${next}`, { scroll: false });
  }, [filters, orgId, router]);

  // Re-fetch from page 1 whenever filters change.
  // Skip the very first run (the server already pre-fetched with initialFilters).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const reqId = ++filterReqId.current;
    setLoading(true);
    fetch(buildUrl(filters, null))
      .then((r) => r.json() as Promise<FeedApiResponse>)
      .then((data) => {
        // Drop stale responses
        if (reqId !== filterReqId.current) return;
        setRows(data.rows ?? []);
        setCursor(data.next_cursor ?? null);
        setSelected(data.rows?.[0] ?? null);
      })
      .catch(() => {
        if (reqId !== filterReqId.current) return;
        setRows([]);
        setCursor(null);
        setSelected(null);
      })
      .finally(() => {
        if (reqId === filterReqId.current) setLoading(false);
      });
  }, [buildUrl, filters]);

  // Append the next page (infinite scroll)
  const loadMore = useCallback(() => {
    if (!cursor || loading) return;
    setLoading(true);
    fetch(buildUrl(filters, cursor))
      .then((r) => r.json() as Promise<FeedApiResponse>)
      .then((data) => {
        setRows((prev) => [...prev, ...(data.rows ?? [])]);
        setCursor(data.next_cursor ?? null);
      })
      .catch(() => {
        // leave cursor as-is; let the user retry by scrolling again
      })
      .finally(() => setLoading(false));
  }, [buildUrl, cursor, filters, loading]);

  const selectedOppId = useMemo(() => selected?.opp_id ?? null, [selected]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-zinc-950 text-zinc-100">
      {/* Header: Quick Import (Plan 05-05) + filter pills */}
      <div className="shrink-0 px-4 lg:px-6 py-3 border-b border-zinc-900 space-y-3">
        <QuickImportBar orgId={orgId} />
        <FilterPills value={filters} onChange={setFilters} />
      </div>

      {/* Split: list left, detail right */}
      <div className="flex-1 min-h-0 grid grid-cols-[minmax(360px,40%)_1fr]">
        <div className="min-h-0 border-r border-zinc-900">
          <FeedList
            rows={rows}
            selectedOppId={selectedOppId}
            onSelect={setSelected}
            hasMore={cursor !== null}
            loading={loading}
            onLoadMore={loadMore}
          />
        </div>
        <div className="min-h-0">
          <DetailPane orgId={orgId} selected={selected} />
        </div>
      </div>
    </div>
  );
}
