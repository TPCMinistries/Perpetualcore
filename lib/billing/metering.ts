import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

export type MeterType = 'ai_tokens' | 'api_calls' | 'storage_gb' | 'premium_models' | 'agents';

export interface UsageMeter {
  id: string;
  organization_id: string;
  meter_type: MeterType;
  stripe_meter_id: string | null;
  current_usage: number;
  included_quota: number;
  overage_units: number;
  overage_price_per_unit: number;
  overage_cost: number;
  billing_period_start: string;
  billing_period_end: string;
  last_synced_to_stripe: string | null;
  last_synced_usage: number;
}

export interface MeterUsageResult {
  meter: UsageMeter;
  percentUsed: number;
  isOverage: boolean;
  overageAmount: number;
  overageCost: number;
}

/**
 * Get or create a usage meter for an organization
 */
export async function getOrCreateMeter(
  organizationId: string,
  meterType: MeterType
): Promise<UsageMeter | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('get_or_create_usage_meter', {
    p_org_id: organizationId,
    p_meter_type: meterType,
  });

  if (error) {
    console.error('[Metering] Error getting/creating meter:', error);
    return null;
  }

  return data as UsageMeter;
}

/**
 * Increment usage for a meter
 */
export async function incrementMeter(
  organizationId: string,
  meterType: MeterType,
  amount: number
): Promise<MeterUsageResult | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('increment_usage_meter', {
    p_org_id: organizationId,
    p_meter_type: meterType,
    p_amount: amount,
  });

  if (error) {
    console.error('[Metering] Error incrementing meter:', error);
    return null;
  }

  const meter = data as UsageMeter;
  const percentUsed = meter.included_quota > 0
    ? (meter.current_usage / meter.included_quota) * 100
    : 100;

  return {
    meter,
    percentUsed,
    isOverage: meter.overage_units > 0,
    overageAmount: meter.overage_units,
    overageCost: meter.overage_cost,
  };
}

/**
 * Get all meters for an organization
 */
export async function getOrganizationMeters(
  organizationId: string
): Promise<UsageMeter[]> {
  const supabase = createAdminClient();

  const periodStart = new Date();
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('usage_meters')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('billing_period_start', periodStart.toISOString());

  if (error) {
    console.error('[Metering] Error fetching meters:', error);
    return [];
  }

  return data as UsageMeter[];
}

/**
 * Get usage summary for an organization
 */
export async function getUsageSummary(organizationId: string): Promise<{
  meters: MeterUsageResult[];
  totalOverageCost: number;
  hasOverage: boolean;
}> {
  const meters = await getOrganizationMeters(organizationId);

  const meterResults: MeterUsageResult[] = meters.map(meter => ({
    meter,
    percentUsed: meter.included_quota > 0
      ? (meter.current_usage / meter.included_quota) * 100
      : 100,
    isOverage: meter.overage_units > 0,
    overageAmount: meter.overage_units,
    overageCost: meter.overage_cost,
  }));

  const totalOverageCost = meterResults.reduce(
    (sum, m) => sum + m.overageCost,
    0
  );

  return {
    meters: meterResults,
    totalOverageCost,
    hasOverage: meterResults.some(m => m.isOverage),
  };
}

/**
 * Sync usage to Stripe for metered billing
 * Should be called by a cron job
 */
export async function syncUsageToStripe(organizationId: string): Promise<{
  synced: boolean;
  metersSynced: number;
  errors: string[];
}> {
  const supabase = createAdminClient();
  const errors: string[] = [];
  let metersSynced = 0;

  // Get subscription for org
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id, stripe_customer_id')
    .eq('organization_id', organizationId)
    .single();

  if (!subscription?.stripe_subscription_id) {
    return { synced: false, metersSynced: 0, errors: ['No active subscription'] };
  }

  // Get all meters with unsyced usage
  const meters = await getOrganizationMeters(organizationId);

  for (const meter of meters) {
    // Only sync if there's new usage since last sync
    const newUsage = meter.current_usage - meter.last_synced_usage;

    if (newUsage <= 0) {
      continue;
    }

    try {
      // Report usage to Stripe using Usage Records
      // Note: This requires metered billing set up in Stripe
      if (meter.stripe_meter_id && meter.overage_units > 0) {
        // Get subscription item for this meter
        const subscriptionItems = await stripe.subscriptionItems.list({
          subscription: subscription.stripe_subscription_id,
        });

        // Find the metered price item (if configured)
        const meteredItem = subscriptionItems.data.find(item =>
          item.price.recurring?.usage_type === 'metered'
        );

        if (meteredItem) {
          await stripe.subscriptionItems.createUsageRecord(meteredItem.id, {
            quantity: meter.overage_units,
            timestamp: Math.floor(Date.now() / 1000),
            action: 'set', // 'set' to replace, 'increment' to add
          });
        }
      }

      // Update last synced
      await supabase
        .from('usage_meters')
        .update({
          last_synced_to_stripe: new Date().toISOString(),
          last_synced_usage: meter.current_usage,
        })
        .eq('id', meter.id);

      metersSynced++;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`Failed to sync ${meter.meter_type}: ${message}`);
      console.error('[Metering] Stripe sync error:', err);
    }
  }

  return {
    synced: errors.length === 0,
    metersSynced,
    errors,
  };
}

/**
 * Track AI token usage (convenience function)
 */
export async function trackAITokens(
  organizationId: string,
  tokens: number
): Promise<MeterUsageResult | null> {
  return incrementMeter(organizationId, 'ai_tokens', tokens);
}

/**
 * Track premium model usage (convenience function)
 */
export async function trackPremiumModelTokens(
  organizationId: string,
  tokens: number
): Promise<MeterUsageResult | null> {
  return incrementMeter(organizationId, 'premium_models', tokens);
}

/**
 * Track API call (convenience function)
 */
export async function trackAPICall(
  organizationId: string
): Promise<MeterUsageResult | null> {
  return incrementMeter(organizationId, 'api_calls', 1);
}

/**
 * Track agent run (convenience function)
 */
export async function trackAgentRun(
  organizationId: string
): Promise<MeterUsageResult | null> {
  return incrementMeter(organizationId, 'agents', 1);
}
