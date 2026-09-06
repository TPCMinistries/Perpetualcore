/**
 * NYC City Record Online (CROL) — citywide procurement solicitations.
 *
 * Source: NYC Open Data dataset `dg92-zbpx` ("City Record Online"), the
 * public, keyless Socrata mirror of every notice printed in the City Record,
 * including every agency RFP/RFx that is otherwise only browsable inside
 * PASSPort (which cannot be paginated without a headless browser).
 *
 * Coverage verified 2026-09-06: 220 open procurement solicitations across
 * DOHMH, DOE, SBS, NYCEM, EDC, HRA, DYCD, Parks, DCAS, etc. This is the
 * canonical NYC feed; the per-agency PASSPort scrapers (nyc_dycd/hra/doe)
 * only see the first 15 rows of PASSPort and stay as a secondary signal.
 *
 * Auth: none. Never throws — records drift and returns [].
 */

import { createAdminClient } from "@/lib/supabase/server";
import {
  fetchSocrata,
  type SocrataSourceConfig,
} from "@/lib/rfp/ingest/connectors/socrata";
import { recordDrift } from "./drift";
import type { OpportunityInput } from "./types";

const SOURCE = "nyc_cityrecord" as const;

/** Registry key in rfp_state_coverage for this feed. */
export const NYC_CITY_RECORD_STATE_CODE = "US-NYC";

export const NYC_CITY_RECORD_CONFIG: SocrataSourceConfig = {
  domain: "data.cityofnewyork.us",
  dataset_id: "dg92-zbpx",
  source_tag: SOURCE,
  geo: "NYC",
  open_field: "due_date",
  filters: {
    section_name: "Procurement",
    type_of_notice_description: "Solicitation",
  },
  limit: 1000,
  field_map: {
    source_id: "request_id",
    title: "short_title",
    agency: "agency_name",
    type: "selection_method_description",
    deadline: "due_date",
    posted_at: "start_date",
    brief: "additional_description_1",
  },
  url_template: "https://a856-cityrecord.nyc.gov/RequestDetail/{source_id}",
};

export async function fetchNycCityRecordOpportunities(): Promise<
  OpportunityInput[]
> {
  const rows = await fetchSocrata(NYC_CITY_RECORD_CONFIG);

  if (rows.length === 0) {
    await recordDrift({
      source: SOURCE,
      reason: "zero_nodes",
      details: {
        endpoint: `https://${NYC_CITY_RECORD_CONFIG.domain}/resource/${NYC_CITY_RECORD_CONFIG.dataset_id}.json`,
        filters: NYC_CITY_RECORD_CONFIG.filters,
        hint: "SODA query returned no open procurement solicitations; check the dataset id, field names, or an HTTP error logged by the connector.",
      },
    });
    return [];
  }

  const opportunities: OpportunityInput[] = rows.map((row) => ({
    ...row,
    source: SOURCE,
    keywords: row.keywords ?? [],
  }));

  await touchRegistry(opportunities.length);
  return opportunities;
}

/** Best-effort registry heartbeat so the coverage table reflects reality. */
async function touchRegistry(count: number): Promise<void> {
  try {
    const supabase = createAdminClient() as unknown as {
      from: (table: string) => any;
    };
    await supabase
      .from("rfp_state_coverage")
      .update({
        status: "live",
        last_success_at: new Date().toISOString(),
        opportunity_count: count,
        updated_at: new Date().toISOString(),
      })
      .eq("state_code", NYC_CITY_RECORD_STATE_CODE);
  } catch (err) {
    console.warn(
      `[${SOURCE}] registry heartbeat failed:`,
      err instanceof Error ? err.message : String(err)
    );
  }
}
