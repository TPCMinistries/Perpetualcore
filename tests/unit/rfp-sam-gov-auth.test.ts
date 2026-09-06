import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("SAM.gov fetcher auth handling", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetModules();
    process.env.SAM_GOV_API_KEY = "test-key-that-sam-rejects";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.SAM_GOV_API_KEY;
  });

  it("throws a loud, actionable error when SAM.gov returns 401", async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ code: "900901", message: "Invalid Credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    ) as unknown as typeof fetch;

    const { fetchSamGovOpportunities } = await import("@/lib/rfp/ingest/sam-gov");
    await expect(fetchSamGovOpportunities()).rejects.toThrow(/rejected SAM_GOV_API_KEY \(HTTP 401\)/);
  });

  it("still degrades to an empty list on non-auth HTTP failures", async () => {
    global.fetch = vi.fn(async () =>
      new Response("upstream down", { status: 503 })
    ) as unknown as typeof fetch;

    const { fetchSamGovOpportunities } = await import("@/lib/rfp/ingest/sam-gov");
    await expect(fetchSamGovOpportunities()).resolves.toEqual([]);
  });
});
