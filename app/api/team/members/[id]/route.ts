import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/team/members/[id]
 * Update a team member's role
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user's organization and role
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "User has no organization" }, { status: 400 });
    }

    // Check if user has permission to update roles (admin or owner)
    if (profile.role !== "admin" && profile.role !== "owner") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    // Validate role
    const validRoles = ["member", "admin", "owner"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Get the member being updated
    const { data: targetMember } = await supabase
      .from("profiles")
      .select("id, role, organization_id")
      .eq("id", params.id)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Verify member is in the same organization
    if (targetMember.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: "Member not in your organization" }, { status: 403 });
    }

    // Cannot change owner role
    if (targetMember.role === "owner") {
      return NextResponse.json({ error: "Cannot change owner role" }, { status: 403 });
    }

    // Only owners can promote to owner
    if (role === "owner" && profile.role !== "owner") {
      return NextResponse.json({ error: "Only owners can promote to owner" }, { status: 403 });
    }

    // Update the member's role
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", params.id);

    if (updateError) {
      console.error("Error updating member role:", updateError);
      return NextResponse.json(
        { error: "Failed to update member role", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Member role updated successfully",
      member: {
        id: params.id,
        role,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error in PATCH /api/team/members/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/team/members/[id]
 * Remove a team member from the organization
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user's organization and role
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "User has no organization" }, { status: 400 });
    }

    // Check if user has permission to remove members (admin or owner)
    if (profile.role !== "admin" && profile.role !== "owner") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get the member being removed
    const { data: targetMember } = await supabase
      .from("profiles")
      .select("id, role, organization_id")
      .eq("id", params.id)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Verify member is in the same organization
    if (targetMember.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: "Member not in your organization" }, { status: 403 });
    }

    // Cannot remove owner
    if (targetMember.role === "owner") {
      return NextResponse.json({ error: "Cannot remove owner" }, { status: 403 });
    }

    // Cannot remove yourself
    if (targetMember.id === user.id) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 403 });
    }

    // Remove member from organization by setting organization_id to null
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ organization_id: null, role: "member" })
      .eq("id", params.id);

    if (updateError) {
      console.error("Error removing member:", updateError);
      return NextResponse.json(
        { error: "Failed to remove member", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Member removed successfully",
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error in DELETE /api/team/members/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
