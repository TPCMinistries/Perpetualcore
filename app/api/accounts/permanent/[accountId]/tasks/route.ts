import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPcClient } from "@/lib/accounts/permanent-account-sync";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = {
  params: {
    accountId: string;
  };
};

type JsonRecord = Record<string, unknown>;

type TaskTemplate = {
  title: string;
  description: string;
  priority: "medium" | "high";
  dueInDays: number;
};

const taskStatusSchema = z.object({
  regenerate: z.boolean().optional(),
});

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: JsonRecord, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value : "";
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function buildAccountTaskTemplates({
  accountName,
  offerName,
  systemName,
  nextStep,
  handoffContext,
}: {
  accountName: string;
  offerName: string;
  systemName: string;
  nextStep: string;
  handoffContext: JsonRecord | null;
}): TaskTemplate[] {
  const workflowOwner = handoffContext ? readString(handoffContext, "workflowOwner") : "";
  const successMetric = handoffContext ? readString(handoffContext, "successMetric") : "";
  const toolsAndData = handoffContext ? readString(handoffContext, "toolsAndData") : "";
  const rules = handoffContext ? readString(handoffContext, "rulesAndEscalations") : "";

  return [
    {
      title: `Confirm ${accountName} kickoff owner and operating lane`,
      description:
        workflowOwner || nextStep
          ? `Confirm the accountable owner, kickoff window, and first lane. Current signal: ${workflowOwner || nextStep}.`
          : `Confirm the accountable owner, kickoff window, and first lane for ${accountName}.`,
      priority: "high",
      dueInDays: 1,
    },
    {
      title: `Map ${accountName}'s first workflow and source systems`,
      description:
        toolsAndData ||
        `Document the first workflow, source systems, handoffs, data access, current bottlenecks, and the smallest useful ${systemName} surface.`,
      priority: "high",
      dueInDays: 2,
    },
    {
      title: `Turn ${accountName}'s examples into assistant behavior`,
      description:
        rules ||
        "Capture examples, edge cases, escalation rules, preferred language, and what the assistant should never decide alone.",
      priority: "high",
      dueInDays: 3,
    },
    {
      title: `Define ${accountName}'s proof metric and review checkpoint`,
      description:
        successMetric ||
        "Name the first measurable proof point, baseline, target, review owner, and date for deciding whether to expand.",
      priority: "medium",
      dueInDays: 5,
    },
    {
      title: `Ship the first ${offerName} operating surface for ${accountName}`,
      description:
        "Create the first useful workspace, assistant prompt, intake path, automation, or dashboard surface that proves the account can operate through Perpetual Core.",
      priority: "high",
      dueInDays: 7,
    },
  ];
}

async function getAuthenticatedAccount(accountId: string) {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();

  if (!user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!accountId) {
    return { response: NextResponse.json({ error: "accountId is required" }, { status: 400 }) };
  }

  const pc = getPcClient();
  const { data: account, error } = await pc
    .from("pc_accounts")
    .select("*")
    .eq("id", accountId)
    .eq("created_by", user.id)
    .single();

  if (error || !account) {
    return { response: NextResponse.json({ error: "Account not found" }, { status: 404 }) };
  }

  return { user, account, pc };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const accountId = params.accountId?.trim();
    const resolved = await getAuthenticatedAccount(accountId);
    if (resolved.response) return resolved.response;

    const admin = createAdminClient();
    const { data: tasks, error } = await admin
      .from("tasks")
      .select("id,title,description,status,priority,due_date,tags,source,source_reference,created_at,updated_at")
      .eq("user_id", resolved.user.id)
      .eq("source_reference", accountId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ tasks: tasks || [] });
  } catch (error) {
    console.error("Permanent account tasks GET error:", error);
    return NextResponse.json({ error: "Could not load account tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const accountId = params.accountId?.trim();
    const resolved = await getAuthenticatedAccount(accountId);
    if (resolved.response) return resolved.response;

    const parsed = taskStatusSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid task request" }, { status: 400 });
    }

    const admin = createAdminClient();
    const [profileResult, engagementsResult, existingTasksResult] = await Promise.all([
      admin.from("profiles").select("organization_id").eq("id", resolved.user.id).single(),
      resolved.pc
        .from("pc_engagements")
        .select("*")
        .eq("account_id", accountId)
        .eq("created_by", resolved.user.id)
        .order("updated_at", { ascending: false }),
      admin
        .from("tasks")
        .select("id,title")
        .eq("user_id", resolved.user.id)
        .eq("source_reference", accountId),
    ]);

    if (profileResult.error || !profileResult.data?.organization_id) {
      return NextResponse.json({ error: "Profile organization not found" }, { status: 400 });
    }

    if (engagementsResult.error) throw engagementsResult.error;
    if (existingTasksResult.error) throw existingTasksResult.error;

    const primaryEngagement = engagementsResult.data?.[0] || null;
    const accountMetadata = isRecord(resolved.account.metadata) ? resolved.account.metadata : {};
    const engagementMetadata = isRecord(primaryEngagement?.metadata) ? primaryEngagement.metadata : {};
    const accountHandoff = isRecord(accountMetadata.account_handoff_context)
      ? accountMetadata.account_handoff_context
      : isRecord(engagementMetadata.account_handoff_context)
        ? engagementMetadata.account_handoff_context
        : null;
    const templates = buildAccountTaskTemplates({
      accountName: resolved.account.name,
      offerName: primaryEngagement?.offer_name || "Perpetual Core",
      systemName: primaryEngagement?.system_name || "AI operating system",
      nextStep: primaryEngagement?.next_step || "Confirm kickoff plan and operating owner",
      handoffContext: accountHandoff,
    });
    const existingTitles = new Set((existingTasksResult.data || []).map((task) => task.title));
    const tasksToCreate = templates.filter((template) => parsed.data.regenerate || !existingTitles.has(template.title));

    if (tasksToCreate.length > 0) {
      const now = new Date().toISOString();
      const { error } = await admin.from("tasks").insert(
        tasksToCreate.map((template) => ({
          organization_id: profileResult.data.organization_id,
          user_id: resolved.user.id,
          title: template.title,
          description: template.description,
          priority: template.priority,
          status: "todo",
          due_date: addDays(template.dueInDays),
          source: "pc_account",
          source_reference: accountId,
          tags: ["perpetual-core-account", "pc-account", "client-delivery", "account-task-plan"],
          created_at: now,
          updated_at: now,
        })),
      );

      if (error) throw error;
    }

    const { data: tasks, error: tasksError } = await admin
      .from("tasks")
      .select("id,title,description,status,priority,due_date,tags,source,source_reference,created_at,updated_at")
      .eq("user_id", resolved.user.id)
      .eq("source_reference", accountId)
      .order("created_at", { ascending: true });

    if (tasksError) throw tasksError;

    return NextResponse.json({
      created: tasksToCreate.length,
      skipped: templates.length - tasksToCreate.length,
      tasks: tasks || [],
    });
  } catch (error) {
    console.error("Permanent account tasks POST error:", error);
    return NextResponse.json({ error: "Could not create account task plan" }, { status: 500 });
  }
}
