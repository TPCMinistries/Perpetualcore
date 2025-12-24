import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { CreateMilestoneRequest, UpdateMilestoneRequest } from "@/types/work";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

// GET /api/projects/[projectId]/milestones - Get project milestones
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: milestones, error } = await supabase
      .from("project_milestones")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("Error fetching milestones:", error);
      return NextResponse.json(
        { error: "Failed to fetch milestones" },
        { status: 500 }
      );
    }

    return NextResponse.json({ milestones: milestones || [] });
  } catch (error) {
    console.error("Milestones API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/milestones - Create milestone
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateMilestoneRequest = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Milestone name is required" },
        { status: 400 }
      );
    }

    // Check permissions
    const { data: project } = await supabase
      .from("projects")
      .select("id, created_by")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    const isAdmin = ["admin", "owner"].includes(profile?.user_role || "");
    const isCreator = project.created_by === user.id;

    const { data: membership } = await supabase
      .from("project_members")
      .select("role, can_manage_milestones")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .single();

    const canManage =
      isAdmin ||
      isCreator ||
      membership?.can_manage_milestones ||
      ["owner", "lead"].includes(membership?.role || "");

    if (!canManage) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Get next sort order
    const { data: lastMilestone } = await supabase
      .from("project_milestones")
      .select("sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = (lastMilestone?.sort_order || 0) + 1;

    const { data: milestone, error } = await supabase
      .from("project_milestones")
      .insert({
        project_id: projectId,
        name: body.name.trim(),
        description: body.description,
        due_date: body.due_date,
        stage: body.stage,
        is_key_milestone: body.is_key_milestone ?? false,
        sort_order: nextSortOrder,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating milestone:", error);
      return NextResponse.json(
        { error: "Failed to create milestone" },
        { status: 500 }
      );
    }

    return NextResponse.json({ milestone }, { status: 201 });
  } catch (error) {
    console.error("Milestones API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[projectId]/milestones?id=xxx - Update milestone
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const milestoneId = searchParams.get("id");

    if (!milestoneId) {
      return NextResponse.json(
        { error: "Milestone id is required" },
        { status: 400 }
      );
    }

    const body: UpdateMilestoneRequest = await request.json();

    // Check permissions
    const { data: project } = await supabase
      .from("projects")
      .select("id, created_by")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    const isAdmin = ["admin", "owner"].includes(profile?.user_role || "");
    const isCreator = project.created_by === user.id;

    const { data: membership } = await supabase
      .from("project_members")
      .select("role, can_manage_milestones")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .single();

    const canManage =
      isAdmin ||
      isCreator ||
      membership?.can_manage_milestones ||
      ["owner", "lead"].includes(membership?.role || "");

    if (!canManage) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.due_date !== undefined) updateData.due_date = body.due_date;
    if (body.completed_at !== undefined) updateData.completed_at = body.completed_at;
    if (body.stage !== undefined) updateData.stage = body.stage;
    if (body.is_key_milestone !== undefined) updateData.is_key_milestone = body.is_key_milestone;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;

    const { data: milestone, error } = await supabase
      .from("project_milestones")
      .update(updateData)
      .eq("id", milestoneId)
      .eq("project_id", projectId)
      .select()
      .single();

    if (error) {
      console.error("Error updating milestone:", error);
      return NextResponse.json(
        { error: "Failed to update milestone" },
        { status: 500 }
      );
    }

    return NextResponse.json({ milestone });
  } catch (error) {
    console.error("Milestones API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/milestones?id=xxx - Delete milestone
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const milestoneId = searchParams.get("id");

    if (!milestoneId) {
      return NextResponse.json(
        { error: "Milestone id is required" },
        { status: 400 }
      );
    }

    // Check permissions
    const { data: project } = await supabase
      .from("projects")
      .select("id, created_by")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .single();

    const isAdmin = ["admin", "owner"].includes(profile?.user_role || "");
    const isCreator = project.created_by === user.id;

    const { data: membership } = await supabase
      .from("project_members")
      .select("role, can_manage_milestones")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .single();

    const canManage =
      isAdmin ||
      isCreator ||
      membership?.can_manage_milestones ||
      ["owner", "lead"].includes(membership?.role || "");

    if (!canManage) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("project_milestones")
      .delete()
      .eq("id", milestoneId)
      .eq("project_id", projectId);

    if (error) {
      console.error("Error deleting milestone:", error);
      return NextResponse.json(
        { error: "Failed to delete milestone" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Milestones API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
