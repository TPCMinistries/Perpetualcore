import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch members of this entity project
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns this project
    const { data: project } = await supabase
      .from("entity_projects")
      .select("id, owner_id")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if entity_project_members table exists, if not return owner as only member
    const { data: members, error } = await supabase
      .from("entity_project_members")
      .select(`
        id,
        role,
        added_at,
        user:profiles (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq("project_id", projectId);

    if (error) {
      // Table might not exist, return owner as default member
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .eq("id", user.id)
        .single();

      return NextResponse.json({
        members: ownerProfile ? [{
          id: "owner",
          role: "owner",
          user_id: user.id,
          user: ownerProfile
        }] : []
      });
    }

    // Add owner if not in members list
    const ownerInList = members?.some((m: any) => m.user?.id === user.id);
    if (!ownerInList) {
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .eq("id", user.id)
        .single();

      if (ownerProfile) {
        members?.unshift({
          id: "owner",
          role: "owner",
          user: ownerProfile,
          added_at: project.created_at
        } as any);
      }
    }

    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error("Entity project members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Add a member to this entity project
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { user_id, role = "member" } = body;

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // Verify user owns this project
    const { data: project } = await supabase
      .from("entity_projects")
      .select("id, owner_id")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Add member to project
    const { data, error } = await supabase
      .from("entity_project_members")
      .insert({
        project_id: projectId,
        user_id,
        role,
        added_by: user.id,
      })
      .select(`
        id,
        role,
        added_at,
        user:profiles (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "User is already a member" }, { status: 400 });
      }
      // Table might not exist
      if (error.code === "42P01") {
        return NextResponse.json({ error: "Members feature not yet available" }, { status: 501 });
      }
      console.error("Error adding member:", error);
      return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
    }

    return NextResponse.json({ member: data }, { status: 201 });
  } catch (error) {
    console.error("Add project member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove a member from this entity project
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // Verify user owns this project
    const { data: project } = await supabase
      .from("entity_projects")
      .select("id, owner_id")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Cannot remove owner
    if (userId === user.id) {
      return NextResponse.json({ error: "Cannot remove project owner" }, { status: 400 });
    }

    // Remove member
    const { error } = await supabase
      .from("entity_project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error removing member:", error);
      return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove project member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
