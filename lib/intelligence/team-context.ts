/**
 * Team Context Loader
 * Loads and applies team-specific AI context for context-aware AI responses
 */

import { createClient } from "@/lib/supabase/server";
import { TeamAIContext } from "@/types/work";

export interface LoadedTeamContext {
  teamId: string;
  teamName: string;
  teamEmoji?: string;
  teamColor: string;
  teamType: "department" | "project_team";
  aiContext: TeamAIContext;
}

export interface LoadedProjectContext {
  projectId: string;
  projectName: string;
  projectEmoji: string;
  currentStage: string;
  description?: string;
  teamContext?: LoadedTeamContext;
}

/**
 * Load team context from database
 */
export async function loadTeamContext(
  teamId: string
): Promise<LoadedTeamContext | null> {
  try {
    const supabase = await createClient();

    const { data: team, error } = await supabase
      .from("teams")
      .select("id, name, emoji, color, team_type, ai_context")
      .eq("id", teamId)
      .single();

    if (error || !team) {
      console.error("Error loading team context:", error);
      return null;
    }

    return {
      teamId: team.id,
      teamName: team.name,
      teamEmoji: team.emoji,
      teamColor: team.color,
      teamType: team.team_type,
      aiContext: team.ai_context as TeamAIContext,
    };
  } catch (error) {
    console.error("Error in loadTeamContext:", error);
    return null;
  }
}

/**
 * Load project context from database
 */
export async function loadProjectContext(
  projectId: string
): Promise<LoadedProjectContext | null> {
  try {
    const supabase = await createClient();

    const { data: project, error } = await supabase
      .from("projects")
      .select(
        `
        id,
        name,
        emoji,
        description,
        current_stage,
        team_id,
        teams:team_id (
          id,
          name,
          emoji,
          color,
          team_type,
          ai_context
        )
      `
      )
      .eq("id", projectId)
      .single();

    if (error || !project) {
      console.error("Error loading project context:", error);
      return null;
    }

    const team = (project as any).teams;
    let teamContext: LoadedTeamContext | undefined;

    if (team) {
      teamContext = {
        teamId: team.id,
        teamName: team.name,
        teamEmoji: team.emoji,
        teamColor: team.color,
        teamType: team.team_type,
        aiContext: team.ai_context as TeamAIContext,
      };
    }

    return {
      projectId: project.id,
      projectName: project.name,
      projectEmoji: project.emoji,
      currentStage: project.current_stage,
      description: project.description,
      teamContext,
    };
  } catch (error) {
    console.error("Error in loadProjectContext:", error);
    return null;
  }
}

/**
 * Load user's active team context from their profile
 */
export async function loadUserTeamContext(
  userId: string
): Promise<LoadedTeamContext | null> {
  try {
    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("active_team_context")
      .eq("id", userId)
      .single();

    if (error || !profile?.active_team_context) {
      return null;
    }

    return loadTeamContext(profile.active_team_context);
  } catch (error) {
    console.error("Error in loadUserTeamContext:", error);
    return null;
  }
}

/**
 * Build team-specific system prompt modifications
 */
export function buildTeamSystemPrompt(
  basePrompt: string,
  teamContext: LoadedTeamContext
): string {
  const { aiContext, teamName, teamType } = teamContext;

  // Build personality and role context
  const personalitySection = aiContext.personality
    ? `\n\n## Team Context: ${teamName}
You are currently operating within the context of the ${teamName} ${teamType === "department" ? "department" : "project team"}.

**Communication Style:** ${aiContext.personality}
`
    : "";

  // Build tone adjustments
  const toneSection = aiContext.prompts?.tone
    ? `**Tone:** Adapt your responses to be ${aiContext.prompts.tone}.
`
    : "";

  // Build focus areas
  const focusSection =
    aiContext.suggestions_focus && aiContext.suggestions_focus.length > 0
      ? `**Focus Areas:** When providing suggestions, prioritize topics related to: ${aiContext.suggestions_focus.join(", ")}.
`
      : "";

  // Build tool awareness
  const toolSection =
    aiContext.tools && aiContext.tools.length > 0
      ? `**Available Tools:** This team commonly uses: ${aiContext.tools.join(", ")}. Reference these when relevant.
`
      : "";

  // Combine all sections
  const teamModifications =
    personalitySection + toneSection + focusSection + toolSection;

  // Insert team context after the base prompt's introduction
  return basePrompt + teamModifications;
}

/**
 * Build project-specific system prompt modifications
 */
export function buildProjectSystemPrompt(
  basePrompt: string,
  projectContext: LoadedProjectContext
): string {
  const { projectName, currentStage, description, teamContext } = projectContext;

  // Stage-specific guidance
  const stageGuidance: Record<string, string> = {
    ideation:
      "The project is in the ideation phase. Focus on brainstorming, exploring possibilities, and helping refine the core concept.",
    planning:
      "The project is in the planning phase. Help with defining scope, creating timelines, identifying requirements, and breaking down work.",
    in_progress:
      "The project is actively being worked on. Focus on execution support, problem-solving, and maintaining momentum.",
    review:
      "The project is under review. Help with quality checks, gathering feedback, identifying improvements, and preparing for completion.",
    complete:
      "The project is complete. Focus on retrospectives, documentation, and identifying learnings for future projects.",
  };

  let projectSection = `\n\n## Project Context: ${projectName}
You are assisting with the "${projectName}" project.
`;

  if (description) {
    projectSection += `**Project Description:** ${description}\n`;
  }

  projectSection += `**Current Stage:** ${currentStage.replace("_", " ").toUpperCase()}
${stageGuidance[currentStage] || ""}
`;

  // Apply team context if available
  let finalPrompt = basePrompt + projectSection;

  if (teamContext) {
    finalPrompt = buildTeamSystemPrompt(finalPrompt, teamContext);
  }

  return finalPrompt;
}

/**
 * Get content filters for RAG based on team context
 */
export function getTeamContentFilters(
  teamContext: LoadedTeamContext | null
): string[] {
  if (!teamContext?.aiContext?.content_filters) {
    return [];
  }
  return teamContext.aiContext.content_filters;
}

/**
 * Get suggestion focus areas for intelligence system
 */
export function getTeamSuggestionFocus(
  teamContext: LoadedTeamContext | null
): string[] {
  if (!teamContext?.aiContext?.suggestions_focus) {
    return [];
  }
  return teamContext.aiContext.suggestions_focus;
}

/**
 * Check if a specific tool is available in team context
 */
export function isToolAvailableForTeam(
  toolName: string,
  teamContext: LoadedTeamContext | null
): boolean {
  if (!teamContext?.aiContext?.tools) {
    return true; // All tools available if no restrictions
  }

  // If tools array is empty, all tools are available
  if (teamContext.aiContext.tools.length === 0) {
    return true;
  }

  return teamContext.aiContext.tools.includes(toolName);
}

/**
 * Format team context for display in UI
 */
export function formatTeamContextForDisplay(
  teamContext: LoadedTeamContext
): string {
  return `${teamContext.teamEmoji || "👥"} ${teamContext.teamName}`;
}

/**
 * Default AI contexts for common department types
 */
export const DEFAULT_TEAM_AI_CONTEXTS: Record<string, TeamAIContext> = {
  marketing: {
    personality: "creative and engaging",
    tools: ["social_media", "content_calendar", "analytics"],
    prompts: { tone: "persuasive and brand-focused" },
    content_filters: ["marketing", "campaigns", "content"],
    suggestions_focus: [
      "content ideas",
      "campaign optimization",
      "audience engagement",
    ],
  },
  sales: {
    personality: "professional and results-driven",
    tools: ["crm", "email_templates", "pipeline"],
    prompts: { tone: "confident and solution-oriented" },
    content_filters: ["deals", "prospects", "revenue"],
    suggestions_focus: [
      "deal closing",
      "follow-up reminders",
      "prospect research",
    ],
  },
  operations: {
    personality: "efficient and process-oriented",
    tools: ["task_automation", "process_docs", "scheduling"],
    prompts: { tone: "clear and procedural" },
    content_filters: ["processes", "workflows", "operations"],
    suggestions_focus: [
      "workflow optimization",
      "resource allocation",
      "bottleneck identification",
    ],
  },
  engineering: {
    personality: "technical and precise",
    tools: ["code_review", "documentation", "debugging"],
    prompts: { tone: "accurate and detailed" },
    content_filters: ["code", "technical", "development"],
    suggestions_focus: [
      "code quality",
      "architecture decisions",
      "technical debt",
    ],
  },
  finance: {
    personality: "analytical and thorough",
    tools: ["spreadsheets", "reports", "forecasting"],
    prompts: { tone: "formal and data-driven" },
    content_filters: ["financial", "budget", "reports"],
    suggestions_focus: [
      "budget analysis",
      "cost optimization",
      "financial planning",
    ],
  },
  hr: {
    personality: "empathetic and supportive",
    tools: ["onboarding", "policies", "performance"],
    prompts: { tone: "warm and professional" },
    content_filters: ["people", "culture", "policies"],
    suggestions_focus: [
      "employee engagement",
      "policy compliance",
      "team culture",
    ],
  },
};
