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
  X,
} from "lucide-react";
import { ProductPreview } from "@/components/landing/v3/ProductPreview";
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

const FILTER_LABELS: Record<MarketplaceCategoryId, string> = {
  "run-coordinate": "Run operations",
  "find-win": "Win work",
  "know-decide": "Make decisions",
  "hire-develop": "Develop people",
  "create-distribute": "Create media",
};

const STATUS_STYLES: Record<MarketplaceStatus, string> = {
  live: "bg-[#def6e9] text-[#17664d]",
  private: "bg-[#ece8ff] text-[#5646b5]",
  pilot: "bg-[#fff0d6] text-[#8a5c12]",
  build: "bg-[#e3f1ff] text-[#276599]",
  invitation: "bg-[#ffe7f0] text-[#a43d63]",
  engagement: "bg-[#eee9ff] text-[#6348b4]",
};

export function MarketplaceExplorer() {
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

  const clearFilters = () => {
    setCategory("all");
    setQuery("");
  };

  return (
    <div>
      <div className="sticky top-[72px] z-30 -mx-6 border-y border-black/8 bg-[#f7f6f2]/92 px-6 py-4 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:top-[84px]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1"
            aria-label="Marketplace categories"
          >
            <button
              type="button"
              onClick={() => setCategory("all")}
              aria-pressed={category === "all"}
              className={`min-h-11 shrink-0 cursor-pointer rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5548d9] ${
                category === "all"
                  ? "bg-[#17171b] text-white"
                  : "border border-black/10 bg-white text-[#5f5f68] hover:border-black/22 hover:text-[#222227]"
              }`}
            >
              All products
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
                  className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5548d9] ${
                    selected
                      ? "bg-[#5548d9] text-white"
                      : "border border-black/10 bg-white text-[#5f5f68] hover:border-black/22 hover:text-[#222227]"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {FILTER_LABELS[item.id]}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-[300px] lg:shrink-0">
            <label htmlFor="marketplace-search" className="sr-only">
              Search products and capabilities
            </label>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777781]"
              aria-hidden="true"
            />
            <input
              id="marketplace-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search RFPs, hiring, meetings..."
              className="min-h-11 w-full rounded-full border border-black/10 bg-white pl-11 pr-10 text-base text-[#26262b] outline-none placeholder:text-[#8a8a93] focus:border-[#5548d9] focus:ring-2 focus:ring-[#5548d9]/20"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#777781] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5548d9]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mb-6 mt-8 flex items-center justify-between">
        <p className="text-sm font-medium text-[#66666f]">
          {filteredItems.length}{" "}
          {filteredItems.length === 1 ? "system" : "systems"} shown
        </p>
        {category !== "all" || query ? (
          <button
            type="button"
            onClick={clearFilters}
            className="min-h-11 text-sm font-semibold text-[#5548d9] hover:text-[#332c7d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5548d9]"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <div aria-live="polite" className="sr-only">
        {filteredItems.length} marketplace systems shown
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const content = (
              <>
                <ProductPreview slug={item.slug} label={item.name} />
                <div className="flex flex-1 flex-col p-2 pb-1 pt-5">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold tracking-[-0.025em] text-[#222227]">
                      {item.name}
                    </h2>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[item.status]}`}
                    >
                      {MARKETPLACE_STATUS_LABELS[item.status]}
                    </span>
                  </div>
                  <p className="mt-3 flex-1 text-[15px] leading-6 text-[#5f5f69]">
                    {item.headline}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-black/8 pt-4 text-xs text-[#74747d]">
                    <span>{item.delivery}</span>
                    <span className="inline-flex items-center font-semibold text-[#373148]">
                      Explore
                      {item.external ? (
                        <ArrowUpRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      ) : (
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      )}
                    </span>
                  </div>
                </div>
              </>
            );
            const className =
              "group flex cursor-pointer flex-col rounded-[26px] border border-black/8 bg-[#fbfaf7] p-4 shadow-[0_16px_48px_rgba(29,27,40,0.055)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_62px_rgba(29,27,40,0.11)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5548d9]";

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
        <div className="rounded-[28px] border border-dashed border-black/15 bg-white p-10 text-center">
          <p className="text-xl font-semibold text-[#242429]">No exact match yet.</p>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#66666f]">
            Try a broader term such as proposals, knowledge, hiring, meetings, or
            media—or let the studio map the workflow.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-6 min-h-11 cursor-pointer rounded-full bg-[#17171b] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#34343c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5548d9]"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
