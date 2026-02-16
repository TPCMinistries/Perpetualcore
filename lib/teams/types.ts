/**
 * Team Workspace Types
 *
 * Types for team collaboration, member management, and shared resources.
 */

export type TeamRole = "owner" | "admin" | "member" | "viewer";

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  avatarUrl?: string;
  teamType: "department" | "project_team";
  aiContext: Record<string, any>;
  dashboardConfig: Record<string, any>;
  createdBy: string;
  primaryAdvisorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  teamId: string;
  userId: string;
  role: TeamRole;
  canManageMembers: boolean;
  canEditSettings: boolean;
  canManageProjects: boolean;
  canViewAnalytics: boolean;
  joinedAt: string;
  profile?: {
    displayName: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  token: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface TeamSkill {
  id: string;
  teamId: string;
  skillId: string;
  sharedBy: string;
  config: Record<string, any>;
  credentialId?: string;
  createdAt: string;
}

export interface TeamCredential {
  id: string;
  teamId: string;
  skillId: string;
  credentialKey: string;
  sharedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamInput {
  name: string;
  description?: string;
  teamType?: "department" | "project_team";
  organizationId: string;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  avatarUrl?: string;
  dashboardConfig?: Record<string, any>;
}

export interface InviteMemberInput {
  email: string;
  role?: TeamRole;
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
  memberCount: number;
}
