import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  console.log("[Chat V2] === REQUEST START ===");

  try {
    const supabase = await createClient();
    console.log("[Chat V2] Supabase client created");

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("[Chat V2] User:", user?.id, "Auth error:", authError?.message);

    if (!user) {
      console.error("[Chat V2] Unauthorized");
      return new Response("Unauthorized", { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    console.log("[Chat V2] Profile:", profile?.organization_id, "Error:", profileError?.message);

    if (!profile) {
      console.error("[Chat V2] No profile found");
      return new Response("Profile not found", { status: 404 });
    }

    const body = await req.json();
    console.log("[Chat V2] Request body received:", JSON.stringify(body).substring(0, 100));

    const { messages, conversationId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error("[Chat V2] Invalid messages");
      return new Response("Invalid messages", { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    console.log("[Chat V2] Last message:", lastUserMessage.substring(0, 50));

    // Create or get conversation ID
    let convId = conversationId;

    if (!convId) {
      console.log("[Chat V2] Creating new conversation");
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          organization_id: profile.organization_id,
          title: lastUserMessage.substring(0, 100) || "New conversation",
          model: "claude-sonnet-4",
        })
        .select()
        .single();

      if (convError) {
        console.error("[Chat V2] Error creating conversation:", convError);
        return new Response(JSON.stringify({ error: convError.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      convId = newConv.id;
      console.log("[Chat V2] New conversation created:", convId);
    }

    // Save user message
    console.log("[Chat V2] Saving user message");
    const { error: userMsgError } = await supabase.from("messages").insert({
      conversation_id: convId,
      role: "user",
      content: lastUserMessage,
    });

    if (userMsgError) {
      console.error("[Chat V2] Error saving user message:", userMsgError);
    }

    // For now, return a simple mock response to test streaming works
    console.log("[Chat V2] Starting stream");
    const stream = new ReadableStream({
      start(controller) {
        try {
          const encoder = new TextEncoder();

          // Send conversation ID
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ conversationId: convId })}\n\n`)
          );

          // Send mock response
          const mockResponse = "Hello! I'm working. This is a test response to verify the streaming works.";
          const words = mockResponse.split(" ");

          // Stream word by word
          let index = 0;
          const interval = setInterval(() => {
            if (index < words.length) {
              const word = words[index] + " ";
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: word })}\n\n`)
              );
              index++;
            } else {
              clearInterval(interval);

              // Save assistant message
              supabase.from("messages").insert({
                conversation_id: convId,
                role: "assistant",
                content: mockResponse,
              }).then(() => {
                console.log("[Chat V2] Message saved");
              });

              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              controller.close();
              console.log("[Chat V2] Stream completed");
            }
          }, 50);

        } catch (error) {
          console.error("[Chat V2] Stream error:", error);
          controller.error(error);
        }
      },
    });

    console.log("[Chat V2] Returning stream response");
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("[Chat V2] === ERROR ===");
    console.error("[Chat V2] Error message:", error.message);
    console.error("[Chat V2] Error stack:", error.stack);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
