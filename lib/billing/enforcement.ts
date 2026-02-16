import { createAdminClient } from "@/lib/supabase/server";
import { PLAN_LIMITS, PlanType } from "@/lib/stripe/client";

export interface EnforcementResult {
  allowed: boolean;
  current: number;
  limit: number;
  plan: string;
  message?: string;
}

/**
 * Get the current plan for an organization
 */
async function getOrgPlan(organizationId: string): Promise<PlanType> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("organization_id", organizationId)
    .single();

  // Treat canceled subscriptions as free
  if (!data || data.status === "canceled") return "free";
  return (data.plan as PlanType) || "free";
}

/**
 * Check if an organization can add more storage
 */
export async function enforceStorageLimit(
  organizationId: string,
  additionalBytes: number = 0
): Promise<EnforcementResult> {
  const plan = await getOrgPlan(organizationId);
  const limitGB = PLAN_LIMITS[plan]?.storageGB ?? 1;

  // -1 means unlimited
  if (limitGB === -1) {
    return { allowed: true, current: 0, limit: -1, plan };
  }

  const supabase = createAdminClient();
  const { data: docs } = await supabase
    .from("documents")
    .select("file_size")
    .eq("organization_id", organizationId);

  const currentBytes = docs?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0;
  const limitBytes = limitGB * 1024 * 1024 * 1024;
  const wouldUse = currentBytes + additionalBytes;

  if (wouldUse > limitBytes) {
    return {
      allowed: false,
      current: currentBytes,
      limit: limitBytes,
      plan,
      message: `Storage limit reached. Your ${plan} plan allows ${limitGB}GB. Consider upgrading for more storage.`,
    };
  }

  return { allowed: true, current: currentBytes, limit: limitBytes, plan };
}

/**
 * Check if an organization can add more documents
 */
export async function enforceDocumentLimit(
  organizationId: string
): Promise<EnforcementResult> {
  const plan = await getOrgPlan(organizationId);
  const limit = PLAN_LIMITS[plan]?.documents ?? 5;

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1, plan };
  }

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  const current = count || 0;

  if (current >= limit) {
    return {
      allowed: false,
      current,
      limit,
      plan,
      message: `Document limit reached (${current}/${limit}). Your ${plan} plan allows ${limit} documents. Upgrade for unlimited documents.`,
    };
  }

  return { allowed: true, current, limit, plan };
}

/**
 * Check if an organization can add more team members
 */
export async function enforceTeamMemberLimit(
  organizationId: string
): Promise<EnforcementResult> {
  const plan = await getOrgPlan(organizationId);
  const limit = PLAN_LIMITS[plan]?.teamMembers ?? 1;

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1, plan };
  }

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  const current = count || 0;

  if (current >= limit) {
    return {
      allowed: false,
      current,
      limit,
      plan,
      message: `Team member limit reached (${current}/${limit}). Upgrade to add more members.`,
    };
  }

  return { allowed: true, current, limit, plan };
}

/**
 * Check if a user can create more custom skills
 */
export async function enforceCustomSkillLimit(
  userId: string,
  organizationId?: string
): Promise<EnforcementResult> {
  const plan = organizationId
    ? await getOrgPlan(organizationId)
    : "free" as PlanType;
  const limit = PLAN_LIMITS[plan]?.customSkills ?? 1;

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1, plan };
  }

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("custom_skills")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", userId);

  const current = count || 0;

  if (current >= limit) {
    return {
      allowed: false,
      current,
      limit,
      plan,
      message: `Custom skill limit reached (${current}/${limit}). Your ${plan} plan allows ${limit} custom skills. Upgrade for more.`,
    };
  }

  return { allowed: true, current, limit, plan };
}

// ============================================================
// OpenClaw Competitive Feature Gates
// ============================================================

/**
 * Check if a user can connect more external channels
 */
export async function enforceChannelLimit(
  userId: string,
  organizationId?: string
): Promise<EnforcementResult> {
  const plan = organizationId
    ? await getOrgPlan(organizationId)
    : "free" as PlanType;
  const limit = PLAN_LIMITS[plan]?.channels ?? 0;

  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1, plan };
  }

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("channel_links")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  const current = count || 0;

  if (current >= limit) {
    return {
      allowed: false,
      current,
      limit,
      plan,
      message: limit === 0
        ? `External channels are not available on the ${plan} plan. Upgrade to Starter or above.`
        : `Channel limit reached (${current}/${limit}). Upgrade for more channels.`,
    };
  }

  return { allowed: true, current, limit, plan };
}

/**
 * Check if a user can create more agent workspaces
 */
export async function enforceAgentWorkspaceLimit(
  userId: string,
  organizationId?: string
): Promise<EnforcementResult> {
  const plan = organizationId
    ? await getOrgPlan(organizationId)
    : "free" as PlanType;
  const limit = PLAN_LIMITS[plan]?.agentWorkspaces ?? 0;

  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1, plan };
  }

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("agent_workspaces")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  const current = count || 0;

  if (current >= limit) {
    return {
      allowed: false,
      current,
      limit,
      plan,
      message: limit === 0
        ? `Agent workspaces are not available on the ${plan} plan. Upgrade to Starter or above.`
        : `Workspace limit reached (${current}/${limit}). Upgrade for more agent workspaces.`,
    };
  }

  return { allowed: true, current, limit, plan };
}

/**
 * Check if voice mode is available for the user's plan
 */
export async function enforceVoiceModeAccess(
  organizationId?: string
): Promise<EnforcementResult> {
  const plan = organizationId
    ? await getOrgPlan(organizationId)
    : "free" as PlanType;
  const hasVoice = PLAN_LIMITS[plan]?.features?.voiceMode ?? false;

  return {
    allowed: hasVoice,
    current: hasVoice ? 1 : 0,
    limit: hasVoice ? 1 : 0,
    plan,
    message: hasVoice
      ? undefined
      : `Voice mode is available on Pro plans and above. Upgrade to unlock.`,
  };
}

/**
 * Check if a user can install more marketplace skills
 */
export async function enforceMarketplaceSkillLimit(
  userId: string,
  organizationId?: string
): Promise<EnforcementResult> {
  const plan = organizationId
    ? await getOrgPlan(organizationId)
    : "free" as PlanType;
  const limit = PLAN_LIMITS[plan]?.marketplaceSkills ?? 3;

  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1, plan };
  }

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("skill_installs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("uninstalled_at", null);

  const current = count || 0;

  if (current >= limit) {
    return {
      allowed: false,
      current,
      limit,
      plan,
      message: `Marketplace skill limit reached (${current}/${limit}). Upgrade for more skills.`,
    };
  }

  return { allowed: true, current, limit, plan };
}

/**
 * Check if a user can create more proactive agent behaviors
 */
export async function enforceProactiveBehaviorLimit(
  userId: string,
  organizationId?: string
): Promise<EnforcementResult> {
  const plan = organizationId
    ? await getOrgPlan(organizationId)
    : "free" as PlanType;
  const limit = PLAN_LIMITS[plan]?.proactiveBehaviors ?? 0;

  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1, plan };
  }

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("proactive_behaviors")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  const current = count || 0;

  if (current >= limit) {
    return {
      allowed: false,
      current,
      limit,
      plan,
      message: limit === 0
        ? `Proactive agent behaviors are not available on the ${plan} plan. Upgrade to Starter or above.`
        : `Behavior limit reached (${current}/${limit}). Upgrade for more proactive behaviors.`,
    };
  }

  return { allowed: true, current, limit, plan };
}

/**
 * Check A2UI block access level (basic vs full)
 */
export async function enforceA2UIAccess(
  organizationId?: string,
  blockType?: string
): Promise<EnforcementResult> {
  const plan = organizationId
    ? await getOrgPlan(organizationId)
    : "free" as PlanType;
  const features = PLAN_LIMITS[plan]?.features;
  const hasBasic = features?.a2uiBasic ?? true;
  const hasFull = features?.a2uiFull ?? false;

  // Basic blocks available to all plans
  const basicBlocks = ["metric", "card", "code", "progress"];
  const isBasicBlock = !blockType || basicBlocks.includes(blockType);

  if (isBasicBlock && hasBasic) {
    return { allowed: true, current: 0, limit: 0, plan };
  }

  if (!isBasicBlock && !hasFull) {
    return {
      allowed: false,
      current: 0,
      limit: 0,
      plan,
      message: `Advanced A2UI blocks (charts, tables, forms, kanban) require Starter plan or above.`,
    };
  }

  return { allowed: true, current: 0, limit: 0, plan };
}
