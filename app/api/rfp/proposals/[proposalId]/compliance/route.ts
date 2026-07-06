/**
 * POST /api/rfp/proposals/[proposalId]/compliance
 *
 * Deterministic capture-readiness pass:
 * - bid/no-bid recommendation
 * - compliance matrix
 * - submission packet checklist
 *
 * Uses existing rfp_compliance_checks rows, so no new schema is needed.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { generateCaptureReadiness } from "@/lib/rfp/compliance/generate";
import { CAPTURE_CHECK_TYPES, type CaptureCheckType } from "@/lib/rfp/compliance/types";
import type { PackageExtraction } from "@/lib/rfp/package/extract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["owner", "writer", "reviewer"]);

const ParamsSchema = z.object({
  proposalId: z.string().uuid(),
});

interface ProposalRow {
  id: string;
  org_id: string;
  opp_id: string | null;
  title: string;
  due_date: string | null;
  vault_chunks_used: unknown;
}

interface OpportunityRow {
  title: string;
  agency: string | null;
  brief: string | null;
  deadline: string | null;
  url: string | null;
  raw_json: unknown;
}

interface MatchRow {
  fit_score: number | null;
  recommendation: string | null;
  chips: string[] | null;
  summary: string | null;
}

interface SectionRow {
  section_type: string;
  content: string | null;
}

interface PackageDocRow {
  extracted_json: unknown;
}

type RfpTableClient = {
  from: (table: string) => {
    select: (columns: string) => RfpQuery;
    delete: () => RfpQuery;
    insert: (values: unknown) => Promise<{ error: { message: string } | null }>;
  };
};

type RfpQuery = {
  eq: (column: string, value: unknown) => RfpQuery;
  in: (column: string, values: readonly string[]) => RfpQuery;
  maybeSingle: <T>() => Promise<{ data: T | null; error: { message: string } | null }>;
  returns: <T>() => Promise<{ data: T | null; error: { message: string } | null }>;
  then: Promise<{ data: unknown; error: { message: string } | null }>["then"];
};

function rfp(client: unknown): RfpTableClient {
  return client as RfpTableClient;
}

function statusFor(checkType: CaptureCheckType, details: unknown): "pass" | "warn" | "fail" {
  if (checkType === "bid_no_bid_v1") {
    const rec = (details as { recommendation?: unknown }).recommendation;
    return rec === "pass" ? "fail" : rec === "maybe" ? "warn" : "pass";
  }
  const status = (details as { overall_status?: unknown }).overall_status;
  return status === "fail" || status === "warn" || status === "pass"
    ? status
    : "warn";
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ proposalId: string }> },
): Promise<NextResponse> {
  let params: z.infer<typeof ParamsSchema>;
  try {
    params = ParamsSchema.parse(await context.params);
  } catch {
    return NextResponse.json({ error: "invalid_proposal_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const userDb = rfp(supabase);
  const { data: proposal, error: pErr } = await userDb
    .from("rfp_proposals")
    .select("id, org_id, opp_id, title, due_date, vault_chunks_used")
    .eq("id", params.proposalId)
    .maybeSingle<ProposalRow>();
  if (pErr || !proposal) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: membership, error: memErr } = await userDb
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", proposal.org_id)
    .eq("user_id", user.id)
    .maybeSingle<{ role: string }>();
  if (memErr || !membership) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!ALLOWED_ROLES.has(membership.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const adminDb = rfp(admin);

  let opportunity: OpportunityRow | null = null;
  let match: MatchRow | null = null;
  if (proposal.opp_id) {
    const { data: opp, error: oppErr } = await adminDb
      .from("rfp_opportunities")
      .select("title, agency, brief, deadline, url, raw_json")
      .eq("id", proposal.opp_id)
      .maybeSingle<OpportunityRow>();
    if (oppErr) {
      return NextResponse.json(
        { error: "opp_load_failed", detail: oppErr.message.slice(0, 200) },
        { status: 500 },
      );
    }
    opportunity = opp;

    const { data: matchRow } = await adminDb
      .from("rfp_opp_matches")
      .select("fit_score, recommendation, chips, summary")
      .eq("opp_id", proposal.opp_id)
      .eq("org_id", proposal.org_id)
      .maybeSingle<MatchRow>();
    match = matchRow;
  }

  const { data: sections, error: sectionsErr } = await adminDb
    .from("rfp_proposal_sections")
    .select("section_type, content")
    .eq("proposal_id", proposal.id)
    .returns<SectionRow[]>();
  if (sectionsErr) {
    return NextResponse.json(
      { error: "sections_load_failed", detail: sectionsErr.message.slice(0, 200) },
      { status: 500 },
    );
  }

  const { data: packageDocs, error: packageErr } = await adminDb
    .from("rfp_package_documents")
    .select("extracted_json")
    .eq("proposal_id", proposal.id)
    .returns<PackageDocRow[]>();
  if (packageErr) {
    return NextResponse.json(
      { error: "package_load_failed", detail: packageErr.message.slice(0, 200) },
      { status: 500 },
    );
  }

  const packageExtractions = (packageDocs ?? [])
    .map((row) => row.extracted_json)
    .filter((value): value is PackageExtraction => {
      if (!value || typeof value !== "object") return false;
      const candidate = value as { kind?: unknown; requirements?: unknown };
      return candidate.kind === "package_requirements_v1" && Array.isArray(candidate.requirements);
    });

  const result = generateCaptureReadiness({
    proposal,
    opportunity,
    match,
    sections: sections ?? [],
    packageExtractions,
  });

  const rows = [
    { check_type: "bid_no_bid_v1" as const, details_json: result.bid_no_bid },
    {
      check_type: "compliance_matrix_v1" as const,
      details_json: result.compliance_matrix,
    },
    {
      check_type: "packet_checklist_v1" as const,
      details_json: result.packet_checklist,
    },
  ].map((row) => ({
    proposal_id: proposal.id,
    check_type: row.check_type,
    status: statusFor(row.check_type, row.details_json),
    details_json: row.details_json,
  }));

  const { error: delErr } = await adminDb
    .from("rfp_compliance_checks")
    .delete()
    .eq("proposal_id", proposal.id)
    .in("check_type", CAPTURE_CHECK_TYPES);
  if (delErr) {
    return NextResponse.json(
      { error: "checks_clear_failed", detail: delErr.message.slice(0, 200) },
      { status: 500 },
    );
  }

  const { error: insertErr } = await adminDb.from("rfp_compliance_checks").insert(rows);
  if (insertErr) {
    return NextResponse.json(
      { error: "checks_insert_failed", detail: insertErr.message.slice(0, 200) },
      { status: 500 },
    );
  }

  await adminDb.from("rfp_agent_sessions").insert({
    proposal_id: proposal.id,
    org_id: proposal.org_id,
    agent: "compliance_v1",
    session_id: `capture_readiness:${Date.now().toString(36)}`,
    model: "deterministic",
    tokens_in: 0,
    tokens_out: 0,
    cost_usd: 0,
  });

  return NextResponse.json(result);
}
