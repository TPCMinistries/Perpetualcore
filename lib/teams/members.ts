/**
 * Team Member Management
 *
 * Invitation, removal, and role management for team members.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { TeamMember, TeamInvitation, TeamRole } from "./types";
import { canInviteMembers, canRemoveMember, canUpdateRole } from "./permissions";
import { randomBytes } from "crypto";

/**
 * Invite a member to a team via email
 */
export async function inviteMember(
  teamId: string,
  email: string,
  role: TeamRole,
  invitedBy: string,
  actorRole: TeamRole
): Promise<{ invitation: TeamInvitation | null; error: string | null }> {
  if (!canInviteMembers(actorRole)) {
    return { invitation: null, error: "You don't have permission to invite members" };
  }

  const supabase = createAdminClient();

  // Check for existing pending invitation
  const { data: existing } = await supabase
    .from("team_invitations")
    .select("id")
    .eq("team_id", teamId)
    .eq("email", email)
    .is("accepted_at", null)
    .single();

  if (existing) {
    return { invitation: null, error: "An invitation has already been sent to this email" };
  }

  // Check if user is already a member
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (profile) {
    const { data: member } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId)
      .eq("user_id", profile.id)
      .single();

    if (member) {
      return { invitation: null, error: "This user is already a team member" };
    }
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const { data, error } = await supabase
    .from("team_invitations")
    .insert({
      team_id: teamId,
      email,
      role: role || "member",
      invited_by: invitedBy,
      token,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    return { invitation: null, error: error.message };
  }

  return {
    invitation: {
      id: data.id,
      teamId: data.team_id,
      email: data.email,
      role: data.role,
      invitedBy: data.invited_by,
      token: data.token,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
    },
    error: null,
  };
}

/**
 * Accept a team invitation
 */
export async function acceptInvite(
  token: string,
  userId: string
): Promise<{ success: boolean; teamId: string | null; error: string | null }> {
  const supabase = createAdminClient();

  const { data: invitation } = await supabase
    .from("team_invitations")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .single();

  if (!invitation) {
    return { success: false, teamId: null, error: "Invalid or expired invitation" };
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return { success: false, teamId: null, error: "This invitation has expired" };
  }

  // Add member to team
  const { error: memberError } = await supabase.from("team_members").insert({
    team_id: invitation.team_id,
    user_id: userId,
    role: invitation.role,
    can_manage_members: invitation.role === "admin" || invitation.role === "owner",
    can_edit_settings: invitation.role === "admin" || invitation.role === "owner",
    can_manage_projects: invitation.role !== "viewer",
    can_view_analytics: true,
  });

  if (memberError) {
    return { success: false, teamId: null, error: memberError.message };
  }

  // Mark invitation as accepted
  await supabase
    .from("team_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  return { success: true, teamId: invitation.team_id, error: null };
}

/**
 * Remove a member from a team
 */
export async function removeMember(
  teamId: string,
  targetUserId: string,
  actorRole: TeamRole,
  targetRole: TeamRole
): Promise<{ success: boolean; error: string | null }> {
  if (!canRemoveMember(actorRole, targetRole)) {
    return { success: false, error: "You don't have permission to remove this member" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", targetUserId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  teamId: string,
  targetUserId: string,
  newRole: TeamRole,
  actorRole: TeamRole,
  targetCurrentRole: TeamRole
): Promise<{ success: boolean; error: string | null }> {
  if (!canUpdateRole(actorRole, targetCurrentRole, newRole)) {
    return { success: false, error: "You don't have permission to change this role" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("team_members")
    .update({
      role: newRole,
      can_manage_members: newRole === "admin" || newRole === "owner",
      can_edit_settings: newRole === "admin" || newRole === "owner",
      can_manage_projects: newRole !== "viewer",
    })
    .eq("team_id", teamId)
    .eq("user_id", targetUserId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Get all members of a team
 */
export async function getMembers(teamId: string): Promise<TeamMember[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("team_members")
    .select(
      `
      team_id,
      user_id,
      role,
      can_manage_members,
      can_edit_settings,
      can_manage_projects,
      can_view_analytics,
      created_at,
      profiles!inner(display_name, email, avatar_url)
    `
    )
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });

  return (data || []).map((m: any) => ({
    teamId: m.team_id,
    userId: m.user_id,
    role: m.role,
    canManageMembers: m.can_manage_members,
    canEditSettings: m.can_edit_settings,
    canManageProjects: m.can_manage_projects,
    canViewAnalytics: m.can_view_analytics,
    joinedAt: m.created_at,
    profile: m.profiles
      ? {
          displayName: m.profiles.display_name,
          email: m.profiles.email,
          avatarUrl: m.profiles.avatar_url,
        }
      : undefined,
  }));
}

/**
 * Get pending invitations for a team
 */
export async function getPendingInvitations(
  teamId: string
): Promise<TeamInvitation[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("team_invitations")
    .select("*")
    .eq("team_id", teamId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  return (data || []).map((inv: any) => ({
    id: inv.id,
    teamId: inv.team_id,
    email: inv.email,
    role: inv.role,
    invitedBy: inv.invited_by,
    token: inv.token,
    expiresAt: inv.expires_at,
    acceptedAt: inv.accepted_at,
    createdAt: inv.created_at,
  }));
}
