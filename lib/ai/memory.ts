/**
 * AI Memory System
 * Enables persistent context across all AI interactions
 */

import { SupabaseClient } from "@supabase/supabase-js";

export type MemoryType =
  | "fact"
  | "preference"
  | "project"
  | "relationship"
  | "goal"
  | "style"
  | "context"
  | "skill"
  | "challenge"
  | "workflow";

export interface AIMemory {
  id: string;
  user_id: string;
  memory_type: MemoryType;
  content: string;
  key?: string;
  value?: any;
  confidence: number;
  source?: string;
  reinforcement_count: number;
  is_verified: boolean;
  learned_at: string;
  last_reinforced_at: string;
}

export interface ConversationContext {
  id: string;
  conversation_id: string;
  topic?: string;
  entities: string[];
  action_items: string[];
  decisions: string[];
  questions: string[];
  sentiment?: string;
  summary?: string;
  key_points: string[];
  continuation_prompt?: string;
}

/**
 * Get all active memories for a user
 */
export async function getUserMemories(
  supabase: SupabaseClient,
  userId: string,
  options?: {
    type?: MemoryType;
    limit?: number;
    minConfidence?: number;
  }
): Promise<AIMemory[]> {
  let query = supabase
    .from("user_ai_memory")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("reinforcement_count", { ascending: false })
    .order("confidence", { ascending: false });

  if (options?.type) {
    query = query.eq("memory_type", options.type);
  }

  if (options?.minConfidence) {
    query = query.gte("confidence", options.minConfidence);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching user memories:", error);
    return [];
  }

  return data || [];
}

/**
 * Build a context string for AI from user memories
 */
export async function buildMemoryContext(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const memories = await getUserMemories(supabase, userId, {
    limit: 30,
    minConfidence: 0.6,
  });

  if (memories.length === 0) {
    return "";
  }

  // Group memories by type
  const grouped: Record<string, AIMemory[]> = {};
  for (const memory of memories) {
    if (!grouped[memory.memory_type]) {
      grouped[memory.memory_type] = [];
    }
    grouped[memory.memory_type].push(memory);
  }

  // Build context string
  const sections: string[] = [];

  if (grouped.context?.length) {
    sections.push(
      `**About the User:**\n${grouped.context.map((m) => `- ${m.content}`).join("\n")}`
    );
  }

  if (grouped.goal?.length) {
    sections.push(
      `**Their Goals:**\n${grouped.goal.map((m) => `- ${m.content}`).join("\n")}`
    );
  }

  if (grouped.project?.length) {
    sections.push(
      `**Current Projects:**\n${grouped.project.map((m) => `- ${m.content}`).join("\n")}`
    );
  }

  if (grouped.preference?.length || grouped.style?.length) {
    const prefs = [...(grouped.preference || []), ...(grouped.style || [])];
    sections.push(
      `**Communication Preferences:**\n${prefs.map((m) => `- ${m.content}`).join("\n")}`
    );
  }

  if (grouped.challenge?.length) {
    sections.push(
      `**Challenges They're Facing:**\n${grouped.challenge.map((m) => `- ${m.content}`).join("\n")}`
    );
  }

  if (grouped.relationship?.length) {
    sections.push(
      `**Key Relationships:**\n${grouped.relationship.map((m) => `- ${m.content}`).join("\n")}`
    );
  }

  if (grouped.skill?.length) {
    sections.push(
      `**Their Expertise:**\n${grouped.skill.map((m) => `- ${m.content}`).join("\n")}`
    );
  }

  if (sections.length === 0) {
    return "";
  }

  return `## What You Know About This User\n\n${sections.join("\n\n")}`;
}

/**
 * Add or reinforce a memory
 */
export async function addMemory(
  supabase: SupabaseClient,
  userId: string,
  memory: {
    type: MemoryType;
    content: string;
    key?: string;
    source?: string;
    sourceId?: string;
    confidence?: number;
  }
): Promise<string | null> {
  const { data, error } = await supabase.rpc("upsert_ai_memory", {
    p_user_id: userId,
    p_memory_type: memory.type,
    p_content: memory.content,
    p_key: memory.key || null,
    p_source: memory.source || "conversation",
    p_source_id: memory.sourceId || null,
    p_confidence: memory.confidence || 0.8,
  });

  if (error) {
    console.error("Error adding memory:", error);
    return null;
  }

  return data;
}

/**
 * Extract memories from AI response
 * Call this after each AI interaction to learn from the conversation
 */
export async function extractMemoriesFromConversation(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
  messages: { role: string; content: string }[]
): Promise<void> {
  // Get recent user messages for context
  const userMessages = messages
    .filter((m) => m.role === "user")
    .slice(-5)
    .map((m) => m.content)
    .join("\n");

  if (!userMessages || userMessages.length < 50) {
    return; // Not enough context
  }

  // Use a simple extraction prompt
  const extractionPrompt = `Analyze this conversation and extract any facts about the user that would be useful to remember for future conversations.

User's messages:
${userMessages}

Return a JSON array of memories to save. Each memory should have:
- type: one of "fact", "preference", "project", "relationship", "goal", "style", "context", "skill", "challenge", "workflow"
- content: a clear, concise statement (max 100 chars)
- confidence: 0.0-1.0 based on how certain you are

Only include memories you're confident about. Return [] if nothing significant to remember.
Return ONLY valid JSON, no explanation.`;

  try {
    // Call AI to extract memories (using a fast model)
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/ai/extract`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: extractionPrompt,
          userId,
          model: "fast", // Use a fast model for extraction
        }),
      }
    );

    if (!response.ok) return;

    const result = await response.json();
    const memories = JSON.parse(result.text || "[]");

    // Save each extracted memory
    for (const memory of memories) {
      if (memory.type && memory.content && memory.confidence > 0.5) {
        await addMemory(supabase, userId, {
          type: memory.type,
          content: memory.content.slice(0, 200),
          source: "conversation",
          sourceId: conversationId,
          confidence: memory.confidence,
        });
      }
    }
  } catch (error) {
    console.error("Error extracting memories:", error);
  }
}

/**
 * Update conversation context
 */
export async function updateConversationContext(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
  context: Partial<ConversationContext>
): Promise<void> {
  const { error } = await supabase
    .from("conversation_context")
    .upsert(
      {
        conversation_id: conversationId,
        user_id: userId,
        ...context,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "conversation_id" }
    );

  if (error) {
    console.error("Error updating conversation context:", error);
  }
}

/**
 * Get conversation context for continuity
 */
export async function getConversationContext(
  supabase: SupabaseClient,
  conversationId: string
): Promise<ConversationContext | null> {
  const { data, error } = await supabase
    .from("conversation_context")
    .select("*")
    .eq("conversation_id", conversationId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Delete a memory
 */
export async function deleteMemory(
  supabase: SupabaseClient,
  memoryId: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("user_ai_memory")
    .update({ is_active: false })
    .eq("id", memoryId)
    .eq("user_id", userId);

  return !error;
}

/**
 * Verify a memory (user confirms it's accurate)
 */
export async function verifyMemory(
  supabase: SupabaseClient,
  memoryId: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("user_ai_memory")
    .update({ is_verified: true, confidence: 1.0 })
    .eq("id", memoryId)
    .eq("user_id", userId);

  return !error;
}
