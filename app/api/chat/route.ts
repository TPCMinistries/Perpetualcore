import { createClient } from "@/lib/supabase/server";
import { streamChatCompletion, ChatMessage, UsageMetadata, ToolCall } from "@/lib/ai/router";
import { AIModel } from "@/types";
import { NextRequest } from "next/server";
import { selectBestModel, isAutoMode } from "@/lib/ai/model-router";
import { AI_MODELS } from "@/lib/ai/config";
import { searchDocuments, buildRAGContext, shouldUseRAG } from "@/lib/documents/rag";
import { calculateCost } from "@/lib/ai/cost-calculator";
import { AVAILABLE_TOOLS, executeToolCall } from "@/lib/ai/tools/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Build optimized, model-specific system prompts
 * Different models perform better with different prompting strategies
 */
function buildOptimizedSystemPrompt(model: AIModel, userMessage: string): string {
  const msg = userMessage.toLowerCase();
  const isComplexTask = msg.length > 500 ||
    msg.match(/analyze|research|complex|detailed|explain|compare|comprehensive/i);
  const isCodeTask = msg.match(/code|program|function|debug|implement/i);

  // Base capabilities all models have
  const basePrompt = `You are an advanced AI assistant with persistent memory and intelligent capabilities.

CORE CAPABILITIES:
• Persistent Memory: You remember all past conversations in this chat
• Conversation Search: You can search through ALL previous conversations across different chats using the search_conversations tool
• Document Access: You can reference uploaded documents when relevant
• Context Awareness: You maintain full context across the conversation
• Tool Usage: You can create tasks, search the web, query documents, and search conversation history when needed

IMPORTANT - INFINITE MEMORY FEATURE:
When a user asks about previous conversations (e.g., "what did we discuss about X?", "my last conversation about Y", "earlier we talked about Z"), you MUST use the search_conversations tool to find relevant past discussions. This is a core feature that differentiates you from other AI assistants.

RESPONSE QUALITY STANDARDS:
• Be accurate, thorough, and helpful
• Cite sources when referencing documents, web search results, or previous conversations
• Ask clarifying questions if the request is ambiguous
• Structure complex information clearly with headings, lists, and examples
• Admit uncertainty rather than guess`;

  // Model-specific optimizations
  if (model === "claude-opus-4") {
    // Claude Opus: Best for deep reasoning and analysis
    return `${basePrompt}

ADVANCED REASONING MODE:
You are Claude Opus, optimized for complex reasoning and critical thinking.
${isComplexTask ? `
For this complex task:
1. Break down the problem into components
2. Consider multiple perspectives and approaches
3. Show your reasoning process step-by-step
4. Provide comprehensive analysis with nuanced insights
5. Highlight assumptions, limitations, and edge cases` : ''}

Excellence is expected. Provide thorough, well-reasoned responses that demonstrate deep understanding.`;
  }

  if (model === "claude-sonnet-4") {
    // Claude Haiku: Fast and creative
    return `${basePrompt}

PERFORMANCE MODE:
You are Claude Haiku, optimized for speed and creativity while maintaining high quality.
• Provide clear, concise responses
• Use creative problem-solving approaches
• Balance thoroughness with efficiency
• Maintain conversational and helpful tone`;
  }

  if (model === "deepseek-chat") {
    // DeepSeek V3: Exceptional at code and math
    if (isCodeTask) {
      return `${basePrompt}

CODE EXCELLENCE MODE:
You are DeepSeek V3, specialized in code generation and technical problem-solving.
• Write clean, well-documented, production-ready code
• Follow best practices and design patterns
• Include error handling and edge cases
• Explain your implementation choices
• Provide examples and usage instructions
• Consider performance, security, and maintainability`;
    }

    return `${basePrompt}

ANALYTICAL MODE:
You are DeepSeek V3, optimized for logical reasoning and precise analysis.
• Approach problems methodically
• Provide accurate calculations and data analysis
• Use step-by-step reasoning for complex problems
• Be precise with technical details`;
  }

  if (model === "gpt-4o") {
    // GPT-4o: Vision, web search, real-time info
    return `${basePrompt}

MULTIMODAL & REAL-TIME MODE:
You are GPT-4o with advanced capabilities:
• Vision: Analyze images, screenshots, diagrams, and charts in detail
• Web Search: Access real-time information and current events
• Comprehensive Knowledge: Draw from broad, up-to-date information

When analyzing images:
1. Describe what you see in detail
2. Identify key elements, text, and patterns
3. Provide actionable insights based on visual content

When providing current information:
• Cite your sources
• Indicate the recency of information
• Distinguish between facts and analysis`;
  }

  if (model === "gemini-2.0-flash-exp") {
    // Gemini: Massive context window
    return `${basePrompt}

LONG-CONTEXT MODE:
You are Gemini 2.0 Flash with a massive 1M token context window.
• Process and analyze extremely large documents
• Maintain coherence across extensive conversations
• Synthesize information from multiple sources
• Provide comprehensive summaries and insights

When working with large documents:
1. Identify key themes and patterns across the entire content
2. Provide structured summaries with main points
3. Reference specific sections when making claims
4. Highlight connections and relationships in the material`;
  }

  // Default for GPT-4o Mini and others
  return `${basePrompt}

EFFICIENCY MODE:
Provide high-quality responses efficiently.
• Be clear and concise
• Focus on what matters most
• Provide practical, actionable information
• Maintain accuracy and helpfulness`;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
      return new Response("Profile not found", { status: 400 });
    }

    // Allow personal chat without organization
    // If no org, we'll use user_id as org_id for RAG search
    const organizationId = profile?.organization_id || user.id;

    const {
      messages,
      model: selectedModel,
      conversationId,
      attachments,
    }: {
      messages: ChatMessage[];
      model: AIModel;
      conversationId?: string;
      attachments?: Array<{
        name: string;
        type: "image" | "document";
        data: string;
        mimeType: string;
      }>;
    } = await req.json();

    // Determine which model to use
    const userMessage = messages[messages.length - 1].content;
    let modelSelection;

    // Auto-select model based on attachments if present
    if (attachments && attachments.length > 0) {
      const hasImages = attachments.some((a) => a.type === "image");
      const hasLargeDoc = attachments.some(
        (a) => a.type === "document" && a.data.length > 100000
      );

      if (hasImages && isAutoMode(selectedModel)) {
        // Images -> GPT-4o (vision capable)
        modelSelection = {
          model: "gpt-4o",
          provider: "openai",
          reason: "Image analysis with vision",
          displayName: AI_MODELS["gpt-4o"].name,
          icon: AI_MODELS["gpt-4o"].icon,
        };
      } else if (hasLargeDoc && isAutoMode(selectedModel)) {
        // Large documents -> Gemini (massive context)
        modelSelection = {
          model: "gemini-2.0-flash-exp",
          provider: "google",
          reason: "Large document processing",
          displayName: AI_MODELS["gemini-2.0-flash-exp"].name,
          icon: AI_MODELS["gemini-2.0-flash-exp"].icon,
        };
      } else if (isAutoMode(selectedModel)) {
        modelSelection = selectBestModel(userMessage);
      } else {
        const modelInfo = AI_MODELS[selectedModel];
        modelSelection = {
          model: selectedModel,
          provider: modelInfo.provider,
          reason: "Manually selected",
          displayName: modelInfo.name,
          icon: modelInfo.icon,
        };
      }
    } else if (isAutoMode(selectedModel)) {
      // Auto-select best model
      modelSelection = selectBestModel(userMessage);
    } else {
      // User manually selected a model
      const modelInfo = AI_MODELS[selectedModel];
      modelSelection = {
        model: selectedModel,
        provider: modelInfo.provider,
        reason: "Manually selected",
        displayName: modelInfo.name,
        icon: modelInfo.icon,
      };
    }

    const model = modelSelection.model as AIModel;

    // Process attachments
    let messagesWithContext = messages;
    if (attachments && attachments.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const hasImages = attachments.some((a) => a.type === "image");
      const hasDocuments = attachments.some((a) => a.type === "document");

      // For images with vision-capable models (GPT-4o), format for vision API
      if (hasImages && model === "gpt-4o") {
        const imageContents = attachments
          .filter((a) => a.type === "image")
          .map((a) => ({
            type: "image_url" as const,
            image_url: {
              url: a.data,
            },
          }));

        // Replace last message with vision format
        messagesWithContext = [
          ...messages.slice(0, -1),
          {
            role: "user" as const,
            content: [
              { type: "text" as const, text: lastMessage.content },
              ...imageContents,
            ] as any,
          },
        ];
      }
      // For images with non-vision models, add descriptive text
      else if (hasImages) {
        const imageNames = attachments
          .filter((a) => a.type === "image")
          .map((a) => a.name)
          .join(", ");

        messagesWithContext = [
          ...messages.slice(0, -1),
          {
            role: "user" as const,
            content: `${lastMessage.content}\n\n[User uploaded images: ${imageNames}. Note: This model cannot view images. Consider using GPT-4o for image analysis.]`,
          },
        ];
      }

      // For documents, extract text and add as context
      if (hasDocuments) {
        const documentTexts = attachments
          .filter((a) => a.type === "document")
          .map((a) => {
            // Check if it's a PDF
            const isPDF = a.mimeType === "application/pdf" || a.name.toLowerCase().endsWith(".pdf");
            const isDOCX = a.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || a.name.toLowerCase().endsWith(".docx");

            if (isPDF || isDOCX) {
              return `[Document: ${a.name}]

⚠️ Quick attachments don't support ${isPDF ? 'PDF' : 'Word'} parsing yet.

💡 For best results with ${isPDF ? 'PDF' : 'Word'} files:
1. Go to Knowledge → Documents in the sidebar
2. Upload your ${isPDF ? 'PDF' : 'Word'} file there for full processing with embeddings
3. It will be automatically searchable via RAG in all future chats

Or, you can copy and paste the text content directly into this chat.`;
            }

            // Decode base64 and extract text (for .txt, .csv files)
            try {
              const base64Data = a.data.split(",")[1];
              if (!base64Data) {
                return `[Document: ${a.name}]\n(No content available)`;
              }
              const decodedText = atob(base64Data);
              // Try to extract readable text (works for .txt, .csv)
              const readableText = decodedText.replace(/[^\x20-\x7E\n\r\t]/g, '');
              if (readableText.trim().length > 50) {
                return `[Document: ${a.name}]\n\n${readableText.substring(0, 15000)}`; // Increased limit
              }
              return `[Document: ${a.name}]\n(Could not extract readable text. File type: ${a.mimeType})`;
            } catch (error) {
              console.error(`Error extracting text from ${a.name}:`, error);
              return `[Document: ${a.name}]\n(Unable to extract text)`;
            }
          })
          .join("\n\n");

        // Add documents as system context (prepend to existing if images were also handled)
        const documentContext = `The user has uploaded the following documents:\n\n${documentTexts}`;

        if (hasImages && model === "gpt-4o") {
          // If we already formatted for vision, add document context as system message
          messagesWithContext = [
            { role: "system" as const, content: documentContext },
            ...messagesWithContext,
          ];
        } else if (!hasImages || model !== "gpt-4o") {
          // Otherwise replace the messages
          messagesWithContext = [
            { role: "system" as const, content: documentContext },
            ...messages,
          ];
        }
      }
    }

    // Build model-specific optimized system prompt
    let systemPrompt = buildOptimizedSystemPrompt(model, userMessage);

    // Check if we should use RAG
    let relevantDocs: any[] = [];
    console.log("🔍 Checking RAG for query:", userMessage);
    const useRAG = shouldUseRAG(userMessage);
    console.log("🔍 shouldUseRAG returned:", useRAG);

    if (useRAG) {
      try {
        console.log("🔍 Searching documents for org:", organizationId, "user:", user.id);
        // Search for relevant documents with enhanced context-aware RAG
        // Lower threshold (0.3) to be more inclusive - let the AI decide what's relevant
        relevantDocs = await searchDocuments(
          userMessage,
          organizationId, // Use organizationId variable (user.id if no org)
          user.id, // Pass user ID for permission checking
          10, // Get more chunks for better context
          0.3, // Lower threshold = more permissive, like NotebookLM
          {
            scope: 'all', // Search all accessible documents (personal + shared + org)
            conversationId: conversationId || undefined, // Pass conversation context
          }
        );
        console.log("🔍 Search results:", relevantDocs.length, "documents found");

        if (relevantDocs.length > 0) {
          console.log("✅ RAG: Injecting", relevantDocs.length, "document chunks into context");
          // Build RAG context
          const ragContext = buildRAGContext(relevantDocs);

          // Prepend RAG context to system prompt
          systemPrompt = ragContext + "\n\n" + systemPrompt;
        } else {
          console.log("⚠️ RAG: No relevant documents found");
        }
      } catch (error) {
        // Fail gracefully if RAG isn't set up yet
        console.error("❌ RAG search error:", error);
      }
    } else {
      console.log("⏭️ RAG: Skipped (query doesn't match criteria)");
    }

    // Inject system prompt
    const existingSystemMessage = messagesWithContext.find(
      (m) => m.role === "system"
    );
    if (existingSystemMessage) {
      existingSystemMessage.content = systemPrompt + "\n\n" + existingSystemMessage.content;
    } else {
      messagesWithContext = [
        { role: "system" as const, content: systemPrompt },
        ...messagesWithContext,
      ];
    }

    // Create or update conversation
    let convId = conversationId;
    if (!convId) {
      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          organization_id: organizationId,
          title: messages[0]?.content.substring(0, 100) || "New conversation",
          model,
        })
        .select()
        .single();

      if (convError) throw convError;
      convId = newConv.id;
    }

    // Save user message
    const lastUserMessage = messages[messages.length - 1];
    const { data: savedMessage } = await supabase.from("messages").insert({
      conversation_id: convId,
      role: "user",
      content: lastUserMessage.content,
    }).select().single();

    // Auto-extract tasks from user message (async, don't wait)
    if (savedMessage) {
      import("@/lib/tasks/extractor").then(({ extractTasksFromChatMessage }) => {
        extractTasksFromChatMessage(
          lastUserMessage.content,
          savedMessage.id,
          user.id,
          organizationId
        ).catch((err) => console.error("Task extraction error:", err));
      });
    }

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let conversationMessages = [...messagesWithContext];
        let maxIterations = 5; // Prevent infinite tool calling loops
        let totalUsage: UsageMetadata = { inputTokens: 0, outputTokens: 0 };
        let finalResponse = "";

        try {
          // Send model selection info first
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                modelUsed: {
                  name: modelSelection.displayName,
                  reason: modelSelection.reason,
                  model: modelSelection.model,
                  icon: modelSelection.icon,
                },
              }) + "\n"
            )
          );

          // Send RAG info if documents were used
          if (relevantDocs.length > 0) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  ragUsed: true,
                  documentsCount: relevantDocs.length,
                }) + "\n"
              )
            );
          }

          // Tool execution loop - allows multi-turn tool use
          while (maxIterations > 0) {
            let fullResponse = "";
            let toolCallsToExecute: ToolCall[] = [];
            let usage: UsageMetadata | undefined;

            // Stream AI response with tools
            for await (const chunk of streamChatCompletion(
              model,
              conversationMessages,
              AVAILABLE_TOOLS // Pass available tools
            )) {
              // Handle fallback events
              if ((chunk as any).fallback) {
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      fallback: {
                        from: (chunk as any).from,
                        to: (chunk as any).to,
                        reason: (chunk as any).reason,
                      },
                    }) + "\n"
                  )
                );
                continue;
              }

              if (chunk.done) {
                usage = chunk.usage;
                break;
              }

              // Stream content to user
              if (chunk.content) {
                fullResponse += chunk.content;
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      content: chunk.content,
                      conversationId: convId,
                    }) + "\n"
                  )
                );
              }

              // Collect tool calls
              if (chunk.tool_calls) {
                toolCallsToExecute = chunk.tool_calls;
              }
            }

            // Accumulate usage
            if (usage) {
              totalUsage.inputTokens += usage.inputTokens;
              totalUsage.outputTokens += usage.outputTokens;
            }

            // If no tool calls, we're done
            if (toolCallsToExecute.length === 0) {
              finalResponse = fullResponse;
              break;
            }

            // Execute tool calls
            console.log(`🔧 Executing ${toolCallsToExecute.length} tool call(s)`);
            const toolResults: string[] = [];

            for (const toolCall of toolCallsToExecute) {
              // Show user what tool is being called
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    tool_status: `Calling ${toolCall.name}...`,
                  }) + "\n"
                )
              );

              try {
                const params = JSON.parse(toolCall.arguments);
                const result = await executeToolCall(toolCall.name, params, {
                  userId: user.id,
                  organizationId: organizationId,
                  conversationId: convId,
                });

                toolResults.push(result);

                // Show user the tool result
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      tool_result: { name: toolCall.name, result },
                    }) + "\n"
                  )
                );

                console.log(`✅ Tool ${toolCall.name} executed successfully`);
              } catch (error: any) {
                console.error(`❌ Tool ${toolCall.name} failed:`, error);
                const errorMsg = `Error: ${error.message}`;
                toolResults.push(errorMsg);

                // Show error to user
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      tool_result: { name: toolCall.name, result: errorMsg },
                    }) + "\n"
                  )
                );
              }
            }

            // Add AI response with tool calls to conversation
            conversationMessages.push({
              role: "assistant",
              content:
                fullResponse ||
                `Called tools: ${toolCallsToExecute.map((t) => t.name).join(", ")}`,
            });

            // Add tool results to conversation
            conversationMessages.push({
              role: "user",
              content: `Tool results:\n${toolResults
                .map((r, i) => `${toolCallsToExecute[i].name}: ${r}`)
                .join("\n\n")}`,
            });

            maxIterations--;
            // Loop continues - model will process tool results and potentially call more tools
          }

          // Calculate cost if usage data is available
          let costData: {
            tokens_used?: number;
            cost_usd?: string;
            model_used?: string;
          } = {};
          if (totalUsage.inputTokens > 0 || totalUsage.outputTokens > 0) {
            const cost = calculateCost(
              model,
              totalUsage.inputTokens,
              totalUsage.outputTokens
            );
            costData = {
              model_used: model,
              tokens_used: cost.totalTokens,
              cost_usd: cost.totalCost.toFixed(6),
            };
            console.log(
              `💰 Usage tracked: ${cost.totalTokens} tokens, $${cost.totalCost.toFixed(6)} for ${model}`
            );
          }

          // Save assistant message with cost tracking
          await supabase.from("messages").insert({
            conversation_id: convId,
            role: "assistant",
            content: finalResponse,
            user_id: user.id,
            ...costData,
          });

          // Send final chunk with conversation ID
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                done: true,
                conversationId: convId,
              }) + "\n"
            )
          );
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
