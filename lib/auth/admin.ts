import { createClient } from "@/lib/supabase/server";

/**
 * Check if the current user is an admin
 * Returns the user profile if admin, throws error if not authenticated or not admin
 */
export async function requireAdmin() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Check admin status from user_profiles table
  const { data: adminProfile, error } = await supabase
    .from("user_profiles")
    .select("is_super_admin, is_admin")
    .eq("id", user.id)
    .single();

  if (error || (!adminProfile?.is_admin && !adminProfile?.is_super_admin)) {
    throw new Error("Forbidden: Admin access required");
  }

  return {
    user,
    isAdmin: adminProfile.is_admin,
    isSuperAdmin: adminProfile.is_super_admin,
  };
}

/**
 * Check if the current user is authenticated
 * Returns the user if authenticated, throws error if not
 */
export async function requireAuth() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
