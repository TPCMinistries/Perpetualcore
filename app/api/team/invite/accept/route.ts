import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rateLimiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logging";

/**
 * POST /api/team/invite/accept
 *
 * Accept a team invitation.
 * - Validates the invitation token
 * - Checks expiry and status
 * - If user is authenticated: adds them to the organization
 * - If user is new: returns info so they can sign up first
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimiters.auth.check(request);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Invitation token is required" },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // 1. Look up invitation by token
    const { data: invitation, error: inviteError } = await adminSupabase
      .from("team_invitations")
      .select(
        "*, organizations(id, name, slug)"
      )
      .eq("token", token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 }
      );
    }

    // 2. Check invitation status
    if (invitation.status !== "pending") {
      return NextResponse.json(
        {
          error: `This invitation has already been ${invitation.status}`,
          status: invitation.status,
        },
        { status: 400 }
      );
    }

    // 3. Check expiry
    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await adminSupabase
        .from("team_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);

      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 410 }
      );
    }

    // 4. Check if user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // User needs to sign up or log in first
      return NextResponse.json(
        {
          requiresAuth: true,
          invitation: {
            email: invitation.email,
            role: invitation.role,
            organizationName: invitation.organizations?.name,
          },
          message: "Please sign up or log in to accept this invitation",
        },
        { status: 200 }
      );
    }

    // 5. Verify the email matches (or allow any authenticated user)
    // Being flexible: allow accepting even if email differs (e.g., user signed up with different email)

    // 6. Check if user is already in this organization
    const { data: existingProfile } = await adminSupabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", user.id)
      .single();

    if (existingProfile?.organization_id === invitation.organization_id) {
      // Already a member
      await adminSupabase
        .from("team_invitations")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", invitation.id);

      return NextResponse.json({
        success: true,
        message: "You are already a member of this organization",
        alreadyMember: true,
      });
    }

    // 7. Add user to the organization
    if (existingProfile) {
      // Update existing profile to point to new organization
      const { error: updateError } = await adminSupabase
        .from("profiles")
        .update({
          organization_id: invitation.organization_id,
          role: invitation.role,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("[InviteAccept] Profile update error:", updateError);
        return NextResponse.json(
          { error: "Failed to join organization" },
          { status: 500 }
        );
      }
    } else {
      // Create profile with organization
      const { error: createError } = await adminSupabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email || invitation.email,
          full_name:
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "User",
          organization_id: invitation.organization_id,
          role: invitation.role,
        });

      if (createError) {
        console.error("[InviteAccept] Profile creation error:", createError);
        return NextResponse.json(
          { error: "Failed to create profile" },
          { status: 500 }
        );
      }
    }

    // 8. Mark invitation as accepted
    await adminSupabase
      .from("team_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    // 9. Log the event
    logger.security("Team invitation accepted", {
      userId: user.id,
      organizationId: invitation.organization_id,
      invitedBy: invitation.invited_by,
      role: invitation.role,
      path: "/api/team/invite/accept",
    });

    return NextResponse.json({
      success: true,
      message: `You've joined ${invitation.organizations?.name || "the organization"} as ${invitation.role}`,
      organization: {
        id: invitation.organization_id,
        name: invitation.organizations?.name,
      },
      role: invitation.role,
    });
  } catch (error) {
    logger.error("Invite acceptance error", {
      error,
      path: "/api/team/invite/accept",
    });
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/team/invite/accept?token=xxx
 *
 * Get invitation details without accepting.
 * Used by the invite page to show invitation info.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    const { data: invitation, error } = await adminSupabase
      .from("team_invitations")
      .select(
        "id, email, role, status, expires_at, created_at, organizations(name, slug)"
      )
      .eq("token", token)
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Check expiry
    const isExpired = new Date(invitation.expires_at) < new Date();

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        status: isExpired ? "expired" : invitation.status,
        organizationName: invitation.organizations?.name,
        expiresAt: invitation.expires_at,
        createdAt: invitation.created_at,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch invitation" },
      { status: 500 }
    );
  }
}
