import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { getUsageSummary, MeterType, MeterUsageResult, getOrganizationMeters } from "./metering";
import { logger } from "@/lib/logging";

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
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('plan_overage_config')
    .select('*')
    .eq('plan', plan)
    .single();

  if (error) {
    logger.error('[Overage] Error getting plan config:', { error });
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
  const supabase = createAdminClient();

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
  const supabase = createAdminClient();

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
  const supabase = createAdminClient();

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
  const supabase = createAdminClient();

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

const METER_LABELS: Record<MeterType, string> = {
  ai_tokens: "AI Token",
  api_calls: "API Call",
  storage_gb: "Storage",
  premium_models: "Premium Model",
  agents: "Agent Run",
};

/**
 * Finalize overages for all organizations at end of billing period.
 * Creates Stripe invoice items for any overage charges.
 */
export async function finalizeOverages(): Promise<{
  processed: number;
  invoiceItemsCreated: number;
  totalOverageUSD: number;
  errors: string[];
}> {
  const supabase = createAdminClient();
  const errors: string[] = [];
  let invoiceItemsCreated = 0;
  let totalOverageUSD = 0;

  // Get all orgs with active paid subscriptions
  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select("organization_id, stripe_customer_id, stripe_subscription_id, plan")
    .eq("status", "active")
    .not("stripe_subscription_id", "is", null)
    .neq("plan", "free");

  if (error) {
    logger.error("[Overage] Error fetching subscriptions:", { error });
    return { processed: 0, invoiceItemsCreated: 0, totalOverageUSD: 0, errors: [error.message] };
  }

  for (const sub of subscriptions || []) {
    if (!sub.stripe_customer_id) continue;

    try {
      // Get plan overage config
      const config = await getPlanOverageConfig(sub.plan as PlanType);
      if (!config?.overage_allowed) continue;

      // Get all meters for this org
      const meters = await getOrganizationMeters(sub.organization_id);

      for (const meter of meters) {
        if (meter.overage_units <= 0 || meter.overage_cost <= 0) continue;

        const amountCents = Math.round(meter.overage_cost * 100);
        if (amountCents <= 0) continue;

        // Check overage cap
        if (config.max_overage_usd !== null && totalOverageUSD > config.max_overage_usd) {
          continue;
        }

        const label = METER_LABELS[meter.meter_type] || meter.meter_type;
        const description = `${label} Overage: ${meter.overage_units.toLocaleString()} units @ $${meter.overage_price_per_unit}/unit`;

        try {
          await stripe.invoiceItems.create({
            customer: sub.stripe_customer_id,
            amount: amountCents,
            currency: "usd",
            description,
            metadata: {
              organization_id: sub.organization_id,
              meter_type: meter.meter_type,
              overage_units: String(meter.overage_units),
              billing_period_start: meter.billing_period_start,
              billing_period_end: meter.billing_period_end,
            },
          });

          invoiceItemsCreated++;
          totalOverageUSD += meter.overage_cost;

          logger.info("[Overage] Invoice item created", {
            org: sub.organization_id,
            meter: meter.meter_type,
            amount: meter.overage_cost,
          });
        } catch (stripeErr) {
          const msg = stripeErr instanceof Error ? stripeErr.message : "Unknown Stripe error";
          errors.push(`Stripe invoice item failed for ${sub.organization_id}/${meter.meter_type}: ${msg}`);
          logger.error("[Overage] Stripe invoice item error:", { error: stripeErr });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`Error processing org ${sub.organization_id}: ${msg}`);
    }
  }

  return {
    processed: subscriptions?.length || 0,
    invoiceItemsCreated,
    totalOverageUSD,
    errors,
  };
}
