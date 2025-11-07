import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/chat/conversations/[id] - Get messages for a regular chat conversation
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const conversationId = params.id;

    // Get the conversation to verify ownership
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (convError || !conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get all messages for this conversation
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (msgError) {
      console.error("Error fetching messages:", msgError);
      return new Response(JSON.stringify({ error: msgError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return Response.json({ messages: messages || [] });
  } catch (error: any) {
    console.error("Error in GET /api/chat/conversations/[id]:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// PATCH /api/chat/conversations/[id] - Update conversation (e.g., move to project)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const conversationId = params.id;
    const body = await req.json();

    // Verify ownership before updating
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (convError || !conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Update the conversation
    const { data: updatedConv, error: updateError } = await supabase
      .from("conversations")
      .update({
        project_id: body.project_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating conversation:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update conversation" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return Response.json({ conversation: updatedConv });
  } catch (error: any) {
    console.error("Error in PATCH /api/chat/conversations/[id]:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// DELETE /api/chat/conversations/[id] - Delete a regular chat conversation
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const conversationId = params.id;

    // Verify ownership before deleting
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (convError || !conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Delete all messages first (cascade delete)
    const { error: msgDeleteError } = await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", conversationId);

    if (msgDeleteError) {
      console.error("Error deleting messages:", msgDeleteError);
      return new Response(JSON.stringify({ error: "Failed to delete messages" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Delete the conversation
    const { error: convDeleteError } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId)
      .eq("user_id", user.id);

    if (convDeleteError) {
      console.error("Error deleting conversation:", convDeleteError);
      return new Response(JSON.stringify({ error: "Failed to delete conversation" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/chat/conversations/[id]:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
