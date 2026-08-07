import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  buildSubmissionTasks,
  type SubmissionTaskEnrichment,
  type SubmissionTaskRow,
} from "@/lib/rfp/submission/tasks";
import { ensureOpportunityEnrichment } from "@/lib/rfp/enrichment/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ProposalRow {
  id: string;
  org_id: string;
  opp_id: string | null;
  due_date: string | null;
}

interface SectionRow {
  id: string;
  section_type: string;
  content: string | null;
}

interface ComplianceCheckRow {
  check_type: string;
  details_json: unknown;
  created_at: string;
}

type ProposalAccess =
  | {
      user: { id: string };
      proposal: ProposalRow;
      role: string;
    }
  | {
      error: NextResponse;
    };

async function requireProposalAccess(proposalId: string): Promise<ProposalAccess> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  }

  const { data: proposal } = await supabase
    .from("rfp_proposals")
    .select("id, org_id, opp_id, due_date")
    .eq("id", proposalId)
    .maybeSingle<ProposalRow>();
  if (!proposal) {
    return { error: NextResponse.json({ error: "not_found" }, { status: 404 }) };
  }

  const { data: membership } = await supabase
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", proposal.org_id)
    .eq("user_id", user.id)
    .maybeSingle<{ role: string }>();
  if (!membership) {
    return { error: NextResponse.json({ error: "not_found" }, { status: 404 }) };
  }

  return { user, proposal, role: membership.role };
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ proposalId: string }> },
): Promise<Response> {
  const { proposalId } = await context.params;
  const access = await requireProposalAccess(proposalId);
  if ("error" in access) return access.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rfp_submission_tasks")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("status")
    .order("priority")
    .order("created_at", { ascending: true })
    .returns<SubmissionTaskRow[]>();
  if (error) {
    return NextResponse.json(
      { error: "tasks_load_failed", detail: error.message.slice(0, 200) },
      { status: 500 },
    );
  }

  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ proposalId: string }> },
): Promise<Response> {
  const { proposalId } = await context.params;
  const access = await requireProposalAccess(proposalId);
  if ("error" in access) return access.error;
  if (!["owner", "writer", "reviewer"].includes(access.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const [{ data: sections, error: sectionsError }, { data: checks, error: checksError }] =
    await Promise.all([
      admin
        .from("rfp_proposal_sections")
        .select("id, section_type, content")
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
          "package_requirements_v1",
        ])
        .order("created_at", { ascending: false })
        .returns<ComplianceCheckRow[]>(),
    ]);

  if (sectionsError || checksError) {
    return NextResponse.json(
      {
        error: "task_source_load_failed",
        detail: (sectionsError ?? checksError)?.message.slice(0, 200),
      },
      { status: 500 },
    );
  }

  const enrichment = access.proposal.opp_id
    ? await ensureOpportunityEnrichment(access.proposal.opp_id)
    : null;

  const tasks = buildSubmissionTasks({
    proposalId,
    dueDate: access.proposal.due_date,
    userId: access.user.id,
    sections: sections ?? [],
    checks: checks ?? [],
    enrichment: enrichment as SubmissionTaskEnrichment | null,
  });

  if (tasks.length > 0) {
    const { error: upsertError } = await admin
      .from("rfp_submission_tasks")
      .upsert(tasks, {
        onConflict: "proposal_id,source_type,source_id",
        ignoreDuplicates: false,
      });
    if (upsertError) {
      return NextResponse.json(
        { error: "tasks_upsert_failed", detail: upsertError.message.slice(0, 200) },
        { status: 500 },
      );
    }
  }

  const { data: rows, error: rowsError } = await admin
    .from("rfp_submission_tasks")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("status")
    .order("priority")
    .order("created_at", { ascending: true })
    .returns<SubmissionTaskRow[]>();
  if (rowsError) {
    return NextResponse.json(
      { error: "tasks_reload_failed", detail: rowsError.message.slice(0, 200) },
      { status: 500 },
    );
  }

  return NextResponse.json({ tasks: rows ?? [], generated: tasks.length });
}
