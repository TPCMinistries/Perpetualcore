import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/tasks/[id]/dependencies
// Get all dependencies for a task
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;

    // Get dependencies with details about dependent tasks
    const { data: dependencies, error: depsError } = await supabase
      .from("task_dependencies")
      .select(`
        *,
        depends_on_task:tasks!task_dependencies_depends_on_task_id_fkey(
          id,
          title,
          status,
          priority
        )
      `)
      .eq("task_id", taskId);

    if (depsError) {
      console.error("Error fetching dependencies:", depsError);
      return NextResponse.json(
        { error: "Failed to fetch dependencies" },
        { status: 500 }
      );
    }

    return NextResponse.json({ dependencies: dependencies || [] });
  } catch (error) {
    console.error("Get dependencies API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/dependencies
// Add a dependency to a task
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;
    const body = await request.json();
    const { depends_on_task_id, dependency_type, is_hard, lag_days } = body;

    if (!depends_on_task_id) {
      return NextResponse.json(
        { error: "depends_on_task_id is required" },
        { status: 400 }
      );
    }

    // Get task to verify ownership and get organization_id
    const { data: task } = await supabase
      .from("tasks")
      .select("organization_id, user_id")
      .eq("id", taskId)
      .single();

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check for circular dependency using the database function
    const { data: isCircular } = await supabase.rpc("check_circular_dependency", {
      p_task_id: taskId,
      p_depends_on_task_id: depends_on_task_id,
    });

    if (isCircular) {
      return NextResponse.json(
        { error: "This would create a circular dependency" },
        { status: 400 }
      );
    }

    // Create dependency
    const { data: dependency, error: insertError } = await supabase
      .from("task_dependencies")
      .insert({
        task_id: taskId,
        depends_on_task_id,
        dependency_type: dependency_type || "finish_to_start",
        is_hard: is_hard !== undefined ? is_hard : true,
        lag_days: lag_days || 0,
        organization_id: task.organization_id,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating dependency:", insertError);
      return NextResponse.json(
        { error: "Failed to create dependency" },
        { status: 500 }
      );
    }

    return NextResponse.json({ dependency }, { status: 201 });
  } catch (error) {
    console.error("Create dependency API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
