import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { AccountHandoffContext, createMissingHandoffTasks } from "@/lib/accounts/handoff-tasks";
import { getPermanentAccountName, syncPermanentAccount } from "@/lib/accounts/permanent-account-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InsightRecord = Record<string, unknown>;

/**
 * The shape the account-sync and handoff-task helpers expect. Several of its
 * fields — name, title, stage, estimated_value, notes, ai_insights — are NOT
 * columns on public.leads; they never were. This route used to select and write
 * them directly, so every insert failed with 42703 and /package-intake returned
 * 500 to every visitor. See the contact-sales fix for the same bug class.
 *
 * The type stays as-is because the helpers are built on it. What changed is
 * that it is now *derived* from real columns via toLeadRecord() rather than
 * read straight off the table.
 */
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
  metadata: unknown;
  tags: unknown;
  ai_insights: unknown;
  created_at?: string | null;
  updated_at?: string | null;
};

/** Columns that actually exist on public.leads. */
const LEAD_COLUMNS =
  "id,user_id,contact_name,email,phone,company,company_name,status,qualification_notes,metadata,tags,created_at,updated_at";

/**
 * Project a real leads row into the LeadRecord shape the helpers consume.
 * Fields with no column live under metadata.packageIntake, written by this route.
 */
function toLeadRecord(row: Record<string, unknown>): LeadRecord {
  const metadata = isRecord(row.metadata) ? row.metadata : {};
  const pkg = isRecord(metadata.packageIntake) ? metadata.packageIntake : {};
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  return {
    id: String(row.id),
    user_id: str(row.user_id),
    name: str(row.contact_name),
    email: str(row.email),
    phone: str(row.phone),
    company: str(row.company_name) ?? str(row.company),
    title: str(pkg.title),
    status: str(row.status),
    stage: str(pkg.stage),
    estimated_value: typeof pkg.estimatedValue === "number" ? pkg.estimatedValue : null,
    notes: str(row.qualification_notes),
    metadata: row.metadata,
    tags: row.tags,
    ai_insights: isRecord(metadata.aiInsights) ? metadata.aiInsights : {},
    created_at: str(row.created_at),
    updated_at: str(row.updated_at),
  };
}

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
      .select(LEAD_COLUMNS)
      .eq("id", leadId)
      .eq("user_id", ownerUserId)
      .maybeSingle();

    if (error) throw error;
    if (data) {
      const leadEmail = String(data.email || "").toLowerCase();
      if (leadEmail && leadEmail !== email) {
        return { lead: null, error: "Lead email does not match this intake." };
      }
      return { lead: toLeadRecord(data as Record<string, unknown>), error: null };
    }
  }

  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_COLUMNS)
    .eq("email", email)
    .eq("user_id", ownerUserId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return { lead: data ? toLeadRecord(data as Record<string, unknown>) : null, error: null };
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

    // Every key must be a real column on public.leads. title, stage,
    // estimated_value, source_detail, name, notes and ai_insights are not, and
    // writing them is what made this route 500 on every submission. They now
    // live under metadata (jsonb) and are projected back out by toLeadRecord().
    const leadPayload = {
      user_id: ownerUserId,
      first_name: firstName,
      last_name: lastName,
      contact_name: data.name,
      email: data.email,
      contact_email: data.email,
      phone: data.phone,
      company: data.company,
      company_name: data.company,
      company_size: data.employees,
      status: "won",
      source: "package-intake",
      lead_type: data.packageId,
      qualification_notes: existingLead?.notes ? `${existingLead.notes}\n\n---\n${intakeNotes}` : intakeNotes,
      tags: Array.from(new Set([...currentTags, "package-intake", "client-handoff", data.packageId])),
      metadata: {
        ...currentMetadata,
        packageIntake: {
          packageId: data.packageId,
          packageLabel: data.packageLabel,
          sessionId: data.sessionId || null,
          submittedAt: now,
          title: `${data.packageLabel} intake`,
          stage: "delivery_handoff",
          estimatedValue: estimateValueForPackage(data.packageId),
        },
        aiInsights: {
          ...currentInsights,
          packageIntake: {
            packageId: data.packageId,
            packageLabel: data.packageLabel,
            sessionId: data.sessionId || null,
            submittedAt: now,
            employees: data.employees,
          },
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
      },
      updated_at: now,
    };

    const leadResult = existingLead?.id
      ? await supabase
          .from("leads")
          .update(leadPayload)
          .eq("id", existingLead.id)
          .select(LEAD_COLUMNS)
          .single()
      : await supabase
          .from("leads")
          .insert({
            ...leadPayload,
            created_at: now,
          })
          .select(LEAD_COLUMNS)
          .single();

    if (leadResult.error || !leadResult.data) {
      console.error("[package-intake] lead write failed", {
        code: leadResult.error?.code,
        message: leadResult.error?.message,
        details: leadResult.error?.details,
      });
      return NextResponse.json({ error: "Could not save package intake" }, { status: 500 });
    }

    // From here the customer's intake IS captured. Everything below is internal
    // automation — account sync, handoff tasks — and none of it may turn a
    // captured intake into an error for the person who submitted it. Previously
    // a failure in any of it returned 500 and the buyer saw a broken form after
    // having already paid.
    const leadRecord = toLeadRecord(leadResult.data as Record<string, unknown>);
    let accountSync: Awaited<ReturnType<typeof syncPermanentAccount>> | null = null;
    let taskSync: Awaited<ReturnType<typeof createMissingHandoffTasks>> | null = null;

    try {
      accountSync = await syncPermanentAccount({
        lead: leadRecord,
        userId: ownerUserId,
        createdFrom: "package_intake",
      });

      const metadata = isRecord(leadRecord.metadata) ? leadRecord.metadata : {};
      const leadInsights = isRecord(leadRecord.ai_insights) ? leadRecord.ai_insights : {};
      const existingNotes = leadRecord.notes?.trim() || "";
      const nextNotes = existingNotes.includes(accountSync.account.id)
        ? existingNotes
        : existingNotes
          ? `${existingNotes}\n\n---\n${accountSync.handoffBlock}`
          : accountSync.handoffBlock;

      const { error: syncedLeadError } = await supabase
        .from("leads")
        .update({
          qualification_notes: nextNotes,
          metadata: {
            ...metadata,
            aiInsights: { ...leadInsights, ...accountSync.nextInsights },
          } as never,
          updated_at: new Date().toISOString(),
        })
        .eq("id", leadRecord.id)
        .eq("user_id", ownerUserId);

      if (syncedLeadError) {
        console.error("[package-intake] account-sync writeback failed", syncedLeadError);
      }
    } catch (err) {
      console.error("[package-intake] account sync failed (intake still captured)", err);
    }

    try {
      taskSync = await createMissingHandoffTasks(supabase, leadRecord, context);
    } catch (err) {
      console.error("[package-intake] handoff task creation failed (intake still captured)", err);
    }

    // NOTE: the previous lead_activities inserts are gone — public.lead_activities
    // does not exist in this database, so they could never have succeeded.

    return NextResponse.json({
      success: true,
      leadId: leadRecord.id,
      context,
      taskSync,
      accountSync: accountSync
        ? {
            accountId: accountSync.account.id,
            engagementId: accountSync.engagement.id,
            offerName: accountSync.lane.offerName,
            nextStep: accountSync.lane.nextStep,
          }
        : null,
    });
  } catch (error) {
    console.error("Package intake error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not submit package intake" },
      { status: 500 },
    );
  }
}
