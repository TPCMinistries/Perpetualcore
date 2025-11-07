import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/conversations/[id] - Get conversation details with messages
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const conversationId = params.id;

    // Check if user is a participant
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (!participant) {
      return new Response("Not a participant", { status: 403 });
    }

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from("shared_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (convError) {
      console.error("Error fetching conversation:", convError);
      return new Response(JSON.stringify({ error: convError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get participants with their profiles
    const { data: convParticipants } = await supabase
      .from("conversation_participants")
      .select("id, user_id, role, can_send_messages, can_invite_others, can_edit_conversation, joined_at")
      .eq("conversation_id", conversationId);

    // Get profiles for participants
    const participantUserIds = convParticipants?.map(p => p.user_id) || [];
    const { data: participantProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", participantUserIds);

    // Combine participants with profiles
    const participantsWithProfiles = convParticipants?.map(participant => ({
      ...participant,
      profiles: participantProfiles?.find(p => p.id === participant.user_id) || null
    })) || [];

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from("conversation_messages")
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

    // Get profiles for messages
    const messageUserIds = messages?.filter(m => m.user_id).map(m => m.user_id) || [];
    const { data: messageProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", messageUserIds);

    // Combine messages with profiles
    const messagesWithProfiles = messages?.map(message => ({
      ...message,
      profiles: message.user_id ? messageProfiles?.find(p => p.id === message.user_id) || null : null
    })) || [];

    // Get document context if linked
    let document = null;
    if (conversation.document_id) {
      const { data: doc } = await supabase
        .from("documents")
        .select("id, title, content, file_type, summary, key_points")
        .eq("id", conversation.document_id)
        .single();

      document = doc;
    }

    return Response.json({
      conversation: {
        ...conversation,
        conversation_participants: participantsWithProfiles
      },
      messages: messagesWithProfiles,
      document,
      current_user_role: participant.role,
    });
  } catch (error: any) {
    console.error("Error in GET /api/conversations/[id]:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
