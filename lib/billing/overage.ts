import { createClient } from "@/lib/supabase/server";
import { getUsageSummary, MeterType, MeterUsageResult } from "./metering";

export type PlanType = 'free' | 'starter' | 'pro' | 'team' | 'business' | 'enterprise';

export interface PlanOverageConfig {
  plan: PlanType;
  overage_allowed: boolean;
  included_ai_tokens: number;
  included_api_calls: number;
  included_storage_gb: number;
  included_premium_model_tokens: number;
  included_agent_runs: number;
  overage_rate_per_1k_tokens: number;
  overage_rate_per_api_call: number;
  overage_rate_per_gb: number;
  max_overage_usd: number | null;
}

export interface OverageCheckResult {
  allowed: boolean;
  reason?: string;
  currentOverageCost: number;
  maxOverageCost: number | null;
  percentOfMaxOverage: number | null;
  wouldExceedCap: boolean;
}

export interface UsageProjection {
  currentUsage: number;
  projectedEndOfMonth: number;
  projectedOverage: number;
  projectedOverageCost: number;
  daysRemaining: number;
  dailyAverage: number;
}

/**
 * Get overage configuration for a plan
 */
export async function getPlanOverageConfig(
  plan: PlanType
): Promise<PlanOverageConfig | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('plan_overage_config')
    .select('*')
    .eq('plan', plan)
    .single();

  if (error) {
    console.error('[Overage] Error getting plan config:', error);
    return null;
  }

  return data as PlanOverageConfig;
}

/**
 * Check if organization can use overage
 */
export async function checkOverageAllowed(
  organizationId: string
): Promise<OverageCheckResult> {
  const supabase = await createClient();

  // Get org's subscription and plan
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('organization_id', organizationId)
    .single();

  const plan = (subscription?.plan as PlanType) || 'free';

  // Get plan config
  const config = await getPlanOverageConfig(plan);

  if (!config) {
    return {
      allowed: false,
      reason: 'Plan configuration not found',
      currentOverageCost: 0,
      maxOverageCost: null,
      percentOfMaxOverage: null,
      wouldExceedCap: false,
    };
  }

  if (!config.overage_allowed) {
    return {
      allowed: false,
      reason: `Overage is not available on the ${plan} plan. Upgrade to continue.`,
      currentOverageCost: 0,
      maxOverageCost: null,
      percentOfMaxOverage: null,
      wouldExceedCap: false,
    };
  }

  // Get current overage costs
  const usageSummary = await getUsageSummary(organizationId);
  const currentOverageCost = usageSummary.totalOverageCost;

  // Check against cap
  const maxOverageCost = config.max_overage_usd;
  let wouldExceedCap = false;
  let percentOfMaxOverage: number | null = null;

  if (maxOverageCost !== null) {
    percentOfMaxOverage = (currentOverageCost / maxOverageCost) * 100;
    wouldExceedCap = currentOverageCost >= maxOverageCost;
  }

  if (wouldExceedCap) {
    return {
      allowed: false,
      reason: `Overage cap of $${maxOverageCost?.toFixed(2)} reached. Contact sales to increase limit.`,
      currentOverageCost,
      maxOverageCost,
      percentOfMaxOverage,
      wouldExceedCap: true,
    };
  }

  return {
    allowed: true,
    currentOverageCost,
    maxOverageCost,
    percentOfMaxOverage,
    wouldExceedCap: false,
  };
}

/**
 * Calculate projected usage and overage for end of billing period
 */
export async function projectUsage(
  organizationId: string,
  meterType: MeterType
): Promise<UsageProjection | null> {
  const supabase = await createClient();

  // Get current meter
  const periodStart = new Date();
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);

  const { data: meter } = await supabase
    .from('usage_meters')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('meter_type', meterType)
    .gte('billing_period_start', periodStart.toISOString())
    .single();

  if (!meter) {
    return null;
  }

  // Calculate days in period and days passed
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysInMonth = endOfMonth.getDate();
  const daysPassed = now.getDate();
  const daysRemaining = daysInMonth - daysPassed;

  // Calculate daily average and projection
  const dailyAverage = daysPassed > 0 ? meter.current_usage / daysPassed : 0;
  const projectedEndOfMonth = Math.round(dailyAverage * daysInMonth);
  const projectedOverage = Math.max(projectedEndOfMonth - meter.included_quota, 0);
  const projectedOverageCost = projectedOverage * meter.overage_price_per_unit;

  return {
    currentUsage: meter.current_usage,
    projectedEndOfMonth,
    projectedOverage,
    projectedOverageCost,
    daysRemaining,
    dailyAverage,
  };
}

/**
 * Get overage breakdown by meter type
 */
export async function getOverageBreakdown(organizationId: string): Promise<{
  byMeter: Record<MeterType, {
    currentUsage: number;
    includedQuota: number;
    overageUnits: number;
    overageCost: number;
    percentUsed: number;
  }>;
  totalOverageCost: number;
  planConfig: PlanOverageConfig | null;
}> {
  const supabase = await createClient();

  // Get subscription plan
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('organization_id', organizationId)
    .single();

  const plan = (subscription?.plan as PlanType) || 'free';
  const planConfig = await getPlanOverageConfig(plan);

  // Get all meters
  const usageSummary = await getUsageSummary(organizationId);

  const byMeter: Record<string, any> = {};
  let totalOverageCost = 0;

  for (const meterResult of usageSummary.meters) {
    const { meter } = meterResult;
    byMeter[meter.meter_type] = {
      currentUsage: meter.current_usage,
      includedQuota: meter.included_quota,
      overageUnits: meter.overage_units,
      overageCost: meter.overage_cost,
      percentUsed: meterResult.percentUsed,
    };
    totalOverageCost += meter.overage_cost;
  }

  return {
    byMeter: byMeter as Record<MeterType, any>,
    totalOverageCost,
    planConfig,
  };
}

/**
 * Estimate cost for additional usage
 */
export async function estimateAdditionalCost(
  organizationId: string,
  meterType: MeterType,
  additionalUsage: number
): Promise<{
  estimatedCost: number;
  wouldTriggerOverage: boolean;
  remainingIncluded: number;
  additionalOverage: number;
}> {
  const supabase = await createClient();

  // Get current meter
  const periodStart = new Date();
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);

  const { data: meter } = await supabase
    .from('usage_meters')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('meter_type', meterType)
    .gte('billing_period_start', periodStart.toISOString())
    .single();

  if (!meter) {
    // No meter exists, assume default free tier
    return {
      estimatedCost: 0,
      wouldTriggerOverage: false,
      remainingIncluded: 0,
      additionalOverage: 0,
    };
  }

  const remainingIncluded = Math.max(meter.included_quota - meter.current_usage, 0);
  const wouldTriggerOverage = additionalUsage > remainingIncluded;

  let additionalOverage = 0;
  let estimatedCost = 0;

  if (wouldTriggerOverage) {
    additionalOverage = additionalUsage - remainingIncluded;
    estimatedCost = additionalOverage * meter.overage_price_per_unit;
  }

  return {
    estimatedCost,
    wouldTriggerOverage,
    remainingIncluded,
    additionalOverage,
  };
}
