import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { ComplianceMatrixArtifact } from "@/lib/rfp/compliance/types";

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

function parseComplianceMatrix(value: unknown): ComplianceMatrixArtifact | null {
  if (!isObject(value) || value.kind !== "compliance_matrix_v1") return null;
  if (!Array.isArray(value.items)) return null;
  return value as unknown as ComplianceMatrixArtifact;
}

function csvCell(value: string | number | null | undefined): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function filename(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "proposal"}-compliance-matrix.csv`;
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
    .eq("check_type", "compliance_matrix_v1")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ComplianceCheckRow>();

  const matrix = parseComplianceMatrix(check?.details_json);
  if (!matrix) {
    return NextResponse.json(
      { error: "compliance_matrix_not_found" },
      { status: 404 },
    );
  }

  const header = [
    "ID",
    "Category",
    "Requirement",
    "Source",
    "Response status",
    "Owner section",
    "Evidence",
  ];
  const rows = matrix.items.map((item) => [
    item.id,
    item.category,
    item.requirement,
    item.source,
    item.response_status,
    item.owner_section,
    item.evidence,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename(proposal.title)}"`,
      "cache-control": "no-store",
    },
  });
}
