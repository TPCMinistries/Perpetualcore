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
