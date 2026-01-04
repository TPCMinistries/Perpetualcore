/**
 * Migration Script: Create advisors for existing BOS 2.0 teams
 *
 * This script finds all teams that have a template_id but no primary_advisor_id
 * and creates a dedicated advisor for each one.
 *
 * Usage: npx ts-node scripts/migrate-teams-to-advisors.ts
 * Or: npx tsx scripts/migrate-teams-to-advisors.ts
 */

import { createClient } from "@supabase/supabase-js";
import { BOS_2_TEAM_TEMPLATES, TRADITIONAL_TEAM_TEMPLATES, TeamTemplate } from "../types/work";

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables:");
  console.error("- NEXT_PUBLIC_SUPABASE_URL");
  console.error("- SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get template by ID
function getTemplateById(templateId: string): TeamTemplate | null {
  const allTemplates = [...(BOS_2_TEAM_TEMPLATES || []), ...(TRADITIONAL_TEAM_TEMPLATES || [])];
  return allTemplates.find((t) => t.id === templateId) || null;
}

// Build advisor instructions
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

// Extract personality traits
function extractPersonalityTraits(context: any): string[] {
  const traits: string[] = [];
  if (context.personality) {
    const words = context.personality.split(/[,\s]+and\s+|\s*,\s*/);
    traits.push(...words.filter((w: string) => w.trim().length > 0));
  }
  return traits.slice(0, 5);
}

async function migrateTeams() {
  console.log("Starting migration: Creating advisors for existing BOS 2.0 teams...\n");

  // Find all teams with template_id but no primary_advisor_id
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("*")
    .not("template_id", "is", null)
    .is("primary_advisor_id", null);

  if (teamsError) {
    console.error("Error fetching teams:", teamsError);
    process.exit(1);
  }

  if (!teams || teams.length === 0) {
    console.log("No teams need migration. All BOS 2.0 teams already have advisors.");
    process.exit(0);
  }

  console.log(`Found ${teams.length} team(s) that need advisors:\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const team of teams) {
    console.log(`Processing: ${team.name} (template: ${team.template_id})`);

    const template = getTemplateById(team.template_id);
    if (!template) {
      console.log(`  - Skipped: Template "${team.template_id}" not found\n`);
      errorCount++;
      continue;
    }

    if (!template.ai_context) {
      console.log(`  - Skipped: Template has no AI context\n`);
      errorCount++;
      continue;
    }

    const context = template.ai_context;

    const advisorData = {
      organization_id: team.organization_id,
      user_id: team.created_by,
      name: `${team.name} Advisor`,
      description: `Dedicated AI advisor for the ${team.name} team. Specializes in ${template.name} operations with a ${context.personality} approach.`,
      role: template.id,
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

    // Create the advisor
    const { data: advisor, error: advisorError } = await supabase
      .from("ai_assistants")
      .insert(advisorData)
      .select()
      .single();

    if (advisorError) {
      console.log(`  - Error creating advisor: ${advisorError.message}\n`);
      errorCount++;
      continue;
    }

    // Link advisor to team
    const { error: updateError } = await supabase
      .from("teams")
      .update({ primary_advisor_id: advisor.id })
      .eq("id", team.id);

    if (updateError) {
      console.log(`  - Advisor created but failed to link: ${updateError.message}`);
      console.log(`  - Advisor ID: ${advisor.id}\n`);
      // Don't count as error since advisor was created
    } else {
      console.log(`  - Created: ${advisor.name}`);
      console.log(`  - Advisor ID: ${advisor.id}\n`);
    }

    successCount++;
  }

  console.log("\n=== Migration Complete ===");
  console.log(`Successfully created: ${successCount} advisor(s)`);
  console.log(`Errors/Skipped: ${errorCount}`);
}

// Run migration
migrateTeams().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
