import { NextRequest, NextResponse } from "next/server";
import { withApiAuth, APIContext } from "@/lib/api";
import { streamChatCompletion, ChatMessage } from "@/lib/ai/router";
import { selectBestModel, isAutoMode } from "@/lib/ai/model-router";
import { AI_MODELS } from "@/lib/ai/config";
import { calculateCost } from "@/lib/ai/cost-calculator";
import { searchDocuments, buildRAGContext, shouldUseRAG } from "@/lib/documents/rag";
import { webhookEvents } from "@/lib/webhooks";
import { AIModel } from "@/types";
import { checkAIUsage, trackAIUsageAfterResponse } from "@/lib/billing/usage-guard";
import { trackAPICall } from "@/lib/billing/metering";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public API v1 - Chat
 * POST /api/v1/chat
 *
 * Request body:
 * {
 *   "messages": [{ "role": "user", "content": "Hello" }],
 *   "model": "auto" | "gpt-4o" | "claude-sonnet-4" | ...
 *   "stream": false,
 *   "use_rag": true,
 *   "conversation_id": "optional-uuid"
 * }
 */
async function handleChat(req: NextRequest, context: APIContext): Promise<Response> {
  try {
    const body = await req.json();

    // Support both n8n simple format and standard format
    // n8n format: { message: "string", conversationId?: "uuid", userId?: "uuid" }
    // Standard format: { messages: [...], model?: "string", stream?: false, ... }
    let messages: ChatMessage[];
    let requestedModel = body.model || "auto";
    let stream = body.stream ?? false;
    let use_rag = body.use_rag ?? true;
    let conversation_id = body.conversation_id || body.conversationId;
    const isSimpleFormat = typeof body.message === "string";

    if (isSimpleFormat) {
      // n8n simple format - convert to messages array
      messages = [{ role: "user", content: body.message }];
    } else {
      // Standard format
      messages = body.messages;
    }

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array or message string is required" },
        { status: 400 }
      );
    }

    // Get user message
    const userMessage = messages[messages.length - 1]?.content || "";

    // Determine model
    let modelSelection;
    if (isAutoMode(requestedModel)) {
      modelSelection = selectBestModel(userMessage);
    } else if (AI_MODELS[requestedModel as AIModel]) {
      const modelInfo = AI_MODELS[requestedModel as AIModel];
      modelSelection = {
        model: requestedModel,
        provider: modelInfo.provider,
        reason: "API specified",
        displayName: modelInfo.name,
        icon: modelInfo.icon,
      };
    } else {
      return NextResponse.json(
        { error: `Invalid model: ${requestedModel}` },
        { status: 400 }
      );
    }

    const model = modelSelection.model as AIModel;

    // Track API call for metering
    trackAPICall(context.organizationId).catch(() => {});

    // Check usage limits (model access + premium quota)
    const usageCheck = await checkAIUsage(context.organizationId, model);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: "Usage limit reached",
          code: usageCheck.code,
          message: usageCheck.reason,
          current_plan: usageCheck.currentPlan,
          upgrade: usageCheck.upgrade,
        },
        { status: 429 }
      );
    }

    // Build system prompt
    let systemPrompt = `You are a helpful AI assistant. Be accurate, helpful, and concise.`;

    // Optional RAG integration
    let relevantDocs: any[] = [];
    if (use_rag && shouldUseRAG(userMessage)) {
      try {
        relevantDocs = await searchDocuments(
          userMessage,
          context.organizationId,
          context.userId,
          5,
          0.4
        );

        if (relevantDocs.length > 0) {
          const ragContext = buildRAGContext(relevantDocs);
          systemPrompt = ragContext + "\n\n" + systemPrompt;
        }
      } catch (err) {
        // RAG failure is non-fatal
        console.error("[API v1] RAG error:", err);
      }
    }

    // Prepare messages with system prompt
    const messagesWithSystem: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    if (stream) {
      // Streaming response
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          let fullResponse = "";
          let usage = { inputTokens: 0, outputTokens: 0 };

          try {
            // Send model info
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "model",
                  model: modelSelection.model,
                  model_name: modelSelection.displayName,
                  reason: modelSelection.reason,
                })}\n\n`
              )
            );

            // Stream content
            for await (const chunk of streamChatCompletion(model, messagesWithSystem)) {
              if (chunk.done) {
                usage = chunk.usage || usage;
                break;
              }

              if (chunk.content) {
                fullResponse += chunk.content;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "content",
                      content: chunk.content,
                    })}\n\n`
                  )
                );
              }
            }

            // Calculate cost
            const cost = calculateCost(model, usage.inputTokens, usage.outputTokens);

            // Send done event
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "done",
                  usage: {
                    input_tokens: usage.inputTokens,
                    output_tokens: usage.outputTokens,
                    total_tokens: cost.totalTokens,
                    cost_usd: cost.totalCost,
                  },
                  rag_documents: relevantDocs.length,
                })}\n\n`
              )
            );

            // Track usage against plan limits
            trackAIUsageAfterResponse(
              context.organizationId,
              model,
              usage.inputTokens,
              usage.outputTokens
            ).catch(() => {});

            // Dispatch webhook
            webhookEvents.chatMessageCreated(context.organizationId, {
              conversationId: conversation_id || "api-direct",
              messageId: context.requestId,
              content: fullResponse.substring(0, 500),
              role: "assistant",
            }).catch(() => {});
          } catch (error) {
            console.error("[API v1] Stream error:", error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  error: "Streaming error",
                })}\n\n`
              )
            );
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Request-ID": context.requestId,
        },
      });
    } else {
      // Non-streaming response
      let fullResponse = "";
      let usage = { inputTokens: 0, outputTokens: 0 };

      for await (const chunk of streamChatCompletion(model, messagesWithSystem)) {
        if (chunk.done) {
          usage = chunk.usage || usage;
          break;
        }
        if (chunk.content) {
          fullResponse += chunk.content;
        }
      }

      // Calculate cost
      const cost = calculateCost(model, usage.inputTokens, usage.outputTokens);

      // Track usage against plan limits
      trackAIUsageAfterResponse(
        context.organizationId,
        model,
        usage.inputTokens,
        usage.outputTokens
      ).catch(() => {});

      // Dispatch webhook
      webhookEvents.chatMessageCreated(context.organizationId, {
        conversationId: conversation_id || "api-direct",
        messageId: context.requestId,
        content: fullResponse.substring(0, 500),
        role: "assistant",
      }).catch(() => {});

      // Return n8n-compatible format when simple format was used
      if (isSimpleFormat) {
        return NextResponse.json(
          {
            response: fullResponse,
            conversationId: conversation_id || context.requestId,
          },
          {
            headers: {
              "X-Request-ID": context.requestId,
            },
          }
        );
      }

      // Standard format response
      return NextResponse.json(
        {
          id: context.requestId,
          model: modelSelection.model,
          model_name: modelSelection.displayName,
          content: fullResponse,
          usage: {
            input_tokens: usage.inputTokens,
            output_tokens: usage.outputTokens,
            total_tokens: cost.totalTokens,
            cost_usd: cost.totalCost,
          },
          rag: {
            enabled: use_rag,
            documents_used: relevantDocs.length,
          },
        },
        {
          headers: {
            "X-Request-ID": context.requestId,
          },
        }
      );
    }
  } catch (error: any) {
    console.error("[API v1] Chat error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error?.message || "Unknown error",
        request_id: context.requestId,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return withApiAuth(req, handleChat, {
    requiredScopes: ["chat:write"],
  });
}
