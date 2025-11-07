import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/rbac/roles
// Get all roles for the organization
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get all roles for the organization with permission counts
    const { data: roles, error } = await supabase
      .from("roles")
      .select(`
        *,
        role_permissions (
          count
        )
      `)
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching roles:", error);
      return NextResponse.json(
        { error: "Failed to fetch roles" },
        { status: 500 }
      );
    }

    // Format the response
    const formattedRoles = roles?.map((role) => ({
      ...role,
      permission_count: role.role_permissions?.[0]?.count || 0,
    }));

    return NextResponse.json({ roles: formattedRoles });
  } catch (error) {
    console.error("Roles GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

// POST /api/rbac/roles
// Create a new role
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization and role
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Only admins and owners can create roles
    if (!["owner", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, description, permission_ids = [] } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Create role
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .insert({
        organization_id: profile.organization_id,
        name,
        slug,
        description,
        is_system_role: false,
        created_by: user.id,
      })
      .select()
      .single();

    if (roleError) {
      console.error("Error creating role:", roleError);
      return NextResponse.json(
        { error: "Failed to create role" },
        { status: 500 }
      );
    }

    // Add permissions to role
    if (permission_ids.length > 0) {
      const rolePermissions = permission_ids.map((permissionId: string) => ({
        role_id: role.id,
        permission_id: permissionId,
      }));

      const { error: permError } = await supabase
        .from("role_permissions")
        .insert(rolePermissions);

      if (permError) {
        console.error("Error adding permissions:", permError);
      }
    }

    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    console.error("Role POST error:", error);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
}
