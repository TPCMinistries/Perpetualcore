import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { AccountHandoffContext, createMissingHandoffTasks } from "@/lib/accounts/handoff-tasks";

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
  notes: string | null;
  metadata: unknown;
  tags: unknown;
  ai_insights: unknown;
};

const packageValues = [
  "software-access",
  "guided-setup",
  "first-workflow",
  "operating-lane-deposit",
] as const;

const employeeValues = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"] as const;

const packageIntakeSchema = z.object({
  leadId: z.string().trim().max(120).optional().nullable(),
  sessionId: z.string().trim().max(220).optional().nullable(),
  packageId: z.enum(packageValues),
  packageLabel: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(100).transform(stripAngles),
  email: z.string().trim().email().max(254).toLowerCase(),
  company: z.string().trim().min(1).max(200).transform(stripAngles),
  phone: z.string().trim().max(30).optional().nullable().transform(cleanOptional),
  employees: z.enum(employeeValues),
  workflowOwner: z.string().trim().max(300).optional().nullable().transform(cleanOptional),
  firstLane: z.string().trim().min(1).max(1200),
  toolsAndData: z.string().trim().min(1).max(1500),
  examples: z.string().trim().max(1500).optional().nullable().transform(cleanOptional),
  successMetric: z.string().trim().min(1).max(800),
  constraints: z.string().trim().max(1500).optional().nullable().transform(cleanOptional),
});

function stripAngles(value: string) {
  return value.replace(/[<>]/g, "");
}

function cleanOptional(value?: string | null) {
  const cleaned = stripAngles(value || "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

function isRecord(value: unknown): value is InsightRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getSalesOwnerUserId() {
  return process.env.LORENZO_USER_ID || process.env.DEFAULT_WEBHOOK_USER_ID || process.env.SALES_OWNER_USER_ID || null;
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || name;
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : null;
  return { firstName, lastName };
}

function estimateValueForPackage(packageId: string) {
  if (packageId === "operating-lane-deposit") return 30000;
  if (packageId === "first-workflow") return 12000;
  if (packageId === "guided-setup") return 5000;
  if (packageId === "software-access") return 499;
  return null;
}

function getAccountName(lead: LeadRecord) {
  return lead.company || lead.name || lead.email || "Client account";
}

async function findLead(
  supabase: ReturnType<typeof createAdminClient>,
  ownerUserId: string,
  leadId: string | null | undefined,
  email: string,
) {
  if (leadId) {
    const { data, error } = await supabase
      .from("leads")
      .select("id,user_id,name,email,phone,company,notes,metadata,tags,ai_insights")
      .eq("id", leadId)
      .eq("user_id", ownerUserId)
      .maybeSingle();

    if (error) throw error;
    if (data) {
      const leadEmail = String(data.email || "").toLowerCase();
      if (leadEmail && leadEmail !== email) {
        return { lead: null, error: "Lead email does not match this intake." };
      }
      return { lead: data as LeadRecord, error: null };
    }
  }

  const { data, error } = await supabase
    .from("leads")
    .select("id,user_id,name,email,phone,company,notes,metadata,tags,ai_insights")
    .eq("email", email)
    .eq("user_id", ownerUserId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return { lead: (data as LeadRecord | null) || null, error: null };
}

export async function POST(request: Request) {
  try {
    const parsed = packageIntakeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid package intake" },
        { status: 400 },
      );
    }

    const ownerUserId = getSalesOwnerUserId();
    if (!ownerUserId) {
      return NextResponse.json({ error: "Sales owner is not configured" }, { status: 500 });
    }

    const data = parsed.data;
    const supabase = createAdminClient();
    const now = new Date().toISOString();
    const found = await findLead(supabase, ownerUserId, data.leadId, data.email);

    if (found.error) {
      return NextResponse.json({ error: found.error }, { status: 403 });
    }

    const existingLead = found.lead;
    const currentInsights = isRecord(existingLead?.ai_insights) ? existingLead.ai_insights : {};
    const currentMetadata = isRecord(existingLead?.metadata) ? existingLead.metadata : {};
    const currentTags = Array.isArray(existingLead?.tags) ? existingLead.tags.map(String) : [];
    const { firstName, lastName } = splitName(data.name);
    const context: AccountHandoffContext = {
      workflowOwner: data.workflowOwner,
      toolsAndData: data.toolsAndData,
      realExamples: data.examples,
      rulesAndEscalations: data.constraints,
      successMetric: data.successMetric,
      notes: data.firstLane,
      submittedAt: now,
    };
    const intakeNotes = [
      "Package intake submitted",
      `Package: ${data.packageLabel} (${data.packageId})`,
      data.sessionId ? `Stripe session: ${data.sessionId}` : "",
      `First lane:\n${data.firstLane}`,
      `Tools and data:\n${data.toolsAndData}`,
      data.examples ? `Examples:\n${data.examples}` : "",
      `Success metric:\n${data.successMetric}`,
      data.constraints ? `Rules, risks, or constraints:\n${data.constraints}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const leadPayload = {
      user_id: ownerUserId,
      name: data.name,
      first_name: firstName,
      last_name: lastName,
      contact_name: data.name,
      email: data.email,
      contact_email: data.email,
      phone: data.phone,
      company: data.company,
      company_name: data.company,
      company_size: data.employees,
      title: `${data.packageLabel} intake`,
      status: "won",
      stage: "delivery_handoff",
      source: "package-intake",
      source_detail: data.packageId,
      estimated_value: estimateValueForPackage(data.packageId),
      notes: existingLead?.notes ? `${existingLead.notes}\n\n---\n${intakeNotes}` : intakeNotes,
      tags: Array.from(new Set([...currentTags, "package-intake", "client-handoff", data.packageId])),
      metadata: {
        ...currentMetadata,
        packageIntake: {
          packageId: data.packageId,
          packageLabel: data.packageLabel,
          sessionId: data.sessionId || null,
          submittedAt: now,
        },
      },
      ai_insights: {
        ...currentInsights,
        accountHandoffContext: {
          ...(isRecord(currentInsights.accountHandoffContext) ? currentInsights.accountHandoffContext : {}),
          ...context,
        },
        accountOfferName: data.packageLabel,
        accountNextStep: "Confirm kickoff window and generate the account operating plan.",
        closePath: {
          ...(isRecord(currentInsights.closePath) ? currentInsights.closePath : {}),
          paymentStatus: "paid",
          buyerStage: "delivery_handoff",
          commercialNextStep: "Confirm kickoff window and generate the account operating plan.",
          updatedAt: now,
        },
      },
      updated_at: now,
    };

    const leadResult = existingLead?.id
      ? await supabase.from("leads").update(leadPayload).eq("id", existingLead.id).select("id,user_id,name,company,email,ai_insights").single()
      : await supabase
          .from("leads")
          .insert({
            ...leadPayload,
            created_at: now,
          })
          .select("id,user_id,name,company,email,ai_insights")
          .single();

    if (leadResult.error || !leadResult.data) {
      return NextResponse.json({ error: "Could not save package intake" }, { status: 500 });
    }

    const leadRecord = leadResult.data as LeadRecord;
    const taskSync = await createMissingHandoffTasks(supabase, leadRecord, context);

    await supabase.from("lead_activities").insert({
      lead_id: leadRecord.id,
      user_id: ownerUserId,
      activity_type: "package_intake",
      title: "Package intake submitted",
      description: `${getAccountName(leadRecord)} submitted kickoff context. ${taskSync.created} kickoff task${taskSync.created === 1 ? "" : "s"} created.`,
      to_value: data.packageId,
    });

    return NextResponse.json({
      success: true,
      leadId: leadRecord.id,
      context,
      taskSync,
    });
  } catch (error) {
    console.error("Package intake error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not submit package intake" },
      { status: 500 },
    );
  }
}
