import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { SubmissionTaskRow } from "@/lib/rfp/submission/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  title: z.string().trim().min(3).max(160),
  detail: z.string().trim().max(1000).optional().default(""),
  owner_label: z.string().trim().max(80).optional().default("Proposal lead"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional()
    .default(null),
});

interface ProposalRow {
  id: string;
  org_id: string;
}

export async function POST(
  req: Request,
  context: { params: Promise<{ proposalId: string }> },
): Promise<Response> {
  const { proposalId } = await context.params;
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", detail: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: proposal } = await supabase
    .from("rfp_proposals")
    .select("id, org_id")
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
  if (!["owner", "writer", "reviewer"].includes(membership.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = parsed.data;
  const admin = createAdminClient();
  const { data: task, error } = await admin
    .from("rfp_submission_tasks")
    .insert({
      proposal_id: proposalId,
      source_type: "manual",
      source_id: `manual:${randomUUID()}`,
      title: body.title,
      detail: body.detail,
      owner_label: body.owner_label || "Proposal lead",
      status: "open",
      priority: body.priority,
      due_date: body.due_date,
      notes: "",
      evidence: "",
      created_by: user.id,
    })
    .select("*")
    .single<SubmissionTaskRow>();

  if (error) {
    return NextResponse.json(
      { error: "task_create_failed", detail: error.message.slice(0, 200) },
      { status: 500 },
    );
  }

  return NextResponse.json({ task });
}
