import { AIModel } from "@/types";
import { ChatMessage } from "./router";

export type UserTier = 'free' | 'pro' | 'business' | 'enterprise';

export interface ModelSelectionContext {
  hasTools?: boolean;
  isCodeTask?: boolean;
  requiresReasoning?: boolean;
  maxBudget?: number; // cents per 1M tokens
  userPreference?: AIModel;
}

export interface ModelCosts {
  inputCostPer1M: number; // dollars
  outputCostPer1M: number; // dollars
}

// Actual pricing as of Dec 2024 API documentation
export const MODEL_COSTS: Record<AIModel, ModelCosts> = {
  'claude-opus-4': { inputCostPer1M: 15.0, outputCostPer1M: 75.0 },
  'claude-sonnet-4': { inputCostPer1M: 3.0, outputCostPer1M: 15.0 },
  'gpt-4o': { inputCostPer1M: 2.50, outputCostPer1M: 10.0 },
  'gpt-4o-mini': { inputCostPer1M: 0.15, outputCostPer1M: 0.60 },
  'o1': { inputCostPer1M: 15.0, outputCostPer1M: 60.0 }, // OpenAI reasoning model
  'o1-mini': { inputCostPer1M: 3.0, outputCostPer1M: 12.0 }, // Smaller reasoning model
  'gemini-2.0-flash-exp': { inputCostPer1M: 0.0, outputCostPer1M: 0.0 }, // Free during preview
  'deepseek-chat': { inputCostPer1M: 0.14, outputCostPer1M: 0.28 }, // DeepSeek V3 pricing
  'perplexity': { inputCostPer1M: 1.0, outputCostPer1M: 1.0 }, // Sonar Large with web search
  'perplexity-fast': { inputCostPer1M: 0.2, outputCostPer1M: 0.2 }, // Sonar Small, faster
  'gamma': { inputCostPer1M: 0.0, outputCostPer1M: 0.0 }, // Separate pricing model
  'auto': { inputCostPer1M: 0.0, outputCostPer1M: 0.0 }, // Dynamic
};

/**
 * Select the best AI model based on task analysis and user tier
 * This is the core intelligence of the routing system
 */
export function selectBestModel(
  messages: ChatMessage[],
  userTier: UserTier,
  context: ModelSelectionContext = {}
): AIModel {
  // 1. Honor user preference if provided and not 'auto'
  if (context.userPreference && context.userPreference !== 'auto') {
    console.log(`[ModelSelector] Using user preference: ${context.userPreference}`);
    return context.userPreference;
  }

  // 2. Analyze the task from messages
  const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || '';
  const messageLength = messages.reduce((sum, m) => sum + m.content.length, 0);
  const allMessagesText = messages.map(m => m.content).join(' ').toLowerCase();

  // 3. Task classification patterns
  const isCodeTask = context.isCodeTask ||
    /\b(code|function|debug|fix|implement|refactor|typescript|javascript|python|java|class|api)\b/.test(lastMessage);

  const isWritingTask = /\b(write|draft|compose|create|document|article|essay|email|letter)\b/.test(lastMessage);

  const isAnalysisTask = /\b(analyze|explain|understand|summarize|review|compare)\b/.test(lastMessage);

  const requiresReasoning = context.requiresReasoning ||
    /\b(why|how|reason|logic|think|consider|evaluate|assess)\b/.test(lastMessage);

  const isPresentationTask = /\b(presentation|slides|deck|powerpoint)\b/.test(lastMessage);

  const requiresWebSearch = /\b(search|latest|current|today|news|recent|2024|2025|look up|find out|what is happening)\b/.test(lastMessage);

  const hasComplexContext = messages.length > 10 || messageLength > 5000;

  console.log(`[ModelSelector] Task analysis:`, {
    userTier,
    messageLength,
    conversationLength: messages.length,
    isCodeTask,
    isWritingTask,
    isAnalysisTask,
    requiresReasoning,
    isPresentationTask,
    requiresWebSearch,
    hasComplexContext,
    hasTools: context.hasTools,
  });

  // 4. Route based on task type and tier

  // Presentations -> Gamma (specialized tool)
  if (isPresentationTask) {
    console.log(`[ModelSelector] Selected 'gamma' for presentation task`);
    return 'gamma';
  }

  // Web search tasks -> Perplexity (has live internet access)
  if (requiresWebSearch) {
    console.log(`[ModelSelector] Selected 'perplexity' for web search task`);
    return 'perplexity';
  }

  // Free tier -> Always use most cost-effective models
  if (userTier === 'free') {
    if (messageLength < 500 && !isCodeTask) {
      console.log(`[ModelSelector] Selected 'gpt-4o-mini' for free tier (short message)`);
      return 'gpt-4o-mini';
    }
    console.log(`[ModelSelector] Selected 'gemini-2.0-flash-exp' for free tier (free model)`);
    return 'gemini-2.0-flash-exp';
  }

  // Pro tier -> Balance cost and quality
  if (userTier === 'pro') {
    if (isCodeTask) {
      console.log(`[ModelSelector] Selected 'claude-sonnet-4' for pro tier (code task)`);
      return 'claude-sonnet-4'; // Claude excels at code
    }
    if (requiresReasoning && hasComplexContext) {
      console.log(`[ModelSelector] Selected 'gpt-4o' for pro tier (complex reasoning)`);
      return 'gpt-4o';
    }
    if (messageLength > 3000) {
      console.log(`[ModelSelector] Selected 'gemini-2.0-flash-exp' for pro tier (long context)`);
      return 'gemini-2.0-flash-exp'; // Good at long context
    }
    console.log(`[ModelSelector] Selected 'gpt-4o-mini' for pro tier (default)`);
    return 'gpt-4o-mini'; // Default for pro tier
  }

  // Business tier -> Quality over cost
  if (userTier === 'business') {
    if (isCodeTask) {
      console.log(`[ModelSelector] Selected 'claude-sonnet-4' for business tier (code task)`);
      return 'claude-sonnet-4';
    }
    if (requiresReasoning) {
      console.log(`[ModelSelector] Selected 'gpt-4o' for business tier (reasoning task)`);
      return 'gpt-4o';
    }
    if (context.hasTools) {
      console.log(`[ModelSelector] Selected 'gpt-4o' for business tier (tool use)`);
      return 'gpt-4o'; // OpenAI has excellent tool support
    }
    console.log(`[ModelSelector] Selected 'gpt-4o' for business tier (default)`);
    return 'gpt-4o';
  }

  // Enterprise tier -> Best models always
  if (userTier === 'enterprise') {
    if (isCodeTask) {
      console.log(`[ModelSelector] Selected 'claude-opus-4' for enterprise tier (code task)`);
      return 'claude-opus-4';
    }
    if (requiresReasoning) {
      console.log(`[ModelSelector] Selected 'claude-opus-4' for enterprise tier (reasoning task)`);
      return 'claude-opus-4';
    }
    if (context.hasTools) {
      console.log(`[ModelSelector] Selected 'claude-opus-4' for enterprise tier (tool use)`);
      return 'claude-opus-4';
    }
    console.log(`[ModelSelector] Selected 'claude-opus-4' for enterprise tier (default)`);
    return 'claude-opus-4';
  }

  // Fallback (should never reach here)
  console.log(`[ModelSelector] Fallback to 'gpt-4o-mini' (no tier matched)`);
  return 'gpt-4o-mini';
}

/**
 * Get fallback chain for a model
 * If primary model fails, try these in order
 */
export function getFallbackChain(primaryModel: AIModel): AIModel[] {
  const chains: Record<AIModel, AIModel[]> = {
    'claude-opus-4': ['claude-opus-4', 'claude-sonnet-4', 'gpt-4o', 'gpt-4o-mini'],
    'claude-sonnet-4': ['claude-sonnet-4', 'gpt-4o-mini', 'gemini-2.0-flash-exp'],
    'gpt-4o': ['gpt-4o', 'gpt-4o-mini', 'claude-sonnet-4', 'gemini-2.0-flash-exp'],
    'gpt-4o-mini': ['gpt-4o-mini', 'gemini-2.0-flash-exp', 'claude-sonnet-4'],
    'o1': ['o1', 'o1-mini', 'claude-opus-4', 'gpt-4o'], // Reasoning model chain
    'o1-mini': ['o1-mini', 'gpt-4o', 'claude-sonnet-4'], // Smaller reasoning chain
    'gemini-2.0-flash-exp': ['gemini-2.0-flash-exp', 'gpt-4o-mini', 'claude-sonnet-4'],
    'deepseek-chat': ['deepseek-chat', 'gpt-4o-mini', 'claude-sonnet-4'],
    'perplexity': ['perplexity', 'perplexity-fast', 'gpt-4o'], // Web search chain
    'perplexity-fast': ['perplexity-fast', 'perplexity', 'gpt-4o-mini'],
    'gamma': ['gamma'], // No fallback for specialized presentation tool
    'auto': ['gpt-4o-mini'], // Should never hit this (auto resolved earlier)
  };

  return chains[primaryModel] || [primaryModel, 'gpt-4o-mini'];
}

/**
 * Check if a model is available (has API key configured)
 */
export function isModelAvailable(model: AIModel): boolean {
  const keyMap: Record<string, string | undefined> = {
    'claude-opus-4': process.env.ANTHROPIC_API_KEY,
    'claude-sonnet-4': process.env.ANTHROPIC_API_KEY,
    'gpt-4o': process.env.OPENAI_API_KEY,
    'gpt-4o-mini': process.env.OPENAI_API_KEY,
    'o1': process.env.OPENAI_API_KEY,
    'o1-mini': process.env.OPENAI_API_KEY,
    'gemini-2.0-flash-exp': process.env.GOOGLE_AI_API_KEY,
    'deepseek-chat': process.env.DEEPSEEK_API_KEY,
    'perplexity': process.env.PERPLEXITY_API_KEY,
    'perplexity-fast': process.env.PERPLEXITY_API_KEY,
    'gamma': process.env.GAMMA_API_KEY,
  };

  return !!keyMap[model];
}

/**
 * Calculate cost for a completed request
 */
export function calculateCost(
  model: AIModel,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = MODEL_COSTS[model];
  const inputCost = (inputTokens / 1_000_000) * costs.inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * costs.outputCostPer1M;
  return inputCost + outputCost;
}

/**
 * Get the cheapest model that meets minimum quality requirements
 */
export function getCheapestModelForTask(
  taskType: 'code' | 'writing' | 'analysis' | 'general',
  minQuality: 'low' | 'medium' | 'high'
): AIModel {
  // Low quality = price is king
  if (minQuality === 'low') {
    return 'gemini-2.0-flash-exp'; // Free during preview
  }

  // Medium quality = balance
  if (minQuality === 'medium') {
    if (taskType === 'code') return 'claude-sonnet-4';
    return 'gpt-4o-mini';
  }

  // High quality = best models
  if (taskType === 'code') return 'claude-opus-4';
  return 'gpt-4o';
}

/**
 * Get model display information
 */
export function getModelInfo(model: AIModel): {
  name: string;
  provider: string;
  description: string;
  icon: string;
} {
  const modelInfo: Record<AIModel, any> = {
    'claude-opus-4': {
      name: 'Claude Opus 4',
      provider: 'Anthropic',
      description: 'Most capable model for complex reasoning and code',
      icon: '🧠',
    },
    'claude-sonnet-4': {
      name: 'Claude Sonnet 4',
      provider: 'Anthropic',
      description: 'Balanced model, excellent for code and analysis',
      icon: '⚡',
    },
    'gpt-4o': {
      name: 'GPT-4o',
      provider: 'OpenAI',
      description: 'Flagship multimodal model with strong tool use',
      icon: '🚀',
    },
    'gpt-4o-mini': {
      name: 'GPT-4o Mini',
      provider: 'OpenAI',
      description: 'Fast and cost-effective for most tasks',
      icon: '⚡',
    },
    'o1': {
      name: 'o1',
      provider: 'OpenAI',
      description: 'Advanced reasoning model for complex problems',
      icon: '🔬',
    },
    'o1-mini': {
      name: 'o1 Mini',
      provider: 'OpenAI',
      description: 'Faster reasoning model, great for STEM',
      icon: '🔬',
    },
    'gemini-2.0-flash-exp': {
      name: 'Gemini 2.0 Flash',
      provider: 'Google',
      description: 'Experimental model, free during preview',
      icon: '✨',
    },
    'deepseek-chat': {
      name: 'DeepSeek V3',
      provider: 'DeepSeek',
      description: 'Excellent for code and math, very cost-effective',
      icon: '🧠',
    },
    'perplexity': {
      name: 'Perplexity Sonar',
      provider: 'Perplexity',
      description: 'AI with live web search, always up-to-date',
      icon: '🌐',
    },
    'perplexity-fast': {
      name: 'Perplexity Fast',
      provider: 'Perplexity',
      description: 'Quick web search, lower cost',
      icon: '🌐',
    },
    'gamma': {
      name: 'Gamma',
      provider: 'Gamma',
      description: 'Specialized for presentation generation',
      icon: '📊',
    },
    'auto': {
      name: 'Auto-select',
      provider: 'Perpetual Core',
      description: 'Automatically choose the best model for your task',
      icon: '🎯',
    },
  };

  return modelInfo[model];
}
