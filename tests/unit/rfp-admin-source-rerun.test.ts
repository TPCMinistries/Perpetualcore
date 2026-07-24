import { describe, expect, it } from "vitest";

import { canManualRerunSource } from "@/lib/rfp/admin-source-rerun";
import {
  isFederalIngestSource,
  toFederalFetcherSource,
} from "@/lib/rfp/ingest/run";
import { isStateCityIngestSource } from "@/lib/rfp/ingest/run-state-city";

describe("RFP admin source rerun", () => {
  it("supports federal sources, including the sbir schema-to-fetcher mapping", () => {
    expect(isFederalIngestSource("sam_gov")).toBe(true);
    expect(isFederalIngestSource("grants_gov")).toBe(true);
    expect(toFederalFetcherSource("sbir")).toBe("sbir_gov");
    expect(canManualRerunSource("sbir")).toBe(true);
  });

  it("supports state and city scraper sources", () => {
    expect(isStateCityIngestSource("ny_state")).toBe(true);
    expect(isStateCityIngestSource("nyc_dycd")).toBe(true);
    expect(isStateCityIngestSource("ca_grants")).toBe(true);
    expect(canManualRerunSource("ca_grants")).toBe(true);
    // nj_grants gained an automated NJ START scraper (run-state-city SCRAPERS),
    // so it is manually rerunnable now.
    expect(isStateCityIngestSource("nj_grants")).toBe(true);
    expect(canManualRerunSource("nj_grants")).toBe(true);
  });

  it("does not expose manual runners for planned, blocked, or manual-only sources", () => {
    expect(canManualRerunSource("foundation_url")).toBe(false);
    expect(canManualRerunSource("candid_foundation_directory")).toBe(false);
  });
});
