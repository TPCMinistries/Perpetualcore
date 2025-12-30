import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/team/members/[id]/permissions
 * Get a user's permissions (role-based + overrides)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "User has no organization" }, { status: 400 });
    }

    // Get target user
    const { data: targetUser } = await supabase
      .from("profiles")
      .select("id, organization_id, role, full_name, email")
      .eq("id", params.id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: "User not in your organization" }, { status: 403 });
    }

    // Get role-based permissions
    const { data: rolePermissions } = await supabase
      .from("role_permissions")
      .select(`
        *,
        permission:permissions(*)
      `)
      .eq("role", targetUser.role);

    // Get user-specific permission overrides
    const { data: userPermissions } = await supabase
      .from("user_permissions")
      .select(`
        *,
        permission:permissions(*),
        granted_by_profile:profiles!user_permissions_granted_by_fkey(
          full_name,
          email
        )
      `)
      .eq("user_id", params.id)
      .order("granted_at", { ascending: false });

    return NextResponse.json({
      user: {
        id: targetUser.id,
        full_name: targetUser.full_name,
        email: targetUser.email,
        role: targetUser.role
      },
      role_permissions: rolePermissions?.map(rp => rp.permission) || [],
      user_permissions: userPermissions || []
    });
  } catch (error: any) {
    console.error("Error in GET /api/team/members/[id]/permissions:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/team/members/[id]/permissions
 * Grant a permission to a user
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization and role
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "User has no organization" }, { status: 400 });
    }

    // Check permissions (admin or owner)
    if (!["admin", "owner"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Verify target user is in same organization
    const { data: targetUser } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", params.id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: "User not in your organization" }, { status: 403 });
    }

    const body = await req.json();
    const { permission_id, resource_id, granted, expires_at } = body;

    if (!permission_id) {
      return NextResponse.json({ error: "Permission ID is required" }, { status: 400 });
    }

    // Verify permission exists
    const { data: permission } = await supabase
      .from("permissions")
      .select("id")
      .eq("id", permission_id)
      .single();

    if (!permission) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    }

    // Upsert user permission
    const { data: userPermission, error } = await supabase
      .from("user_permissions")
      .upsert({
        user_id: params.id,
        permission_id,
        resource_id: resource_id || null,
        granted: granted !== undefined ? granted : true,
        granted_by: user.id,
        expires_at: expires_at || null
      }, {
        onConflict: "user_id,permission_id,resource_id"
      })
      .select(`
        *,
        permission:permissions(*),
        granted_by_profile:profiles!user_permissions_granted_by_fkey(
          full_name,
          email
        )
      `)
      .single();

    if (error) {
      console.error("Error granting permission:", error);
      return NextResponse.json(
        { error: "Failed to grant permission", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ permission: userPermission }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/team/members/[id]/permissions:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/team/members/[id]/permissions
 * Revoke a permission from a user
 * Body: { permission_id: string, resource_id?: string }
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization and role
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "User has no organization" }, { status: 400 });
    }

    // Check permissions (admin or owner)
    if (!["admin", "owner"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Verify target user is in same organization
    const { data: targetUser } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", params.id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: "User not in your organization" }, { status: 403 });
    }

    const body = await req.json();
    const { permission_id, resource_id } = body;

    if (!permission_id) {
      return NextResponse.json({ error: "Permission ID is required" }, { status: 400 });
    }

    // Delete the permission override
    let query = supabase
      .from("user_permissions")
      .delete()
      .eq("user_id", params.id)
      .eq("permission_id", permission_id);

    if (resource_id !== undefined) {
      query = query.eq("resource_id", resource_id);
    }

    const { error } = await query;

    if (error) {
      console.error("Error revoking permission:", error);
      return NextResponse.json(
        { error: "Failed to revoke permission", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Permission revoked successfully" });
  } catch (error: any) {
    console.error("Error in DELETE /api/team/members/[id]/permissions:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
