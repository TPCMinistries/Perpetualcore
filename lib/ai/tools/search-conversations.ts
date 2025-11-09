import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const searchConversationsSchema = z.object({
  query: z.string().describe("The search query to find in previous conversations"),
  limit: z.number().optional().default(10).describe("Maximum number of results to return (default: 10)"),
});

export type SearchConversationsInput = z.infer<typeof searchConversationsSchema>;

export interface ConversationSearchResult {
  conversationId: string;
  conversationTitle: string;
  messageContent: string;
  messageRole: "user" | "assistant";
  createdAt: string;
  snippet: string;
}

/**
 * Search through previous conversations and messages
 * This enables the "infinite memory" feature - AI can recall past conversations
 */
export async function searchConversations(
  input: SearchConversationsInput
): Promise<{ results: ConversationSearchResult[]; totalFound: number }> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get user's profile to get organization_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      throw new Error("No organization found");
    }

    const { query, limit } = input;

    // Search in messages content across all conversations for this user/org
    const { data: messages, error } = await supabase
      .from("messages")
      .select(
        `
        id,
        content,
        role,
        created_at,
        conversation_id,
        conversations!inner(
          id,
          title,
          user_id,
          organization_id
        )
      `
      )
      .eq("conversations.organization_id", profile.organization_id)
      .ilike("content", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error searching conversations:", error);
      return { results: [], totalFound: 0 };
    }

    if (!messages || messages.length === 0) {
      return { results: [], totalFound: 0 };
    }

    // Format results
    const results: ConversationSearchResult[] = messages.map((msg: any) => {
      // Create a snippet (first 300 characters of the message)
      const snippet = msg.content.length > 300
        ? msg.content.substring(0, 300) + "..."
        : msg.content;

      return {
        conversationId: msg.conversation_id,
        conversationTitle: msg.conversations.title || "Untitled conversation",
        messageContent: msg.content,
        messageRole: msg.role,
        createdAt: msg.created_at,
        snippet,
      };
    });

    return {
      results,
      totalFound: results.length,
    };
  } catch (error) {
    console.error("Error in searchConversations:", error);
    return { results: [], totalFound: 0 };
  }
}

export const searchConversationsTool = {
  name: "search_conversations",
  description: `Search through ALL previous conversations and messages. Use this when the user asks about:
- Previous conversations (e.g., "what did we discuss about X?")
- Past topics or discussions
- Things they mentioned before
- Conversation history
- Any reference to "last time" or "earlier" discussions

This tool searches the ENTIRE conversation history across all chats, not just the current conversation.

IMPORTANT: Always use this tool when users reference past conversations or ask about previous discussions.`,
  parameters: searchConversationsSchema,
  execute: searchConversations,
};
