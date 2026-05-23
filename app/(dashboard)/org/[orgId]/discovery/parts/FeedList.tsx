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
    <div className="flex h-full items-center justify-center p-10">
      <div className="relative w-full max-w-sm text-center">
        {/* Soft emerald halo behind the card */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-12 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.18),transparent)] blur-2xl"
        />

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-zinc-950 shadow-[0_0_40px_-5px_rgba(16,185,129,0.55)]">
            <Sparkles className="h-5 w-5" />
          </div>

          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-300/80">
            New org · feed unscored
          </p>
          <h2
            className="mt-2 text-2xl italic leading-tight text-zinc-100"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Score this org against current opportunities.
          </h2>
          <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">
            We&apos;ll match every open RFP against your capacity profile,
            NAICS codes, and capacity summary — then rank what fits.
          </p>

          {orgId && (
            <Button
              type="button"
              onClick={runRecompute}
              disabled={state === "running" || state === "done"}
              className="mt-6 h-11 w-full gap-2 rounded-md bg-gradient-to-br from-emerald-400 to-teal-600 text-[13px] font-medium text-zinc-950 shadow-[0_0_30px_-5px_rgba(16,185,129,0.55)] hover:from-emerald-300 hover:to-teal-500 disabled:opacity-70"
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
            <p
              role="alert"
              className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/5 p-3 text-[12px] text-rose-300"
            >
              Something went wrong. Try again, or paste an RFP URL into the
              import bar above to seed your feed manually.
            </p>
          )}

          <p className="mt-6 border-t border-white/5 pt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Discovery also re-scans every 6 hours
          </p>
        </div>
      </div>
    </div>
  );
}
