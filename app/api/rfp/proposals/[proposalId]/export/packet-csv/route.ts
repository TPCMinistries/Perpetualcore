import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { csvDocument, exportFilename } from "@/lib/rfp/export/csv";
import type { PacketChecklistArtifact } from "@/lib/rfp/compliance/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ProposalRow {
  id: string;
  org_id: string;
  title: string;
}

interface ComplianceCheckRow {
  details_json: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

  const admin = createAdminClient();
  const { data: check } = await admin
    .from("rfp_compliance_checks")
    .select("details_json")
    .eq("proposal_id", proposalId)
    .eq("check_type", "packet_checklist_v1")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ComplianceCheckRow>();

  const checklist = parsePacketChecklist(check?.details_json);
  if (!checklist) {
    return NextResponse.json(
      { error: "packet_checklist_not_found" },
      { status: 404 },
    );
  }

  const header = ["ID", "Packet item", "Status", "Notes", "Due date", "Submission URL"];
  const rows = checklist.items.map((item) => [
    item.id,
    item.label,
    item.status,
    item.notes,
    checklist.due_date,
    checklist.submission_url,
  ]);
  const csv = csvDocument([header, ...rows]);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${exportFilename(proposal.title, "submission-packet")}"`,
      "cache-control": "no-store",
    },
  });
}
