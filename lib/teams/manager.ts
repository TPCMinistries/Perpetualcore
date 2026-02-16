/**
 * Team Manager
 *
 * CRUD operations for teams.
 */

import { createAdminClient } from "@/lib/supabase/server";
import {
  Team,
  TeamWithMembers,
  CreateTeamInput,
  UpdateTeamInput,
} from "./types";

/**
 * Create a new team
 */
export async function createTeam(
  input: CreateTeamInput,
  createdBy: string
): Promise<{ team: Team | null; error: string | null }> {
  const supabase = createAdminClient();

  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data, error } = await supabase
    .from("teams")
    .insert({
      name: input.name,
      slug,
      description: input.description || null,
      team_type: input.teamType || "project_team",
      organization_id: input.organizationId,
      created_by: createdBy,
      ai_context: {},
      dashboard_config: {},
    })
    .select()
    .single();

  if (error) {
    return { team: null, error: error.message };
  }

  // Add creator as owner
  await supabase.from("team_members").insert({
    team_id: data.id,
    user_id: createdBy,
    role: "owner",
    can_manage_members: true,
    can_edit_settings: true,
    can_manage_projects: true,
    can_view_analytics: true,
  });

  return { team: mapTeamRow(data), error: null };
}

/**
 * Get a team by ID
 */
export async function getTeam(teamId: string): Promise<Team | null> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  return data ? mapTeamRow(data) : null;
}

/**
 * Get a team with members
 */
export async function getTeamWithMembers(
  teamId: string
): Promise<TeamWithMembers | null> {
  const supabase = createAdminClient();

  const { data: teamData } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (!teamData) return null;

  const { data: membersData } = await supabase
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
    .eq("team_id", teamId);

  const members = (membersData || []).map((m: any) => ({
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

  return {
    ...mapTeamRow(teamData),
    members,
    memberCount: members.length,
  };
}

/**
 * Get all teams for a user
 */
export async function getUserTeams(userId: string): Promise<Team[]> {
  const supabase = createAdminClient();

  const { data: memberRows } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId);

  if (!memberRows || memberRows.length === 0) return [];

  const teamIds = memberRows.map((r) => r.team_id);

  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .in("id", teamIds)
    .order("created_at", { ascending: false });

  return (teams || []).map(mapTeamRow);
}

/**
 * Update a team
 */
export async function updateTeam(
  teamId: string,
  input: UpdateTeamInput
): Promise<{ team: Team | null; error: string | null }> {
  const supabase = createAdminClient();

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) {
    updates.name = input.name;
    updates.slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  if (input.description !== undefined) updates.description = input.description;
  if (input.avatarUrl !== undefined) updates.avatar_url = input.avatarUrl;
  if (input.dashboardConfig !== undefined)
    updates.dashboard_config = input.dashboardConfig;

  const { data, error } = await supabase
    .from("teams")
    .update(updates)
    .eq("id", teamId)
    .select()
    .single();

  if (error) {
    return { team: null, error: error.message };
  }

  return { team: mapTeamRow(data), error: null };
}

/**
 * Delete a team
 */
export async function deleteTeam(
  teamId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient();

  // Delete members first (cascade should handle, but be explicit)
  await supabase.from("team_members").delete().eq("team_id", teamId);
  await supabase.from("team_invitations").delete().eq("team_id", teamId);
  await supabase.from("team_skills").delete().eq("team_id", teamId);
  await supabase.from("team_credentials").delete().eq("team_id", teamId);

  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Get member role in a team
 */
export async function getMemberRole(
  teamId: string,
  userId: string
): Promise<string | null> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .single();

  return data?.role || null;
}

function mapTeamRow(row: any): Team {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    slug: row.slug || "",
    description: row.description,
    avatarUrl: row.avatar_url,
    teamType: row.team_type,
    aiContext: row.ai_context || {},
    dashboardConfig: row.dashboard_config || {},
    createdBy: row.created_by,
    primaryAdvisorId: row.primary_advisor_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}
