import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/conversations - List all conversations for the user
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
      return new Response("User has no organization", { status: 400 });
    }

    // Get only conversations where the user is a participant
    // First, get conversation IDs where user is a participant
    const { data: participantData } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    const conversationIds = participantData?.map(p => p.conversation_id) || [];

    // If no conversations, return empty array
    if (conversationIds.length === 0) {
      return Response.json({ conversations: [] });
    }

    // Get all shared conversations where user is a participant
    // Exclude private conversations (personal AI chats)
    const { data: conversations, error } = await supabase
      .from("shared_conversations")
      .select("*")
      .in("id", conversationIds)
      .eq("organization_id", profile.organization_id)
      .eq("is_private", false)  // Only show shared team conversations
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Return conversations with message counts and last message timestamp
    const conversationsWithCounts = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Get message count from conversation_messages (FIXED: was shared_conversation_messages)
        const { count } = await supabase
          .from("conversation_messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id);

        // Get last message timestamp
        const { data: lastMessage } = await supabase
          .from("conversation_messages")
          .select("created_at")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        return {
          ...conv,
          message_count: count || 0,
          last_message_at: lastMessage?.created_at || conv.created_at,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
        };
      })
    );

    return Response.json({ conversations: conversationsWithCounts });
  } catch (error: any) {
    console.error("Error in GET /api/conversations:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// POST /api/conversations - Create a new shared conversation
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
      return new Response("User has no organization", { status: 400 });
    }

    const body = await req.json();
    const {
      title,
      description,
      document_id,
      context_type,
      is_private = false,
      participant_ids = [] // Array of user IDs to add as participants
    } = body;

    if (!title) {
      return new Response("Title is required", { status: 400 });
    }

    // Create the conversation
    const { data: conversation, error: createError } = await supabase
      .from("shared_conversations")
      .insert({
        organization_id: profile.organization_id,
        created_by: user.id,
        title,
        description,
        document_id,
        context_type,
        is_private,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating conversation:", createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Add the creator as a participant (owner)
    const { error: participantError } = await supabase
      .from("conversation_participants")
      .insert({
        conversation_id: conversation.id,
        user_id: user.id,
        role: "owner",
        can_send_messages: true,
        can_invite_others: true,
        can_edit_conversation: true,
      });

    if (participantError) {
      console.error("Error adding creator as participant:", participantError);
      // Don't fail the request, but log the error
    }

    // Add additional participants if specified
    if (participant_ids.length > 0) {
      const participantsToAdd = participant_ids.map((userId: string) => ({
        conversation_id: conversation.id,
        user_id: userId,
        role: "participant",
        can_send_messages: true,
        can_invite_others: false,
        can_edit_conversation: false,
      }));

      const { error: bulkError } = await supabase
        .from("conversation_participants")
        .insert(participantsToAdd);

      if (bulkError) {
        console.error("Error adding participants:", bulkError);
        // Don't fail the request
      }
    }

    // Fetch the complete conversation with participants
    const { data: fullConversation } = await supabase
      .from("shared_conversations")
      .select("*")
      .eq("id", conversation.id)
      .single();

    // Get participants with their profiles
    const { data: convParticipants } = await supabase
      .from("conversation_participants")
      .select("id, user_id, role")
      .eq("conversation_id", conversation.id);

    // Get profiles for participants
    const participantUserIds = convParticipants?.map(p => p.user_id) || [];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", participantUserIds);

    // Combine participants with profiles
    const participantsWithProfiles = convParticipants?.map(participant => ({
      ...participant,
      profiles: profiles?.find(p => p.id === participant.user_id) || null
    })) || [];

    return Response.json({
      conversation: {
        ...fullConversation,
        conversation_participants: participantsWithProfiles
      },
      message: "Conversation created successfully"
    });
  } catch (error: any) {
    console.error("Error in POST /api/conversations:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
