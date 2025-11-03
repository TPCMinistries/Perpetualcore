import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIModel } from "@/types";
import { Tool } from "./tools/schema";
import { formatToolsForOpenAI, formatToolsForClaude } from "./tools/registry";

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

let deepseek: OpenAI | null = null;
function getDeepSeek() {
  if (!deepseek && process.env.DEEPSEEK_API_KEY) {
    deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
    });
  }
  return deepseek;
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

export async function* streamChatCompletion(
  model: AIModel,
  messages: ChatMessage[],
  tools?: Tool[]
): AsyncGenerator<StreamChunk> {
  // Skip auto - it should be resolved before this
  if (model === "auto") {
    model = "claude-sonnet-4";
  }

  if (model === "claude-opus-4" || model === "claude-sonnet-4") {
    yield* streamClaude(messages, model, tools);
  } else if (model === "gpt-4o" || model === "gpt-4o-mini") {
    yield* streamOpenAI(messages, model, tools);
  } else if (model === "deepseek-chat") {
    yield* streamDeepSeek(messages, tools);
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
    ? "claude-3-haiku-20240307" // Using Haiku for sonnet-4 due to tier restrictions
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

async function* streamDeepSeek(
  messages: ChatMessage[],
  tools?: Tool[]
): AsyncGenerator<StreamChunk> {
  const client = getDeepSeek();
  if (!client) {
    throw new Error("DeepSeek client not initialized");
  }

  const stream = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    tools: tools ? formatToolsForOpenAI(tools) : undefined,
    stream: true,
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

    // Handle tool calls - DeepSeek uses OpenAI format
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

    // DeepSeek includes usage in the final chunk (if available)
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
  messages: ChatMessage[]
): Promise<string> {
  let fullResponse = "";

  for await (const chunk of streamChatCompletion(model, messages)) {
    if (!chunk.done) {
      fullResponse += chunk.content;
    }
  }

  return fullResponse;
}
