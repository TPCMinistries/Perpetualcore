import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/chat/conversations - List all personal AI chat conversations for the current user
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Fetch all conversations for this user, ordered by most recent first
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(`
        id,
        title,
        model,
        created_at,
        updated_at,
        organization_id,
        user_id
      `)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get the last message for each conversation to show preview
    const conversationsWithPreview = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { data: lastMessage } = await supabase
          .from("messages")
          .select("content, created_at, role")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        return {
          ...conv,
          lastMessage: lastMessage?.content?.substring(0, 100) || "",
          lastMessageAt: lastMessage?.created_at || conv.updated_at,
        };
      })
    );

    return Response.json({ conversations: conversationsWithPreview });
  } catch (error: any) {
    console.error("Error in GET /api/chat/conversations:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
