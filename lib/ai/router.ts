import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIModel } from "@/types";
import { Tool } from "./tools/schema";
import { formatToolsForOpenAI, formatToolsForClaude } from "./tools/registry";
import {
  selectBestModel,
  getFallbackChain,
  isModelAvailable,
  calculateCost,
  UserTier,
  ModelSelectionContext,
} from "./model-selector";

// Lazy initialization to avoid build-time errors
let anthropic: Anthropic | null = null;
function getAnthropic() {
  if (!anthropic && process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

let openai: OpenAI | null = null;
function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

let googleAI: GoogleGenerativeAI | null = null;
function getGoogleAI() {
  if (!googleAI && process.env.GOOGLE_AI_API_KEY) {
    googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  }
  return googleAI;
}


export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface UsageMetadata {
  inputTokens: number;
  outputTokens: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string; // JSON string
}

export interface StreamChunk {
  content: string;
  done: boolean;
  usage?: UsageMetadata;
  tool_calls?: ToolCall[];
}

/**
 * Stream chat completion with intelligent model selection and automatic fallback
 * This is the main entry point for all AI requests
 */
export async function* streamChatCompletion(
  model: AIModel,
  messages: ChatMessage[],
  tools?: Tool[],
  userTier: UserTier = 'free',
  context?: ModelSelectionContext
): AsyncGenerator<StreamChunk> {
  // Resolve 'auto' to best model for this request
  let selectedModel = model;
  if (model === "auto") {
    selectedModel = selectBestModel(messages, userTier, {
      ...context,
      hasTools: !!tools,
    });
    console.log(`[Router] Auto-selected model: ${selectedModel} (tier: ${userTier})`);
  }

  // Get fallback chain for reliability
  const fallbackChain = getFallbackChain(selectedModel);
  console.log(`[Router] Fallback chain:`, fallbackChain);

  // Try each model in the fallback chain
  for (let i = 0; i < fallbackChain.length; i++) {
    const attemptModel = fallbackChain[i];

    try {
      console.log(`[Router] Attempting model: ${attemptModel} (attempt ${i + 1}/${fallbackChain.length})`);

      // Check if model is available (has API key)
      if (!isModelAvailable(attemptModel)) {
        console.warn(`[Router] ${attemptModel} not available (missing API key), trying next...`);
        continue;
      }

      // Try to stream from this model
      yield* streamFromModel(attemptModel, messages, tools);

      // Success! Log and return
      console.log(`[Router] ✅ Successfully streamed from ${attemptModel}`);
      return;

    } catch (error: any) {
      console.error(`[Router] ❌ ${attemptModel} failed:`, error.message);

      // If this was the last model in the chain, throw the error
      if (i === fallbackChain.length - 1) {
        throw new Error(`All models in fallback chain failed. Last error: ${error.message}`);
      }

      // Otherwise, log and continue to next fallback
      console.log(`[Router] 🔄 Falling back to next model...`);
    }
  }

  // Should never reach here, but just in case
  throw new Error('Failed to stream from any model in fallback chain');
}

/**
 * Internal function to route to the correct model implementation
 */
async function* streamFromModel(
  model: AIModel,
  messages: ChatMessage[],
  tools?: Tool[]
): AsyncGenerator<StreamChunk> {
  if (model === "claude-opus-4" || model === "claude-sonnet-4") {
    yield* streamClaude(messages, model, tools);
  } else if (model === "gpt-4o" || model === "gpt-4o-mini") {
    yield* streamOpenAI(messages, model, tools);
  } else if (model === "gemini-2.0-flash-exp") {
    yield* streamGemini(messages);
  } else if (model === "gamma") {
    yield* streamGamma(messages);
  } else {
    throw new Error(`Unsupported model: ${model}`);
  }
}

async function* streamClaude(
  messages: ChatMessage[],
  model: AIModel,
  tools?: Tool[]
): AsyncGenerator<StreamChunk> {
  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  // Map our model IDs to Anthropic's API model names
  const anthropicModel = model === "claude-opus-4"
    ? "claude-opus-4-20250514"
    : model === "claude-sonnet-4"
    ? "claude-sonnet-3-5-20241022" // Actual Sonnet 3.5
    : "claude-3-haiku-20240307"; // Default to Haiku

  const client = getAnthropic();
  if (!client) {
    throw new Error("Anthropic client not initialized");
  }

  const stream = await client.messages.stream({
    model: anthropicModel,
    max_tokens: 8192,
    system: systemMessage?.content,
    messages: conversationMessages as any,
    tools: tools ? formatToolsForClaude(tools) : undefined,
  });

  let usage: UsageMetadata | undefined;
  let toolCalls: ToolCall[] = [];

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      yield {
        content: chunk.delta.text,
        done: false,
      };
    } else if (
      chunk.type === "content_block_start" &&
      (chunk.content_block as any).type === "tool_use"
    ) {
      // Claude signals tool use at block start
      const toolUse = chunk.content_block as any;
      toolCalls.push({
        id: toolUse.id,
        name: toolUse.name,
        arguments: JSON.stringify(toolUse.input || {}),
      });
    } else if (chunk.type === "message_start") {
      // Extract usage from message_start event
      const message = chunk.message as any;
      if (message.usage) {
        usage = {
          inputTokens: message.usage.input_tokens || 0,
          outputTokens: message.usage.output_tokens || 0,
        };
      }
    } else if (chunk.type === "message_delta") {
      // Update usage from message_delta event (for output tokens)
      const delta = chunk as any;
      if (delta.usage) {
        if (!usage) usage = { inputTokens: 0, outputTokens: 0 };
        usage.outputTokens = delta.usage.output_tokens || usage.outputTokens;
      }
    }
  }

  // Yield tool calls if any
  if (toolCalls.length > 0) {
    yield { content: "", done: false, tool_calls: toolCalls };
  }

  yield { content: "", done: true, usage };
}

async function* streamOpenAI(
  messages: ChatMessage[],
  model: string,
  tools?: Tool[]
): AsyncGenerator<StreamChunk> {
  const client = getOpenAI();
  if (!client) {
    throw new Error("OpenAI client not initialized");
  }

  const stream = await client.chat.completions.create({
    model: model,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    tools: tools ? formatToolsForOpenAI(tools) : undefined,
    stream: true,
    stream_options: { include_usage: true },
  });

  let usage: UsageMetadata | undefined;
  let accumulatedToolCalls: Map<number, ToolCall> = new Map();

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      yield {
        content,
        done: false,
      };
    }

    // Handle tool calls - OpenAI streams them incrementally
    const deltaToolCalls = chunk.choices[0]?.delta?.tool_calls;
    if (deltaToolCalls) {
      for (const toolCall of deltaToolCalls) {
        const index = toolCall.index;
        const existing = accumulatedToolCalls.get(index);

        if (!existing) {
          // New tool call
          accumulatedToolCalls.set(index, {
            id: toolCall.id || "",
            name: toolCall.function?.name || "",
            arguments: toolCall.function?.arguments || "",
          });
        } else {
          // Append to existing tool call
          if (toolCall.function?.arguments) {
            existing.arguments += toolCall.function.arguments;
          }
        }
      }
    }

    // OpenAI includes usage in the final chunk
    if (chunk.usage) {
      usage = {
        inputTokens: chunk.usage.prompt_tokens || 0,
        outputTokens: chunk.usage.completion_tokens || 0,
      };
    }
  }

  // Yield accumulated tool calls if any
  if (accumulatedToolCalls.size > 0) {
    const toolCalls = Array.from(accumulatedToolCalls.values());
    yield { content: "", done: false, tool_calls: toolCalls };
  }

  yield { content: "", done: true, usage };
}


async function* streamGemini(
  messages: ChatMessage[]
): AsyncGenerator<StreamChunk> {
  const client = getGoogleAI();
  if (!client) {
    throw new Error("Google AI client not initialized");
  }

  const model = client.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages.filter((m) => m.role !== "system");

  // Build conversation history
  const history = conversationMessages.slice(0, -1).map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const lastMessage = conversationMessages[conversationMessages.length - 1];

  const chat = model.startChat({
    history,
    generationConfig: {
      maxOutputTokens: 8192,
    },
  });

  const result = await chat.sendMessageStream(lastMessage.content);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield {
        content: text,
        done: false,
      };
    }
  }

  // Get final response with usage metadata
  const finalResponse = await result.response;
  const usageMetadata = finalResponse.usageMetadata;

  const usage: UsageMetadata | undefined = usageMetadata
    ? {
        inputTokens: usageMetadata.promptTokenCount || 0,
        outputTokens: usageMetadata.candidatesTokenCount || 0,
      }
    : undefined;

  yield { content: "", done: true, usage };
}

async function* streamGamma(
  messages: ChatMessage[]
): AsyncGenerator<StreamChunk> {
  // Gamma AI integration - for presentations
  const userMessage = messages[messages.length - 1].content;

  try {
    const response = await fetch("https://api.gamma.app/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GAMMA_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: userMessage,
        type: "presentation",
      }),
    });

    if (!response.ok) {
      throw new Error(`Gamma API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Stream the response
    const text = data.content || "I've created a presentation based on your request. You can view it at the link provided.";

    for (let i = 0; i < text.length; i += 10) {
      yield {
        content: text.slice(i, i + 10),
        done: false,
      };
      // Small delay to simulate streaming
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  } catch (error) {
    console.error("Gamma API error:", error);
    yield {
      content: "I'm sorry, I encountered an error with Gamma AI. This feature is being set up. For now, try using another model for your request.",
      done: false,
    };
  }

  yield { content: "", done: true };
}

// Non-streaming version for simpler use cases
export async function getChatCompletion(
  model: AIModel,
  messages: ChatMessage[],
  userTier: UserTier = 'free'
): Promise<{ response: string; cost: number; usage: UsageMetadata }> {
  let fullResponse = "";
  let finalUsage: UsageMetadata = { inputTokens: 0, outputTokens: 0 };
  let actualModel: AIModel = model;

  for await (const chunk of streamChatCompletion(model, messages, undefined, userTier)) {
    if (!chunk.done) {
      fullResponse += chunk.content;
    } else if (chunk.usage) {
      finalUsage = chunk.usage;
    }
  }

  // Calculate cost (will be 0 for free models)
  const cost = calculateCost(actualModel, finalUsage.inputTokens, finalUsage.outputTokens);

  console.log(`[Router] Request completed. Tokens: ${finalUsage.inputTokens + finalUsage.outputTokens}, Cost: $${cost.toFixed(4)}`);

  return {
    response: fullResponse,
    cost,
    usage: finalUsage,
  };
}

// Export the cost calculator for external use
export { calculateCost } from "./model-selector";
