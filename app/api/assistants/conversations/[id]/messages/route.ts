import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { buildMemoryContext, extractMemoriesFromConversation } from "@/lib/ai/memory";
import { selectBestModel } from "@/lib/ai/model-router";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;

    // Verify conversation ownership
    const { data: conversation } = await supabase
      .from("assistant_conversations")
      .select("user_id")
      .eq("id", conversationId)
      .single();

    if (!conversation || conversation.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: messages, error } = await supabase
      .from("assistant_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("Messages API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    // Verify conversation ownership and get details
    const { data: conversation } = await supabase
      .from("assistant_conversations")
      .select("user_id, organization_id, assistant_id")
      .eq("id", conversationId)
      .single();

    if (!conversation || conversation.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get assistant details for response generation
    const { data: assistant } = await supabase
      .from("ai_assistants")
      .select("*")
      .eq("id", conversation.assistant_id)
      .single();

    if (!assistant) {
      return NextResponse.json({ error: "Assistant not found" }, { status: 404 });
    }

    // Get conversation history
    const { data: previousMessages } = await supabase
      .from("assistant_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20); // Last 20 messages for context

    // Create user message
    const { data: userMessage, error: userMsgError } = await supabase
      .from("assistant_messages")
      .insert({
        conversation_id: conversationId,
        organization_id: conversation.organization_id,
        role: "user",
        content: content.trim(),
      })
      .select()
      .single();

    if (userMsgError) {
      console.error("Error creating user message:", userMsgError);
      return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
    }

    // Build conversation messages for Claude
    const messages: Anthropic.MessageParam[] = [];

    // Add previous messages for context
    if (previousMessages && previousMessages.length > 0) {
      previousMessages.forEach((msg) => {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      });
    }

    // Add current user message
    messages.push({
      role: "user",
      content: content.trim(),
    });

    // Build system prompt
    let systemPrompt = assistant.system_instructions;

    if (assistant.context_knowledge) {
      systemPrompt += `\n\nAdditional Context:\n${assistant.context_knowledge}`;
    }

    if (assistant.tone) {
      systemPrompt += `\n\nTone: Maintain a ${assistant.tone} tone in your responses.`;
    }

    if (assistant.verbosity) {
      const verbosityGuidance = {
        concise: "Keep responses brief and to the point.",
        balanced: "Provide well-balanced responses with appropriate detail.",
        detailed: "Provide comprehensive, detailed responses with thorough explanations.",
      };
      systemPrompt += `\n\n${verbosityGuidance[assistant.verbosity as keyof typeof verbosityGuidance] || verbosityGuidance.balanced}`;
    }

    // Inject RAG context from user's documents
    try {
      if (process.env.OPENAI_API_KEY && conversation.organization_id) {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: content.trim(),
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;

        const { data: ragChunks } = await supabase.rpc("search_document_chunks", {
          query_embedding: queryEmbedding,
          org_id: conversation.organization_id,
          requesting_user_id: user.id,
          match_threshold: 0.35,
          match_count: 5,
          search_scope: "all",
          conversation_id: null,
          space_id: null,
        });

        if (ragChunks && ragChunks.length > 0) {
          const ragContext = ragChunks
            .map((chunk: any, i: number) => `[${i + 1}] "${chunk.document_title}": ${chunk.content}`)
            .join("\n\n");
          systemPrompt += `\n\n## Relevant Documents\nThe following excerpts from the user's documents may be relevant to their question. Reference them specifically when answering:\n\n${ragContext}`;
        }
      }
    } catch (ragError) {
      console.warn("RAG search failed (non-blocking):", ragError);
    }

    // Inject persistent memory context
    try {
      const memoryContext = await buildMemoryContext(supabase, user.id);
      if (memoryContext) {
        systemPrompt += `\n\n${memoryContext}`;
      }
    } catch (memError) {
      console.warn("Memory context failed (non-blocking):", memError);
    }

    console.log(`🤖 Generating streaming response for assistant: ${assistant.name} (${assistant.role})`);

    // Smart model routing — use selectBestModel for intelligent cost-aware selection
    // Honor the advisor's model preference if it's a premium model, otherwise route intelligently
    const modelSelection = selectBestModel(content.trim());
    const actualModel = modelSelection.provider === "anthropic"
      ? modelSelection.model
      : "claude-sonnet-4"; // Default to Sonnet for non-Anthropic routes since we're using Anthropic SDK here

    // Create a streaming response using Server-Sent Events
    const encoder = new TextEncoder();
    let fullResponse = "";
    let inputTokens = 0;
    let outputTokens = 0;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial user message event
          const userMessageData = JSON.stringify({
            type: "user_message",
            message: userMessage,
          });
          controller.enqueue(encoder.encode(`data: ${userMessageData}\n\n`));

          // Stream from Claude API
          const messageStream = await anthropic.messages.stream({
            model: actualModel,
            max_tokens: assistant.max_tokens || 2000,
            temperature: assistant.temperature ? Number(assistant.temperature) : 0.7,
            system: systemPrompt,
            messages: messages,
          });

          // Process streaming events
          for await (const event of messageStream) {
            if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                const text = event.delta.text;
                fullResponse += text;

                // Send text chunk to client
                const chunkData = JSON.stringify({
                  type: "text_delta",
                  text: text,
                });
                controller.enqueue(encoder.encode(`data: ${chunkData}\n\n`));
              }
            } else if (event.type === "message_start") {
              inputTokens = event.message.usage.input_tokens;
            } else if (event.type === "message_delta") {
              outputTokens = event.usage.output_tokens;
            }
          }

          // Calculate token usage and cost
          const totalTokens = inputTokens + outputTokens;
          const inputCost = (inputTokens / 1_000_000) * 3.0;
          const outputCost = (outputTokens / 1_000_000) * 15.0;
          const totalCost = inputCost + outputCost;

          console.log(`✅ Streaming complete: ${totalTokens} tokens, $${totalCost.toFixed(4)}`);

          // Save complete assistant message to database
          const { data: assistantMessage, error: assistantMsgError } = await supabase
            .from("assistant_messages")
            .insert({
              conversation_id: conversationId,
              organization_id: conversation.organization_id,
              role: "assistant",
              content: fullResponse,
              metadata: {
                model: actualModel,
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                total_tokens: totalTokens,
                cost_usd: totalCost.toFixed(6),
              },
            })
            .select()
            .single();

          if (assistantMsgError) {
            console.error("Error creating assistant message:", assistantMsgError);
            const errorData = JSON.stringify({
              type: "error",
              error: "Failed to save message",
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          } else {
            // Send completion event with full message data
            const completionData = JSON.stringify({
              type: "message_complete",
              message: assistantMessage,
              usage: {
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                total_tokens: totalTokens,
                cost_usd: totalCost.toFixed(6),
              },
            });
            controller.enqueue(encoder.encode(`data: ${completionData}\n\n`));

            // Extract memories from this advisor conversation (non-blocking)
            extractMemoriesFromConversation(supabase, user.id, conversationId, [
              ...messages,
              { role: "assistant", content: fullResponse }
            ]).catch(err => console.warn("Memory extraction failed:", err));
          }

          controller.close();
        } catch (error: any) {
          console.error("Streaming error:", error);
          const errorData = JSON.stringify({
            type: "error",
            error: error.message || "Streaming failed",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Create message API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
