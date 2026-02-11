/**
 * Custom Skill Loader
 *
 * Loads custom skills from the database and converts them
 * into the Skill interface used by the registry.
 */

import { createAdminClient } from "@/lib/supabase/server";
import type { Skill, SkillTool, ToolContext, ToolResult } from "../types";
import type { CustomSkillRecord, CustomToolDefinition } from "./types";
import { executeHttpTool } from "./http-executor";

/**
 * Load all custom skills accessible to a user:
 * - User's own skills
 * - Organization-shared skills
 * - Published public skills
 */
export async function loadCustomSkillsForUser(
  userId: string,
  organizationId?: string
): Promise<Skill[]> {
  const supabase = createAdminClient();

  // Build query for accessible skills
  let query = supabase
    .from("custom_skills")
    .select("*")
    .or(
      [
        `creator_id.eq.${userId}`,
        organizationId
          ? `and(visibility.eq.organization,organization_id.eq.${organizationId})`
          : null,
        "and(visibility.eq.public,is_published.eq.true)",
      ]
        .filter(Boolean)
        .join(",")
    );

  const { data, error } = await query;

  if (error) {
    console.error("[CustomSkills] Error loading custom skills:", error);
    return [];
  }

  if (!data || data.length === 0) return [];

  return data.map((record) => convertToSkill(record as CustomSkillRecord));
}

/**
 * Load a single custom skill by ID
 */
export async function loadCustomSkillById(skillId: string): Promise<Skill | null> {
  // Extract the actual DB ID from the prefixed skill ID
  const dbId = skillId.replace(/^custom_/, "");

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("custom_skills")
    .select("*")
    .eq("id", dbId)
    .single();

  if (error || !data) {
    return null;
  }

  return convertToSkill(data as CustomSkillRecord);
}

/**
 * Load a custom skill by slug for a specific creator
 */
export async function loadCustomSkillBySlug(
  creatorId: string,
  slug: string
): Promise<Skill | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("custom_skills")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return null;
  }

  return convertToSkill(data as CustomSkillRecord);
}

/**
 * Convert a CustomSkillRecord from DB into the Skill interface
 */
function convertToSkill(record: CustomSkillRecord): Skill {
  const skillId = `custom_${record.slug}`;

  const tools: SkillTool[] = (record.tools || []).map((toolDef: CustomToolDefinition) => ({
    name: toolDef.name,
    description: toolDef.description,
    parameters: toolDef.parameters,
    execute: async (params: any, context: ToolContext): Promise<ToolResult> => {
      // Inject skill metadata into context for credential resolution
      const enrichedContext: ToolContext = {
        ...context,
        skillConfig: {
          ...context.skillConfig,
          _skillSlug: record.slug,
          _skillId: record.id,
          _authType: record.auth_type,
        },
      };

      return executeHttpTool(toolDef, params, enrichedContext, {
        authType: record.auth_type,
        authConfig: record.auth_config || {},
        allowedDomains: record.allowed_domains || [],
      });
    },
  }));

  return {
    id: skillId,
    name: record.name,
    description: record.description,
    version: "1.0.0",
    author: record.creator_id,
    category: record.category as any,
    tags: record.tags || [],
    icon: record.icon || "🔧",
    color: record.color || undefined,
    tier: "free",
    isBuiltIn: false,
    tools,
    systemPrompt: record.system_prompt || undefined,
    configSchema: record.config_schema || undefined,
    defaultConfig: record.default_config || undefined,
  };
}

/**
 * Get the database record ID from a custom skill ID
 */
export function getCustomSkillDbId(skillId: string): string | null {
  if (!skillId.startsWith("custom_")) return null;
  return skillId.replace(/^custom_/, "");
}

/**
 * Increment the execution count for a custom skill
 */
export async function incrementCustomSkillExecCount(dbId: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.rpc("increment_counter", {
    row_id: dbId,
    table_name: "custom_skills",
    column_name: "execution_count",
  }).catch(() => {
    // Fallback: direct update if RPC doesn't exist
    supabase
      .from("custom_skills")
      .update({ execution_count: supabase.rpc ? undefined : 0 })
      .eq("id", dbId)
      .catch(() => {});
  });
}
