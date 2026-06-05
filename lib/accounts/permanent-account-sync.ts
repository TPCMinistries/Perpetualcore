import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type PcAccountRow = {
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

export type PcEngagementRow = {
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

export type PermanentLeadRow = {
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
  ai_insights: unknown;
  created_at?: string | null;
  updated_at?: string | null;
};

type SyncPermanentAccountOptions = {
  lead: PermanentLeadRow;
  userId: string;
  createdFrom: "sales_command_center" | "package_intake";
};

export function getPcClient() {
  return createAdminClient() as unknown as SupabaseClient<PcDatabase>;
}

function isRecord(value: unknown): value is Record<string, Json> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function getPermanentAccountName(lead: PermanentLeadRow) {
  return lead.company || lead.name || lead.email || "Client account";
}

export function getPermanentContactName(lead: PermanentLeadRow) {
  return lead.name || lead.email || "Primary contact";
}

function getRecommendedLane(lead: PermanentLeadRow) {
  const text = `${lead.title || ""} ${lead.notes || ""}`.toLowerCase();
  const value = lead.estimated_value || 0;
  const insights = isRecord(lead.ai_insights) ? lead.ai_insights : {};
  const offerName = typeof insights.accountOfferName === "string" ? insights.accountOfferName : null;
  const nextStep = typeof insights.accountNextStep === "string" ? insights.accountNextStep : null;

  if (offerName) {
    return {
      offerName,
      systemName: offerName.toLowerCase().includes("software") ? "Perpetual Core software" : "AI operating system",
      valueRange:
        offerName.toLowerCase().includes("operating") || value >= 15000
          ? "$15k-$45k+"
          : offerName.toLowerCase().includes("workflow") || value >= 7500
            ? "$7.5k-$15k"
            : offerName.toLowerCase().includes("setup") || value >= 1000
              ? "$2.5k-$5k + software"
              : "$149-$499/mo",
      nextStep: nextStep || "Confirm kickoff window and generate the account operating plan.",
    };
  }

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

export async function getAccountByLead(pc: ReturnType<typeof getPcClient>, leadId: string, userId: string) {
  const { data, error } = await pc
    .from("pc_accounts")
    .select("*")
    .eq("created_by", userId)
    .contains("metadata", { source_lead_id: leadId })
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getEngagementByLead(pc: ReturnType<typeof getPcClient>, leadId: string, userId: string) {
  const { data, error } = await pc
    .from("pc_engagements")
    .select("*")
    .eq("created_by", userId)
    .contains("metadata", { source_lead_id: leadId })
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function syncPermanentAccount({ lead, userId, createdFrom }: SyncPermanentAccountOptions) {
  const pc = getPcClient();
  const existingAccount = await getAccountByLead(pc, lead.id, userId);
  const existingEngagement = await getEngagementByLead(pc, lead.id, userId);
  const lane = getRecommendedLane(lead);
  const currentInsights = isRecord(lead.ai_insights) ? lead.ai_insights : {};
  const accountName = getPermanentAccountName(lead);
  const now = new Date().toISOString();
  const accountMetadata: Json = {
    source_lead_id: lead.id,
    source_lead_status: lead.status,
    source_lead_stage: lead.stage,
    contact_name: getPermanentContactName(lead),
    contact_email: lead.email,
    contact_phone: lead.phone,
    estimated_value: lead.estimated_value,
    account_plan: currentInsights.accountPlan,
    account_milestones: currentInsights.accountMilestones,
    account_updates: currentInsights.accountUpdates,
    account_handoff_context: currentInsights.accountHandoffContext,
    package_intake: currentInsights.packageIntake,
    created_from: existingAccount && isRecord(existingAccount.metadata) ? existingAccount.metadata.created_from : createdFrom,
    converted_at: existingAccount && isRecord(existingAccount.metadata) ? existingAccount.metadata.converted_at : now,
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
    created_by: userId,
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
    throw accountResult.error || new Error("Could not create account");
  }

  const engagementMetadata: Json = {
    source_lead_id: lead.id,
    source_lead_status: lead.status,
    source_lead_stage: lead.stage,
    account_id: accountResult.data.id,
    contact_name: getPermanentContactName(lead),
    contact_email: lead.email,
    estimated_value: lead.estimated_value,
    account_plan: currentInsights.accountPlan,
    account_milestones: currentInsights.accountMilestones,
    account_handoff_context: currentInsights.accountHandoffContext,
    package_intake: currentInsights.packageIntake,
    created_from: createdFrom,
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
    created_by: userId,
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
    throw engagementResult.error || new Error("Could not create engagement");
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
    `Contact: ${getPermanentContactName(lead)}`,
    `Engagement: ${lane.offerName}`,
    `System: ${lane.systemName}`,
    `Next step: ${lane.nextStep}`,
    `pc_accounts: ${accountResult.data.id}`,
    `pc_engagements: ${engagementResult.data.id}`,
  ].join("\n");

  return {
    account: accountResult.data,
    engagement: engagementResult.data,
    lane,
    nextInsights,
    handoffBlock,
  };
}
