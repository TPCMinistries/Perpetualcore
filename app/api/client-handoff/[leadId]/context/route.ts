import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InsightRecord = Record<string, unknown>;

type LeadRecord = {
  id: string;
  user_id: string | null;
  name: string | null;
  company: string | null;
  email: string | null;
  ai_insights: unknown;
};

type HandoffContext = {
  workflowOwner: string | null;
  toolsAndData: string | null;
  realExamples: string | null;
  rulesAndEscalations: string | null;
  successMetric: string | null;
  notes: string | null;
  submittedAt: string;
};

type TaskTemplate = {
  title: string;
  description: string;
  priority: "high" | "medium";
  dueDate: string;
};

const handoffContextSchema = z.object({
  token: z.string().min(1, "Missing handoff token"),
  workflowOwner: z.string().trim().max(300).optional().nullable(),
  toolsAndData: z.string().trim().max(1500).optional().nullable(),
  realExamples: z.string().trim().max(1500).optional().nullable(),
  rulesAndEscalations: z.string().trim().max(1500).optional().nullable(),
  successMetric: z.string().trim().max(800).optional().nullable(),
  notes: z.string().trim().max(1200).optional().nullable(),
});

function isRecord(value: unknown): value is InsightRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getTokenIsValid(lead: LeadRecord, token: string) {
  if (!isRecord(lead.ai_insights)) return false;
  return token === lead.ai_insights.accountId || token === lead.ai_insights.engagementId;
}

function getAccountName(lead: LeadRecord) {
  return lead.company || lead.name || lead.email || "Client account";
}

function sanitizeOptional(value?: string | null) {
  const cleaned = (value || "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString();
}

function buildHandoffTaskTemplates(lead: LeadRecord, context: HandoffContext): TaskTemplate[] {
  const account = getAccountName(lead);
  const today = new Date();
  const owner = context.workflowOwner || "Confirm the workflow owner";
  const metric = context.successMetric || "Define the measurable first-lane success metric";
  const tools = context.toolsAndData || "Collect current tools, systems, documents, and data access";
  const examples = context.realExamples || "Collect real examples from the workflow";
  const rules = context.rulesAndEscalations || "Define what AI should do, avoid, ask, remember, and escalate";

  return [
    {
      title: `Confirm kickoff owner and window for ${account}`,
      description: `Client submitted handoff context.\n\nWorkflow owner:\n${owner}\n\nSuccess metric:\n${metric}`,
      priority: "high",
      dueDate: addDays(today, 1),
    },
    {
      title: `Map first workflow context for ${account}`,
      description: `Use the client's submitted context to map the current workflow, source systems, users, and handoff points.\n\nTools, data, and access:\n${tools}`,
      priority: "high",
      dueDate: addDays(today, 2),
    },
    {
      title: `Turn client examples into assistant behavior for ${account}`,
      description: `Draft assistant instructions from real operating examples.\n\nReal examples:\n${examples}\n\nRules and escalations:\n${rules}`,
      priority: "high",
      dueDate: addDays(today, 3),
    },
    {
      title: `Define first-lane review checkpoint for ${account}`,
      description: `Define what Perpetual Core will show the client first and how the client will judge whether the lane is worth expanding.\n\nSuccess metric:\n${metric}\n\nAdditional notes:\n${context.notes || "No additional notes submitted."}`,
      priority: "medium",
      dueDate: addDays(today, 5),
    },
    {
      title: `Ship first operating lane for ${account}`,
      description: `Build the first useful operating surface from the submitted context, then prepare the expansion recommendation.`,
      priority: "high",
      dueDate: addDays(today, 7),
    },
  ];
}

async function createMissingHandoffTasks(
  supabase: ReturnType<typeof createAdminClient>,
  lead: LeadRecord,
  context: HandoffContext,
) {
  if (!lead.user_id) return { created: 0, skipped: 0, error: "Lead has no owner" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", lead.user_id)
    .single();

  if (profileError || !profile?.organization_id) {
    return { created: 0, skipped: 0, error: "Lead owner profile not found" };
  }

  const templates = buildHandoffTaskTemplates(lead, context);
  const { data: existingTasks, error: existingError } = await supabase
    .from("tasks")
    .select("title")
    .eq("source_reference", lead.id);

  if (existingError) {
    return { created: 0, skipped: 0, error: "Could not read existing tasks" };
  }

  const existingTitles = new Set((existingTasks || []).map((task) => String(task.title || "").toLowerCase()));
  const tasksToCreate = templates.filter((task) => !existingTitles.has(task.title.toLowerCase()));

  if (tasksToCreate.length === 0) {
    return { created: 0, skipped: templates.length, error: null };
  }

  const { error: insertError } = await supabase.from("tasks").insert(
    tasksToCreate.map((task) => ({
      organization_id: profile.organization_id,
      user_id: lead.user_id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: "todo",
      due_date: task.dueDate,
      source_type: "client_handoff",
      source_reference: lead.id,
      tags: ["perpetual-core-account", "client-delivery", "client-handoff"],
      ai_extracted: false,
    })),
  );

  if (insertError) {
    return { created: 0, skipped: templates.length - tasksToCreate.length, error: "Could not create handoff tasks" };
  }

  return { created: tasksToCreate.length, skipped: templates.length - tasksToCreate.length, error: null };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
) {
  try {
    const { leadId } = await params;
    const parsed = handoffContextSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid handoff context" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const { data: lead, error } = await supabase
      .from("leads")
      .select("id,user_id,name,company,email,ai_insights")
      .eq("id", leadId)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: "Handoff link not found" }, { status: 404 });
    }

    const leadRecord = lead as LeadRecord;
    if (!getTokenIsValid(leadRecord, parsed.data.token)) {
      return NextResponse.json({ error: "Handoff token is not valid" }, { status: 403 });
    }

    const submittedAt = new Date().toISOString();
    const insights = isRecord(leadRecord.ai_insights) ? leadRecord.ai_insights : {};
    const context: HandoffContext = {
      workflowOwner: sanitizeOptional(parsed.data.workflowOwner),
      toolsAndData: sanitizeOptional(parsed.data.toolsAndData),
      realExamples: sanitizeOptional(parsed.data.realExamples),
      rulesAndEscalations: sanitizeOptional(parsed.data.rulesAndEscalations),
      successMetric: sanitizeOptional(parsed.data.successMetric),
      notes: sanitizeOptional(parsed.data.notes),
      submittedAt,
    };

    const nextInsights = {
      ...insights,
      accountHandoffContext: {
        ...(isRecord(insights.accountHandoffContext) ? insights.accountHandoffContext : {}),
        ...context,
      },
    };

    const { error: updateError } = await supabase
      .from("leads")
      .update({
        ai_insights: nextInsights,
        stage: "delivery_handoff",
        updated_at: submittedAt,
      })
      .eq("id", leadId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save handoff context" }, { status: 500 });
    }

    const taskSync = await createMissingHandoffTasks(supabase, leadRecord, context);

    if (leadRecord.user_id) {
      await supabase.from("lead_activities").insert({
        lead_id: leadId,
        user_id: leadRecord.user_id,
        activity_type: "client_handoff_context",
        title: "Client handoff context submitted",
        description: `${getAccountName(leadRecord)} sent workflow owner, tools, examples, rules, and success metric context for kickoff. ${taskSync.created} kickoff task${taskSync.created === 1 ? "" : "s"} created.`,
      });
    }

    return NextResponse.json({ success: true, context, taskSync });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save handoff context";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
