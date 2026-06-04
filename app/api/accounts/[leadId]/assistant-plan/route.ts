import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InsightRecord = Record<string, unknown>;

type LeadRecord = {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  status: string | null;
  stage: string | null;
  estimated_value: number | null;
  notes: string | null;
  next_follow_up_at: string | null;
  ai_insights: unknown;
};

type AccountTask = {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
};

type AccountPlan = {
  firstLane: string;
  sevenDayDeliverable: string;
  thirtyDayOutcome: string;
  accessNeeded: string;
  ownerOnClientSide: string;
  nextAction: string;
};

type AccountMilestone = {
  id: string;
  title: string;
  detail: string;
  completed: boolean;
  owner: string;
  dueDate: string;
  notes: string;
};

type AssistantPlan = {
  accountPlan: AccountPlan;
  accountMilestones: AccountMilestone[];
  assistantBehavior: {
    shouldDo: string[];
    shouldAvoid: string[];
    shouldAsk: string[];
    shouldEscalate: string[];
    memoryRules: string[];
  };
  commercialNextStep: string;
  suggestedEmail: string;
  operatingBrief: string;
  generatedAt?: string;
  generatedBy?: string;
};

function isRecord(value: unknown): value is InsightRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}

function getAccountName(lead: LeadRecord) {
  return lead.company || lead.name || lead.email || "Client account";
}

function getContactName(lead: LeadRecord) {
  return lead.name || lead.email || "Primary contact";
}

function readHandoffContext(insights: InsightRecord) {
  const context = isRecord(insights.accountHandoffContext) ? insights.accountHandoffContext : {};
  return {
    workflowOwner: readString(context.workflowOwner),
    toolsAndData: readString(context.toolsAndData),
    realExamples: readString(context.realExamples),
    rulesAndEscalations: readString(context.rulesAndEscalations),
    successMetric: readString(context.successMetric),
    notes: readString(context.notes),
    submittedAt: readString(context.submittedAt),
  };
}

function getRecommendedLane(lead: LeadRecord, insights: InsightRecord) {
  const accountOfferName = readString(insights.accountOfferName);
  if (accountOfferName) return accountOfferName;

  const text = `${lead.title || ""} ${lead.notes || ""}`.toLowerCase();
  const value = lead.estimated_value || 0;
  if (value >= 15000 || text.includes("operating") || text.includes("enterprise")) return "90-Day Operating Lane";
  if (value >= 7500 || text.includes("workflow")) return "First Workflow Package";
  if (value >= 1000 || text.includes("setup")) return "Guided Setup";
  return "Software Access";
}

function createMilestone(id: string, title: string, detail: string, notes = ""): AccountMilestone {
  return {
    id,
    title,
    detail,
    completed: false,
    owner: "",
    dueDate: "",
    notes,
  };
}

function createFallbackPlan(lead: LeadRecord, tasks: AccountTask[]): AssistantPlan {
  const insights = isRecord(lead.ai_insights) ? lead.ai_insights : {};
  const context = readHandoffContext(insights);
  const account = getAccountName(lead);
  const lane = getRecommendedLane(lead, insights);
  const firstLane =
    context.workflowOwner || context.toolsAndData || context.successMetric
      ? context.notes || context.successMetric || `Install the first ${lane.toLowerCase()} operating lane for ${account}.`
      : `Confirm the first workflow for ${account} before implementation expands.`;
  const nextOpenTask = tasks.find((task) => task.status !== "completed");

  return {
    accountPlan: {
      firstLane,
      sevenDayDeliverable:
        context.toolsAndData
          ? "Ship a first working operating surface using the submitted tools, data, and examples."
          : "Collect minimum context and ship one visible operating surface the client can react to.",
      thirtyDayOutcome:
        context.successMetric ||
        "Prove enough time, revenue, quality, visibility, or follow-up improvement to justify expansion.",
      accessNeeded:
        context.toolsAndData ||
        "Workflow owner, current tools, docs, examples, customer language, access constraints, and success metric.",
      ownerOnClientSide: context.workflowOwner || "Name the client-side owner who can unblock access and decisions.",
      nextAction:
        nextOpenTask?.title ||
        (context.toolsAndData ? "Turn submitted handoff context into kickoff tasks." : "Send or complete the client handoff context."),
    },
    accountMilestones: [
      createMilestone("kickoff-confirmed", "Kickoff confirmed", "Payment/admin path, owner, first lane, and kickoff window are clear."),
      createMilestone("context-collected", "Context collected", "Docs, systems, examples, and operating rules are gathered."),
      createMilestone("workflow-mapped", "First workflow mapped", "Current process, bottleneck, users, data, and success metric are defined."),
      createMilestone("first-lane-shipped", "First lane shipped", "The client has a working output, not only a plan."),
      createMilestone("expansion-reviewed", "Expansion reviewed", "The first result is translated into renew, expand, or handoff recommendation."),
    ],
    assistantBehavior: {
      shouldDo: [
        "Keep commercial path, client context, tasks, and delivery proof connected.",
        "Recommend the smallest next action that moves the account forward.",
        "Use submitted client examples before inventing new language.",
      ],
      shouldAvoid: [
        "Do not expand scope before the first lane has a visible output.",
        "Do not ask for a full knowledge dump when one workflow can prove value.",
      ],
      shouldAsk: [
        "Who owns the workflow and can unblock access?",
        "Which system contains the source of truth?",
        "What result would make the first 30 days worth continuing?",
      ],
      shouldEscalate: [
        "Payment, procurement, or approval is unclear.",
        "Client data access or compliance constraints are unresolved.",
        "A task is blocked or overdue.",
      ],
      memoryRules: [
        "Store first lane, owner, tools, examples, rules, and success metric on the account.",
        "Update next action after every payment, handoff, task, or client decision.",
      ],
    },
    commercialNextStep:
      nextOpenTask?.title ||
      (context.toolsAndData
        ? "Confirm kickoff window and begin the first operating lane."
        : "Collect client handoff context before delivery expands."),
    suggestedEmail: `${getContactName(lead)},\n\nI have the account path framed as ${lane}. The next step is to confirm the first operating lane, the owner, the tools/data involved, and the success metric for the first visible output.\n\nFor ${account}, I would start with: ${firstLane}\n\nOnce that is clear, I can turn this into a working operating surface instead of another loose AI conversation.`,
    operatingBrief: `Account: ${account}\nLane: ${lane}\nNext action: ${nextOpenTask?.title || "Confirm handoff context and kickoff tasks."}`,
  };
}

function extractJson(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced?.[1] || content;
}

function normalizeAssistantPlan(value: unknown, fallback: AssistantPlan): AssistantPlan {
  if (!isRecord(value)) return fallback;

  const rawPlan = isRecord(value.accountPlan) ? value.accountPlan : {};
  const rawBehavior = isRecord(value.assistantBehavior) ? value.assistantBehavior : {};
  const rawMilestones = Array.isArray(value.accountMilestones) ? value.accountMilestones : [];

  const list = (candidate: unknown, backup: string[]) =>
    Array.isArray(candidate) ? candidate.map((item) => String(item)).filter(Boolean).slice(0, 6) : backup;

  return {
    accountPlan: {
      firstLane: readString(rawPlan.firstLane) || fallback.accountPlan.firstLane,
      sevenDayDeliverable: readString(rawPlan.sevenDayDeliverable) || fallback.accountPlan.sevenDayDeliverable,
      thirtyDayOutcome: readString(rawPlan.thirtyDayOutcome) || fallback.accountPlan.thirtyDayOutcome,
      accessNeeded: readString(rawPlan.accessNeeded) || fallback.accountPlan.accessNeeded,
      ownerOnClientSide: readString(rawPlan.ownerOnClientSide) || fallback.accountPlan.ownerOnClientSide,
      nextAction: readString(rawPlan.nextAction) || fallback.accountPlan.nextAction,
    },
    accountMilestones:
      rawMilestones.length > 0
        ? rawMilestones.slice(0, 6).map((item, index) => {
            const record = isRecord(item) ? item : {};
            return createMilestone(
              readString(record.id) || `assistant-milestone-${index + 1}`,
              readString(record.title) || fallback.accountMilestones[index]?.title || `Milestone ${index + 1}`,
              readString(record.detail) || fallback.accountMilestones[index]?.detail || "Move account forward.",
              readString(record.notes),
            );
          })
        : fallback.accountMilestones,
    assistantBehavior: {
      shouldDo: list(rawBehavior.shouldDo, fallback.assistantBehavior.shouldDo),
      shouldAvoid: list(rawBehavior.shouldAvoid, fallback.assistantBehavior.shouldAvoid),
      shouldAsk: list(rawBehavior.shouldAsk, fallback.assistantBehavior.shouldAsk),
      shouldEscalate: list(rawBehavior.shouldEscalate, fallback.assistantBehavior.shouldEscalate),
      memoryRules: list(rawBehavior.memoryRules, fallback.assistantBehavior.memoryRules),
    },
    commercialNextStep: readString(value.commercialNextStep) || fallback.commercialNextStep,
    suggestedEmail: readString(value.suggestedEmail) || fallback.suggestedEmail,
    operatingBrief: readString(value.operatingBrief) || fallback.operatingBrief,
  };
}

async function generateAssistantPlan(lead: LeadRecord, tasks: AccountTask[]) {
  const fallback = createFallbackPlan(lead, tasks);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { plan: { ...fallback, generatedBy: "fallback" }, aiGenerated: false };
  }

  const insights = isRecord(lead.ai_insights) ? lead.ai_insights : {};
  const context = readHandoffContext(insights);
  const client = new OpenAI({ apiKey });

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are Perpetual Core's account operator. Return concise JSON only. Build a practical account operating plan that connects sales, payment, client handoff context, first workflow delivery, assistant behavior, and expansion proof.",
        },
        {
          role: "user",
          content: JSON.stringify({
            requiredShape: {
              accountPlan: {
                firstLane: "string",
                sevenDayDeliverable: "string",
                thirtyDayOutcome: "string",
                accessNeeded: "string",
                ownerOnClientSide: "string",
                nextAction: "string",
              },
              accountMilestones: [{ id: "string", title: "string", detail: "string", notes: "string" }],
              assistantBehavior: {
                shouldDo: ["string"],
                shouldAvoid: ["string"],
                shouldAsk: ["string"],
                shouldEscalate: ["string"],
                memoryRules: ["string"],
              },
              commercialNextStep: "string",
              suggestedEmail: "string",
              operatingBrief: "string",
            },
            lead: {
              account: getAccountName(lead),
              contact: getContactName(lead),
              email: lead.email,
              title: lead.title,
              status: lead.status,
              stage: lead.stage,
              estimatedValue: lead.estimated_value,
              notes: lead.notes,
            },
            recommendedLane: getRecommendedLane(lead, insights),
            handoffContext: context,
            openTasks: tasks.filter((task) => task.status !== "completed").slice(0, 8),
          }),
        },
      ],
    });

    const content = response.choices[0]?.message?.content || "";
    const parsed = JSON.parse(extractJson(content)) as unknown;
    return { plan: { ...normalizeAssistantPlan(parsed, fallback), generatedBy: "openai" }, aiGenerated: true };
  } catch (error) {
    console.error("Assistant plan AI fallback:", error);
    return { plan: { ...fallback, generatedBy: "fallback" }, aiGenerated: false };
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
) {
  try {
    const { leadId } = await params;
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: lead, error } = await supabase
      .from("leads")
      .select("id,user_id,name,email,phone,company,title,status,stage,estimated_value,notes,next_follow_up_at,ai_insights")
      .eq("id", leadId)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const leadRecord = lead as LeadRecord;
    if (leadRecord.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: tasks } = await supabase
      .from("tasks")
      .select("id,title,description,status,priority,due_date")
      .eq("source_reference", leadId)
      .order("created_at", { ascending: false })
      .limit(25);

    const generated = await generateAssistantPlan(leadRecord, (tasks || []) as AccountTask[]);
    const currentInsights = isRecord(leadRecord.ai_insights) ? leadRecord.ai_insights : {};
    const currentClosePath = isRecord(currentInsights.closePath) ? currentInsights.closePath : {};
    const now = new Date().toISOString();
    const plan: AssistantPlan = {
      ...generated.plan,
      generatedAt: now,
    };

    const nextInsights = {
      ...currentInsights,
      accountPlan: plan.accountPlan,
      accountMilestones: plan.accountMilestones,
      assistantBehavior: plan.assistantBehavior,
      assistantPlan: plan,
      accountPlanUpdatedAt: now,
      closePath: {
        ...currentClosePath,
        commercialNextStep: plan.commercialNextStep,
        updatedAt: now,
      },
    };

    const { data: updatedLead, error: updateError } = await supabase
      .from("leads")
      .update({
        stage: leadRecord.stage || "delivery_handoff",
        ai_insights: nextInsights,
        updated_at: now,
      })
      .eq("id", leadId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError || !updatedLead) {
      return NextResponse.json({ error: "Could not save assistant plan" }, { status: 500 });
    }

    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      user_id: user.id,
      activity_type: "assistant_operating_plan",
      title: generated.aiGenerated ? "AI operating plan generated" : "Fallback operating plan generated",
      description: plan.operatingBrief,
      to_value: plan.commercialNextStep,
    });

    return NextResponse.json({
      success: true,
      aiGenerated: generated.aiGenerated,
      plan,
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Assistant plan error:", error);
    const fallbackMessage =
      error instanceof SyntaxError
        ? "AI returned an unreadable plan"
        : error instanceof Error
          ? error.message
          : "Could not generate assistant plan";
    return NextResponse.json({ error: fallbackMessage }, { status: 500 });
  }
}
