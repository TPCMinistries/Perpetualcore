import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

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
    console.log("[Chat V2] Request received");

    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[Chat V2] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("[Chat V2] User authenticated:", user.id);

    const body = await req.json();
    const { messages, conversationId } = body;

    console.log("[Chat V2] Processing", messages?.length, "messages");

    // Create or get conversation
    let currentConversationId = conversationId;

    if (!currentConversationId) {
      // Get user's organization
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          organization_id: profile?.organization_id,
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
