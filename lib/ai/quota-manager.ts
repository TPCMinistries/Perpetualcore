import { createClient } from "@/lib/supabase/server";
import { AIModel } from "@/types";
import { UserTier } from "./model-selector";
import {
  trackAITokens,
  trackPremiumModelTokens,
  MeterUsageResult,
} from "@/lib/billing/metering";
import {
  checkOverageAllowed,
  OverageCheckResult,
} from "@/lib/billing/overage";
import {
  calculateCost,
  isModelAvailableForTier,
} from "@/lib/billing/model-pricing";
import { sendAlertNotifications } from "@/lib/billing/alerts";

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  tier?: string;
  dailyLimit?: number;
  dailyUsed?: number;
  monthlyLimit?: number;
  monthlyUsed?: number;
  dailyRemaining?: number;
  monthlyRemaining?: number;
  model?: string;
  // New fields for overage
  isOverage?: boolean;
  overageAllowed?: boolean;
  estimatedCost?: number;
}

export interface UserQuota {
  userId: string;
  organizationId: string;
  tier: UserTier;
  maxTokensPerDay: number;
  tokensUsedToday: number;
  maxTokensPerMonth: number;
  tokensUsedThisMonth: number;
  canUsePremiumModels: boolean;
  allowedModels: string[];
}

/**
 * Get user's current quota and usage
 */
export async function getUserQuota(userId: string): Promise<UserQuota | null> {
  const supabase = await createClient();

  // Call database function to get or create quota
  const { data, error } = await supabase.rpc('get_or_create_user_quota', {
    p_user_id: userId,
  });

  if (error) {
    console.error('[QuotaManager] Error getting user quota:', error);
    return null;
  }

  if (!data) {
    console.error('[QuotaManager] No quota data returned for user:', userId);
    return null;
  }

  return {
    userId: data.user_id,
    organizationId: data.organization_id,
    tier: data.tier as UserTier,
    maxTokensPerDay: data.max_tokens_per_day,
    tokensUsedToday: data.tokens_used_today || 0,
    maxTokensPerMonth: data.max_tokens_per_month,
    tokensUsedThisMonth: data.tokens_used_this_month || 0,
    canUsePremiumModels: data.can_use_premium_models || false,
    allowedModels: data.allowed_models || [],
  };
}

/**
 * Check if user can make a request with estimated token count
 */
export async function checkQuota(
  userId: string,
  estimatedTokens: number,
  model: AIModel
): Promise<QuotaCheckResult> {
  const supabase = await createClient();

  console.log(`[QuotaManager] Checking quota for user ${userId}, model ${model}, estimated ${estimatedTokens} tokens`);

  // Call database function to check quota
  const { data, error } = await supabase.rpc('can_use_tokens', {
    p_user_id: userId,
    p_estimated_tokens: estimatedTokens,
    p_model: model,
  });

  if (error) {
    console.error('[QuotaManager] Error checking quota:', error);
    // Fail open - allow the request but log the error
    return {
      allowed: true,
      reason: 'Quota check failed, allowing request',
    };
  }

  console.log(`[QuotaManager] Quota check result:`, data);

  return data as QuotaCheckResult;
}

/**
 * Record usage after a request completes
 * Enhanced with billing system integration for metered billing
 */
export async function recordUsage(
  userId: string,
  model: AIModel,
  inputTokens: number,
  outputTokens: number,
  cost: number,
  options?: {
    conversationId?: string;
    taskType?: 'code' | 'writing' | 'analysis' | 'general';
  }
): Promise<{
  recorded: boolean;
  meterResult?: MeterUsageResult;
  isOverage?: boolean;
  overageCost?: number;
}> {
  const supabase = await createClient();
  const totalTokens = inputTokens + outputTokens;

  console.log(`[QuotaManager] Recording usage for user ${userId}: ${totalTokens} tokens, $${cost.toFixed(4)}`);

  // Record in user_ai_usage (existing system)
  const { error } = await supabase.rpc('record_ai_usage', {
    p_user_id: userId,
    p_model: model,
    p_input_tokens: inputTokens,
    p_output_tokens: outputTokens,
    p_cost: cost,
    p_conversation_id: options?.conversationId || null,
    p_task_type: options?.taskType || null,
  });

  if (error) {
    console.error('[QuotaManager] Error recording usage:', error);
  }

  // Get user's organization for metering
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (!profile?.organization_id) {
    return { recorded: !error };
  }

  // Track in billing meters
  let meterResult: MeterUsageResult | null = null;
  try {
    // Track general AI tokens
    meterResult = await trackAITokens(profile.organization_id, totalTokens);

    // Track premium model tokens separately if applicable
    const isPremiumModel = ['claude-opus-4', 'gpt-4o', 'o1-preview'].includes(model);
    if (isPremiumModel) {
      await trackPremiumModelTokens(profile.organization_id, totalTokens);
    }

    // Check and send alerts if approaching/exceeding quota
    await sendAlertNotifications(profile.organization_id);

    console.log(`[QuotaManager] ✅ Usage recorded successfully (${meterResult?.isOverage ? 'OVERAGE' : 'within quota'})`);
  } catch (meterError) {
    console.error('[QuotaManager] Error tracking in billing meters:', meterError);
  }

  return {
    recorded: !error,
    meterResult: meterResult || undefined,
    isOverage: meterResult?.isOverage,
    overageCost: meterResult?.overageCost,
  };
}

/**
 * Record usage with automatic cost calculation
 */
export async function recordUsageWithCost(
  userId: string,
  model: AIModel,
  inputTokens: number,
  outputTokens: number,
  options?: {
    conversationId?: string;
    taskType?: 'code' | 'writing' | 'analysis' | 'general';
  }
): Promise<{
  recorded: boolean;
  cost: number;
  isOverage?: boolean;
  overageCost?: number;
}> {
  // Calculate cost using model pricing
  const costCalc = await calculateCost(model, inputTokens, outputTokens);

  const result = await recordUsage(
    userId,
    model,
    inputTokens,
    outputTokens,
    costCalc.totalCost,
    options
  );

  return {
    ...result,
    cost: costCalc.totalCost,
  };
}

/**
 * Get user's usage summary
 */
export async function getUserUsageSummary(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_ai_usage_summary')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('[QuotaManager] Error getting usage summary:', error);
    return null;
  }

  return data;
}

/**
 * Estimate token count for messages (rough approximation)
 * Actual count may vary, but this is good enough for quota checking
 */
export function estimateTokenCount(messages: Array<{ content: string }>): number {
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  // Rough estimate: 1 token ≈ 4 characters for English text
  return Math.ceil(totalChars / 4);
}

/**
 * Get downgraded model if user can't use the requested one
 */
export function getDowngradedModel(
  requestedModel: AIModel,
  userTier: UserTier
): AIModel {
  const premiumModels: AIModel[] = ['claude-opus-4', 'gpt-4o'];

  if (premiumModels.includes(requestedModel)) {
    // Free/Pro users get downgraded to cheaper alternatives
    if (userTier === 'free') {
      return 'gpt-4o-mini';
    }
    if (userTier === 'pro') {
      return requestedModel === 'claude-opus-4' ? 'claude-sonnet-4' : 'gpt-4o-mini';
    }
  }

  return requestedModel;
}

/**
 * Enhanced quota check with overage support
 * Returns whether request is allowed, even if in overage (if plan allows)
 */
export async function checkQuotaWithOverage(
  userId: string,
  estimatedTokens: number,
  model: AIModel
): Promise<QuotaCheckResult & { overageStatus?: OverageCheckResult }> {
  const supabase = await createClient();

  // First, do standard quota check
  const quotaResult = await checkQuota(userId, estimatedTokens, model);

  // Get user's organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (!profile?.organization_id) {
    return quotaResult;
  }

  // Check if overage is allowed for this org
  const overageStatus = await checkOverageAllowed(profile.organization_id);

  // If standard quota allows, return as-is
  if (quotaResult.allowed) {
    return {
      ...quotaResult,
      isOverage: false,
      overageAllowed: overageStatus.allowed,
      overageStatus,
    };
  }

  // Quota exceeded - check if overage is allowed
  if (overageStatus.allowed) {
    // Calculate estimated cost for this request
    const costCalc = await calculateCost(model, estimatedTokens, 0);

    return {
      ...quotaResult,
      allowed: true, // Allow with overage
      reason: 'Quota exceeded - overage charges will apply',
      isOverage: true,
      overageAllowed: true,
      estimatedCost: costCalc.totalCost,
      overageStatus,
    };
  }

  // Overage not allowed - deny
  return {
    ...quotaResult,
    allowed: false,
    reason: quotaResult.reason || 'Quota exceeded and overage not available on your plan',
    isOverage: true,
    overageAllowed: false,
    overageStatus,
  };
}

/**
 * Check if a model is available for user's tier
 */
export async function checkModelAccess(
  userId: string,
  model: AIModel
): Promise<{ allowed: boolean; reason?: string; tier?: string }> {
  const quota = await getUserQuota(userId);

  if (!quota) {
    return { allowed: false, reason: 'Could not verify user quota' };
  }

  const modelAvailable = await isModelAvailableForTier(model, quota.tier);

  if (!modelAvailable) {
    return {
      allowed: false,
      reason: `Model ${model} is not available on the ${quota.tier} tier`,
      tier: quota.tier,
    };
  }

  return { allowed: true, tier: quota.tier };
}

/**
 * Tier limits configuration
 */
export const TIER_LIMITS = {
  free: {
    maxTokensPerDay: 50_000,
    maxTokensPerMonth: 1_000_000,
    canUsePremiumModels: false,
    allowedModels: ['gpt-4o-mini', 'gemini-2.0-flash-exp'],
  },
  pro: {
    maxTokensPerDay: 500_000,
    maxTokensPerMonth: 10_000_000,
    canUsePremiumModels: false,
    allowedModels: ['claude-sonnet-4', 'gpt-4o-mini', 'gemini-2.0-flash-exp'],
  },
  business: {
    maxTokensPerDay: 2_000_000,
    maxTokensPerMonth: 50_000_000,
    canUsePremiumModels: true,
    allowedModels: ['claude-opus-4', 'claude-sonnet-4', 'gpt-4o', 'gpt-4o-mini', 'gemini-2.0-flash-exp'],
  },
  enterprise: {
    maxTokensPerDay: 10_000_000,
    maxTokensPerMonth: 200_000_000,
    canUsePremiumModels: true,
    allowedModels: ['claude-opus-4', 'claude-sonnet-4', 'gpt-4o', 'gpt-4o-mini', 'gemini-2.0-flash-exp', 'gamma'],
  },
} as const;

/**
 * Update user's tier (admin function)
 */
export async function updateUserTier(
  userId: string,
  newTier: UserTier
): Promise<boolean> {
  const supabase = await createClient();

  const limits = TIER_LIMITS[newTier];

  const { error } = await supabase
    .from('user_ai_quotas')
    .update({
      tier: newTier,
      max_tokens_per_day: limits.maxTokensPerDay,
      max_tokens_per_month: limits.maxTokensPerMonth,
      can_use_premium_models: limits.canUsePremiumModels,
      allowed_models: limits.allowedModels,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('[QuotaManager] Error updating user tier:', error);
    return false;
  }

  console.log(`[QuotaManager] ✅ Updated user ${userId} to ${newTier} tier`);
  return true;
}
