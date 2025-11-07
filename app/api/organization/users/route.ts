import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/organization/users
 * Get all users in the current user's organization
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response("No organization found", { status: 403 });
    }

    // Get all users in the organization (excluding current user)
    const { data: users, error } = await supabase
      .from("profiles")
      .select(`
        id,
        auth_users:id (
          email
        ),
        full_name
      `)
      .eq("organization_id", profile.organization_id)
      .neq("id", user.id)
      .order("full_name");

    if (error) {
      console.error("Error fetching organization users:", error);
      return new Response("Failed to fetch users", { status: 500 });
    }

    // Format the response
    const formattedUsers = users?.map((u: any) => ({
      id: u.id,
      email: u.auth_users?.email || "No email",
      full_name: u.full_name || "Unknown User",
    })) || [];

    return Response.json({ users: formattedUsers });
  } catch (error) {
    console.error("Organization users error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
