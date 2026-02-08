import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * RBAC Permission Checker
 *
 * Uses the database's `user_has_permission()` function which checks:
 * 1. Owner role → all permissions
 * 2. Explicit deny in user_custom_permissions → denied
 * 3. Explicit grant in user_custom_permissions → granted
 * 4. Role-based permissions via roles + role_permissions tables
 */

export interface RBACResult {
  allowed: boolean;
  user: { id: string; email?: string } | null;
  role: string | null;
  error?: string;
}

/**
 * Check if the current user has a specific permission.
 * Uses the Supabase `user_has_permission()` RPC function.
 *
 * @param permission - Permission name like "documents.create", "billing.update"
 * @param resourceId - Optional specific resource UUID to check against
 */
export async function checkPermission(
  permission: string,
  resourceId?: string
): Promise<RBACResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { allowed: false, user: null, role: null, error: "Not authenticated" };
    }

    // Get user's role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role || null;

    // Owners and admins have all permissions
    if (role === "owner" || role === "admin") {
      return { allowed: true, user, role };
    }

    // Check permission via database function
    const { data, error } = await supabase.rpc("user_has_permission", {
      p_user_id: user.id,
      p_permission_name: permission,
      p_resource_id: resourceId || null,
    });

    if (error) {
      // If the function doesn't exist or errors, fall back to role check
      console.error("[RBAC] Permission check error:", error);
      // Fallback: admin/owner = allowed, others = denied for non-read
      const action = permission.split(".")[1];
      if (action === "read" || action === "use") {
        return { allowed: true, user, role };
      }
      return { allowed: false, user, role, error: error.message };
    }

    return { allowed: !!data, user, role };
  } catch (err) {
    console.error("[RBAC] Error:", err);
    return { allowed: false, user: null, role: null, error: "Permission check failed" };
  }
}

/**
 * Get all permissions for the current user.
 */
export async function getUserPermissions(): Promise<{
  permissions: string[];
  role: string | null;
  user: { id: string } | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { permissions: [], role: null, user: null };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const { data, error } = await supabase.rpc("get_user_permissions", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("[RBAC] Get permissions error:", error);
      return { permissions: [], role: profile?.role || null, user };
    }

    const permissions = (data || []).map(
      (p: { permission_name: string }) => p.permission_name
    );

    return { permissions, role: profile?.role || null, user };
  } catch {
    return { permissions: [], role: null, user: null };
  }
}

/**
 * API route wrapper that requires a specific permission.
 * Returns 401 if not authenticated, 403 if not authorized.
 *
 * Usage:
 * ```ts
 * export async function DELETE(req: NextRequest) {
 *   const auth = await requirePermission("documents.delete");
 *   if (auth.response) return auth.response;
 *   // auth.user is available
 * }
 * ```
 */
export async function requirePermission(
  permission: string,
  resourceId?: string
): Promise<{
  response?: NextResponse;
  user: { id: string; email?: string } | null;
  role: string | null;
}> {
  const result = await checkPermission(permission, resourceId);

  if (!result.user) {
    return {
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
      user: null,
      role: null,
    };
  }

  if (!result.allowed) {
    return {
      response: NextResponse.json(
        {
          error: "Forbidden",
          message: `You don't have the "${permission}" permission.`,
          requiredPermission: permission,
        },
        { status: 403 }
      ),
      user: result.user,
      role: result.role,
    };
  }

  return { user: result.user, role: result.role };
}
