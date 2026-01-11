import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/inbox/folders/setup - Create default smart folders
export async function POST() {
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

    // Default smart folders
    const defaultFolders = [
      {
        name: "Priority",
        slug: "priority",
        icon: "alert-circle",
        color: "#ef4444",
        folder_type: "smart",
        is_smart: true,
        smart_rules: { priority_min: 0.7, categories: ["urgent", "important"] },
        sort_order: 1,
      },
      {
        name: "Needs Reply",
        slug: "needs-reply",
        icon: "reply",
        color: "#f59e0b",
        folder_type: "smart",
        is_smart: true,
        smart_rules: { requires_response: true },
        sort_order: 2,
      },
      {
        name: "Newsletters",
        slug: "newsletters",
        icon: "newspaper",
        color: "#8b5cf6",
        folder_type: "smart",
        is_smart: true,
        smart_rules: { categories: ["newsletter", "promotional"] },
        sort_order: 3,
      },
      {
        name: "Clients",
        slug: "clients",
        icon: "users",
        color: "#10b981",
        folder_type: "custom",
        is_smart: false,
        smart_rules: null,
        sort_order: 4,
      },
      {
        name: "Projects",
        slug: "projects",
        icon: "briefcase",
        color: "#3b82f6",
        folder_type: "custom",
        is_smart: false,
        smart_rules: null,
        sort_order: 5,
      },
    ];

    const foldersToInsert = defaultFolders.map((f) => ({
      ...f,
      organization_id: profile.organization_id,
      user_id: user.id,
    }));

    const { data: folders, error } = await supabase
      .from("email_folders")
      .upsert(foldersToInsert, { onConflict: "user_id,slug" })
      .select();

    if (error) throw error;

    return NextResponse.json({ folders, message: "Default folders created" });
  } catch (error) {
    console.error("Setup folders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
