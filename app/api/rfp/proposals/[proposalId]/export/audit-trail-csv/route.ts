import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { exportFilename } from "@/lib/rfp/export/csv";
import {
  auditTrailCsvDocument,
  type RfpAuditTrailRow,
} from "@/lib/rfp/export/audit-trail-csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ProposalRow {
  id: string;
  org_id: string;
  title: string;
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
    .select("id, org_id, title")
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

  const { data, error } = await createAdminClient()
    .from("rfp_agent_sessions")
    .select("created_at, agent, model, session_id, tokens_in, tokens_out, cost_usd, proposal_id, org_id")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: true })
    .returns<RfpAuditTrailRow[]>();
  if (error) {
    return NextResponse.json(
      { error: "audit_trail_load_failed", detail: error.message.slice(0, 200) },
      { status: 500 },
    );
  }

  return new Response(auditTrailCsvDocument(data ?? []), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${exportFilename(proposal.title, "audit-trail")}"`,
      "cache-control": "no-store",
    },
  });
}
