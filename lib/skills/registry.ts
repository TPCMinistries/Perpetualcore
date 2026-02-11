/**
 * Skills Registry
 *
 * Manages loading, registering, and accessing skills.
 * Skills can be built-in or user-installed.
 */

import { Skill, UserSkillConfig, ToolContext, ToolResult } from "./types";
import { createAdminClient } from "@/lib/supabase/server";
import { loadCustomSkillsForUser, loadCustomSkillById } from "./custom/loader";

// Built-in skills are imported directly
import { weatherSkill } from "./builtin/weather";
import { githubSkill } from "./builtin/github";
import { webSearchSkill } from "./builtin/web-search";
import { notionSkill } from "./builtin/notion";
import { trelloSkill } from "./builtin/trello";
import { discordSkill } from "./builtin/discord";
import { pdfSkill } from "./builtin/pdf";
import { imageGenSkill } from "./builtin/image-gen";
// Batch 2 Skills
import { googleCalendarSkill } from "./builtin/google-calendar";
import { gmailSkill } from "./builtin/gmail";
import { todoistSkill } from "./builtin/todoist";
import { linearSkill } from "./builtin/linear";
// Batch 3 Skills
import { slackSkill } from "./builtin/slack";
import { zoomSkill } from "./builtin/zoom";
import { dropboxSkill } from "./builtin/dropbox";

// Registry of all available skills
const skillRegistry: Map<string, Skill> = new Map();

// Built-in skills
const BUILT_IN_SKILLS: Skill[] = [
  weatherSkill,
  githubSkill,
  webSearchSkill,
  notionSkill,
  trelloSkill,
  discordSkill,
  pdfSkill,
  imageGenSkill,
  // Batch 2 Skills
  googleCalendarSkill,
  gmailSkill,
  todoistSkill,
  linearSkill,
  // Batch 3 Skills
  slackSkill,
  zoomSkill,
  dropboxSkill,
];

/**
 * Initialize the skill registry with built-in skills
 */
export function initializeSkillRegistry(): void {
  // Clear existing
  skillRegistry.clear();

  // Register built-in skills
  for (const skill of BUILT_IN_SKILLS) {
    skillRegistry.set(skill.id, skill);
  }

  console.log(`Skill registry initialized with ${skillRegistry.size} skills`);
}

/**
 * Get a skill by ID
 */
export function getSkill(skillId: string): Skill | undefined {
  return skillRegistry.get(skillId);
}

/**
 * Get all available skills
 */
export function getAllSkills(): Skill[] {
  return Array.from(skillRegistry.values());
}

/**
 * Get skills by category
 */
export function getSkillsByCategory(category: string): Skill[] {
  return getAllSkills().filter(s => s.category === category);
}

/**
 * Get user's enabled skills
 */
export async function getUserSkills(userId: string): Promise<UserSkillConfig[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("user_skills")
    .select("*")
    .eq("user_id", userId)
    .eq("enabled", true);

  return (data || []).map(row => ({
    skillId: row.skill_id,
    enabled: row.enabled,
    config: row.config || {},
    installedAt: row.installed_at,
    lastUsedAt: row.last_used_at,
  }));
}

/**
 * Enable a skill for a user
 */
export async function enableSkill(
  userId: string,
  skillId: string,
  config?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  // Check built-in or custom skill exists
  let skill: Skill | undefined | null = getSkill(skillId);
  if (!skill && skillId.startsWith("custom_")) {
    skill = await loadCustomSkillById(skillId);
  }
  if (!skill) {
    return { success: false, error: "Skill not found" };
  }

  // Check requirements (built-in skills only)
  if (skill.isBuiltIn && skill.requiredEnvVars) {
    for (const envVar of skill.requiredEnvVars) {
      if (!process.env[envVar]) {
        return { success: false, error: `Missing required environment variable: ${envVar}` };
      }
    }
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("user_skills")
    .upsert({
      user_id: userId,
      skill_id: skillId,
      enabled: true,
      config: config || skill.defaultConfig || {},
      installed_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,skill_id",
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Disable a skill for a user
 */
export async function disableSkill(
  userId: string,
  skillId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("user_skills")
    .update({ enabled: false })
    .eq("user_id", userId)
    .eq("skill_id", skillId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Update skill configuration
 */
export async function updateSkillConfig(
  userId: string,
  skillId: string,
  config: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("user_skills")
    .update({ config })
    .eq("user_id", userId)
    .eq("skill_id", skillId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Execute a skill tool
 */
export async function executeSkillTool(
  skillId: string,
  toolName: string,
  params: any,
  context: ToolContext
): Promise<ToolResult> {
  // Resolve skill: built-in from registry, or custom from DB
  let skill: Skill | undefined | null;
  const isCustom = skillId.startsWith("custom_");

  if (isCustom) {
    skill = await loadCustomSkillById(skillId);
  } else {
    skill = getSkill(skillId);
  }

  if (!skill) {
    return { success: false, error: "Skill not found" };
  }

  const tool = skill.tools.find(t => t.name === toolName);
  if (!tool) {
    return { success: false, error: `Tool '${toolName}' not found in skill '${skillId}'` };
  }

  const startTime = Date.now();

  try {
    const result = await tool.execute(params, context);
    const durationMs = Date.now() - startTime;

    // Log execution
    const supabase = createAdminClient();
    await supabase.from("skill_executions").insert({
      user_id: context.userId,
      skill_id: skillId,
      tool_name: toolName,
      input: params,
      output: result,
      duration_ms: durationMs,
      success: result.success,
    }).catch(() => {}); // Don't fail if logging fails

    // Update last_used_at
    await supabase
      .from("user_skills")
      .update({ last_used_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .eq("skill_id", skillId)
      .catch(() => {});

    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Unknown error executing tool",
    };
  }
}

/**
 * Get all tools from enabled skills for a user
 * Used to build the AI's tool list
 */
export async function getUserTools(userId: string, organizationId: string): Promise<{
  tools: any[];
  skillMap: Record<string, string>;
}> {
  const userSkills = await getUserSkills(userId);
  const tools: any[] = [];
  const skillMap: Record<string, string> = {}; // toolName -> skillId

  // Load built-in skill tools
  for (const userSkill of userSkills) {
    const skill = getSkill(userSkill.skillId);
    if (!skill) continue;

    for (const tool of skill.tools) {
      // Format for OpenAI function calling
      tools.push({
        type: "function",
        function: {
          name: `${skill.id}_${tool.name}`,
          description: `[${skill.name}] ${tool.description}`,
          parameters: tool.parameters,
        },
      });

      skillMap[`${skill.id}_${tool.name}`] = skill.id;
    }
  }

  // Load custom skill tools
  try {
    const customSkills = await loadCustomSkillsForUser(userId, organizationId);

    // Only include custom skills the user has enabled
    const enabledCustomIds = new Set(
      userSkills
        .filter((us) => us.skillId.startsWith("custom_"))
        .map((us) => us.skillId)
    );

    for (const skill of customSkills) {
      // Include if: user enabled it, or it's the user's own skill (auto-enabled)
      const isOwn = skill.author === userId;
      if (!isOwn && !enabledCustomIds.has(skill.id)) continue;

      for (const tool of skill.tools) {
        const toolKey = `${skill.id}_${tool.name}`;
        tools.push({
          type: "function",
          function: {
            name: toolKey,
            description: `[${skill.name}] ${tool.description}`,
            parameters: tool.parameters,
          },
        });

        skillMap[toolKey] = skill.id;
      }
    }
  } catch (error) {
    console.error("[Skills] Error loading custom skills:", error);
  }

  return { tools, skillMap };
}

/**
 * Build system prompt additions from enabled skills
 */
export async function getSkillSystemPrompt(userId: string, organizationId?: string): Promise<string> {
  const userSkills = await getUserSkills(userId);

  const skillPrompts: string[] = [];

  // Built-in skill prompts
  for (const userSkill of userSkills) {
    const skill = getSkill(userSkill.skillId);
    if (!skill?.systemPrompt) continue;

    skillPrompts.push(`## ${skill.name}\n${skill.systemPrompt}`);
  }

  // Custom skill prompts
  try {
    const customSkills = await loadCustomSkillsForUser(userId, organizationId);
    for (const skill of customSkills) {
      if (skill.systemPrompt) {
        skillPrompts.push(`## ${skill.name} (Custom)\n${skill.systemPrompt}`);
      }
    }
  } catch (error) {
    console.error("[Skills] Error loading custom skill prompts:", error);
  }

  if (skillPrompts.length === 0) {
    return "";
  }

  return `\n\n# Enabled Skills\n\n${skillPrompts.join("\n\n")}`;
}

// Initialize on module load
initializeSkillRegistry();
