/**
 * Agent Workspace Types
 *
 * Defines types for multi-agent routing with isolated personas.
 * Each workspace binds to specific channels and applies persona
 * overrides, context filters, and skill configurations.
 */

import { ChannelType } from "@/lib/channels/types";

/**
 * An agent workspace with its own persona, channel bindings,
 * and context configuration. Users can have multiple workspaces
 * (e.g., "Work Agent", "Personal Agent", "Ministry Agent").
 */
export interface AgentWorkspace {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  persona: AgentPersona;
  channel_bindings: ChannelBinding[];
  context_filter: ContextFilter;
  skill_overrides: string[];
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Persona overrides for a workspace. These modify how the agent
 * communicates when handling messages routed to this workspace.
 */
export interface AgentPersona {
  display_name?: string;
  tone?: "professional" | "casual" | "pastoral" | "technical" | "friendly";
  system_prompt_override?: string;
  greeting_message?: string;
  signature?: string;
}

/**
 * Binds a workspace to a specific channel (or all messages on a channel type).
 * Used by the workspace router to determine which workspace handles a message.
 */
export interface ChannelBinding {
  channel_type: ChannelType;
  channel_identifier?: string;
  match_all?: boolean;
}

/**
 * Filters what context is loaded for a workspace.
 * Allows workspaces to limit which documents, contacts, and memories
 * are included in the AI context.
 */
export interface ContextFilter {
  include_tags?: string[];
  exclude_tags?: string[];
  document_folders?: string[];
  contact_groups?: string[];
  max_memory_items?: number;
}

/**
 * A DM pairing code record. When an unknown sender messages on any channel,
 * a 6-digit code is generated and must be verified in the dashboard before
 * the agent will process their messages.
 */
export interface PairingCode {
  id: string;
  user_id: string;
  channel_type: ChannelType;
  channel_user_id: string;
  code: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

/**
 * Input type for creating a new workspace (omits server-generated fields).
 */
export type CreateWorkspaceInput = Omit<
  AgentWorkspace,
  "id" | "user_id" | "created_at" | "updated_at"
>;

/**
 * Input type for updating an existing workspace.
 */
export type UpdateWorkspaceInput = Partial<
  Omit<AgentWorkspace, "id" | "user_id" | "created_at" | "updated_at">
>;
