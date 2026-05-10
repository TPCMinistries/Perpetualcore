"use client";

/**
 * FeedList — scrollable, infinite-scroll list of FeedRow.
 *
 * Scroll persistence: this component owns its own scroll container. Because
 * DiscoveryClient renders FeedList and DetailPane as siblings, selecting a row
 * does NOT remount the list — the scroll position is preserved naturally by
 * React (and by the browser's DOM-level scrollTop on the inner div).
 *
 * Infinite scroll: an IntersectionObserver watches a sentinel element at the
 * bottom of the list. When it scrolls into view AND cursor !== null AND we're
 * not already loading, we call onLoadMore(). 25 rows per chunk per 05-CONTEXT.md.
 *
 * Empty state: when rows.length === 0, we render an explicit "No opportunities
 * yet" message so the user knows the feed is intentionally empty (vs broken).
 */

import { useEffect, useRef } from "react";
import { FeedRow } from "./FeedRow";
import type { FeedRow as FeedRowType } from "@/lib/rfp/feed";

interface FeedListProps {
  rows: FeedRowType[];
  selectedOppId: string | null;
  onSelect: (row: FeedRowType) => void;
  /** True when there are more rows available (cursor !== null). */
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}

export function FeedList({
  rows,
  selectedOppId,
  onSelect,
  hasMore,
  loading,
  onLoadMore,
}: FeedListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onLoadMore();
            break;
          }
        }
      },
      { rootMargin: "200px" } // start fetching ~one viewport before the bottom
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (rows.length === 0 && !loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center max-w-xs">
          <p className="font-serif italic text-zinc-300 text-lg">
            No opportunities yet.
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            The cron scans for new RFPs every six hours. Adjust your filters or
            check back soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" data-testid="feed-list-scroll">
      <ul className="divide-y divide-zinc-900">
        {rows.map((row) => (
          <li key={row.opp_id}>
            <FeedRow
              row={row}
              selected={row.opp_id === selectedOppId}
              onClick={() => onSelect(row)}
            />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div
          ref={sentinelRef}
          className="py-4 text-center text-xs uppercase tracking-wide text-zinc-500 font-mono"
        >
          {loading ? "Loading…" : "Scroll for more"}
        </div>
      )}
      {!hasMore && rows.length > 0 && (
        <div className="py-6 text-center text-xs uppercase tracking-wide text-zinc-600 font-mono">
          End of feed
        </div>
      )}
    </div>
  );
}
