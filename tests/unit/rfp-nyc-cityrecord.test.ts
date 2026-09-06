import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchSocrata } from "@/lib/rfp/ingest/connectors/socrata";
import { NYC_CITY_RECORD_CONFIG } from "@/lib/rfp/ingest/scrape/nyc-cityrecord";

describe("NYC City Record Socrata config", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("queries open procurement solicitations and deep-links each notice", async () => {
    let requested = "";
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      requested = String(input);
      return new Response(
        JSON.stringify([
          {
            request_id: "20260825021",
            short_title: "01727P0002-Strengthening Communities Database #2",
            agency_name: "Emergency Management",
            selection_method_description: "Competitive Sealed Proposals",
            due_date: "2026-09-21T00:00:00.000",
            start_date: "2026-09-01T00:00:00.000",
            additional_description_1: "<p>NYCEM is seeking an off-the-shelf, secure database.</p>",
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as unknown as typeof fetch;

    const rows = await fetchSocrata({ ...NYC_CITY_RECORD_CONFIG, now: "2026-09-06T00:00:00Z" });

    const url = new URL(requested);
    expect(url.hostname).toBe("data.cityofnewyork.us");
    expect(url.pathname).toBe("/resource/dg92-zbpx.json");
    expect(url.searchParams.get("section_name")).toBe("Procurement");
    expect(url.searchParams.get("type_of_notice_description")).toBe("Solicitation");
    expect(url.searchParams.get("$where")).toContain("due_date > '2026-09-06T00:00:00'");

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      source: "nyc_cityrecord",
      source_id: "20260825021",
      agency: "Emergency Management",
      type: "Competitive Sealed Proposals",
      deadline: "2026-09-21T00:00:00.000",
      geo: "NYC",
      url: "https://a856-cityrecord.nyc.gov/RequestDetail/20260825021",
    });
    expect(rows[0].brief).toBe("NYCEM is seeking an off-the-shelf, secure database.");
  });
});
