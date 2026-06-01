/**
 * GET /api/rfp/opps/[id]?org_id=<uuid>
 *
 * Returns a single opportunity + its rfp_opp_matches row for the caller's org,
 * with the FeedRow fields plus the extended detail fields needed by DetailPane:
 *   score_breakdown (jsonb), posted_at, keywords, geo, raw_json.
 *
 * Auth + RLS:
 *   - Request-scoped createClient — NOT createAdminClient. RLS on
 *     rfp_opp_matches restricts SELECT to rows the caller is a member of via
 *     rfp_user_orgs. If the caller is not a member of org_id, the row simply
 *     isn't visible → 404.
 *   - We deliberately surface 404 (not 403) in both "row doesn't exist" and
 *     "caller-not-member" cases so attackers can't probe for valid IDs.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ensureOpportunityEnrichment } from "@/lib/rfp/enrichment/store";
import type { OpportunityEnrichment } from "@/lib/rfp/enrichment/generate";
import { tierFor } from "@/lib/rfp/scoring/weights";

const QuerySchema = z.object({
  org_id: z.string().uuid(),
});

interface DetailJoinRow {
  opp_id: string;
  fit_score: number;
  chips: string[] | null;
  summary: string | null;
  triage_status: "untriaged" | "watch" | "pursuing" | "passed" | null;
  triage_note: string | null;
  score_breakdown: unknown;
  rfp_opportunities: {
    source: string;
    title: string;
    agency: string | null;
    amount_min: number | null;
    amount_max: number | null;
    deadline: string | null;
    brief: string | null;
    url: string | null;
    needs_review: boolean | null;
    posted_at: string | null;
    keywords: string[] | null;
    geo: string | null;
    raw_json: unknown;
  } | null;
}

interface RfpClient {
  from(table: "rfp_opp_matches"): {
    select(columns: string): {
      eq(column: "opp_id" | "org_id", value: string): {
        eq(column: "opp_id" | "org_id", value: string): {
          maybeSingle(): Promise<{
            data: DetailJoinRow | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate path param
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Parse + validate query
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    org_id: url.searchParams.get("org_id") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_query", detail: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Query — rfp_* tables aren't in database.types.ts yet (per 05-03 pattern).
  const rfp = supabase as unknown as RfpClient;
  const { data, error } = await rfp
    .from("rfp_opp_matches")
    .select(
      "opp_id, fit_score, chips, summary, triage_status, triage_note, score_breakdown, rfp_opportunities ( source, title, agency, amount_min, amount_max, deadline, brief, url, needs_review, posted_at, keywords, geo, raw_json )"
    )
    .eq("opp_id", id)
    .eq("org_id", parsed.data.org_id)
    .maybeSingle();

  if (error) {
    console.error("[/api/rfp/opps/[id] GET] DB error", error);
    return NextResponse.json(
      { error: "detail_unavailable" },
      { status: 500 }
    );
  }

  const row = data as DetailJoinRow | null;
  if (!row || !row.rfp_opportunities) {
    // 404 covers "doesn't exist", "RLS-filtered", and "non-member" cases uniformly.
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const opp = row.rfp_opportunities;
  let enrichment: OpportunityEnrichment | null = null;
  try {
    enrichment = await ensureOpportunityEnrichment(row.opp_id);
  } catch (e) {
    console.error("[/api/rfp/opps/[id] GET] enrichment unavailable", e);
  }

  return NextResponse.json({
    opp_id: row.opp_id,
    source: opp.source,
    title: opp.title,
    agency: opp.agency,
    amount_min: opp.amount_min,
    amount_max: opp.amount_max,
    deadline: opp.deadline,
    brief: opp.brief,
    url: opp.url,
    fit_score: row.fit_score,
    tier: tierFor(row.fit_score),
    chips: row.chips ?? [],
    summary: row.summary,
    triage_status: row.triage_status ?? "untriaged",
    triage_note: row.triage_note,
    needs_review: opp.needs_review ?? false,
    score_breakdown: row.score_breakdown,
    posted_at: opp.posted_at,
    keywords: opp.keywords ?? [],
    geo: opp.geo,
    raw_json: opp.raw_json,
    enrichment,
  });
}
