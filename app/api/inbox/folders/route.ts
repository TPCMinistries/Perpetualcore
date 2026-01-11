import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/inbox/folders - List all folders with email counts
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get folders with counts
    const { data: folders, error } = await supabase
      .from("email_folders")
      .select(`
        *,
        email_folder_assignments(count)
      `)
      .eq("user_id", user.id)
      .order("sort_order");

    if (error) {
      // If table doesn't exist yet, return empty
      if (error.code === "42P01") {
        return NextResponse.json({ folders: [], needsSetup: true });
      }
      throw error;
    }

    // If no folders exist for user, trigger setup
    if (!folders || folders.length === 0) {
      return NextResponse.json({ folders: [], needsSetup: true });
    }

    // Get unread counts for each folder
    const foldersWithCounts = await Promise.all(
      (folders || []).map(async (folder) => {
        const { count: unreadCount } = await supabase
          .from("email_folder_assignments")
          .select("*, emails!inner(is_read)", { count: "exact", head: true })
          .eq("folder_id", folder.id)
          .eq("emails.is_read", false);

        return {
          ...folder,
          email_count: folder.email_folder_assignments?.[0]?.count || 0,
          unread_count: unreadCount || 0,
        };
      })
    );

    return NextResponse.json({ folders: foldersWithCounts });
  } catch (error) {
    console.error("List folders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/inbox/folders - Create a new folder
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const body = await request.json();
    const { name, color, icon, is_smart, smart_rules } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const { data: folder, error } = await supabase
      .from("email_folders")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        name,
        slug,
        color: color || "#6366f1",
        icon: icon || "folder",
        folder_type: is_smart ? "smart" : "custom",
        is_smart: is_smart || false,
        smart_rules: smart_rules || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Folder already exists" }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error("Create folder error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
