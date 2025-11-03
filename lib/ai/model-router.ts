import { ModelSelection } from "@/types";
import { AI_MODELS } from "./config";

/**
 * Advanced Cost-Aware Model Router
 * Intelligently selects the best model based on task complexity and cost optimization
 *
 * Strategy:
 * - Use ultra-cheap models (DeepSeek, GPT-4o Mini, Haiku) for 80% of tasks
 * - Reserve premium models (Opus, GPT-4o) for tasks requiring their unique capabilities
 * - Balance quality vs cost for maximum value
 */
export function selectBestModel(userMessage: string): ModelSelection {
  const msg = userMessage.toLowerCase();
  const messageLength = userMessage.length;

  // ========================================
  // TIER 1: Premium Models (Use Sparingly)
  // ========================================

  // Mission-critical reasoning: Claude Opus ($0.015/1k)
  // Only use for extremely complex tasks that justify the cost
  if (msg.match(/critical|mission-critical|life-or-death|legal advice|medical diagnosis|financial decision/i) ||
      msg.match(/^(?=.*complex)(?=.*(?:analysis|reasoning|problem)).*$/i)) {
    return {
      model: "claude-opus-4",
      reason: "Premium reasoning for critical tasks",
      provider: "anthropic",
      displayName: AI_MODELS["claude-opus-4"].name,
      icon: AI_MODELS["claude-opus-4"].icon,
    };
  }

  // Vision tasks: GPT-4o ($0.005/1k)
  if (msg.match(/image|picture|photo|screenshot|visual|diagram|chart|graph/i) &&
      msg.match(/analyze|describe|explain|what.*see|identify/i)) {
    return {
      model: "gpt-4o",
      reason: "Vision capabilities for image analysis",
      provider: "openai",
      displayName: AI_MODELS["gpt-4o"].name,
      icon: AI_MODELS["gpt-4o"].icon,
    };
  }

  // Real-time web search: GPT-4o ($0.005/1k)
  if (msg.match(/latest|current|today|now|recent|breaking|news|what'?s happening|live|real-time/i)) {
    return {
      model: "gpt-4o",
      reason: "Web search for real-time information",
      provider: "openai",
      displayName: AI_MODELS["gpt-4o"].name,
      icon: AI_MODELS["gpt-4o"].icon,
    };
  }

  // ========================================
  // TIER 2: Specialized Models
  // ========================================

  // Massive context: Gemini 2.0 Flash ($0.00125/1k)
  if (msg.match(/analyze.*(?:document|file|text)|summarize.*(?:long|entire|whole)|review.*(?:all|entire|full)/i) ||
      messageLength > 15000) {
    return {
      model: "gemini-2.0-flash-exp",
      reason: "1M token context for large documents",
      provider: "google",
      displayName: AI_MODELS["gemini-2.0-flash-exp"].name,
      icon: AI_MODELS["gemini-2.0-flash-exp"].icon,
    };
  }

  // ========================================
  // TIER 3: Ultra-Cheap Models (Default)
  // ========================================

  // Complex coding: DeepSeek V3 ($0.00014/1k)
  // DeepSeek V3 excels at code generation and is 93% cheaper than GPT-4o Mini
  if (msg.match(/code|program|script|function|class|debug|error|bug|syntax|implement|refactor|algorithm/i) ||
      msg.match(/python|javascript|typescript|java|c\+\+|rust|go|sql|react|node/i)) {
    return {
      model: "deepseek-chat",
      reason: "Exceptional coding at 93% cost savings",
      provider: "deepseek",
      displayName: AI_MODELS["deepseek-chat"].name,
      icon: AI_MODELS["deepseek-chat"].icon,
    };
  }

  // Writing, brainstorming, creative tasks: Claude Haiku ($0.00025/1k)
  // Haiku is great for creative writing and fast responses
  if (msg.match(/write|draft|compose|create|brainstorm|ideas|creative|story|email|letter/i) ||
      msg.match(/help me (?:write|draft|compose)/i)) {
    return {
      model: "claude-sonnet-4",
      reason: "Fast, creative responses",
      provider: "anthropic",
      displayName: AI_MODELS["claude-sonnet-4"].name,
      icon: AI_MODELS["claude-sonnet-4"].icon,
    };
  }

  // Math, calculations, data analysis: DeepSeek V3 ($0.00014/1k)
  // DeepSeek is excellent at mathematical reasoning
  if (msg.match(/calculate|compute|math|equation|formula|statistics|data analysis|numbers/i)) {
    return {
      model: "deepseek-chat",
      reason: "Strong mathematical reasoning",
      provider: "deepseek",
      displayName: AI_MODELS["deepseek-chat"].name,
      icon: AI_MODELS["deepseek-chat"].icon,
    };
  }

  // Longer messages (>500 chars): Use Haiku for speed
  if (messageLength > 500) {
    return {
      model: "claude-sonnet-4",
      reason: "Fast processing for longer queries",
      provider: "anthropic",
      displayName: AI_MODELS["claude-sonnet-4"].name,
      icon: AI_MODELS["claude-sonnet-4"].icon,
    };
  }

  // ========================================
  // DEFAULT: DeepSeek V3 ($0.00014/1k)
  // ========================================
  // For general questions, conversations, and simple tasks
  // DeepSeek V3 offers GPT-4 class quality at 1/35th the cost
  return {
    model: "deepseek-chat",
    reason: "Best value for general tasks",
    provider: "deepseek",
    displayName: AI_MODELS["deepseek-chat"].name,
    icon: AI_MODELS["deepseek-chat"].icon,
  };
}

// Helper to check if using auto mode
export function isAutoMode(selectedModel: string): boolean {
  return selectedModel === "auto";
}
