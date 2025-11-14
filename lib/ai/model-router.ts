import { AIModel, ModelSelection } from "@/types";
import { AI_MODELS } from "./config";

type CandidateModel = Exclude<AIModel, "auto" | "gamma">;

interface ModelCapability {
  vision: boolean;
  longContext: number; // tokens
  reasoning: number; // 0-1
  coding: number; // 0-1
  creative: number; // 0-1
  analytical: number; // 0-1
  realtime: boolean;
  speed: number; // 0-1
  costWeight: number; // 0-1 (higher = more expensive)
}

interface TaskSignals {
  tokensEstimate: number;
  isCodeTask: boolean;
  isCreativeTask: boolean;
  needsVision: boolean;
  needsRealtime: boolean;
  needsDeepReasoning: boolean;
  needsAnalyticalPrecision: boolean;
  needsLongContext: boolean;
  preferFastResponse: boolean;
  attachmentsSummary?: string;
}

export interface AttachmentMeta {
  type: "image" | "document";
  mimeType?: string;
  size?: number;
}

export interface RoutingContext {
  attachments?: AttachmentMeta[];
  conversationTokens?: number;
  messageCount?: number;
  userTier?: "free" | "pro" | "business" | "enterprise";
  preferFastResponse?: boolean;
  preferPremium?: boolean;
}

const MODEL_CAPABILITIES: Record<CandidateModel, ModelCapability> = {
  "gpt-4o": {
    vision: true,
    longContext: 120_000,
    reasoning: 0.85,
    coding: 0.8,
    creative: 0.8,
    analytical: 0.85,
    realtime: true,
    speed: 0.7,
    costWeight: 0.65,
  },
  "gpt-4o-mini": {
    vision: false,
    longContext: 80_000,
    reasoning: 0.6,
    coding: 0.55,
    creative: 0.65,
    analytical: 0.6,
    realtime: false,
    speed: 0.85,
    costWeight: 0.15,
  },
  "claude-sonnet-4": {
    vision: false,
    longContext: 200_000,
    reasoning: 0.8,
    coding: 0.9,
    creative: 0.85,
    analytical: 0.8,
    realtime: false,
    speed: 0.75,
    costWeight: 0.35,
  },
  "claude-opus-4": {
    vision: false,
    longContext: 200_000,
    reasoning: 1,
    coding: 0.95,
    creative: 0.9,
    analytical: 0.95,
    realtime: false,
    speed: 0.55,
    costWeight: 1,
  },
  "gemini-2.0-flash-exp": {
    vision: true,
    longContext: 1_000_000,
    reasoning: 0.7,
    coding: 0.65,
    creative: 0.8,
    analytical: 0.7,
    realtime: false,
    speed: 0.8,
    costWeight: 0.2,
  },
};

const DEFAULT_MODEL_ORDER: CandidateModel[] = [
  "gpt-4o",
  "claude-opus-4",
  "claude-sonnet-4",
  "gemini-2.0-flash-exp",
  "gpt-4o-mini",
];

const CODE_REGEX = /\b(code|program|function|class|api|bug|debug|stacktrace|typescript|python|javascript|sql|regex|algorithm|unit test)\b/i;
const CREATIVE_REGEX = /\b(write|draft|compose|story|script|copy|creative|idea|tagline|narrative)\b/i;
const REALTIME_REGEX = /\b(latest|current|today|now|breaking|news|real-time|up-to-date|live)\b/i;
const ANALYTICAL_REGEX = /\b(calculate|math|equation|statistic|analyze|percent|table|chart|data|budget|forecast)\b/i;
const REASONING_REGEX = /\b(why|how|strategy|plan|evaluate|compare|assess|risk|architecture|roadmap)\b/i;

const LARGE_MESSAGE_TOKEN_THRESHOLD = 6_000;

function estimateTokens(text: string): number {
  // Quick heuristic: 4 chars ≈ 1 token
  return Math.ceil(text.length / 4);
}

function analyzeTask(userMessage: string, context: RoutingContext): TaskSignals {
  const lower = userMessage.toLowerCase();
  const conversationTokens = context.conversationTokens ?? 0;
  const messageTokens = estimateTokens(userMessage);
  const totalTokens = messageTokens + conversationTokens;

  const attachments = context.attachments ?? [];
  const hasImages = attachments.some((a) => a.type === "image");
  const documentBytes = attachments
    .filter((a) => a.type === "document")
    .reduce((sum, doc) => sum + (doc.size ?? 0), 0);
  const needsLongContext =
    totalTokens > LARGE_MESSAGE_TOKEN_THRESHOLD || documentBytes > 750_000;

  return {
    tokensEstimate: totalTokens,
    isCodeTask: CODE_REGEX.test(lower),
    isCreativeTask: CREATIVE_REGEX.test(lower),
    needsVision: hasImages,
    needsRealtime: REALTIME_REGEX.test(lower),
    needsDeepReasoning: lower.length > 900 || REASONING_REGEX.test(lower),
    needsAnalyticalPrecision: ANALYTICAL_REGEX.test(lower),
    needsLongContext,
    preferFastResponse:
      context.preferFastResponse ??
      (lower.length < 280 &&
        !REALTIME_REGEX.test(lower) &&
        !REASONING_REGEX.test(lower)),
    attachmentsSummary:
      attachments.length > 0
        ? `${attachments.length} attachment${attachments.length > 1 ? "s" : ""}`
        : undefined,
  };
}

function getAllowedModels(userTier: RoutingContext["userTier"]): CandidateModel[] {
  switch (userTier) {
    case "free":
      return ["gpt-4o-mini", "gemini-2.0-flash-exp"];
    case "pro":
      return ["gpt-4o", "claude-sonnet-4", "gemini-2.0-flash-exp", "gpt-4o-mini"];
    case "business":
    case "enterprise":
    default:
      return DEFAULT_MODEL_ORDER;
  }
}

function scoreModel(
  model: CandidateModel,
  signals: TaskSignals,
  context: RoutingContext
): { score: number; rationale: string[] } {
  const capability = MODEL_CAPABILITIES[model];
  let score = capability.speed * 6 - capability.costWeight * 5;
  const reasons: string[] = [];

  if (signals.needsVision) {
    if (capability.vision) {
      score += 25;
      reasons.push("Vision-ready for image analysis");
    } else {
      score -= 20;
    }
  }

  if (signals.needsRealtime) {
    if (capability.realtime) {
      score += 8;
      reasons.push("Real-time search capable");
    } else {
      score -= 4;
    }
  }

  if (signals.isCodeTask) {
    score += capability.coding * 12;
    if (capability.coding > 0.8) {
      reasons.push("Optimized for coding & debugging");
    }
  }

  if (signals.isCreativeTask) {
    score += capability.creative * 6;
    if (capability.creative > 0.75) {
      reasons.push("Great for creative writing");
    }
  }

  if (signals.needsAnalyticalPrecision) {
    score += capability.analytical * 10;
    if (capability.analytical > 0.8) {
      reasons.push("Strong analytical/mathematical accuracy");
    }
  }

  if (signals.needsDeepReasoning) {
    score += capability.reasoning * 15;
    if (capability.reasoning > 0.85) {
      reasons.push("Highest reasoning depth");
    }
  }

  if (signals.needsLongContext) {
    if (capability.longContext >= signals.tokensEstimate + 1_000) {
      score += 18;
      reasons.push("Can handle the long context safely");
    } else {
      score -= 35;
    }
  }

  if (signals.preferFastResponse) {
    score += capability.speed * 8;
    if (capability.speed > 0.8) {
      reasons.push("Optimized for fast responses");
    }
  }

  if (context.preferPremium) {
    score += capability.costWeight > 0.5 ? 4 : -2;
  }

  return { score, rationale: reasons };
}

export function selectBestModel(
  userMessage: string,
  context: RoutingContext = {}
): ModelSelection {
  const signals = analyzeTask(userMessage, context);
  const allowedModels = getAllowedModels(context.userTier);

  let bestModel: CandidateModel = allowedModels[0];
  let bestScore = -Infinity;
  let bestReasons: string[] = [];

  for (const model of allowedModels) {
    const { score, rationale } = scoreModel(model, signals, context);
    if (score > bestScore) {
      bestScore = score;
      bestModel = model;
      bestReasons = rationale;
    }
  }

  const info = AI_MODELS[bestModel];
  const reason =
    bestReasons.slice(0, 3).join(" • ") ||
    `Balanced quality, speed, and cost for this request${
      signals.attachmentsSummary ? ` (${signals.attachmentsSummary})` : ""
    }`;

  return {
    model: bestModel,
    reason,
    provider: info.provider,
    displayName: info.name,
    icon: info.icon,
  };
}

// Helper to check if using auto mode
export function isAutoMode(selectedModel: string): boolean {
  return selectedModel === "auto";
}
