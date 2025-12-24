import { createClient } from "@/lib/supabase/server";
import { streamChatCompletion, ChatMessage } from "@/lib/ai/router";
import { NextRequest } from "next/server";
import { loadProjectContext, buildProjectSystemPrompt } from "@/lib/intelligence/project-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Base system prompt for project assistant
const BASE_PROMPT = `You are a helpful project management AI assistant.
You help users manage their projects by answering questions, suggesting tasks,
and providing guidance based on the project's current stage and goals.

Be concise but helpful. When suggesting actions, be specific and actionable.
If the user asks you to create a task or milestone, confirm what you would create
but explain you'll help them set it up through the project interface.`;

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient();
    const { projectId } = params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response("Organization not found", { status: 400 });
    }

    // Verify project belongs to user's organization
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, organization_id")
      .eq("id", projectId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (projectError || !project) {
      return new Response("Project not found", { status: 404 });
    }

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages array required", { status: 400 });
    }

    // Load project context
    const projectContext = await loadProjectContext(projectId);

    // Build system prompt with project context
    let systemPrompt = BASE_PROMPT;
    if (projectContext) {
      systemPrompt = buildProjectSystemPrompt(BASE_PROMPT, projectContext);
    }

    // Format messages for the AI
    const chatMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await streamChatCompletion(
            "claude-sonnet-4", // Use Sonnet for fast, quality responses
            chatMessages,
            {
              temperature: 0.7,
              max_tokens: 2000,
            }
          );

          const reader = response.getReader();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Decode the chunk
            const text = new TextDecoder().decode(value);
            buffer += text;

            // Process complete SSE events
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  // Extract content from the response
                  let content = "";
                  if (parsed.choices?.[0]?.delta?.content) {
                    content = parsed.choices[0].delta.content;
                  } else if (parsed.delta?.text) {
                    content = parsed.delta.text;
                  } else if (parsed.content) {
                    content = parsed.content;
                  }

                  if (content) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                    );
                  }
                } catch {
                  // Skip unparseable chunks
                }
              }
            }
          }

          // Process any remaining buffer
          if (buffer.startsWith("data: ") && buffer.length > 6) {
            const data = buffer.slice(6);
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content ||
                             parsed.delta?.text ||
                             parsed.content || "";
              if (content) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                );
              }
            } catch {
              // Skip
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
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
    console.error("Project chat error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
