import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type {
  BidNoBidArtifact,
  ComplianceMatrixArtifact,
  PacketChecklistArtifact,
} from "@/lib/rfp/compliance/types";
import type { SubmissionTaskRow } from "@/lib/rfp/submission/tasks";
import { loadSubmitReadinessGate } from "@/lib/rfp/submission/readiness-source";
import type { RfpAuditTrailRow } from "@/lib/rfp/export/audit-trail-csv";
import {
  buildSubmissionBundleZip,
  submissionBundleFilename,
} from "@/lib/rfp/export/submission-bundle";

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

interface SectionRow {
  section_type: string;
  content: string | null;
}

interface ComplianceCheckRow {
  check_type: string;
  details_json: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBidNoBid(value: unknown): BidNoBidArtifact | null {
  if (!isObject(value) || value.kind !== "bid_no_bid_v1") return null;
  if (typeof value.score !== "number") return null;
  return value as unknown as BidNoBidArtifact;
}

function parseComplianceMatrix(value: unknown): ComplianceMatrixArtifact | null {
  if (!isObject(value) || value.kind !== "compliance_matrix_v1") return null;
  if (!Array.isArray(value.items)) return null;
  return value as unknown as ComplianceMatrixArtifact;
}

function parsePacketChecklist(value: unknown): PacketChecklistArtifact | null {
  if (!isObject(value) || value.kind !== "packet_checklist_v1") return null;
  if (!Array.isArray(value.items)) return null;
  return value as unknown as PacketChecklistArtifact;
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
  const [orgRes, sectionsRes, checksRes, tasksRes, auditRes, readinessRes] = await Promise.all([
    admin.from("rfp_orgs").select("name").eq("id", proposal.org_id).maybeSingle<OrgRow>(),
    admin
      .from("rfp_proposal_sections")
      .select("section_type, content")
      .eq("proposal_id", proposalId)
      .returns<SectionRow[]>(),
    admin
      .from("rfp_compliance_checks")
      .select("check_type, details_json")
      .eq("proposal_id", proposalId)
      .in("check_type", [
        "bid_no_bid_v1",
        "compliance_matrix_v1",
        "packet_checklist_v1",
      ])
      .order("created_at", { ascending: false })
      .returns<ComplianceCheckRow[]>(),
    admin
      .from("rfp_submission_tasks")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("status")
      .order("priority")
      .order("created_at", { ascending: true })
      .returns<SubmissionTaskRow[]>(),
    admin
      .from("rfp_agent_sessions")
      .select("created_at, agent, model, session_id, tokens_in, tokens_out, cost_usd, proposal_id, org_id")
      .eq("proposal_id", proposalId)
      .order("created_at", { ascending: true })
      .returns<RfpAuditTrailRow[]>(),
    loadSubmitReadinessGate(proposalId),
  ]);

  if (sectionsRes.error || checksRes.error || tasksRes.error || auditRes.error) {
    return NextResponse.json(
      {
        error: "bundle_source_load_failed",
        detail: (sectionsRes.error ?? checksRes.error ?? tasksRes.error ?? auditRes.error)?.message.slice(0, 200),
      },
      { status: 500 },
    );
  }

  let opportunity: OppRow | null = null;
  if (proposal.opp_id) {
    const { data } = await admin
      .from("rfp_opportunities")
      .select("title, agency, brief, amount_min, amount_max, deadline, url")
      .eq("id", proposal.opp_id)
      .maybeSingle<OppRow>();
    opportunity = data ?? null;
  }

  const checksByType = new Map<string, unknown>();
  for (const row of checksRes.data ?? []) {
    if (!checksByType.has(row.check_type)) {
      checksByType.set(row.check_type, row.details_json);
    }
  }

  const bidNoBid = parseBidNoBid(checksByType.get("bid_no_bid_v1"));
  const complianceMatrix = parseComplianceMatrix(
    checksByType.get("compliance_matrix_v1"),
  );
  const packetChecklist = parsePacketChecklist(
    checksByType.get("packet_checklist_v1"),
  );
  const buffer = await buildSubmissionBundleZip({
    proposal,
    org: orgRes.data ?? null,
    opportunity,
    sections: sectionsRes.data ?? [],
    checks: checksRes.data ?? [],
    bidNoBid,
    complianceMatrix,
    packetChecklist,
    tasks: tasksRes.data ?? [],
    auditRows: auditRes.data ?? [],
    readiness: readinessRes,
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${submissionBundleFilename(proposal.title)}"`,
      "cache-control": "no-store",
    },
  });
}
