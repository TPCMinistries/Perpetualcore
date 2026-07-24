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
import { Building2, Database, Landmark, Search, SlidersHorizontal, Target } from "lucide-react";
import {
  FilterPills,
  type FilterValues,
  type ModeFilter,
} from "./parts/FilterPills";
import { FeedList } from "./parts/FeedList";
import { DetailPane } from "./parts/DetailPane";
import { SavedSearchControl } from "./parts/SavedSearchControl";
import { DeepResearchButton } from "./parts/DeepResearchButton";
import { QuickImportBar } from "@/components/rfp/quick-import-bar";
import type { OpportunityTriageStatus } from "@/components/rfp/OpportunityTriageControl";
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
  opportunityInventoryCount: number;
  sourceIntelligence: SourceIntelligenceSummary;
  /** Initial Mode selection — only meaningful when org.type === 'dual'. */
  initialMode?: ModeFilter;
  /**
   * Initial empty_reason from the server prefetch (when the dual user has no
   * matching underlying member orgs). When set, the empty state renders
   * immediately on first paint without a flicker.
   */
  initialEmptyReason?: "no_member_orgs" | null;
}

interface SourceIntelligenceSummary {
  liveSourceCount: number;
  curatedProgramCount: number;
  channels: Array<{
    source: string;
    label: string;
    category: string;
    targetScale: string;
  }>;
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
  if (filters.query.trim().length > 0) p.set("q", filters.query.trim());
  if (filters.sources.length > 0) p.set("sources", filters.sources.join(","));
  if (filters.deadline_within_days !== null) {
    p.set("deadline_within_days", String(filters.deadline_within_days));
  }
  if (filters.min_amount !== null) {
    p.set("min_amount", String(filters.min_amount));
  }
  if (filters.actionability !== null) {
    p.set("actionability", filters.actionability);
  }
  if (filters.sort !== "fit") {
    p.set("sort", filters.sort);
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

function orgTypeLabel(type: RfpOrg["type"]): string {
  if (type === "nonprofit") return "Nonprofit";
  if (type === "forprofit") return "For-profit";
  return "Dual";
}

function formatInventoryCount(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return "0";
  return count.toLocaleString("en-US");
}

export function DiscoveryClient({
  org,
  initialRows,
  initialCursor,
  initialFilters,
  opportunityInventoryCount,
  sourceIntelligence,
  initialMode = "all",
  initialEmptyReason = null,
}: DiscoveryClientProps) {
  const router = useRouter();
  const orgId = org.id;
  const isDualMode = org.type === "dual";
  const inventoryLabel = formatInventoryCount(opportunityInventoryCount);

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
      if (f.query.trim().length > 0) p.set("q", f.query.trim());
      if (f.sources.length > 0) p.set("sources", f.sources.join(","));
      if (f.deadline_within_days !== null) {
        p.set("deadline_within_days", String(f.deadline_within_days));
      }
      if (f.min_amount !== null) p.set("min_amount", String(f.min_amount));
      if (f.actionability !== null) p.set("actionability", f.actionability);
      if (f.sort !== "fit") p.set("sort", f.sort);
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
  const [queryDraft, setQueryDraft] = useState(initialFilters.query);

  useEffect(() => {
    setQueryDraft(filters.query);
  }, [filters.query]);

  // When the dual user has no underlying member orgs matching the mode, the
  // API returns empty_reason='no_member_orgs'. Render an actionable empty
  // state inside the list pane instead of the generic "No opportunities yet"
  // placeholder — the user's blocker isn't lack of scored opps, it's lack of
  // member orgs to score against.
  const showNoMemberOrgsState =
    isDualMode && emptyReason === "no_member_orgs" && rows.length === 0;

  const handleImported = useCallback(() => {
    window.location.reload();
  }, []);

  const applySavedSearch = useCallback(
    (nextFilters: FilterValues, nextMode: ModeFilter) => {
      setFilters(nextFilters);
      setQueryDraft(nextFilters.query);
      setMode(nextMode);
    },
    [],
  );

  const handleTriageChange = useCallback(
    (oppId: string, status: OpportunityTriageStatus, note: string | null) => {
      setRows((prev) =>
        prev.map((row) =>
          row.opp_id === oppId
            ? { ...row, triage_status: status, triage_note: note }
            : row,
        ),
      );
      setSelected((prev) =>
        prev && prev.opp_id === oppId
          ? { ...prev, triage_status: status, triage_note: note }
          : prev,
      );
    },
    [],
  );

  const applySearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, query: queryDraft.trim() }));
  }, [queryDraft]);

  const activeFilterCount =
    (filters.query.trim().length > 0 ? 1 : 0) +
    filters.sources.length +
    (filters.deadline_within_days ? 1 : 0) +
    (filters.min_amount ? 1 : 0) +
    (filters.actionability ? 1 : 0) +
    (filters.sort !== "fit" ? 1 : 0) +
    (isDualMode && mode !== "all" ? 1 : 0);
  const curatedChannels = sourceIntelligence.channels.filter(
    (channel) => channel.category === "corporate",
  );

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-[#f4f5f1] text-zinc-950 lg:h-[calc(100vh-3.5rem)]">
      {/* Header: value framing + Quick Import + filter pills */}
      <div id="opportunity-feed" className="shrink-0 border-b border-zinc-200 bg-[#fbfbf7] px-4 py-4 shadow-sm lg:px-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.62fr)] xl:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                Opportunity intelligence
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-800">
                {inventoryLabel} indexed
              </span>
              <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                {orgTypeLabel(org.type)}
              </span>
              {loading && (
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-blue-700">
                  Refreshing
                </span>
              )}
            </div>
            <h1 className="mt-3 max-w-3xl text-[28px] font-semibold leading-[1.08] tracking-tight text-zinc-950 sm:text-[34px]">
              Find fundable opportunities and run the pursuit workflow.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              Explore federal, state, city, and foundation opportunities by
              keyword, source, deadline, amount, NAICS fit, and scored relevance.
            </p>

            <form
              className="mt-4 flex max-w-3xl items-center gap-2 rounded-xl border border-zinc-300 bg-white p-2 shadow-sm"
              onSubmit={(event) => {
                event.preventDefault();
                applySearch();
              }}
            >
              <Search className="ml-2 h-4 w-4 shrink-0 text-zinc-400" />
              <input
                value={queryDraft}
                onChange={(event) => setQueryDraft(event.target.value)}
                placeholder="Search healthcare workforce, youth programs, housing, AI training, reentry..."
                className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
              />
              {filters.query && (
                <button
                  type="button"
                  onClick={() => {
                    setQueryDraft("");
                    setFilters((prev) => ({ ...prev, query: "" }));
                  }}
                  className="hidden text-xs font-medium text-zinc-500 hover:text-zinc-900 sm:inline"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Search
              </button>
            </form>
          </div>

          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-r border-zinc-200 p-4">
              <Database className="mb-2 h-4 w-4 text-emerald-700" />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Indexed
              </p>
              <p className="mt-1 text-xl font-semibold text-zinc-950">
                {inventoryLabel}
              </p>
            </div>
            <div className="border-r border-zinc-200 p-4">
              <Target className="mb-2 h-4 w-4 text-blue-700" />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Shown
              </p>
              <p className="mt-1 text-xl font-semibold text-zinc-950">{rows.length}</p>
            </div>
            <div className="p-4">
              <SlidersHorizontal className="mb-2 h-4 w-4 text-violet-700" />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Filters
              </p>
              <p className="mt-1 text-xl font-semibold text-zinc-950">{activeFilterCount}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,0.74fr)_minmax(280px,0.26fr)]">
          <div className="grid gap-3 sm:grid-cols-2">
            {curatedChannels.map((channel) => {
              const isBank = channel.source === "bank_cra";
              const Icon = isBank ? Landmark : Building2;
              return (
                <button
                  key={channel.source}
                  type="button"
                  onClick={() => setFilters((prev) => ({
                    ...prev,
                    sources: prev.sources.includes(channel.source)
                      ? prev.sources.filter((source) => source !== channel.source)
                      : [...prev.sources, channel.source],
                  }))}
                  className={`group flex min-h-[104px] cursor-pointer items-start gap-3 rounded-xl border bg-white p-4 text-left shadow-sm transition-colors duration-150 hover:border-zinc-400 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 motion-reduce:transition-none ${
                    filters.sources.includes(channel.source)
                      ? "border-emerald-500 ring-1 ring-emerald-500"
                      : "border-zinc-200"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                      isBank
                        ? "border-blue-200 bg-blue-50 text-blue-800"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-zinc-950">
                      {channel.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-zinc-600">
                      {channel.targetScale}
                    </span>
                    <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      {filters.sources.includes(channel.source) ? "Filter active" : "Tap to filter"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              Source network
            </p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">
              {sourceIntelligence.liveSourceCount}
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-600">
              Live source families feeding discovery, including {sourceIntelligence.curatedProgramCount} verified curated funder records.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
          <QuickImportBar orgId={orgId} onImported={handleImported} />
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <FilterPills
              value={filters}
              onChange={setFilters}
              isDualMode={isDualMode}
              mode={mode}
              onModeChange={setMode}
            />
            <div className="flex items-start gap-3">
              <SavedSearchControl
                orgId={orgId}
                filters={filters}
                mode={mode}
                onApply={applySavedSearch}
              />
              <DeepResearchButton orgId={orgId} />
            </div>
          </div>
        </div>
      </div>

      {/* Split: list left, detail right */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(360px,39%)_1fr]">
        <div className="min-h-[360px] border-b border-zinc-200 bg-white lg:min-h-0 lg:border-b-0 lg:border-r">
          {showNoMemberOrgsState ? (
            <div className="flex h-full items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <p className="text-zinc-700 italic font-serif text-lg mb-2">
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
                  className="mt-4 inline-flex text-emerald-600 hover:text-emerald-700 text-sm uppercase tracking-wide font-mono"
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
        <div className="min-h-[520px] bg-[#fbfbf7] lg:min-h-0">
          <DetailPane
            orgId={orgId}
            selected={selected}
            onTriageChange={handleTriageChange}
          />
        </div>
      </div>
    </div>
  );
}
