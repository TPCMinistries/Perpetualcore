import { createAdminClient } from "@/lib/supabase/server";
import {
  generateOpportunityEnrichment,
  type OpportunityEnrichment,
  type OpportunityForEnrichment,
} from "./generate";

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

interface OpportunitySelectBuilder {
  eq(column: string, value: string): {
    maybeSingle(): Promise<QueryResult<OpportunityForEnrichment>>;
  };
  order(column: string, options: { ascending: boolean }): {
    range(
      from: number,
      to: number,
    ): Promise<QueryResult<OpportunityForEnrichment[]>>;
    limit(count: number): Promise<QueryResult<OpportunityForEnrichment[]>>;
  };
}

interface EnrichmentSelectBuilder {
  eq(column: string, value: string): {
    maybeSingle(): Promise<QueryResult<OpportunityEnrichment>>;
  };
}

interface UpsertBuilder extends PromiseLike<QueryResult<null>> {
  select(columns: string): {
    maybeSingle(): Promise<QueryResult<OpportunityEnrichment>>;
  };
}

interface RfpAdminDb {
  from(table: "rfp_opportunities"): {
    select(columns: string): OpportunitySelectBuilder;
  };
  from(table: "rfp_opportunity_enrichments"): {
    select(columns: string): EnrichmentSelectBuilder;
    upsert(
      row: Record<string, unknown> | Array<Record<string, unknown>>,
      options: { onConflict: string },
    ): UpsertBuilder;
  };
}

const OPPORTUNITY_COLUMNS =
  "id, source, title, agency, amount_min, amount_max, deadline, posted_at, brief, url, raw_json";

const ENRICHMENT_COLUMNS =
  "opp_id, source, eligibility, required_documents, submission_method, submission_url, contact, matching_funds, funding_method, award_range, timeline, risks, missing_fields, quality_score, raw";

function adminDb(): RfpAdminDb {
  return createAdminClient() as unknown as RfpAdminDb;
}

function toDbRow(enrichment: OpportunityEnrichment): Record<string, unknown> {
  return {
    opp_id: enrichment.opp_id,
    source: enrichment.source,
    eligibility: enrichment.eligibility,
    required_documents: enrichment.required_documents,
    submission_method: enrichment.submission_method,
    submission_url: enrichment.submission_url,
    contact: enrichment.contact,
    matching_funds: enrichment.matching_funds,
    funding_method: enrichment.funding_method,
    award_range: enrichment.award_range,
    timeline: enrichment.timeline,
    risks: enrichment.risks,
    missing_fields: enrichment.missing_fields,
    quality_score: enrichment.quality_score,
    raw: enrichment.raw,
    updated_at: new Date().toISOString(),
  };
}

export async function getOpportunityEnrichment(
  oppId: string,
): Promise<OpportunityEnrichment | null> {
  const { data, error } = await adminDb()
    .from("rfp_opportunity_enrichments")
    .select(ENRICHMENT_COLUMNS)
    .eq("opp_id", oppId)
    .maybeSingle();

  if (error) {
    console.error("[rfp enrichment] load failed", { oppId, error });
    return null;
  }
  return data;
}

export async function upsertOpportunityEnrichment(
  oppId: string,
): Promise<OpportunityEnrichment | null> {
  const { data: opp, error: oppError } = await adminDb()
    .from("rfp_opportunities")
    .select(OPPORTUNITY_COLUMNS)
    .eq("id", oppId)
    .maybeSingle();

  if (oppError || !opp) {
    console.error("[rfp enrichment] opportunity load failed", {
      oppId,
      error: oppError,
    });
    return null;
  }

  const enrichment = generateOpportunityEnrichment(opp);
  const { data, error } = await adminDb()
    .from("rfp_opportunity_enrichments")
    .upsert(toDbRow(enrichment), { onConflict: "opp_id" })
    .select(ENRICHMENT_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("[rfp enrichment] upsert failed", { oppId, error });
    return enrichment;
  }
  return data ?? enrichment;
}

export async function ensureOpportunityEnrichment(
  oppId: string,
): Promise<OpportunityEnrichment | null> {
  return (await getOpportunityEnrichment(oppId)) ?? upsertOpportunityEnrichment(oppId);
}

export async function backfillOpportunityEnrichments(limit = 250): Promise<{
  processed: number;
  enriched: number;
}> {
  const pageSize = 500;
  let processed = 0;
  let enriched = 0;

  for (let offset = 0; offset < limit; offset += pageSize) {
    const upper = Math.min(offset + pageSize, limit) - 1;
    const { data: opportunities, error } = await adminDb()
      .from("rfp_opportunities")
      .select(OPPORTUNITY_COLUMNS)
      .order("id", { ascending: true })
      .range(offset, upper);

    if (error || !opportunities) {
      console.error("[rfp enrichment] backfill load failed", { offset, error });
      break;
    }
    if (opportunities.length === 0) break;

    const rows = opportunities.map((opp) =>
      toDbRow(generateOpportunityEnrichment(opp)),
    );
    const { error: upsertError } = await adminDb()
      .from("rfp_opportunity_enrichments")
      .upsert(rows, { onConflict: "opp_id" });

    processed += opportunities.length;
    if (upsertError) {
      console.error("[rfp enrichment] batch upsert failed", {
        offset,
        error: upsertError,
      });
    } else {
      enriched += rows.length;
    }

    if (opportunities.length < pageSize) break;
  }

  return { processed, enriched };
}
