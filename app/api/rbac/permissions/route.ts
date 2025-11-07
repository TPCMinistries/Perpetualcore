import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/rbac/permissions
// Get all available permissions grouped by category
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all permissions with their groups
    const { data: permissions, error } = await supabase
      .from("permissions")
      .select(`
        *,
        permission_groups (
          id,
          name,
          description,
          icon,
          sort_order
        )
      `)
      .order("resource", { ascending: true })
      .order("action", { ascending: true });

    if (error) {
      console.error("Error fetching permissions:", error);
      return NextResponse.json(
        { error: "Failed to fetch permissions" },
        { status: 500 }
      );
    }

    // Group permissions by group
    const grouped = permissions?.reduce((acc, perm) => {
      const groupName = perm.permission_groups?.name || "Other";
      if (!acc[groupName]) {
        acc[groupName] = {
          group: perm.permission_groups,
          permissions: [],
        };
      }
      acc[groupName].permissions.push(perm);
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({ permissions, grouped });
  } catch (error) {
    console.error("Permissions GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}
