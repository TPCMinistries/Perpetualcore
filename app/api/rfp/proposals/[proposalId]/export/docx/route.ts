import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  buildProposalDocxBuffer,
  proposalDocxFilename,
} from "@/lib/rfp/export/proposal-docx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ProposalRow {
  id: string;
  org_id: string;
  title: string;
  status: string;
  due_date: string | null;
  opp_id: string | null;
  created_at: string;
}

interface SectionRow {
  section_type: string;
  content: string | null;
  version: number;
}

interface OrgRow {
  name: string;
}

interface OppRow {
  title: string;
  agency: string | null;
  brief: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  url: string | null;
}

interface ComplianceCheckRow {
  check_type: string;
  details_json: unknown;
  created_at: string;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ proposalId: string }> },
): Promise<Response> {
  const { proposalId } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: proposal } = await supabase
    .from("rfp_proposals")
    .select("id, org_id, title, status, due_date, opp_id, created_at")
    .eq("id", proposalId)
    .maybeSingle<ProposalRow>();
  if (!proposal) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", proposal.org_id)
    .eq("user_id", user.id)
    .maybeSingle<{ role: string }>();
  if (!membership) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const [{ data: org }, { data: sections }, { data: checks }] = await Promise.all([
    admin.from("rfp_orgs").select("name").eq("id", proposal.org_id).maybeSingle<OrgRow>(),
    admin
      .from("rfp_proposal_sections")
      .select("section_type, content, version")
      .eq("proposal_id", proposalId)
      .returns<SectionRow[]>(),
    admin
      .from("rfp_compliance_checks")
      .select("check_type, details_json, created_at")
      .eq("proposal_id", proposalId)
      .in("check_type", [
        "bid_no_bid_v1",
        "compliance_matrix_v1",
        "packet_checklist_v1",
      ])
      .order("created_at", { ascending: false })
      .returns<ComplianceCheckRow[]>(),
  ]);

  let opp: OppRow | null = null;
  if (proposal.opp_id) {
    const { data } = await admin
      .from("rfp_opportunities")
      .select("title, agency, brief, amount_min, amount_max, deadline, url")
      .eq("id", proposal.opp_id)
      .maybeSingle<OppRow>();
    opp = data ?? null;
  }

  const buffer = await buildProposalDocxBuffer({
    proposal,
    org: org ?? null,
    opportunity: opp,
    sections: sections ?? [],
    checks: checks ?? [],
  });
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "content-disposition": `attachment; filename="${proposalDocxFilename(proposal.title)}"`,
      "cache-control": "no-store",
    },
  });
}
