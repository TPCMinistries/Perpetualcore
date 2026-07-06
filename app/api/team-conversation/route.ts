import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const DEFAULT_MODEL = "gpt-4o-mini";

export async function POST(request: NextRequest) {
  try {
    const { conversationId, message } = await request.json();

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: "Missing conversationId or message" },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has access to this conversation
    const { data: participant, error: participantError } = await supabase
      .from("conversation_participants")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: "You don't have access to this conversation" },
        { status: 403 }
      );
    }

    // Get conversation context
    const { data: conversation } = await supabase
      .from("shared_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    // Get conversation history (last 20 messages)
    const { data: messages } = await supabase
      .from("conversation_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Reverse to get chronological order
    const conversationHistory = (messages || []).reverse();

    // Build system prompt based on conversation context
    let systemPrompt = `You are a helpful AI assistant participating in a team conversation titled "${conversation?.title || "Team Conversation"}".`;

    if (conversation?.description) {
      systemPrompt += `\n\nConversation context: ${conversation.description}`;
    }

    if (conversation?.context_type) {
      const contextDescriptions: Record<string, string> = {
        document: "This is a document review conversation. Help the team analyze and discuss documents.",
        training: "This is a training session. Help the team learn and understand new concepts.",
        project: "This is a project planning conversation. Help the team organize and plan their work.",
        general: "This is a general team discussion. Provide helpful insights and assistance.",
      };
      systemPrompt += `\n\n${contextDescriptions[conversation.context_type] || ""}`;
    }

    systemPrompt += `\n\nProvide helpful, concise, and collaborative responses. You're part of the team conversation.`;

    // Prepare messages for AI
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })),
    ];

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: DEFAULT_MODEL,
                messages: aiMessages,
                stream: true,
                temperature: 0.7,
                max_tokens: 2000,
              }),
            }
          );

          if (!response.ok) {
            const error = await response.text();
            console.error("OpenAI API error:", error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: "Failed to get AI response" })}\n\n`
              )
            );
            controller.close();
            return;
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          while (reader) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter((line) => line.trim() !== "");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;

                  if (content) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ content })}\n\n`
                      )
                    );
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }

          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream error" })}\n\n`
            )
          );
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
  } catch (error: any) {
    console.error("Team conversation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
