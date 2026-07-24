import { describe, it, expect, vi, beforeEach } from "vitest";
import type { OpportunityRow } from "@/lib/rfp/ingest/normalize";
import type { OpportunityRowWithId } from "@/lib/rfp/ingest/canonicalize";

/**
 * Unit test for persistCanonicalAliases (FND-02).
 *
 * Proves that two OpportunityRowWithId records sharing the same canonical_key
 * (one from grants_gov, one cross-posted from nsf_grants) collapse into:
 *   - ONE canonical upsert to rfp_opportunity_canonicals
 *   - TWO alias upserts to rfp_opportunity_aliases
 *
 * No real network. createAdminClient is mocked via vi.mock.
 */

// ── Captured upsert payloads ────────────────────────────────────────────────

type UpsertArgs = { table: string; values: unknown[] };
const capturedUpserts: UpsertArgs[] = [];

// ── Mock definition ─────────────────────────────────────────────────────────

// The canonical upsert returns one row; the alias upsert returns two rows.
const CANONICAL_ID = "canonical-uuid-abc123";

function makeMockSupabase() {
  return {
    from: vi.fn((table: string) => {
      return {
        upsert: vi.fn((values: unknown) => {
          const arr = Array.isArray(values) ? values : [values];
          capturedUpserts.push({ table, values: arr });
          return {
            select: vi.fn((_cols: string) => {
              if (table === "rfp_opportunity_canonicals") {
                // Return one canonical row for the shared key
                return Promise.resolve({
                  data: [{ id: CANONICAL_ID, canonical_key: "grants_gov:353936" }],
                  error: null,
                });
              }
              // rfp_opportunity_aliases — return two rows
              return Promise.resolve({
                data: [
                  { opp_id: "opp-id-grants-gov" },
                  { opp_id: "opp-id-nsf-grants" },
                ],
                error: null,
              });
            }),
          };
        }),
      };
    }),
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => makeMockSupabase()),
}));

// ── Import AFTER mock is registered ─────────────────────────────────────────

import { persistCanonicalAliases } from "@/lib/rfp/ingest/canonicalize";

// ── Helpers ──────────────────────────────────────────────────────────────────

function baseRow(overrides: Partial<OpportunityRow>): OpportunityRow {
  return {
    source: "grants_gov",
    source_id: "353936",
    title: "Mathematical Foundations of Artificial Intelligence",
    agency: "National Science Foundation",
    type: "posted",
    amount_min: null,
    amount_max: null,
    deadline: null,
    posted_at: null,
    brief: null,
    keywords: [],
    geo: "US",
    url: "https://www.grants.gov/search-results-detail/353936",
    needs_review: false,
    last_seen_at: "2026-06-04T00:00:00.000Z",
    raw_json: {},
    ...overrides,
  };
}

function rowWithId(
  id: string,
  overrides: Partial<OpportunityRow>,
): OpportunityRowWithId {
  return { ...baseRow(overrides), id };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("persistCanonicalAliases — FND-02 dedup behaviour", () => {
  beforeEach(() => {
    capturedUpserts.length = 0;
    vi.clearAllMocks();
  });

  it("collapses two same-key records from different sources into one canonical and two aliases", async () => {
    /**
     * Row A: canonical grants_gov source.
     * Row B: nsf_grants cross-post carrying raw_json.id=353936 so
     *        deriveOpportunityCanonicalKey returns grants_gov:353936 for both.
     */
    const rowA = rowWithId("opp-id-grants-gov", {
      source: "grants_gov",
      source_id: "353936",
      raw_json: { id: 353936 },
    });

    const rowB = rowWithId("opp-id-nsf-grants", {
      source: "nsf_grants",
      source_id: "24-569",
      raw_json: { id: 353936, number: "24-569" },
    });

    const result = await persistCanonicalAliases([rowA, rowB]);

    // No errors
    expect(result.errors).toHaveLength(0);

    // One canonical upserted
    expect(result.canonicals_seen).toBe(1);

    // Two aliases upserted
    expect(result.aliases_upserted).toBe(2);

    // Canonical payload has exactly ONE unique key
    const canonicalUpsert = capturedUpserts.find(
      (u) => u.table === "rfp_opportunity_canonicals",
    );
    expect(canonicalUpsert).toBeDefined();
    const canonicalValues = canonicalUpsert!.values as Array<{
      canonical_key: string;
    }>;
    const uniqueKeys = new Set(canonicalValues.map((v) => v.canonical_key));
    expect(uniqueKeys.size).toBe(1);
    expect([...uniqueKeys][0]).toBe("grants_gov:353936");

    // Alias payload has two rows, both pointing at the same canonical_id
    const aliasUpsert = capturedUpserts.find(
      (u) => u.table === "rfp_opportunity_aliases",
    );
    expect(aliasUpsert).toBeDefined();
    const aliasValues = aliasUpsert!.values as Array<{
      canonical_id: string;
      opp_id: string;
      source: string;
    }>;
    expect(aliasValues).toHaveLength(2);

    const aliasCanonicalIds = new Set(aliasValues.map((v) => v.canonical_id));
    expect(aliasCanonicalIds.size).toBe(1);
    expect([...aliasCanonicalIds][0]).toBe(CANONICAL_ID);

    const aliasSources = aliasValues.map((v) => v.source).sort();
    expect(aliasSources).toEqual(["grants_gov", "nsf_grants"]);
  });

  it("returns zero counts for an empty input", async () => {
    const result = await persistCanonicalAliases([]);
    expect(result.aliases_upserted).toBe(0);
    expect(result.canonicals_seen).toBe(0);
    expect(result.errors).toHaveLength(0);
    // No DB calls for empty input
    expect(capturedUpserts).toHaveLength(0);
  });

  it("treats a single record as one canonical and one alias", async () => {
    const rowA = rowWithId("opp-id-single", {
      source: "grants_gov",
      source_id: "999999",
      raw_json: { id: 999999 },
    });

    // Re-wire mock so the canonical select returns the matching key for 999999
    const { createAdminClient } = await import("@/lib/supabase/server");
    (createAdminClient as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      from: vi.fn((table: string) => ({
        upsert: vi.fn((values: unknown) => {
          const arr = Array.isArray(values) ? values : [values];
          capturedUpserts.push({ table, values: arr });
          return {
            select: vi.fn((_cols: string) => {
              if (table === "rfp_opportunity_canonicals") {
                return Promise.resolve({
                  data: [{ id: "canonical-single", canonical_key: "grants_gov:999999" }],
                  error: null,
                });
              }
              return Promise.resolve({
                data: [{ opp_id: "opp-id-single" }],
                error: null,
              });
            }),
          };
        }),
      })),
    }));

    const result = await persistCanonicalAliases([rowA]);
    expect(result.errors).toHaveLength(0);
    expect(result.canonicals_seen).toBe(1);
    expect(result.aliases_upserted).toBe(1);
  });
});
