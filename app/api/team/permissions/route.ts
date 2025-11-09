import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/team/permissions
 * Get all available permissions with role mappings
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all permissions
    const { data: permissions, error: permError } = await supabase
      .from("permissions")
      .select("*")
      .order("resource_type", { ascending: true })
      .order("action", { ascending: true });

    if (permError) {
      console.error("Error fetching permissions:", permError);
      return NextResponse.json(
        { error: "Failed to fetch permissions", details: permError.message },
        { status: 500 }
      );
    }

    // Get role permissions
    const { data: rolePermissions, error: roleError } = await supabase
      .from("role_permissions")
      .select(`
        *,
        permission:permissions(*)
      `);

    if (roleError) {
      console.error("Error fetching role permissions:", roleError);
      return NextResponse.json(
        { error: "Failed to fetch role permissions", details: roleError.message },
        { status: 500 }
      );
    }

    // Group role permissions by role
    const permissionsByRole = rolePermissions?.reduce((acc: any, rp) => {
      if (!acc[rp.role]) {
        acc[rp.role] = [];
      }
      acc[rp.role].push(rp.permission);
      return acc;
    }, {}) || {};

    return NextResponse.json({
      permissions: permissions || [],
      role_permissions: permissionsByRole
    });
  } catch (error: any) {
    console.error("Error in GET /api/team/permissions:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
