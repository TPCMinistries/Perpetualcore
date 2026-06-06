import { describe, expect, it } from "vitest";

import { deriveOpportunityCanonicalKey } from "@/lib/rfp/ingest/canonicalize";
import type { OpportunityRow } from "@/lib/rfp/ingest/normalize";

function row(overrides: Partial<OpportunityRow>): OpportunityRow {
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

describe("RFP opportunity canonicalization", () => {
  it("prefers the Grants.gov numeric ID for federal cross-posted records", () => {
    const derived = deriveOpportunityCanonicalKey(
      row({
        source: "nsf_grants",
        source_id: "24-569",
        raw_json: { id: 353936, number: "24-569" },
      }),
    );

    expect(derived.key).toBe("grants_gov:353936");
    expect(derived.confidence).toBe(0.98);
    expect(derived.evidence).toMatchObject({ match: "grants_gov_id" });
  });

  it("falls back to source opportunity numbers when no Grants.gov ID is present", () => {
    const derived = deriveOpportunityCanonicalKey(
      row({
        source: "nih_grants",
        source_id: "RFA-AI-25-012",
        url: null,
        raw_json: { number: "RFA-AI-25-012" },
      }),
    );

    expect(derived.key).toBe("opportunity_number:RFA-AI-25-012");
    expect(derived.confidence).toBe(0.9);
  });

  it("uses a normalized title and agency fallback for local imported records", () => {
    const derived = deriveOpportunityCanonicalKey(
      row({
        source: "foundation_url",
        source_id: "local-1",
        title: "Community Health: Workforce Training!!",
        agency: "Example Foundation",
        url: null,
        raw_json: {},
      }),
    );

    expect(derived.key).toBe(
      "opportunity_number:LOCAL-1",
    );
  });
});
