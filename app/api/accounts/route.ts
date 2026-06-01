import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type PcAccountRow = {
  id: string;
  name: string;
  normalized_name: string;
  account_type: string;
  buyer_type: string | null;
  data_posture: string;
  risk_level: string;
  status: string;
  notes: string | null;
  metadata: Json;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type PcAccountInsert = Omit<PcAccountRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

type PcEngagementRow = {
  id: string;
  account_id: string;
  name: string;
  offer_name: string;
  system_name: string;
  stage: string;
  value_range: string | null;
  data_posture: string;
  risk_level: string;
  next_step: string | null;
  task_id: string | null;
  metadata: Json;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type PcEngagementInsert = Omit<PcEngagementRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

type PcDatabase = {
  public: {
    Tables: {
      pc_accounts: {
        Row: PcAccountRow;
        Insert: PcAccountInsert;
        Update: Partial<PcAccountInsert>;
        Relationships: [];
      };
      pc_engagements: {
        Row: PcEngagementRow;
        Insert: PcEngagementInsert;
        Update: Partial<PcEngagementInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type LeadRow = {
  id: string;
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
  created_at: string;
  updated_at: string;
};

function getPcClient() {
  return createAdminClient() as unknown as SupabaseClient<PcDatabase>;
}

function isRecord(value: unknown): value is Record<string, Json> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function getAccountName(lead: LeadRow) {
  return lead.company || lead.name || lead.email || "Client account";
}

function getContactName(lead: LeadRow) {
  return lead.name || lead.email || "Primary contact";
}

function getRecommendedLane(lead: LeadRow) {
  const text = `${lead.title || ""} ${lead.notes || ""}`.toLowerCase();
  const value = lead.estimated_value || 0;

  if (value >= 15000 || text.includes("operating") || text.includes("enterprise")) {
    return {
      offerName: "90-Day Operating Lane",
      systemName: "AI operating system",
      valueRange: "$15k-$45k+",
      nextStep: "Confirm kickoff, first department lane, access, and 7-day deliverable.",
    };
  }

  if (value >= 7500 || text.includes("workflow")) {
    return {
      offerName: "First Workflow Package",
      systemName: "Workflow install",
      valueRange: "$7.5k-$15k",
      nextStep: "Map the workflow, collect context, and ship the first working surface.",
    };
  }

  if (value >= 1000 || text.includes("setup")) {
    return {
      offerName: "Guided Setup",
      systemName: "Perpetual Core setup",
      valueRange: "$2.5k-$5k + software",
      nextStep: "Configure profile, sources, and the first useful workspace.",
    };
  }

  return {
    offerName: "Software Access",
    systemName: "Perpetual Core software",
    valueRange: "$149-$499/mo",
    nextStep: "Confirm activation, usage path, and first workflow fit.",
  };
}

async function getOwnedLead(supabase: Awaited<ReturnType<typeof createClient>>, leadId: string, userId: string) {
  return supabase
    .from("leads")
    .select("id,name,email,phone,company,title,status,stage,estimated_value,notes,next_follow_up_at,ai_insights,created_at,updated_at")
    .eq("id", leadId)
    .eq("user_id", userId)
    .single();
}

async function getAccountByLead(pc: ReturnType<typeof getPcClient>, leadId: string, userId: string) {
  const { data, error } = await pc
    .from("pc_accounts")
    .select("*")
    .eq("created_by", userId)
    .contains("metadata", { source_lead_id: leadId })
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getEngagementByLead(pc: ReturnType<typeof getPcClient>, leadId: string, userId: string) {
  const { data, error } = await pc
    .from("pc_engagements")
    .select("*")
    .eq("created_by", userId)
    .contains("metadata", { source_lead_id: leadId })
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");
    const pc = getPcClient();

    if (leadId) {
      const account = await getAccountByLead(pc, leadId, user.id);
      const engagement = await getEngagementByLead(pc, leadId, user.id);
      return NextResponse.json({ account, engagement });
    }

    const [accountsResult, engagementsResult] = await Promise.all([
      pc
        .from("pc_accounts")
        .select("*")
        .eq("created_by", user.id)
        .order("updated_at", { ascending: false })
        .limit(50),
      pc
        .from("pc_engagements")
        .select("*")
        .eq("created_by", user.id)
        .order("updated_at", { ascending: false })
        .limit(100),
    ]);

    if (accountsResult.error) throw accountsResult.error;
    if (engagementsResult.error) throw engagementsResult.error;

    return NextResponse.json({
      accounts: accountsResult.data || [],
      engagements: engagementsResult.data || [],
    });
  } catch (error) {
    console.error("Accounts GET error:", error);
    return NextResponse.json({ error: "Could not load accounts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { leadId?: unknown };
    if (typeof body.leadId !== "string" || body.leadId.trim().length === 0) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const leadId = body.leadId.trim();
    const { data: lead, error: leadError } = await getOwnedLead(supabase, leadId, user.id);

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const pc = getPcClient();
    const existingAccount = await getAccountByLead(pc, lead.id, user.id);
    const existingEngagement = await getEngagementByLead(pc, lead.id, user.id);
    const lane = getRecommendedLane(lead);
    const currentInsights = isRecord(lead.ai_insights) ? lead.ai_insights : {};
    const accountName = getAccountName(lead);
    const now = new Date().toISOString();
    const accountMetadata: Json = {
      source_lead_id: lead.id,
      source_lead_status: lead.status,
      source_lead_stage: lead.stage,
      contact_name: getContactName(lead),
      contact_email: lead.email,
      contact_phone: lead.phone,
      estimated_value: lead.estimated_value,
      account_plan: currentInsights.accountPlan,
      account_milestones: currentInsights.accountMilestones,
      account_updates: currentInsights.accountUpdates,
      converted_at: existingAccount ? (isRecord(existingAccount.metadata) ? existingAccount.metadata.converted_at : now) : now,
      last_synced_at: now,
    };

    const accountPayload: PcAccountInsert = {
      name: accountName,
      normalized_name: normalizeName(accountName) || lead.id,
      account_type: "client",
      buyer_type: lead.title || lane.offerName,
      data_posture: "client",
      risk_level: "medium",
      status: "active",
      notes: lead.notes,
      metadata: accountMetadata,
      created_by: user.id,
    };

    const accountResult = existingAccount
      ? await pc
          .from("pc_accounts")
          .update({ ...accountPayload, updated_at: now })
          .eq("id", existingAccount.id)
          .select("*")
          .single()
      : await pc.from("pc_accounts").insert(accountPayload).select("*").single();

    if (accountResult.error || !accountResult.data) {
      console.error("Account conversion error:", accountResult.error);
      return NextResponse.json({ error: "Could not create account" }, { status: 500 });
    }

    const engagementMetadata: Json = {
      source_lead_id: lead.id,
      source_lead_status: lead.status,
      source_lead_stage: lead.stage,
      account_id: accountResult.data.id,
      contact_name: getContactName(lead),
      contact_email: lead.email,
      estimated_value: lead.estimated_value,
      account_plan: currentInsights.accountPlan,
      account_milestones: currentInsights.accountMilestones,
      created_from: "sales_command_center",
      last_synced_at: now,
    };

    const engagementPayload: PcEngagementInsert = {
      account_id: accountResult.data.id,
      name: `${accountName} - ${lane.offerName}`,
      offer_name: lane.offerName,
      system_name: lane.systemName,
      stage: "kickoff",
      value_range: lane.valueRange,
      data_posture: "client",
      risk_level: "medium",
      next_step: lane.nextStep,
      task_id: null,
      metadata: engagementMetadata,
      created_by: user.id,
    };

    const engagementResult = existingEngagement
      ? await pc
          .from("pc_engagements")
          .update({ ...engagementPayload, updated_at: now })
          .eq("id", existingEngagement.id)
          .select("*")
          .single()
      : await pc.from("pc_engagements").insert(engagementPayload).select("*").single();

    if (engagementResult.error || !engagementResult.data) {
      console.error("Engagement conversion error:", engagementResult.error);
      return NextResponse.json({ error: "Could not create engagement" }, { status: 500 });
    }

    const nextInsights: Json = {
      ...currentInsights,
      accountId: accountResult.data.id,
      engagementId: engagementResult.data.id,
      accountSyncedAt: now,
      accountOfferName: lane.offerName,
      accountNextStep: lane.nextStep,
    };
    const handoffBlock = [
      "Permanent account synced",
      `Account: ${accountName}`,
      `Contact: ${getContactName(lead)}`,
      `Engagement: ${lane.offerName}`,
      `System: ${lane.systemName}`,
      `Next step: ${lane.nextStep}`,
      `pc_accounts: ${accountResult.data.id}`,
      `pc_engagements: ${engagementResult.data.id}`,
    ].join("\n");
    const existingNotes = lead.notes?.trim() || "";
    const nextNotes = existingNotes.includes(accountResult.data.id)
      ? existingNotes
      : existingNotes
        ? `${existingNotes}\n\n---\n${handoffBlock}`
        : handoffBlock;

    const { data: updatedLead, error: updateLeadError } = await supabase
      .from("leads")
      .update({
        status: "won",
        stage: "delivery_handoff",
        notes: nextNotes,
        ai_insights: nextInsights,
        updated_at: now,
      })
      .eq("id", lead.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateLeadError) {
      console.error("Lead account sync error:", updateLeadError);
      return NextResponse.json({ error: "Account created, but lead sync failed" }, { status: 500 });
    }

    await supabase.from("lead_activities").insert({
      lead_id: lead.id,
      user_id: user.id,
      activity_type: "account_synced",
      title: "Permanent account synced",
      description: `${accountName} is now stored in pc_accounts with a ${lane.offerName} engagement.`,
    });

    return NextResponse.json({
      account: accountResult.data,
      engagement: engagementResult.data,
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Accounts POST error:", error);
    return NextResponse.json({ error: "Could not sync account" }, { status: 500 });
  }
}
