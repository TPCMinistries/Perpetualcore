"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  BriefcaseBusiness,
  Clapperboard,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_ITEMS,
  MARKETPLACE_STATUS_LABELS,
  type MarketplaceCategoryId,
  type MarketplaceStatus,
} from "@/lib/marketplace/catalog";

type CategoryFilter = "all" | MarketplaceCategoryId;

const CATEGORY_ICONS = {
  "run-coordinate": BriefcaseBusiness,
  "find-win": Sparkles,
  "know-decide": BrainCircuit,
  "hire-develop": UsersRound,
  "create-distribute": Clapperboard,
} satisfies Record<MarketplaceCategoryId, typeof Search>;

const STATUS_STYLES: Record<MarketplaceStatus, string> = {
  live: "border-emerald-300/50 bg-emerald-300/10 text-emerald-100",
  private: "border-violet-300/40 bg-violet-300/10 text-violet-100",
  pilot: "border-amber-300/50 bg-amber-300/10 text-amber-100",
  build: "border-sky-300/40 bg-sky-300/10 text-sky-100",
  invitation: "border-fuchsia-300/40 bg-fuchsia-300/10 text-fuchsia-100",
  engagement: "border-violet-300/40 bg-violet-300/10 text-violet-100",
};

export function MarketplaceExplorer({
  showSearch = true,
}: {
  showSearch?: boolean;
}) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return MARKETPLACE_ITEMS.filter((item) => {
      const categoryMatch =
        category === "all" || item.categoryIds.includes(category);
      const queryMatch =
        normalizedQuery.length === 0 ||
        [
          item.name,
          item.eyebrow,
          item.headline,
          item.description,
          item.buyer,
          ...item.capabilities,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return categoryMatch && queryMatch;
    });
  }, [category, query]);

  return (
    <div>
      <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
            Browse by the job you need done
          </p>
          <div
            className="mt-4 flex gap-2 overflow-x-auto pb-2"
            aria-label="Marketplace categories"
          >
            <button
              type="button"
              onClick={() => setCategory("all")}
              aria-pressed={category === "all"}
              className={`min-h-11 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26f2a8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080a13] ${
                category === "all"
                  ? "border-white bg-white text-[#080a13]"
                  : "border-white/20 bg-white/[0.04] text-white/70 hover:border-white/45 hover:text-white"
              }`}
            >
              All capabilities
            </button>
            {MARKETPLACE_CATEGORIES.map((item) => {
              const Icon = CATEGORY_ICONS[item.id];
              const selected = category === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  aria-pressed={selected}
                  className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26f2a8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080a13] ${
                    selected
                      ? "border-white bg-white text-[#080a13]"
                      : "border-white/20 bg-white/[0.04] text-white/70 hover:border-white/45 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {showSearch ? (
          <div>
            <label
              htmlFor="marketplace-search"
              className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-white/50"
            >
              Search products and capabilities
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45"
                aria-hidden="true"
              />
              <input
                id="marketplace-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="RFPs, meetings, hiring, knowledge..."
                className="min-h-12 w-full rounded-md border border-white/20 bg-white/[0.06] pl-11 pr-4 text-base text-white outline-none placeholder:text-white/35 focus:border-[#26f2a8] focus:ring-2 focus:ring-[#26f2a8]/30"
              />
            </div>
          </div>
        ) : null}
      </div>

      <div aria-live="polite" className="sr-only">
        {filteredItems.length} marketplace capabilities shown
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid gap-px overflow-hidden rounded-lg border border-white/15 bg-white/15 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const content = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6dd7ff]">
                    {item.eyebrow}
                  </p>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] ${STATUS_STYLES[item.status]}`}
                  >
                    {MARKETPLACE_STATUS_LABELS[item.status]}
                  </span>
                </div>
                <div className="mt-10">
                  <h3 className="text-2xl font-semibold tracking-[-0.03em] text-white transition-colors group-hover:text-[#26f2a8]">
                    {item.name}
                  </h3>
                  <p className="mt-3 text-base font-medium leading-6 text-white/88">
                    {item.headline}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white/58">
                    {item.description}
                  </p>
                </div>
                <div className="mt-8">
                  <div className="grid grid-cols-[1fr_auto] gap-4">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
                        Built for
                      </p>
                      <p className="mt-2 text-xs leading-5 text-white/64">
                        {item.buyer}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
                        Delivery
                      </p>
                      <p className="mt-2 text-xs leading-5 text-white/64">
                        {item.delivery}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {item.capabilities.slice(0, 4).map((capability) => (
                    <span
                      key={capability}
                      className="rounded-full border border-white/12 bg-white/[0.035] px-2.5 py-1 text-[11px] text-white/55"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
                <span className="mt-8 inline-flex items-center text-sm font-medium text-white">
                  Explore {item.name}
                  {item.external ? (
                    <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  ) : (
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  )}
                </span>
              </>
            );
            const className =
              "group flex min-h-[430px] cursor-pointer flex-col bg-[#0b0e19] p-6 transition-colors duration-200 hover:bg-[#11172a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#26f2a8] sm:p-7";

            return item.external ? (
              <a
                key={item.slug}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {content}
              </a>
            ) : (
              <Link key={item.slug} href={item.href} className={className}>
                {content}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/20 bg-white/[0.03] p-10 text-center">
          <p className="text-lg font-semibold text-white">
            No exact match yet.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/55">
            Try a broader job such as knowledge, meetings, proposals, hiring, or
            media—or map the workflow with the studio.
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory("all");
              setQuery("");
            }}
            className="mt-5 min-h-11 cursor-pointer rounded-md border border-white/25 px-4 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26f2a8]"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
