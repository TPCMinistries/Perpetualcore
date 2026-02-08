import { createClient } from "@/lib/supabase/server";
import { ProjectWithDetails } from "@/types/work";

export interface ProjectContext {
  projectId: string;
  projectName: string;
  projectDescription?: string;
  currentStage: string;
  teamName?: string;
  teamEmoji?: string;
  milestones: Array<{
    name: string;
    stage: string;
    dueDate?: string;
    completed: boolean;
  }>;
  taskStats: {
    total: number;
    completed: number;
  };
  aiContext?: Record<string, unknown>;
}

/**
 * Load project context for AI
 */
export async function loadProjectContext(projectId: string): Promise<ProjectContext | null> {
  try {
    const supabase = await createClient();

    const { data: project, error } = await supabase
      .from("projects")
      .select(`
        id,
        name,
        description,
        current_stage,
        priority,
        ai_context,
        team:teams (
          name,
          emoji,
          ai_context
        ),
        milestones:project_milestones (
          name,
          stage,
          due_date,
          completed_at
        )
      `)
      .eq("id", projectId)
      .single();

    if (error || !project) {
      console.error("Error loading project context:", error);
      return null;
    }

    // Get task stats
    const { count: totalTasks } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    const { count: completedTasks } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("status", "completed");

    return {
      projectId: project.id,
      projectName: project.name,
      projectDescription: project.description,
      currentStage: project.current_stage,
      teamName: (project.team as { name?: string; emoji?: string } | null)?.name,
      teamEmoji: (project.team as { name?: string; emoji?: string } | null)?.emoji,
      milestones: ((project.milestones as Array<{ name: string; stage: string; due_date?: string; completed_at?: string }>) || []).map((m) => ({
        name: m.name,
        stage: m.stage,
        dueDate: m.due_date,
        completed: !!m.completed_at,
      })),
      taskStats: {
        total: totalTasks || 0,
        completed: completedTasks || 0,
      },
      aiContext: project.ai_context,
    };
  } catch (error) {
    console.error("Error in loadProjectContext:", error);
    return null;
  }
}

/**
 * Build system prompt for project assistant
 */
export function buildProjectSystemPrompt(
  basePrompt: string,
  context: ProjectContext
): string {
  const stageLabels: Record<string, string> = {
    ideation: "Ideation",
    planning: "Planning",
    in_progress: "In Progress",
    review: "Review",
    complete: "Complete",
  };

  const milestonesText = context.milestones.length > 0
    ? context.milestones
        .map((m) => `- ${m.name} (${stageLabels[m.stage] || m.stage})${m.completed ? " [COMPLETED]" : m.dueDate ? ` (Due: ${m.dueDate})` : ""}`)
        .join("\n")
    : "No milestones defined yet.";

  const progressPercent = context.taskStats.total > 0
    ? Math.round((context.taskStats.completed / context.taskStats.total) * 100)
    : 0;

  const projectContext = `
## Project Context

You are the AI assistant for the project "${context.projectName}".

**Current Stage:** ${stageLabels[context.currentStage] || context.currentStage}
${context.teamName ? `**Team:** ${context.teamEmoji || ""} ${context.teamName}` : ""}
${context.projectDescription ? `**Description:** ${context.projectDescription}` : ""}

**Progress:**
- Tasks: ${context.taskStats.completed}/${context.taskStats.total} completed (${progressPercent}%)

**Milestones:**
${milestonesText}

## Your Role

You are helping manage this project. You can:
1. Create tasks for this project
2. Create milestones
3. Update project stage
4. Answer questions about the project
5. Help with planning and organization

When creating tasks or milestones, they will be automatically linked to this project.
Be proactive in suggesting next steps based on the current stage.
`;

  return `${basePrompt}\n\n${projectContext}`;
}

/**
 * Get stage-appropriate suggestions
 */
export function getStageSuggestions(stage: string): string[] {
  const suggestions: Record<string, string[]> = {
    ideation: [
      "Help brainstorm project ideas",
      "Define project goals",
      "Create initial milestones",
      "Identify key stakeholders",
    ],
    planning: [
      "Break down work into tasks",
      "Set milestone deadlines",
      "Assign team responsibilities",
      "Create a project timeline",
    ],
    in_progress: [
      "Review task progress",
      "Check milestone status",
      "Identify blockers",
      "Update task priorities",
    ],
    review: [
      "Summarize completed work",
      "Review remaining tasks",
      "Prepare for completion",
      "Document lessons learned",
    ],
    complete: [
      "Archive project materials",
      "Generate project summary",
      "Review final outcomes",
      "Document achievements",
    ],
  };

  return suggestions[stage] || suggestions.ideation;
}
