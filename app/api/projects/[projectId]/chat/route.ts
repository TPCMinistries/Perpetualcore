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

    // Create streaming response using AsyncGenerator
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // streamChatCompletion returns an AsyncGenerator
          for await (const chunk of streamChatCompletion(
            "claude-sonnet-4",
            chatMessages
          )) {
            if (chunk.content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`)
              );
            }
            if (chunk.done) {
              break;
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Failed to get response" })}\n\n`)
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
  } catch (error) {
    console.error("Project chat error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
