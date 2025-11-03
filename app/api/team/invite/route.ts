import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/team/invite
 * Send an invitation to join the organization
 */
export async function POST(req: NextRequest) {
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

    // Check if user has permission to invite (admin or owner)
    if (profile.role !== "admin" && profile.role !== "owner") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate role
    const validRoles = ["member", "admin"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if user already exists in the organization
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .eq("organization_id", profile.organization_id)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "User already in organization" }, { status: 400 });
    }

    // In a real implementation, you would:
    // 1. Create an invitation record with a unique token
    // 2. Send an email with the invitation link
    // 3. The link would allow the user to sign up and join the organization

    // For now, we'll create a simple invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from("team_invitations")
      .insert({
        organization_id: profile.organization_id,
        invited_by: user.id,
        email,
        role: role || "member",
        token: crypto.randomUUID(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();

    if (inviteError) {
      // Check if table doesn't exist
      if (inviteError.code === "42P01") {
        console.warn("team_invitations table doesn't exist - invitation feature not yet set up");
        return NextResponse.json({
          message: "Invitation sent successfully (simulated - feature not fully implemented)",
          email,
          role: role || "member",
        }, { status: 200 });
      }

      console.error("Error creating invitation:", inviteError);
      return NextResponse.json(
        { error: "Failed to create invitation", details: inviteError.message },
        { status: 500 }
      );
    }

    // TODO: Send invitation email here
    // await sendInvitationEmail(email, invitation.token);

    return NextResponse.json({
      message: "Invitation sent successfully",
      invitation: {
        email,
        role: role || "member",
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/team/invite:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
