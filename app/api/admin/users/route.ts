// @ts-nocheck
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/users - Get all users with their roles (admin only)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get all users with their profiles
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return Response.json({ users });
  } catch (error: any) {
    console.error("Error in GET /api/admin/users:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// PATCH /api/admin/users - Update user role (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { userId, role } = await req.json();

    if (!userId || !role) {
      return new Response(JSON.stringify({ error: "userId and role are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Validate role
    const validRoles = ["admin", "member", "viewer"];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role. Must be admin, member, or viewer" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Prevent admin from removing their own admin role
    if (userId === user.id && role !== "admin") {
      return new Response(JSON.stringify({ error: "Cannot remove your own admin role" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Update user role
    const { data: updatedUser, error } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select("id, email, full_name, role")
      .single();

    if (error) {
      console.error("Error updating user role:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return Response.json({ user: updatedUser });
  } catch (error: any) {
    console.error("Error in PATCH /api/admin/users:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
