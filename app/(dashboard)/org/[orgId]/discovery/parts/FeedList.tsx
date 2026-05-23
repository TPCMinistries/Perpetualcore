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

import { useEffect, useRef, useState } from "react";
import { FeedRow } from "./FeedRow";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import type { FeedRow as FeedRowType } from "@/lib/rfp/feed";

interface FeedListProps {
  rows: FeedRowType[];
  selectedOppId: string | null;
  onSelect: (row: FeedRowType) => void;
  /** True when there are more rows available (cursor !== null). */
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  /**
   * Phase 05-06 — when true (dual-mode), each row gets a scoring-org badge so
   * the user can see which underlying org each opp was matched against.
   */
  showOrgBadge?: boolean;
  /**
   * Phase 05-06 — the active org's id. FeedRow uses this to suppress its badge
   * when the scoring org IS the active org (single-mode case never reaches this
   * branch, so this is purely a dual-mode concern).
   */
  activeOrgId?: string;
}

export function FeedList({
  rows,
  selectedOppId,
  onSelect,
  hasMore,
  loading,
  onLoadMore,
  showOrgBadge = false,
  activeOrgId,
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
    return <EmptyFeed orgId={activeOrgId} />;
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
              showOrgBadge={showOrgBadge}
              activeOrgId={activeOrgId}
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

/**
 * EmptyFeed — empty state with a "Find my matches" recompute button.
 *
 * The most common cause of an empty feed for a real user is "fresh org, no
 * scoring run yet" — not "no opps in the database." The button POSTs to
 * /api/rfp/orgs/{orgId}/recompute-scores which kicks off a fire-and-forget
 * scoring pass; we then poll the parent's reload by hard-refreshing after a
 * short delay (scoring is async and idempotent, so the next page load picks
 * up whatever's landed so far).
 */
function EmptyFeed({ orgId }: { orgId?: string }) {
  const [state, setState] = useState<"idle" | "running" | "error" | "done">(
    "idle",
  );

  const runRecompute = async () => {
    if (!orgId) return;
    setState("running");
    try {
      const res = await fetch(
        `/api/rfp/orgs/${orgId}/recompute-scores`,
        { method: "POST", headers: { "Content-Type": "application/json" } },
      );
      if (!res.ok && res.status !== 202) {
        setState("error");
        return;
      }
      setState("done");
      // Scoring is async; give it a beat to land rows, then reload the feed.
      window.setTimeout(() => window.location.reload(), 2500);
    } catch {
      setState("error");
    }
  };

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <div>
          <p className="font-serif text-lg italic text-zinc-300">
            No opportunities match these filters yet.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            If this org is new, we haven&apos;t scored its fit against current
            opportunities yet. Run the matcher to populate your feed.
          </p>
        </div>

        {orgId && (
          <Button
            type="button"
            onClick={runRecompute}
            disabled={state === "running" || state === "done"}
            className="gap-2"
          >
            {state === "running" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scoring opportunities…
              </>
            ) : state === "done" ? (
              <>
                <Sparkles className="h-4 w-4" />
                Reloading feed…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Find my matches
              </>
            )}
          </Button>
        )}

        {state === "error" && (
          <p role="alert" className="text-xs text-destructive">
            Something went wrong. Try again, or paste an RFP URL into the
            import bar above to seed your feed manually.
          </p>
        )}

        <p className="text-[11px] leading-relaxed text-zinc-600">
          Discovery also scans federal, state, and city sources every six hours.
          New rows land here automatically as they show up upstream.
        </p>
      </div>
    </div>
  );
}
