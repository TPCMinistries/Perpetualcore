import { AIModel, AIModelConfig } from "@/types";

export const AI_MODELS: Record<AIModel, AIModelConfig> = {
  "auto": {
    id: "auto",
    name: "Auto (Recommended)",
    provider: "anthropic",
    costPer1kTokens: 0,
    maxTokens: 0,
    icon: "🤖",
  },
  "claude-opus-4": {
    id: "claude-opus-4",
    name: "Claude 3.5 Opus",
    provider: "anthropic",
    costPer1kTokens: 0.015,
    maxTokens: 200000,
    icon: "👑",
  },
  "claude-sonnet-4": {
    id: "claude-sonnet-4",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    costPer1kTokens: 0.003,
    maxTokens: 200000,
    icon: "🎼",
  },
  "gpt-4o": {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    costPer1kTokens: 0.005,
    maxTokens: 128000,
    icon: "⚡",
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    costPer1kTokens: 0.00015,
    maxTokens: 128000,
    icon: "💨",
  },
  "gemini-2.0-flash-exp": {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    provider: "google",
    costPer1kTokens: 0.00125,
    maxTokens: 1000000,
    icon: "✨",
  },
  "gamma": {
    id: "gamma",
    name: "Gamma AI",
    provider: "gamma",
    costPer1kTokens: 0.002,
    maxTokens: 32000,
    icon: "📊",
  },
};

export const DEFAULT_MODEL: AIModel = "gpt-4o-mini";
