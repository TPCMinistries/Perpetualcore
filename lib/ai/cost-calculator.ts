import { AIModel } from "@/types";

/**
 * Pricing per million tokens (as of Jan 2025)
 * Source: Official pricing pages for each provider
 */
const MODEL_PRICING: Record<
  AIModel,
  {
    input_per_million: number;
    output_per_million: number;
  }
> = {
  // Anthropic Claude Models
  "claude-sonnet-4": {
    input_per_million: 3.0,
    output_per_million: 15.0,
  },
  "claude-3-5-sonnet-20241022": {
    input_per_million: 3.0,
    output_per_million: 15.0,
  },
  "claude-3-5-sonnet-20240620": {
    input_per_million: 3.0,
    output_per_million: 15.0,
  },
  "claude-3-opus-20240229": {
    input_per_million: 15.0,
    output_per_million: 75.0,
  },
  "claude-3-haiku-20240307": {
    input_per_million: 0.25,
    output_per_million: 1.25,
  },

  // OpenAI Models
  "gpt-4o": {
    input_per_million: 2.5,
    output_per_million: 10.0,
  },
  "gpt-4o-mini": {
    input_per_million: 0.15,
    output_per_million: 0.6,
  },
  "gpt-4-turbo": {
    input_per_million: 10.0,
    output_per_million: 30.0,
  },
  "gpt-3.5-turbo": {
    input_per_million: 0.5,
    output_per_million: 1.5,
  },

  // Google Gemini Models
  "gemini-2.0-flash-exp": {
    input_per_million: 0.0, // Currently free in preview
    output_per_million: 0.0,
  },
  "gemini-1.5-pro": {
    input_per_million: 1.25,
    output_per_million: 5.0,
  },
  "gemini-1.5-flash": {
    input_per_million: 0.075,
    output_per_million: 0.3,
  },

  // Auto mode (use Claude Sonnet 4 as default for estimation)
  auto: {
    input_per_million: 3.0,
    output_per_million: 15.0,
  },
};

/**
 * Calculate the cost of an AI API call based on token usage
 */
export function calculateCost(
  model: AIModel,
  inputTokens: number,
  outputTokens: number
): {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  totalTokens: number;
} {
  const pricing = MODEL_PRICING[model];

  if (!pricing) {
    console.warn(`Unknown model pricing for: ${model}, using Claude Sonnet 4 defaults`);
    const fallback = MODEL_PRICING["claude-sonnet-4"];
    const inputCost = (inputTokens / 1_000_000) * fallback.input_per_million;
    const outputCost = (outputTokens / 1_000_000) * fallback.output_per_million;

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      totalTokens: inputTokens + outputTokens,
    };
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.input_per_million;
  const outputCost = (outputTokens / 1_000_000) * pricing.output_per_million;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    totalTokens: inputTokens + outputTokens,
  };
}

/**
 * Get pricing information for a model
 */
export function getModelPricing(model: AIModel) {
  return MODEL_PRICING[model] || MODEL_PRICING["claude-sonnet-4"];
}

/**
 * Estimate cost for a given number of tokens (useful for pre-call estimates)
 */
export function estimateCost(
  model: AIModel,
  estimatedTokens: number
): number {
  const pricing = getModelPricing(model);
  // Assume 50/50 split for estimation
  const halfTokens = estimatedTokens / 2;
  const inputCost = (halfTokens / 1_000_000) * pricing.input_per_million;
  const outputCost = (halfTokens / 1_000_000) * pricing.output_per_million;
  return inputCost + outputCost;
}
