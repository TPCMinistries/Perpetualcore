/**
 * Agent Workspace Router
 *
 * Resolves which workspace handles a message based on channel type
 * and sender identity. Builds workspace-aware system prompts by
 * applying persona overrides and context filters.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { ChannelType } from "@/lib/channels/types";
import {
  AgentWorkspace,
  AgentPersona,
  ChannelBinding,
  ContextFilter,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "./workspace-types";

/**
 * Transform a database row into an AgentWorkspace object.
 */
function transformRow(row: any): AgentWorkspace {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description || undefined,
    persona: (row.persona as AgentPersona) || {},
    channel_bindings: (row.channel_bindings as ChannelBinding[]) || [],
    context_filter: (row.context_filter as ContextFilter) || {},
    skill_overrides: row.skill_overrides || [],
    is_default: row.is_default ?? false,
    is_active: row.is_active ?? true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Resolve which workspace handles a message based on channel + sender.
 *
 * Priority:
 * 1. Exact match: channel_type + channel_identifier matches channelUserId
 * 2. Wildcard: channel_type matches + match_all = true
 * 3. Default workspace (is_default = true) as fallback
 *
 * @returns The best matching workspace, or null if none found
 */
export async function resolveWorkspace(
  userId: string,
  channelType: ChannelType,
  channelUserId?: string
): Promise<AgentWorkspace | null> {
  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from("agent_workspaces")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("is_default", { ascending: true });

  if (error || !rows || rows.length === 0) {
    return null;
  }

  const workspaces = rows.map(transformRow);

  // Priority 1: Exact match on channel_type + channel_identifier
  if (channelUserId) {
    for (const ws of workspaces) {
      for (const binding of ws.channel_bindings) {
        if (
          binding.channel_type === channelType &&
          binding.channel_identifier === channelUserId
        ) {
          return ws;
        }
      }
    }
  }

  // Priority 2: Wildcard match on channel_type with match_all
  for (const ws of workspaces) {
    for (const binding of ws.channel_bindings) {
      if (binding.channel_type === channelType && binding.match_all) {
        return ws;
      }
    }
  }

  // Priority 3: Default workspace
  const defaultWorkspace = workspaces.find((ws) => ws.is_default);
  return defaultWorkspace || null;
}

/**
 * Build a workspace-aware system prompt by applying persona overrides.
 *
 * @param workspace - The resolved workspace
 * @param basePrompt - The original system prompt from the channel router
 * @returns Modified system prompt with workspace persona applied
 */
export function buildWorkspaceSystemPrompt(
  workspace: AgentWorkspace,
  basePrompt: string
): string {
  const persona = workspace.persona;
  const sections: string[] = [];

  // Workspace identity header
  sections.push(
    `## Active Workspace: ${workspace.name}${workspace.description ? `\n${workspace.description}` : ""}`
  );

  // Persona display name
  if (persona.display_name) {
    sections.push(`You are responding as "${persona.display_name}".`);
  }

  // Tone override
  if (persona.tone) {
    const toneDescriptions: Record<string, string> = {
      professional:
        "Maintain a professional, business-appropriate tone. Be clear and precise.",
      casual:
        "Be relaxed and conversational. Use natural, everyday language.",
      pastoral:
        "Be warm, compassionate, and spiritually encouraging. Speak with care and wisdom.",
      technical:
        "Be precise and technical. Use domain-specific terminology when appropriate.",
      friendly:
        "Be warm, approachable, and personable. Show genuine interest.",
    };
    sections.push(
      `## Tone\n${toneDescriptions[persona.tone] || `Use a ${persona.tone} tone.`}`
    );
  }

  // Custom system prompt override
  if (persona.system_prompt_override) {
    sections.push(
      `## Workspace Instructions\n${persona.system_prompt_override}`
    );
  }

  // Greeting message
  if (persona.greeting_message) {
    sections.push(
      `## Greeting\nWhen starting a new conversation in this workspace, use: "${persona.greeting_message}"`
    );
  }

  // Signature
  if (persona.signature) {
    sections.push(
      `## Signature\nEnd messages with: "${persona.signature}"`
    );
  }

  // Context filter instructions
  const filter = workspace.context_filter;
  if (filter.include_tags && filter.include_tags.length > 0) {
    sections.push(
      `## Context Focus\nPrioritize information tagged with: ${filter.include_tags.join(", ")}`
    );
  }
  if (filter.exclude_tags && filter.exclude_tags.length > 0) {
    sections.push(
      `Exclude information tagged with: ${filter.exclude_tags.join(", ")}`
    );
  }

  // Prepend workspace context to the base prompt
  const workspaceContext = sections.join("\n\n");
  return `${workspaceContext}\n\n---\n\n${basePrompt}`;
}

// ============================================================
// CRUD Operations
// ============================================================

/**
 * Get all workspaces for a user.
 */
export async function getWorkspacesForUser(
  userId: string
): Promise<AgentWorkspace[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("agent_workspaces")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[WorkspaceRouter] Error fetching workspaces:", error);
    throw new Error(`Failed to fetch workspaces: ${error.message}`);
  }

  return (data || []).map(transformRow);
}

/**
 * Create a new workspace for a user.
 * If is_default is true, unset default on all other workspaces first.
 */
export async function createWorkspace(
  userId: string,
  input: CreateWorkspaceInput
): Promise<AgentWorkspace> {
  const supabase = createAdminClient();

  // If setting as default, unset existing defaults
  if (input.is_default) {
    await supabase
      .from("agent_workspaces")
      .update({ is_default: false })
      .eq("user_id", userId)
      .eq("is_default", true);
  }

  const { data, error } = await supabase
    .from("agent_workspaces")
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description || null,
      persona: input.persona || {},
      channel_bindings: input.channel_bindings || [],
      context_filter: input.context_filter || {},
      skill_overrides: input.skill_overrides || [],
      is_default: input.is_default ?? false,
      is_active: input.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error("[WorkspaceRouter] Error creating workspace:", error);
    throw new Error(`Failed to create workspace: ${error.message}`);
  }

  return transformRow(data);
}

/**
 * Update an existing workspace.
 * If is_default is being set to true, unset default on all other workspaces.
 */
export async function updateWorkspace(
  id: string,
  userId: string,
  updates: UpdateWorkspaceInput
): Promise<AgentWorkspace> {
  const supabase = createAdminClient();

  // If setting as default, unset existing defaults
  if (updates.is_default) {
    await supabase
      .from("agent_workspaces")
      .update({ is_default: false })
      .eq("user_id", userId)
      .eq("is_default", true);
  }

  // Build update payload, only including defined fields
  const payload: Record<string, any> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined)
    payload.description = updates.description;
  if (updates.persona !== undefined) payload.persona = updates.persona;
  if (updates.channel_bindings !== undefined)
    payload.channel_bindings = updates.channel_bindings;
  if (updates.context_filter !== undefined)
    payload.context_filter = updates.context_filter;
  if (updates.skill_overrides !== undefined)
    payload.skill_overrides = updates.skill_overrides;
  if (updates.is_default !== undefined) payload.is_default = updates.is_default;
  if (updates.is_active !== undefined) payload.is_active = updates.is_active;

  const { data, error } = await supabase
    .from("agent_workspaces")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("[WorkspaceRouter] Error updating workspace:", error);
    throw new Error(`Failed to update workspace: ${error.message}`);
  }

  return transformRow(data);
}

/**
 * Delete a workspace. Cannot delete the default workspace if it's the only one.
 */
export async function deleteWorkspace(
  id: string,
  userId: string
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("agent_workspaces")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[WorkspaceRouter] Error deleting workspace:", error);
    throw new Error(`Failed to delete workspace: ${error.message}`);
  }
}
