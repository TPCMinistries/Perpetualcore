import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type {
  SubmissionTaskPriority,
  SubmissionTaskStatus,
} from "@/lib/rfp/submission/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["open", "in_progress", "blocked", "resolved", "waived"] as const;
const PRIORITIES = ["low", "medium", "high", "critical"] as const;

interface ProposalRow {
  id: string;
  org_id: string;
}

interface PatchBody {
  status?: unknown;
  priority?: unknown;
  owner_label?: unknown;
  notes?: unknown;
  due_date?: unknown;
}

function isStatus(value: unknown): value is SubmissionTaskStatus {
  return typeof value === "string" && STATUSES.includes(value as SubmissionTaskStatus);
}

function isPriority(value: unknown): value is SubmissionTaskPriority {
  return typeof value === "string" && PRIORITIES.includes(value as SubmissionTaskPriority);
}

function asOptionalText(value: unknown, max: number): string | undefined {
  if (value === undefined) return undefined;
  if (value === null) return "";
  if (typeof value !== "string") return undefined;
  return value.trim().slice(0, max);
}

function asOptionalDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return value;
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ proposalId: string; taskId: string }> },
): Promise<Response> {
  const { proposalId, taskId } = await context.params;

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

  const body = (await req.json().catch(() => ({}))) as PatchBody;
  const update: {
    status?: SubmissionTaskStatus;
    priority?: SubmissionTaskPriority;
    owner_label?: string;
    notes?: string;
    due_date?: string | null;
    resolved_at?: string | null;
  } = {};

  if (body.status !== undefined) {
    if (!isStatus(body.status)) {
      return NextResponse.json({ error: "invalid_status" }, { status: 422 });
    }
    update.status = body.status;
    update.resolved_at =
      body.status === "resolved" || body.status === "waived"
        ? new Date().toISOString()
        : null;
  }

  if (body.priority !== undefined) {
    if (!isPriority(body.priority)) {
      return NextResponse.json({ error: "invalid_priority" }, { status: 422 });
    }
    update.priority = body.priority;
  }

  const owner = asOptionalText(body.owner_label, 80);
  if (owner !== undefined) update.owner_label = owner || "Unassigned";
  const notes = asOptionalText(body.notes, 2000);
  if (notes !== undefined) update.notes = notes;
  const dueDate = asOptionalDate(body.due_date);
  if (dueDate !== undefined) update.due_date = dueDate;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no_valid_fields" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data: task, error } = await admin
    .from("rfp_submission_tasks")
    .update(update)
    .eq("id", taskId)
    .eq("proposal_id", proposalId)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "task_update_failed", detail: error.message.slice(0, 200) },
      { status: 500 },
    );
  }
  if (!task) {
    return NextResponse.json({ error: "task_not_found" }, { status: 404 });
  }

  return NextResponse.json({ task });
}
