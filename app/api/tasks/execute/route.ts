import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChatCompletion } from "@/lib/ai/router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/tasks/execute
 * Autonomous task execution endpoint - demonstrates Phase 2 (Workflows)
 *
 * This is a simplified example showing how tasks move from passive to active:
 * - AI decides if task is executable
 * - Breaks complex tasks into subtasks
 * - Actually executes simple tasks (like drafting emails)
 * - Logs execution history
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await req.json();

    if (!taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    // Fetch the task
    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (fetchError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if task is executable
    if (task.execution_type === "manual") {
      return NextResponse.json(
        { error: "Task is marked as manual - cannot execute autonomously" },
        { status: 400 }
      );
    }

    if (task.execution_status !== "pending" && task.execution_status !== "queued") {
      return NextResponse.json(
        { error: `Task cannot be executed - current status: ${task.execution_status}` },
        { status: 400 }
      );
    }

    // Mark task as started
    await supabase.rpc("start_task_execution", {
      task_id: taskId,
      executor_id: user.id,
      executor_type: "workflow",
    });

    // Analyze task to determine execution strategy
    const analysisPrompt = `Analyze this task and determine how to execute it:

**Task Details:**
Title: ${task.title}
Description: ${task.description || "No description"}
Priority: ${task.priority}
Execution Type: ${task.execution_type}

**Your Job:**
1. Determine if this task is simple enough to execute immediately or needs to be broken down
2. If it's a task you can execute (like drafting an email, creating a document outline, generating a report), do it
3. If it's too complex or requires external actions (like scheduling meetings, making purchases), break it into subtasks

**Response Format (JSON):**
{
  "executable": true/false,
  "executionStrategy": "immediate" | "decompose" | "blocked",
  "result": "... actual result if executable ...",
  "subtasks": [ {title, description, execution_type}... ] if needs decomposition,
  "blockingReason": "..." if blocked,
  "confidence": 0.0-1.0
}

Examples of EXECUTABLE tasks:
- "Draft email to customer about product delay"
- "Create project status report outline"
- "Summarize meeting notes"
- "Write social media post"
- "Generate invoice description"

Examples of NEEDS DECOMPOSITION:
- "Plan Q4 marketing campaign" → break into research, strategy, budget, timeline subtasks
- "Onboard new employee" → break into account setup, training schedule, equipment order
- "Launch new product" → break into multiple phases

Examples of BLOCKED:
- "Buy office supplies" → needs human approval/payment
- "Schedule meeting with CEO" → needs access to calendar systems`;

    const analysis = await getChatCompletion("gpt-4o-mini", [
      {
        role: "system",
        content:
          "You are an AI task execution engine. Analyze tasks and either execute them or break them down. Always respond with valid JSON only.",
      },
      { role: "user", content: analysisPrompt },
    ]);

    // Parse AI response
    const jsonMatch = analysis.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse execution analysis");
    }

    const executionPlan = JSON.parse(jsonMatch[0]);

    // Handle different execution strategies
    if (executionPlan.executionStrategy === "immediate" && executionPlan.executable) {
      // Task can be executed immediately
      await supabase.rpc("complete_task_execution", {
        task_id: taskId,
        result_data: {
          strategy: "immediate",
          result: executionPlan.result,
          confidence: executionPlan.confidence,
          ai_model: "gpt-4o-mini",
        },
      });

      return NextResponse.json({
        success: true,
        strategy: "immediate",
        result: executionPlan.result,
        message: "Task executed successfully",
      });
    } else if (executionPlan.executionStrategy === "decompose") {
      // Task needs to be broken down into subtasks
      const subtaskIds: string[] = [];

      for (const subtask of executionPlan.subtasks || []) {
        const { data: newSubtask } = await supabase.rpc("create_subtask", {
          parent_id: taskId,
          subtask_title: subtask.title,
          subtask_description: subtask.description || null,
          subtask_priority: task.priority,
          subtask_execution_type: subtask.execution_type || "semi_automated",
        });

        if (newSubtask) {
          subtaskIds.push(newSubtask);
        }
      }

      // Mark parent task as completed (subtasks are now the work)
      await supabase.rpc("complete_task_execution", {
        task_id: taskId,
        result_data: {
          strategy: "decompose",
          subtask_count: subtaskIds.length,
          subtask_ids: subtaskIds,
        },
      });

      return NextResponse.json({
        success: true,
        strategy: "decompose",
        subtasks: executionPlan.subtasks,
        subtaskIds,
        message: `Task decomposed into ${subtaskIds.length} subtasks`,
      });
    } else if (executionPlan.executionStrategy === "blocked") {
      // Task is blocked - needs human intervention
      await supabase.rpc("block_task_execution", {
        task_id: taskId,
        reason: executionPlan.blockingReason || "Requires human intervention",
      });

      return NextResponse.json({
        success: false,
        strategy: "blocked",
        reason: executionPlan.blockingReason,
        message: "Task blocked - requires human action",
      });
    } else {
      // Unknown strategy
      await supabase.rpc("fail_task_execution", {
        task_id: taskId,
        error_message: "AI could not determine execution strategy",
        should_retry: false,
      });

      return NextResponse.json(
        { error: "Could not determine how to execute this task" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Task execution error:", error);
    return NextResponse.json(
      { error: "Failed to execute task", details: error },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tasks/execute?organizationId=xxx
 * Get all executable tasks for an organization (ready for autonomous execution)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    // Get executable tasks
    const { data: executableTasks, error } = await supabase.rpc("get_executable_tasks", {
      for_organization_id: profile.organization_id,
      execution_type_filter: null, // Get all types
    });

    if (error) {
      console.error("Error fetching executable tasks:", error);
      return NextResponse.json(
        { error: "Failed to fetch executable tasks" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tasks: executableTasks || [],
      count: executableTasks?.length || 0,
    });
  } catch (error) {
    console.error("GET executable tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch executable tasks" },
      { status: 500 }
    );
  }
}
