import { createClient } from "@/lib/supabase/server";

interface AdminCheckResult {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  user: any;
  error?: string;
}

/**
 * Check if the current user has admin privileges.
 * Checks both `profiles.role` and `user_profiles.is_admin/is_super_admin`
 * for compatibility with different table structures.
 */
export async function checkAdminAccess(): Promise<AdminCheckResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        isAdmin: false,
        isSuperAdmin: false,
        user: null,
        error: "Not authenticated",
      };
    }

    // Check profiles table for role-based access
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Check user_profiles table for flag-based access
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("is_admin, is_super_admin")
      .eq("id", user.id)
      .single();

    // If not found by id, try user_id
    let userProfileByUserId = null;
    if (!userProfile) {
      const { data: profileByUserId } = await supabase
        .from("user_profiles")
        .select("is_admin, is_super_admin")
        .eq("user_id", user.id)
        .single();
      userProfileByUserId = profileByUserId;
    }

    const effectiveUserProfile = userProfile || userProfileByUserId;

    const isAdmin =
      profile?.role === "admin" ||
      effectiveUserProfile?.is_admin === true ||
      effectiveUserProfile?.is_super_admin === true;

    const isSuperAdmin = effectiveUserProfile?.is_super_admin === true;

    return {
      isAdmin,
      isSuperAdmin,
      user,
    };
  } catch (error: any) {
    console.error("Error checking admin access:", error);
    return {
      isAdmin: false,
      isSuperAdmin: false,
      user: null,
      error: error.message,
    };
  }
}

/**
 * Helper to create a consistent unauthorized response
 */
export function unauthorizedResponse(message: string = "Unauthorized") {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Helper to create a consistent forbidden response
 */
export function forbiddenResponse(message: string = "Admin access required") {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
