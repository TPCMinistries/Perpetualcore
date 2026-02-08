/**
 * Agent Workspace - CRUD Operations
 * Manages agent identity records in the agent_identities table
 */

import { createAdminClient } from "@/lib/supabase/server";
import { AgentIdentity, AgentIdentityUpdate, CommunicationStyle } from "./types";

const DEFAULT_COMMUNICATION_STYLE: CommunicationStyle = {
  tone: "professional",
  verbosity: "moderate",
  useEmoji: false,
  language: "en",
  personality: "Helpful, knowledgeable, and proactive",
};

/**
 * Transform a database row into an AgentIdentity object
 */
function transformRow(row: any): AgentIdentity {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    persona: row.persona || "A helpful AI assistant",
    communicationStyle: {
      ...DEFAULT_COMMUNICATION_STYLE,
      ...(typeof row.communication_style === "object" ? row.communication_style : {}),
    },
    boundaries: row.boundaries || [],
    greeting: row.greeting || "Hello! How can I help you today?",
    signoff: row.signoff || "",
    systemPromptOverride: row.system_prompt_override || undefined,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get the agent identity for a user
 */
export async function getAgentIdentity(userId: string): Promise<AgentIdentity | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("agent_identities")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    if (error?.code !== "PGRST116") {
      // PGRST116 = no rows returned (not an error for us)
      console.error("[AgentWorkspace] Error fetching identity:", error);
    }
    return null;
  }

  return transformRow(data);
}

/**
 * Create a new agent identity for a user
 */
export async function createAgentIdentity(
  userId: string,
  identity: AgentIdentityUpdate
): Promise<AgentIdentity> {
  const supabase = createAdminClient();

  const communicationStyle = {
    ...DEFAULT_COMMUNICATION_STYLE,
    ...(identity.communicationStyle || {}),
  };

  const { data, error } = await supabase
    .from("agent_identities")
    .insert({
      user_id: userId,
      name: identity.name || "Atlas",
      persona: identity.persona || "A helpful AI assistant",
      communication_style: communicationStyle,
      boundaries: identity.boundaries || [],
      greeting: identity.greeting || "Hello! How can I help you today?",
      signoff: identity.signoff || "",
      system_prompt_override: identity.systemPromptOverride || null,
      is_active: identity.isActive ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error("[AgentWorkspace] Error creating identity:", error);
    throw new Error(`Failed to create agent identity: ${error.message}`);
  }

  return transformRow(data);
}

/**
 * Update an existing agent identity
 */
export async function updateAgentIdentity(
  userId: string,
  update: AgentIdentityUpdate
): Promise<AgentIdentity> {
  const supabase = createAdminClient();

  // Build the update payload, only including defined fields
  const payload: Record<string, any> = {};

  if (update.name !== undefined) payload.name = update.name;
  if (update.persona !== undefined) payload.persona = update.persona;
  if (update.boundaries !== undefined) payload.boundaries = update.boundaries;
  if (update.greeting !== undefined) payload.greeting = update.greeting;
  if (update.signoff !== undefined) payload.signoff = update.signoff;
  if (update.systemPromptOverride !== undefined) payload.system_prompt_override = update.systemPromptOverride;
  if (update.isActive !== undefined) payload.is_active = update.isActive;

  if (update.communicationStyle !== undefined) {
    // Merge with existing style
    const existing = await getAgentIdentity(userId);
    const existingStyle = existing?.communicationStyle || DEFAULT_COMMUNICATION_STYLE;
    payload.communication_style = {
      ...existingStyle,
      ...update.communicationStyle,
    };
  }

  const { data, error } = await supabase
    .from("agent_identities")
    .update(payload)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("[AgentWorkspace] Error updating identity:", error);
    throw new Error(`Failed to update agent identity: ${error.message}`);
  }

  return transformRow(data);
}

/**
 * Delete an agent identity
 */
export async function deleteAgentIdentity(userId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("agent_identities")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("[AgentWorkspace] Error deleting identity:", error);
    throw new Error(`Failed to delete agent identity: ${error.message}`);
  }
}
