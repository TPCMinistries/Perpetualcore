import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/decisions/[id]/tasks - Get all tasks linked to a decision
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: decisionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify decision exists and user has access
    const { data: decision, error: decisionError } = await supabase
      .from("decisions")
      .select("id, title")
      .eq("id", decisionId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (decisionError || !decision) {
      return NextResponse.json({ error: "Decision not found" }, { status: 404 });
    }

    // Get tasks linked to this decision (simple query without FK join)
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("decision_id", decisionId)
      .order("created_at", { ascending: false });

    if (tasksError) {
      console.error("Error fetching decision tasks:", tasksError);
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }

    // Get assignee names separately if there are assigned tasks
    const assignedUserIds = (tasks || [])
      .filter((t: any) => t.assigned_to)
      .map((t: any) => t.assigned_to);

    let userMap: Record<string, string> = {};
    if (assignedUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", assignedUserIds);

      if (profiles) {
        userMap = Object.fromEntries(profiles.map(p => [p.id, p.full_name]));
      }
    }

    // Format the response
    const formattedTasks = (tasks || []).map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      assigned_to: task.assigned_to,
      assigned_to_name: task.assigned_to ? userMap[task.assigned_to] || null : null,
      created_at: task.created_at,
      completed_at: task.completed_at,
    }));

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error) {
    console.error("Get decision tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/decisions/[id]/tasks - Create a task from a decision
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: decisionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify decision exists and user has access
    const { data: decision, error: decisionError } = await supabase
      .from("decisions")
      .select("id, title, description, priority, due_date")
      .eq("id", decisionId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (decisionError || !decision) {
      return NextResponse.json({ error: "Decision not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      priority,
      due_date,
      assigned_to,
    } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Create the task linked to this decision
    // Use only core columns that definitely exist
    const taskData: Record<string, unknown> = {
      organization_id: profile.organization_id,
      user_id: user.id,
      title: title.trim(),
      description: description || null,
      priority: priority || decision.priority || "medium",
      due_date: due_date || decision.due_date || null,
      status: "todo",
      decision_id: decisionId,
    };

    // Add optional columns if provided
    if (assigned_to) {
      taskData.assigned_to = assigned_to;
    }

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert(taskData)
      .select()
      .single();

    if (taskError) {
      console.error("Error creating task:", taskError);
      return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }

    // Record the event on the decision (use 'updated' since 'task_created' may not exist)
    try {
      await supabase.from("decision_events").insert({
        decision_id: decisionId,
        event_type: "updated",
        comment: `Task created: ${title}`,
        performed_by: user.id,
        performed_by_system: false,
        metadata: { task_id: task.id, task_title: title },
      });
    } catch (eventError) {
      console.warn("Could not record decision event:", eventError);
    }

    // Create relationship in item_relationships (may not exist in all deployments)
    try {
      await supabase.from("item_relationships").insert({
        source_type: "decision",
        source_id: decisionId,
        target_type: "task",
        target_id: task.id,
        relationship_type: "spawned",
        description: "Task created from decision",
        created_by: user.id,
      });
    } catch (relError) {
      console.warn("Could not create item relationship:", relError);
    }

    return NextResponse.json({
      task,
      message: "Task created successfully from decision",
    }, { status: 201 });
  } catch (error) {
    console.error("Create task from decision error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
