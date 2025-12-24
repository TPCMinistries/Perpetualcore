import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTasks, extractTasksFromText, saveExtractedTasks } from "@/lib/tasks/extractor";
import { rateLimiters } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Fetch user's tasks
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limit: 100 requests per minute
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query params for filtering
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const projectId = searchParams.get("project_id") || undefined;
    const teamId = searchParams.get("team_id") || undefined;

    const tasks = await getUserTasks(user.id, { status, priority, projectId, teamId });

    return NextResponse.json({ tasks, count: tasks.length });
  } catch (error) {
    console.error("Tasks GET error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

/**
 * POST - Create a new task or extract tasks from text
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 100 requests per minute
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const body = await req.json();

    // Check if this is an AI extraction request
    if (body.extractFromText && body.text) {
      const extracted = await extractTasksFromText(
        body.text,
        user.id,
        body.sourceType || "manual",
        body.sourceId
      );

      const { savedCount } = await saveExtractedTasks(
        extracted,
        user.id,
        profile.organization_id,
        body.sourceType || "manual",
        body.sourceId
      );

      return NextResponse.json({
        success: true,
        extracted: extracted.length,
        saved: savedCount,
        tasks: extracted,
      });
    }

    // Manual task creation
    const taskData = {
      organization_id: profile.organization_id,
      user_id: user.id,
      title: body.title,
      description: body.description || null,
      priority: body.priority || "medium",
      status: body.status || "todo",
      execution_status: body.executionStatus || "pending",
      execution_type: body.executionType || "manual",
      due_date: body.dueDate || null,
      assigned_to_type: body.assignedToType || null,
      assigned_to_id: body.assignedToId || null,
      assigned_by: body.assignedToId ? user.id : null,
      workflow_id: body.workflowId || null,
      agent_id: body.agentId || null,
      automation_rules: body.automationRules || null,
      estimated_duration_minutes: body.estimatedDurationMinutes || null,
      parent_task_id: body.parentTaskId || null,
      project_name: body.projectName || null,
      project_id: body.projectId || null,
      team_id: body.teamId || null,
      tags: body.tags || [],
      source_type: "manual",
      execution_log: [],
      retry_count: 0,
      max_retries: body.maxRetries || 3,
    };

    const { data: task, error } = await supabase
      .from("tasks")
      .insert(taskData)
      .select()
      .single();

    if (error) {
      console.error("Task creation error:", error);
      return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Tasks POST error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

/**
 * PUT - Update a task
 */
export async function PUT(req: NextRequest) {
  try {
    // Rate limit: 100 requests per minute
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    // Add completed_at timestamp if status changed to completed
    if (updates.status === "completed" && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    const { data: task, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Task update error:", error);
      return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Tasks PUT error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

/**
 * DELETE - Delete a task
 */
export async function DELETE(req: NextRequest) {
  try {
    // Rate limit: 100 requests per minute
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error("Task delete error:", error);
      return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tasks DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
