import { createClient } from "@/lib/supabase/server";

export interface ModelPricing {
  id: string;
  model_id: string;
  provider: string;
  display_name: string;
  input_cost_per_1k: number;
  output_cost_per_1k: number;
  is_premium: boolean;
  tier_required: string;
  overage_multiplier: number;
  is_active: boolean;
  supports_vision: boolean;
  supports_function_calling: boolean;
  context_window: number;
}

export interface CostCalculation {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

// Cache for model pricing to avoid repeated DB calls
let modelPricingCache: Map<string, ModelPricing> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get all model pricing
 */
export async function getAllModelPricing(): Promise<ModelPricing[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ai_model_pricing')
    .select('*')
    .eq('is_active', true)
    .order('provider', { ascending: true });

  if (error) {
    console.error('[ModelPricing] Error fetching pricing:', error);
    return [];
  }

  return data as ModelPricing[];
}

/**
 * Get pricing for a specific model
 */
export async function getModelPricing(modelId: string): Promise<ModelPricing | null> {
  // Check cache
  if (modelPricingCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return modelPricingCache.get(modelId) || null;
  }

  // Refresh cache
  const allPricing = await getAllModelPricing();
  modelPricingCache = new Map(allPricing.map(p => [p.model_id, p]));
  cacheTimestamp = Date.now();

  return modelPricingCache.get(modelId) || null;
}

/**
 * Calculate cost for a request
 */
export async function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  isOverage: boolean = false
): Promise<CostCalculation> {
  const pricing = await getModelPricing(modelId);

  if (!pricing) {
    // Default fallback pricing
    console.warn(`[ModelPricing] No pricing found for ${modelId}, using defaults`);
    return {
      inputCost: (inputTokens / 1000) * 0.001,
      outputCost: (outputTokens / 1000) * 0.002,
      totalCost: (inputTokens / 1000) * 0.001 + (outputTokens / 1000) * 0.002,
      model: modelId,
      inputTokens,
      outputTokens,
    };
  }

  // Apply overage multiplier if in overage
  const multiplier = isOverage ? pricing.overage_multiplier : 1.0;

  const inputCost = (inputTokens / 1000) * pricing.input_cost_per_1k * multiplier;
  const outputCost = (outputTokens / 1000) * pricing.output_cost_per_1k * multiplier;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    model: modelId,
    inputTokens,
    outputTokens,
  };
}

/**
 * Calculate cost using database function (for accuracy)
 */
export async function calculateCostDB(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('calculate_model_cost', {
    p_model_id: modelId,
    p_input_tokens: inputTokens,
    p_output_tokens: outputTokens,
  });

  if (error) {
    console.error('[ModelPricing] Error calculating cost:', error);
    // Fallback to local calculation
    const calc = await calculateCost(modelId, inputTokens, outputTokens);
    return calc.totalCost;
  }

  return data as number;
}

/**
 * Get models available for a tier
 */
export async function getModelsForTier(tier: string): Promise<ModelPricing[]> {
  const allPricing = await getAllModelPricing();

  const tierOrder: Record<string, number> = {
    free: 0,
    starter: 1,
    pro: 2,
    team: 3,
    business: 4,
    enterprise: 5,
  };

  const userTierLevel = tierOrder[tier] ?? 0;

  return allPricing.filter(model => {
    const requiredLevel = tierOrder[model.tier_required] ?? 0;
    return requiredLevel <= userTierLevel;
  });
}

/**
 * Check if a model is available for a tier
 */
export async function isModelAvailableForTier(
  modelId: string,
  tier: string
): Promise<boolean> {
  const pricing = await getModelPricing(modelId);

  if (!pricing) {
    return false;
  }

  const tierOrder: Record<string, number> = {
    free: 0,
    starter: 1,
    pro: 2,
    team: 3,
    business: 4,
    enterprise: 5,
  };

  const userTierLevel = tierOrder[tier] ?? 0;
  const requiredLevel = tierOrder[pricing.tier_required] ?? 0;

  return requiredLevel <= userTierLevel;
}

/**
 * Get premium models
 */
export async function getPremiumModels(): Promise<ModelPricing[]> {
  const allPricing = await getAllModelPricing();
  return allPricing.filter(model => model.is_premium);
}

/**
 * Get models by provider
 */
export async function getModelsByProvider(provider: string): Promise<ModelPricing[]> {
  const allPricing = await getAllModelPricing();
  return allPricing.filter(model =>
    model.provider.toLowerCase() === provider.toLowerCase()
  );
}

/**
 * Estimate monthly cost based on usage patterns
 */
export async function estimateMonthlyCost(
  modelId: string,
  dailyInputTokens: number,
  dailyOutputTokens: number
): Promise<{
  dailyCost: number;
  weeklyCost: number;
  monthlyCost: number;
  model: string;
}> {
  const dailyCalc = await calculateCost(modelId, dailyInputTokens, dailyOutputTokens);

  return {
    dailyCost: dailyCalc.totalCost,
    weeklyCost: dailyCalc.totalCost * 7,
    monthlyCost: dailyCalc.totalCost * 30,
    model: modelId,
  };
}

/**
 * Compare costs across models
 */
export async function compareModelCosts(
  inputTokens: number,
  outputTokens: number
): Promise<Array<CostCalculation & { savings: number; savingsPercent: number }>> {
  const allPricing = await getAllModelPricing();

  const costs = await Promise.all(
    allPricing.map(async model => {
      const calc = await calculateCost(model.model_id, inputTokens, outputTokens);
      return {
        ...calc,
        displayName: model.display_name,
        provider: model.provider,
        isPremium: model.is_premium,
      };
    })
  );

  // Sort by cost
  costs.sort((a, b) => a.totalCost - b.totalCost);

  // Calculate savings compared to most expensive
  const maxCost = costs[costs.length - 1]?.totalCost || 0;

  return costs.map(cost => ({
    ...cost,
    savings: maxCost - cost.totalCost,
    savingsPercent: maxCost > 0 ? ((maxCost - cost.totalCost) / maxCost) * 100 : 0,
  }));
}

/**
 * Clear pricing cache
 */
export function clearPricingCache(): void {
  modelPricingCache = null;
  cacheTimestamp = 0;
}
