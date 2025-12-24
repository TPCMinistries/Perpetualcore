import { createClient } from "@/lib/supabase/server";
import { streamChatCompletion, ChatMessage } from "@/lib/ai/router";
import { NextRequest } from "next/server";
import { loadTeamContext, buildTeamSystemPrompt } from "@/lib/intelligence/team-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

// Base system prompt for team assistant
const BASE_PROMPT = `You are a helpful AI assistant for a team.
You help team members with their work by answering questions, providing suggestions,
and assisting with tasks relevant to the team's focus and responsibilities.

Be concise but helpful. Adapt your communication style to match the team's preferences.
When suggesting actions, be specific and actionable.`;

export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { teamId } = await params;
    const supabase = await createClient();

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

    // Verify team belongs to user's organization
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, organization_id, name")
      .eq("id", teamId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (teamError || !team) {
      return new Response("Team not found", { status: 404 });
    }

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages array required", { status: 400 });
    }

    // Load team context
    const teamContext = await loadTeamContext(teamId);

    // Build system prompt with team context
    let systemPrompt = BASE_PROMPT;
    if (teamContext) {
      systemPrompt = buildTeamSystemPrompt(BASE_PROMPT, teamContext);
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
    console.error("Team chat error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
