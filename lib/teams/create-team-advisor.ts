import { SupabaseClient } from "@supabase/supabase-js";
import { Team, TeamTemplate, TeamAIContext } from "@/types/work";

/**
 * Builds system instructions for a team advisor based on the template
 */
function buildAdvisorInstructions(
  team: { name: string; description?: string },
  template: TeamTemplate
): string {
  const context = template.ai_context;
  const workflowDescription = template.workflow_stages
    ?.map((s) => `${s.name} (${s.description || "stage " + s.order})`)
    .join(" → ");

  return `You are the AI Advisor for the "${team.name}" team.

## Your Role
You are a ${context.personality} advisor specializing in ${template.name} operations. Your communication style is ${context.prompts?.tone || "professional and helpful"}.

## Team Context
${team.description || template.description}

## Your Focus Areas
${context.suggestions_focus?.map((f) => `- ${f}`).join("\n") || "- General team assistance"}

## Core Responsibilities
${context.prompts?.focus || "Help the team achieve their goals efficiently."}

${workflowDescription ? `## Workflow Stages\nItems in this team flow through: ${workflowDescription}` : ""}

## Available Tools
${context.tools?.length ? context.tools.map((t) => `- ${t.replace(/_/g, " ")}`).join("\n") : "- General AI assistance"}

## Guidelines
1. Stay focused on ${template.name} domain topics
2. Provide actionable, specific advice
3. Reference team workflows and stages when relevant
4. Proactively identify bottlenecks and opportunities
5. Maintain the ${context.prompts?.tone || "professional"} tone consistently

Remember: You are a dedicated advisor for this team. Be helpful, be specific, and always consider the team's goals.`;
}

/**
 * Extracts personality traits from template AI context
 */
function extractPersonalityTraits(context: TeamAIContext): string[] {
  const traits: string[] = [];

  // Parse personality string into traits
  if (context.personality) {
    const words = context.personality.split(/[,\s]+and\s+|\s*,\s*/);
    traits.push(...words.filter((w) => w.trim().length > 0));
  }

  return traits.slice(0, 5); // Limit to 5 traits
}

/**
 * Creates a dedicated AI advisor for a team
 */
export async function createTeamAdvisor(
  supabase: SupabaseClient,
  team: Team,
  template: TeamTemplate,
  createdBy: string
): Promise<{ advisor: any; error: any }> {
  const context = template.ai_context;

  const advisorData = {
    organization_id: team.organization_id,
    user_id: createdBy,
    name: `${team.name} Advisor`,
    description: `Dedicated AI advisor for the ${team.name} team. Specializes in ${template.name} operations with a ${context.personality} approach.`,
    role: template.id, // e.g., 'sales-engine', 'opportunities-engine'
    avatar_emoji: template.emoji,
    personality_traits: extractPersonalityTraits(context),
    tone: context.prompts?.tone?.includes("formal")
      ? "formal"
      : context.prompts?.tone?.includes("friendly")
      ? "friendly"
      : "professional",
    verbosity: "balanced",
    system_instructions: buildAdvisorInstructions(team, template),
    context_knowledge: context.suggestions_focus?.join(", ") || template.description,
    example_interactions: [],
    capabilities: context.tools || [],
    tools_enabled: {},
    model_preference: "claude-3-5-sonnet-20241022",
    temperature: 0.7,
    max_tokens: 2500,
    team_id: team.id,
    advisor_type: "dedicated",
    enabled: true,
    is_public: false,
    is_featured: false,
  };

  const { data: advisor, error } = await supabase
    .from("ai_assistants")
    .insert(advisorData)
    .select()
    .single();

  if (error) {
    console.error("Error creating team advisor:", error);
    return { advisor: null, error };
  }

  // Update the team with the primary advisor ID
  const { error: updateError } = await supabase
    .from("teams")
    .update({ primary_advisor_id: advisor.id })
    .eq("id", team.id);

  if (updateError) {
    console.error("Error linking advisor to team:", updateError);
    // Don't fail - advisor was created, just not linked
  }

  return { advisor, error: null };
}

/**
 * Gets the template by ID from the BOS_TEMPLATES or TRADITIONAL_TEMPLATES
 */
export function getTemplateById(templateId: string): TeamTemplate | null {
  // Import templates from types/work.ts
  const { BOS_2_TEAM_TEMPLATES, TRADITIONAL_TEAM_TEMPLATES } = require("@/types/work");

  const allTemplates = [...(BOS_2_TEAM_TEMPLATES || []), ...(TRADITIONAL_TEAM_TEMPLATES || [])];
  return allTemplates.find((t: TeamTemplate) => t.id === templateId) || null;
}
