import { createClient } from "@/lib/supabase/server";
import { AIModel } from "@/types";
import { UserTier } from "./model-selector";

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
): Promise<void> {
  const supabase = await createClient();

  console.log(`[QuotaManager] Recording usage for user ${userId}: ${inputTokens + outputTokens} tokens, $${cost.toFixed(4)}`);

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
    // Don't throw - this shouldn't break the user's request
  } else {
    console.log(`[QuotaManager] ✅ Usage recorded successfully`);
  }
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
