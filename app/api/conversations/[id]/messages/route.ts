import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// POST /api/conversations/[id]/messages - Send a message in a conversation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id: conversationId } = await params;
    const { content, context, skipAI } = await req.json();

    if (!content) {
      return new Response(JSON.stringify({ error: "Content is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Check if user is a participant
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (!participant) {
      return new Response(JSON.stringify({ error: "Not a participant" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!participant.can_send_messages) {
      return new Response(JSON.stringify({ error: "No permission to send messages" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Save user message
    const { data: userMessage, error: messageError } = await supabase
      .from("conversation_messages")
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: "user",
        content,
      })
      .select()
      .single();

    if (messageError) {
      console.error("Error saving user message:", messageError);
      return new Response(JSON.stringify({ error: messageError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // If AI is disabled (skipAI = true), return early without generating AI response
    if (skipAI) {
      return Response.json({
        user_message: userMessage,
        ai_message: null,
        message: "Message saved (AI response skipped)"
      });
    }

    // Get conversation history (last 20 messages)
    const { data: historyMessages } = await supabase
      .from("conversation_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Reverse to get chronological order
    const conversationHistory = (historyMessages || []).reverse();

    // Build system prompt with context
    let systemPrompt = "You are a helpful AI assistant in a collaborative conversation. ";
    
    if (context?.document_title) {
      systemPrompt += `This conversation is about the document: "${context.document_title}". `;
    }
    
    if (context?.document_content) {
      systemPrompt += `\n\nDocument content:\n${context.document_content.substring(0, 30000)}`;
    }

    systemPrompt += "\n\nProvide helpful, accurate, and collaborative responses.";

    // Build messages for Claude
    const messages: Anthropic.MessageParam[] = conversationHistory
      .filter(msg => msg.role !== "system")
      .map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    // Generate AI response
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    const responseText = response.content[0].type === "text" 
      ? response.content[0].text 
      : "";

    // Calculate cost
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const totalTokens = inputTokens + outputTokens;
    const inputCost = (inputTokens / 1_000_000) * 3.0;
    const outputCost = (outputTokens / 1_000_000) * 15.0;
    const totalCost = inputCost + outputCost;

    // Save AI response
    const { data: aiMessage, error: aiError } = await supabase
      .from("conversation_messages")
      .insert({
        conversation_id: conversationId,
        user_id: null, // AI message
        role: "assistant",
        content: responseText,
        model_used: "claude-3-haiku-20240307",
        tokens_used: totalTokens,
        cost_usd: totalCost.toFixed(4),
      })
      .select()
      .single();

    if (aiError) {
      console.error("Error saving AI message:", aiError);
      return new Response(JSON.stringify({ error: aiError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return Response.json({
      user_message: userMessage,
      ai_message: aiMessage,
      tokens_used: totalTokens,
      cost_usd: totalCost.toFixed(4),
    });
  } catch (error: any) {
    console.error("Error in POST /api/conversations/[id]/messages:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// GET /api/conversations/[id]/messages - Get all messages in a conversation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { id: conversationId } = await params;

    // Check if user is a participant
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (!participant) {
      return new Response(JSON.stringify({ error: "Not a participant" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get all messages with user profiles
    const { data: messages, error } = await supabase
      .from("conversation_messages")
      .select(`
        *,
        profiles (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return Response.json({ messages });
  } catch (error: any) {
    console.error("Error in GET /api/conversations/[id]/messages:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
