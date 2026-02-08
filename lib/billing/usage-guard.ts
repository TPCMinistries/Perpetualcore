import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS, type PlanType } from "@/lib/stripe/client";
import { getCurrentUsage, getPlanLimits } from "@/lib/stripe/subscriptions";
import { isModelAvailableForTier } from "@/lib/billing/model-pricing";
import { incrementMeter } from "@/lib/billing/metering";
import type { AIModel } from "@/types";

export interface UsageGuardResult {
  allowed: boolean;
  reason?: string;
  code?: "QUOTA_EXCEEDED" | "MODEL_RESTRICTED" | "FEATURE_GATED";
  currentPlan?: string;
  usage?: {
    premiumMessagesUsed: number;
    premiumMessagesLimit: number;
    percentUsed: number;
  };
  upgrade?: {
    requiredPlan: string;
    message: string;
  };
}

/**
 * Check if a user's AI request is allowed based on their plan limits.
 * Call this BEFORE processing AI requests in chat routes.
 *
 * Checks:
 * 1. Is the selected model available for this plan tier?
 * 2. Has the user exceeded their premium message quota?
 */
export async function checkAIUsage(
  organizationId: string,
  model: AIModel
): Promise<UsageGuardResult> {
  const supabase = await createClient();

  // Get current subscription plan
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("organization_id", organizationId)
    .single();

  const plan = (subscription?.plan || "free") as PlanType;
  const planLimits = PLAN_LIMITS[plan];

  if (!planLimits) {
    // Unknown plan — allow but log
    console.warn(`[UsageGuard] Unknown plan: ${plan}, defaulting to free`);
    return checkAIUsage(organizationId, model);
  }

  // 1. Check model access for this tier
  const modelAllowed = await isModelAvailableForTier(model, plan);

  if (!modelAllowed) {
    // Determine which plan the user needs for this model
    const requiredPlan = getRequiredPlanForModel(model);

    return {
      allowed: false,
      reason: `${getModelDisplayName(model)} is not available on the ${plan} plan.`,
      code: "MODEL_RESTRICTED",
      currentPlan: plan,
      upgrade: {
        requiredPlan,
        message: `Upgrade to ${requiredPlan} to use ${getModelDisplayName(model)}.`,
      },
    };
  }

  // 2. Check premium message quota (only applies to plans with limits)
  const isPremiumModel = isPremium(model);

  if (isPremiumModel && planLimits.premiumMessages !== -1) {
    // Get current month's premium usage
    const usage = await getCurrentUsage(organizationId);
    const premiumUsed = usage?.ai_messages_count || 0;
    const premiumLimit = planLimits.premiumMessages;

    if (premiumUsed >= premiumLimit) {
      return {
        allowed: false,
        reason: `You've used all ${premiumLimit} premium AI messages this month.`,
        code: "QUOTA_EXCEEDED",
        currentPlan: plan,
        usage: {
          premiumMessagesUsed: premiumUsed,
          premiumMessagesLimit: premiumLimit,
          percentUsed: 100,
        },
        upgrade: {
          requiredPlan: plan === "free" ? "starter" : "pro",
          message:
            plan === "free"
              ? "Upgrade to Starter for 100 premium messages/month, or Pro for unlimited."
              : "Upgrade to Pro for unlimited premium AI messages.",
        },
      };
    }

    return {
      allowed: true,
      currentPlan: plan,
      usage: {
        premiumMessagesUsed: premiumUsed,
        premiumMessagesLimit: premiumLimit,
        percentUsed: Math.round((premiumUsed / premiumLimit) * 100),
      },
    };
  }

  // Unlimited or non-premium model — allow
  return {
    allowed: true,
    currentPlan: plan,
  };
}

/**
 * Track AI usage after a successful response.
 * Call this AFTER the AI response is complete.
 */
export async function trackAIUsageAfterResponse(
  organizationId: string,
  model: AIModel,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const totalTokens = inputTokens + outputTokens;

  try {
    // Track total AI tokens
    await incrementMeter(organizationId, "ai_tokens", totalTokens);

    // Track premium model usage separately
    if (isPremium(model)) {
      await incrementMeter(organizationId, "premium_models", 1);

      // Also increment the usage_tracking table for quota enforcement
      const supabase = await createClient();
      const currentMonth = new Date().toISOString().slice(0, 7);

      await supabase.rpc("increment_usage", {
        org_id: organizationId,
        usr_id: "", // Will be filled by RPC if needed
        usage_type: "ai_messages",
        increment_by: 1,
      });
    }
  } catch (error) {
    // Non-fatal — don't break the chat flow for tracking failures
    console.error("[UsageGuard] Error tracking usage:", error);
  }
}

/**
 * Check if a model is considered "premium" (costs more / limited on lower tiers)
 */
function isPremium(model: AIModel): boolean {
  const premiumModels = [
    "claude-opus-4",
    "claude-sonnet-4",
    "gpt-4o",
    "gpt-4-turbo",
    "deepseek-chat",
  ];
  return premiumModels.includes(model);
}

/**
 * Get minimum plan required for a model
 */
function getRequiredPlanForModel(model: AIModel): string {
  const modelPlanMap: Record<string, string> = {
    "gemini-2.0-flash-exp": "free",
    "gpt-4o-mini": "starter",
    "deepseek-chat": "starter",
    "gpt-4o": "starter",
    "claude-sonnet-4": "starter",
    "claude-opus-4": "starter",
  };
  return modelPlanMap[model] || "starter";
}

/**
 * Get display name for a model
 */
function getModelDisplayName(model: AIModel): string {
  const names: Record<string, string> = {
    "claude-opus-4": "Claude Opus",
    "claude-sonnet-4": "Claude Sonnet",
    "gpt-4o": "GPT-4o",
    "gpt-4o-mini": "GPT-4o Mini",
    "gemini-2.0-flash-exp": "Gemini 2.0 Flash",
    "deepseek-chat": "DeepSeek V3",
  };
  return names[model] || model;
}
