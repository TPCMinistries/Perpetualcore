import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { SECTION_SPECS, SECTION_TYPES, type SectionType } from "@/lib/rfp/draft/sections";
import {
  buildSubmissionManifestRows,
  SUBMISSION_MANIFEST_HEADER,
} from "@/lib/rfp/export/submission-manifest";
import { csvDocument, exportFilename } from "@/lib/rfp/export/csv";
import type {
  BidNoBidArtifact,
  ComplianceMatrixArtifact,
  PacketChecklistArtifact,
} from "@/lib/rfp/compliance/types";
import type { SubmissionTaskRow } from "@/lib/rfp/submission/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ProposalRow {
  id: string;
  org_id: string;
  title: string;
  status: string;
  due_date: string | null;
  opp_id: string | null;
}

interface OppRow {
  title: string;
  agency: string | null;
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
    .select("id, org_id, title, status, due_date, opp_id")
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
  const [sectionsRes, checksRes, tasksRes] = await Promise.all([
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
  ]);

  if (sectionsRes.error || checksRes.error || tasksRes.error) {
    return NextResponse.json(
      {
        error: "manifest_source_load_failed",
        detail: (sectionsRes.error ?? checksRes.error ?? tasksRes.error)?.message.slice(0, 200),
      },
      { status: 500 },
    );
  }

  let opportunity: OppRow | null = null;
  if (proposal.opp_id) {
    const { data } = await admin
      .from("rfp_opportunities")
      .select("title, agency, url")
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

  const sectionsByType = new Map(
    (sectionsRes.data ?? []).map((section) => [section.section_type, section]),
  );
  const sections = SECTION_TYPES.map((type) => ({
    section_type: type,
    label: SECTION_SPECS[type as SectionType].label,
    content: sectionsByType.get(type)?.content ?? null,
  }));

  const rows = buildSubmissionManifestRows({
    proposal,
    opportunity: opportunity
      ? {
          title: opportunity.title,
          agency: opportunity.agency,
          url: opportunity.url,
        }
      : null,
    bidNoBid: parseBidNoBid(checksByType.get("bid_no_bid_v1")),
    complianceMatrix: parseComplianceMatrix(checksByType.get("compliance_matrix_v1")),
    packetChecklist: parsePacketChecklist(checksByType.get("packet_checklist_v1")),
    sections,
    tasks: tasksRes.data ?? [],
  });
  const csv = csvDocument([[...SUBMISSION_MANIFEST_HEADER], ...rows]);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${exportFilename(proposal.title, "submission-manifest")}"`,
      "cache-control": "no-store",
    },
  });
}
