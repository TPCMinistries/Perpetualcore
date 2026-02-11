import { NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { checkAIUsage, trackAIUsageAfterResponse } from "@/lib/billing/usage-guard";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await checkRateLimit(req, rateLimiters.chat);
    if (rateLimitResponse) return rateLimitResponse;

    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get org for usage check
    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    const organizationId = profile?.organization_id || user.id;

    // Check usage limits (gpt-4o-mini is the model for chat-v2)
    const usageCheck = await checkAIUsage(organizationId, "gpt-4o-mini");
    if (!usageCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: "Usage limit reached",
          code: usageCheck.code,
          message: usageCheck.reason,
          upgrade: usageCheck.upgrade,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { messages, conversationId } = body;

    // Create or get conversation - PERSONAL CHAT ONLY (no org checks)
    let currentConversationId = conversationId;

    if (!currentConversationId) {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: messages[0]?.content?.substring(0, 100) || "New Chat",
          model: "gpt-4o-mini",
        })
        .select()
        .single();

      if (convError) {
        console.error("[Chat V2] Error creating conversation:", convError);
        throw convError;
      }

      currentConversationId = newConv.id;
      console.log("[Chat V2] Created conversation:", currentConversationId);
    }

    // Save user message
    const userMessage = messages[messages.length - 1];
    await supabase.from("messages").insert({
      conversation_id: currentConversationId,
      role: "user",
      content: userMessage.content,
    });

    // Stream response from OpenAI
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      stream: true,
      temperature: 0.7,
    });

    // Create streaming response
    const encoder = new TextEncoder();
    let fullResponse = "";

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Send conversation ID first
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ conversationId: currentConversationId })}\n\n`)
          );

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullResponse += content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }

          // Save assistant message
          await supabase.from("messages").insert({
            conversation_id: currentConversationId,
            role: "assistant",
            content: fullResponse,
          });

          // Track usage (estimate tokens from response length)
          trackAIUsageAfterResponse(
            organizationId,
            "gpt-4o-mini",
            messages.reduce((sum: number, m: any) => sum + (m.content?.length || 0), 0) / 4,
            fullResponse.length / 4
          ).catch(() => {});

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("[Chat V2] Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("[Chat V2] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
