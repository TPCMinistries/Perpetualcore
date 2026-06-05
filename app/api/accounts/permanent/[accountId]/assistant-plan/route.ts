import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { Json } from "@/lib/accounts/permanent-account-sync";
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
type WritableJsonRecord = Record<string, Json | undefined>;

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

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toJsonRecord(value: unknown): WritableJsonRecord {
  return isRecord(value) ? (value as WritableJsonRecord) : {};
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}

function readMetadataString(metadata: JsonRecord, key: string) {
  return readString(metadata[key]);
}

function readAccountUpdates(metadata: JsonRecord) {
  const updates = metadata.account_updates;
  return Array.isArray(updates) ? updates.filter(isRecord).slice(0, 8) : [];
}

function readHandoffContext(accountMetadata: JsonRecord, engagementMetadata: JsonRecord) {
  const context = isRecord(accountMetadata.account_handoff_context)
    ? accountMetadata.account_handoff_context
    : isRecord(engagementMetadata.account_handoff_context)
      ? engagementMetadata.account_handoff_context
      : {};

  return {
    workflowOwner: readString(context.workflowOwner),
    toolsAndData: readString(context.toolsAndData),
    realExamples: readString(context.realExamples),
    rulesAndEscalations: readString(context.rulesAndEscalations),
    successMetric: readString(context.successMetric),
    notes: readString(context.notes),
  };
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

function extractJson(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced?.[1] || content;
}

function createFallbackPlan({
  accountName,
  contactName,
  offerName,
  systemName,
  valueRange,
  nextStep,
  handoffContext,
  tasks,
}: {
  accountName: string;
  contactName: string;
  offerName: string;
  systemName: string;
  valueRange: string;
  nextStep: string;
  handoffContext: ReturnType<typeof readHandoffContext>;
  tasks: AccountTask[];
}): AssistantPlan {
  const nextOpenTask = tasks.find((task) => task.status !== "completed");
  const firstLane =
    handoffContext.notes ||
    handoffContext.successMetric ||
    nextStep ||
    `Install the first ${systemName} lane for ${accountName}.`;

  return {
    accountPlan: {
      firstLane,
      sevenDayDeliverable: handoffContext.toolsAndData
        ? "Ship a first visible operating surface using the known tools, data, examples, and constraints."
        : "Confirm the workflow, collect minimum context, and ship one visible operating surface the account can react to.",
      thirtyDayOutcome:
        handoffContext.successMetric ||
        "Prove enough time, revenue, quality, visibility, or follow-up improvement to justify expansion.",
      accessNeeded:
        handoffContext.toolsAndData ||
        "Workflow owner, current tools, examples, customer language, operating rules, data constraints, and success metric.",
      ownerOnClientSide: handoffContext.workflowOwner || "Name the client-side owner who can unblock access and decisions.",
      nextAction: nextOpenTask?.title || nextStep || "Confirm the first workflow and kickoff owner.",
    },
    accountMilestones: [
      createMilestone("kickoff-confirmed", "Kickoff confirmed", "Owner, first lane, success metric, and kickoff window are clear."),
      createMilestone("context-collected", "Context collected", "Docs, systems, examples, and operating rules are gathered."),
      createMilestone("workflow-mapped", "First workflow mapped", "Current process, bottleneck, users, data, and success metric are defined."),
      createMilestone("first-surface-shipped", "First surface shipped", "The account has a working output, not only a plan."),
      createMilestone("expansion-reviewed", "Expansion reviewed", "The first result becomes a renew, expand, or handoff recommendation."),
    ],
    assistantBehavior: {
      shouldDo: [
        "Keep commercial path, client context, account tasks, and delivery proof connected.",
        "Recommend the smallest action that moves the account forward.",
        "Use account updates and submitted examples before inventing new language.",
      ],
      shouldAvoid: [
        "Do not expand scope before the first visible operating surface ships.",
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
        "A high-priority task is blocked or overdue.",
      ],
      memoryRules: [
        "Store owner, first lane, tools, examples, rules, and success metric on the account.",
        "Update next action after every payment, handoff, task, or client decision.",
      ],
    },
    commercialNextStep: nextOpenTask?.title || nextStep || "Confirm kickoff window and begin the first operating lane.",
    suggestedEmail: `${contactName},\n\nI have ${accountName} framed around ${offerName}${valueRange ? ` (${valueRange})` : ""}. The next step is to confirm the first operating lane, owner, tools/data involved, and success metric for the first visible output.\n\nI would start with: ${firstLane}\n\nOnce that is clear, we can turn this into a working ${systemName} surface instead of another loose AI conversation.`,
    operatingBrief: `Account: ${accountName}\nOffer: ${offerName}\nSystem: ${systemName}\nNext action: ${nextOpenTask?.title || nextStep || "Confirm kickoff context."}`,
  };
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
              readString(record.id) || `account-milestone-${index + 1}`,
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

async function generatePlan(input: {
  accountName: string;
  contactName: string;
  contactEmail: string;
  offerName: string;
  systemName: string;
  stage: string;
  valueRange: string;
  nextStep: string;
  handoffContext: ReturnType<typeof readHandoffContext>;
  tasks: AccountTask[];
  updates: JsonRecord[];
}) {
  const fallback = createFallbackPlan(input);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { plan: { ...fallback, generatedBy: "fallback" }, aiGenerated: false };
  }

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
            "You are Perpetual Core's account operator. Return concise JSON only. Build a practical permanent-account operating plan that connects sales, delivery, client context, assistant behavior, current tasks, and expansion proof. Do not force one funnel; adapt to the account.",
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
            account: {
              name: input.accountName,
              contactName: input.contactName,
              contactEmail: input.contactEmail,
              offerName: input.offerName,
              systemName: input.systemName,
              stage: input.stage,
              valueRange: input.valueRange,
              nextStep: input.nextStep,
            },
            handoffContext: input.handoffContext,
            openTasks: input.tasks.filter((task) => task.status !== "completed").slice(0, 10),
            recentUpdates: input.updates,
          }),
        },
      ],
    });

    const content = response.choices[0]?.message?.content || "";
    const parsed = JSON.parse(extractJson(content)) as unknown;
    return { plan: { ...normalizeAssistantPlan(parsed, fallback), generatedBy: "openai" }, aiGenerated: true };
  } catch (error) {
    console.error("Permanent account assistant plan fallback:", error);
    return { plan: { ...fallback, generatedBy: "fallback" }, aiGenerated: false };
  }
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = params.accountId?.trim();
    if (!accountId) {
      return NextResponse.json({ error: "accountId is required" }, { status: 400 });
    }

    const pc = getPcClient();
    const admin = createAdminClient();
    const [accountResult, engagementsResult, tasksResult] = await Promise.all([
      pc.from("pc_accounts").select("*").eq("id", accountId).eq("created_by", user.id).single(),
      pc
        .from("pc_engagements")
        .select("*")
        .eq("account_id", accountId)
        .eq("created_by", user.id)
        .order("updated_at", { ascending: false }),
      admin
        .from("tasks")
        .select("id,title,description,status,priority,due_date")
        .eq("user_id", user.id)
        .eq("source_reference", accountId)
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

    if (accountResult.error || !accountResult.data) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    if (engagementsResult.error) throw engagementsResult.error;
    if (tasksResult.error) throw tasksResult.error;

    const account = accountResult.data;
    const primaryEngagement = engagementsResult.data?.[0] || null;
    const accountMetadata = isRecord(account.metadata) ? account.metadata : {};
    const engagementMetadata = isRecord(primaryEngagement?.metadata) ? primaryEngagement.metadata : {};
    const handoffContext = readHandoffContext(accountMetadata, engagementMetadata);
    const contactName =
      readMetadataString(accountMetadata, "contact_name") ||
      readMetadataString(engagementMetadata, "contact_name") ||
      "Primary contact";
    const contactEmail =
      readMetadataString(accountMetadata, "contact_email") || readMetadataString(engagementMetadata, "contact_email");
    const generated = await generatePlan({
      accountName: account.name,
      contactName,
      contactEmail,
      offerName: primaryEngagement?.offer_name || "Perpetual Core",
      systemName: primaryEngagement?.system_name || "AI operating system",
      stage: primaryEngagement?.stage || account.status,
      valueRange: primaryEngagement?.value_range || "",
      nextStep: primaryEngagement?.next_step || readMetadataString(accountMetadata, "last_account_next_action"),
      handoffContext,
      tasks: (tasksResult.data || []) as AccountTask[],
      updates: readAccountUpdates(accountMetadata),
    });
    const now = new Date().toISOString();
    const plan: AssistantPlan = {
      ...generated.plan,
      generatedAt: now,
    };
    const update: WritableJsonRecord = {
      id: crypto.randomUUID(),
      summary: generated.aiGenerated ? "AI account operating plan generated" : "Fallback account operating plan generated",
      decision: plan.commercialNextStep,
      risk: plan.assistantBehavior.shouldEscalate[0] || "",
      nextAction: plan.accountPlan.nextAction,
      createdAt: now,
      createdBy: user.id,
      source: "assistant_plan",
    };
    const nextAccountMetadata: WritableJsonRecord = {
      ...toJsonRecord(account.metadata),
      account_plan: plan.accountPlan,
      account_milestones: plan.accountMilestones,
      assistant_behavior: plan.assistantBehavior,
      assistant_plan: plan,
      account_plan_updated_at: now,
      account_next_step: plan.commercialNextStep,
      last_account_update_at: now,
      last_account_next_action: plan.accountPlan.nextAction,
      account_updates: [update, ...readAccountUpdates(accountMetadata)].slice(0, 50),
    };

    const { data: updatedAccount, error: accountUpdateError } = await pc
      .from("pc_accounts")
      .update({
        metadata: nextAccountMetadata,
        updated_at: now,
      })
      .eq("id", accountId)
      .eq("created_by", user.id)
      .select("*")
      .single();

    if (accountUpdateError || !updatedAccount) {
      return NextResponse.json({ error: "Could not save account assistant plan" }, { status: 500 });
    }

    if (primaryEngagement) {
      await pc
        .from("pc_engagements")
        .update({
          metadata: {
            ...toJsonRecord(primaryEngagement.metadata),
            account_plan: plan.accountPlan,
            account_milestones: plan.accountMilestones,
            assistant_behavior: plan.assistantBehavior,
            assistant_plan: plan,
            account_plan_updated_at: now,
          },
          next_step: plan.commercialNextStep,
          updated_at: now,
        })
        .eq("id", primaryEngagement.id)
        .eq("created_by", user.id);
    }

    return NextResponse.json({
      success: true,
      aiGenerated: generated.aiGenerated,
      plan,
      account: updatedAccount,
    });
  } catch (error) {
    console.error("Permanent account assistant plan error:", error);
    const message =
      error instanceof SyntaxError
        ? "AI returned an unreadable plan"
        : error instanceof Error
          ? error.message
          : "Could not generate account assistant plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
