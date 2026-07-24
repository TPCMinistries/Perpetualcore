/**
 * GET /api/rfp/opps/[id]?org_id=<uuid>
 *
 * Returns a single opportunity + its rfp_opp_matches row for the caller's org,
 * with the FeedRow fields plus the extended detail fields needed by DetailPane:
 *   score_breakdown (jsonb), posted_at, keywords, geo, raw_json.
 *
 * Phase 18 addition: returns a top-level `fit_reasoning` object containing
 *   { scored_v2, dimensions, disqualifiers, evidence } sourced from
 *   score_breakdown (JSONB v2 fields) and rfp_fit_evidence table.
 *   Pre-v2 rows (no scored_at_v2 sentinel) return
 *   { scored_v2: false, dimensions: null, disqualifiers: [], evidence: [] }
 *   so the UI can show a Rescore CTA without crashing.
 *
 * Auth + RLS:
 *   - Request-scoped createClient — NOT createAdminClient. RLS on
 *     rfp_opp_matches restricts SELECT to rows the caller is a member of via
 *     rfp_user_orgs. If the caller is not a member of org_id, the row simply
 *     isn't visible → 404.
 *   - We deliberately surface 404 (not 403) in both "row doesn't exist" and
 *     "caller-not-member" cases so attackers can't probe for valid IDs.
 *   - rfp_fit_evidence uses the same createClient for the evidence SELECT so
 *     RLS filters to the caller's orgs automatically.
 *   - Admin client only for evidence when RLS alone is insufficient — here
 *     we use createAdminClient for the evidence read after the RLS-gated opp
 *     row confirms membership.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ensureOpportunityEnrichment } from "@/lib/rfp/enrichment/store";
import type { OpportunityEnrichment } from "@/lib/rfp/enrichment/generate";
import { tierFor } from "@/lib/rfp/scoring/weights";
import { loadCanonicalMetadataForOpps } from "@/lib/rfp/canonical-read";
import { computeOpportunityActionability } from "@/lib/rfp/actionability";
import type { ExplainedDimensions } from "@/lib/rfp/scoring/dimensions";
import type { DisqualifierFlag } from "@/lib/rfp/scoring/disqualifiers";
import type { FitEvidenceDimension } from "@/lib/rfp/scoring/evidence-store";

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
  scored_version: number | null;
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

/** A single piece of vault evidence for a dimension. */
interface EvidenceItem {
  artifact_id: string;
  artifact_doc_id: string;
  artifact_title: string;
  artifact_type: string;
  excerpt: string;
  similarity: number;
  dimension: FitEvidenceDimension;
}

/** fit_reasoning shape returned to UI. */
interface FitReasoning {
  scored_v2: boolean;
  dimensions: ExplainedDimensions | null;
  disqualifiers: DisqualifierFlag[];
  /** Evidence items grouped by dimension key. */
  evidence: Record<FitEvidenceDimension, EvidenceItem[]> | Record<string, never>;
}

/** Row shape from rfp_fit_evidence SELECT. */
interface FitEvidenceDbRow {
  artifact_id: string;
  artifact_doc_id: string;
  artifact_title: string;
  artifact_type: string;
  excerpt: string;
  similarity: number;
  dimension: FitEvidenceDimension;
}

interface AmendmentRow {
  id: string;
  material: boolean;
  material_reasons: string[] | null;
  diff_json: unknown;
  status: string;
  created_at: string;
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

  const { data, error } = await supabase
    .from("rfp_opp_matches")
    .select(
      "opp_id, fit_score, chips, summary, triage_status, triage_note, score_breakdown, scored_version, rfp_opportunities ( source, title, agency, amount_min, amount_max, deadline, brief, url, needs_review, posted_at, keywords, geo, raw_json )"
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

  let canonical = null;
  try {
    // Use the RLS-scoped user client so canonical aliases are visible per org membership.
    const canonicalByOpp = await loadCanonicalMetadataForOpps(supabase, [row.opp_id]);
    canonical = canonicalByOpp.get(row.opp_id) ?? null;
  } catch (e) {
    console.error("[/api/rfp/opps/[id] GET] canonical metadata unavailable", e);
  }

  let amendments: AmendmentRow[] = [];
  try {
    const { data: amendmentRows, error: amendmentError } = await supabase
      .from("rfp_solicitation_amendments")
      .select("id, material, material_reasons, diff_json, status, created_at")
      .eq("org_id", parsed.data.org_id)
      .eq("opp_id", id)
      .order("created_at", { ascending: false })
      .limit(5);
    if (amendmentError) {
      console.warn("[/api/rfp/opps/[id] GET] amendment fetch failed (non-fatal):", amendmentError.message);
    } else {
      amendments = (amendmentRows ?? []) as AmendmentRow[];
    }
  } catch (e) {
    console.error("[/api/rfp/opps/[id] GET] amendment fetch threw (non-fatal):", e);
  }

  // ── Phase 18: Build fit_reasoning from score_breakdown v2 fields + rfp_fit_evidence ──
  let fitReasoning: FitReasoning = {
    scored_v2: false,
    dimensions: null,
    disqualifiers: [],
    evidence: {},
  };

  try {
    const bd = row.score_breakdown as Record<string, unknown> | null;
    const isV2 = !!bd && typeof bd === "object" && typeof bd.scored_at_v2 === "string";

    if (isV2 && bd) {
      const dimensions = bd.dimensions as ExplainedDimensions | null ?? null;
      const disqualifiers = Array.isArray(bd.disqualifiers)
        ? (bd.disqualifiers as DisqualifierFlag[])
        : [];

      // Fetch cited evidence rows for this (opp, org) pair at the current scored_version.
      // Use admin client: membership is already confirmed by the RLS-gated rfp_opp_matches
      // read above. Evidence needs service_role for the cross-schema select.
      const admin = createAdminClient() as unknown as { from: (t: string) => any };
      const scoredVersion = typeof row.scored_version === "number" ? row.scored_version : null;

      let evidenceRows: FitEvidenceDbRow[] = [];
      if (scoredVersion !== null) {
        const { data: evData, error: evErr } = await admin
          .from("rfp_fit_evidence")
          .select(
            "artifact_id, artifact_doc_id, artifact_title, artifact_type, excerpt, similarity, dimension"
          )
          .eq("opp_id", id)
          .eq("org_id", parsed.data.org_id)
          .eq("scored_version", scoredVersion)
          .order("similarity", { ascending: false });

        if (evErr) {
          console.warn("[/api/rfp/opps/[id] GET] evidence fetch failed (non-fatal):", evErr.message);
        } else {
          evidenceRows = (evData ?? []) as FitEvidenceDbRow[];
        }
      }

      // Group evidence by dimension
      const evidenceByDimension: Record<FitEvidenceDimension, EvidenceItem[]> = {
        mission_fit: [],
        eligibility: [],
        track_record: [],
        capacity: [],
        funder_relationship: [],
      };
      for (const ev of evidenceRows) {
        if (ev.dimension in evidenceByDimension) {
          evidenceByDimension[ev.dimension].push(ev);
        }
      }

      fitReasoning = {
        scored_v2: true,
        dimensions,
        disqualifiers,
        evidence: evidenceByDimension,
      };
    }
  } catch (e) {
    console.error("[/api/rfp/opps/[id] GET] fit_reasoning build failed (non-fatal):", e);
    // fitReasoning stays as the scored_v2:false stub — UI will show Rescore CTA
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
    canonical,
    amendments,
    actionability: computeOpportunityActionability({
      fitScore: row.fit_score,
      deadline: opp.deadline,
      needsReview: opp.needs_review ?? false,
      enrichment: enrichment
        ? {
            eligibility: enrichment.eligibility,
            required_documents: enrichment.required_documents,
            submission_method: enrichment.submission_method,
            submission_url: enrichment.submission_url,
            risks: enrichment.risks,
            missing_fields: enrichment.missing_fields,
            quality_score: enrichment.quality_score,
          }
        : null,
    }),
    fit_reasoning: fitReasoning,
  });
}
