import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: workspaces, error } = await supabase
      .from("user_workspaces")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ workspaces: workspaces || [] });
  } catch (error) {
    console.error("Workspaces GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspace } = body;

    if (!workspace || !workspace.name) {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      );
    }

    // Check if this is an update or create
    const { data: existing } = await supabase
      .from("user_workspaces")
      .select("id")
      .eq("user_id", user.id)
      .eq("id", workspace.id)
      .single();

    let result;
    if (existing) {
      // Update
      result = await supabase
        .from("user_workspaces")
        .update({
          name: workspace.name,
          config: {
            description: workspace.description,
            icon: workspace.icon,
            prioritizedSections: workspace.prioritizedSections,
            hiddenSections: workspace.hiddenSections,
            hiddenItems: workspace.hiddenItems,
            silentNotifications: workspace.silentNotifications,
            aiMode: workspace.aiMode,
          },
          is_default: workspace.isDefault || false,
        })
        .eq("id", workspace.id)
        .eq("user_id", user.id)
        .select()
        .single();
    } else {
      // Create
      result = await supabase
        .from("user_workspaces")
        .insert({
          user_id: user.id,
          name: workspace.name,
          config: {
            description: workspace.description,
            icon: workspace.icon,
            prioritizedSections: workspace.prioritizedSections,
            hiddenSections: workspace.hiddenSections,
            hiddenItems: workspace.hiddenItems,
            silentNotifications: workspace.silentNotifications,
            aiMode: workspace.aiMode,
          },
          is_default: workspace.isDefault || false,
        })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    return NextResponse.json({ workspace: result.data });
  } catch (error) {
    console.error("Workspaces POST error:", error);
    return NextResponse.json(
      { error: "Failed to save workspace" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("id");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("user_workspaces")
      .delete()
      .eq("id", workspaceId)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Workspaces DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete workspace" },
      { status: 500 }
    );
  }
}
