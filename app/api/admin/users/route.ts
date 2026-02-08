import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/rbac";
import {
  updateUserRoleSchema,
  validateBody,
  validationErrorResponse,
  ValidationError,
} from "@/lib/validations/schemas";

// GET /api/admin/users - Get all users with their roles (admin only)
export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission("users.read");
    if (auth.response) return auth.response;

    const supabase = await createClient();

    // Get all users with their profiles
    const { data: users, error: fetchError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching users:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
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
    const auth = await requirePermission("users.manage_roles");
    if (auth.response) return auth.response;
    const user = auth.user!;

    // Validate input with Zod
    let validatedData;
    try {
      validatedData = await validateBody(req, updateUserRoleSchema);
    } catch (error) {
      return validationErrorResponse(error);
    }

    const { userId, role } = validatedData;

    // Prevent admin from removing their own admin role
    if (userId === user.id && role !== "admin") {
      return new Response(JSON.stringify({ error: "Cannot remove your own admin role" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const supabase = await createClient();

    // Update user role
    const { data: updatedUser, error: updateError } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select("id, email, full_name, role")
      .single();

    if (updateError) {
      console.error("Error updating user role:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return Response.json({ user: updatedUser });
  } catch (error: unknown) {
    console.error("Error in PATCH /api/admin/users:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
