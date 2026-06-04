import { createAdminClient } from "@/lib/supabase/server";

type SupabaseAdminClient = ReturnType<typeof createAdminClient>;

export type AccountHandoffLead = {
  id: string;
  user_id: string | null;
  name: string | null;
  company: string | null;
  email: string | null;
};

export type AccountHandoffContext = {
  workflowOwner: string | null;
  toolsAndData: string | null;
  realExamples: string | null;
  rulesAndEscalations: string | null;
  successMetric: string | null;
  notes: string | null;
  submittedAt?: string | null;
};

type TaskTemplate = {
  title: string;
  description: string;
  priority: "high" | "medium";
  dueDate: string;
};

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString();
}

function getAccountName(lead: AccountHandoffLead) {
  return lead.company || lead.name || lead.email || "Client account";
}

export function buildHandoffTaskTemplates(
  lead: AccountHandoffLead,
  context: AccountHandoffContext,
): TaskTemplate[] {
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
      description: "Build the first useful operating surface from the submitted context, then prepare the expansion recommendation.",
      priority: "high",
      dueDate: addDays(today, 7),
    },
  ];
}

export async function createMissingHandoffTasks(
  supabase: SupabaseAdminClient,
  lead: AccountHandoffLead,
  context: AccountHandoffContext,
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
