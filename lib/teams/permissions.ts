/**
 * Team Permissions
 *
 * Role-based permission checks for team operations.
 */

import { TeamRole } from "./types";

const ROLE_HIERARCHY: Record<TeamRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export function canManageTeam(role: TeamRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin;
}

export function canInviteMembers(role: TeamRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin;
}

export function canRemoveMember(actorRole: TeamRole, targetRole: TeamRole): boolean {
  if (targetRole === "owner") return false;
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}

export function canUpdateRole(actorRole: TeamRole, targetRole: TeamRole, newRole: TeamRole): boolean {
  if (actorRole !== "owner") return false;
  if (targetRole === "owner") return false;
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[newRole];
}

export function canShareSkills(role: TeamRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.member;
}

export function canViewBilling(role: TeamRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin;
}

export function canEditSettings(role: TeamRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin;
}

export function canDeleteTeam(role: TeamRole): boolean {
  return role === "owner";
}

export function canViewTeam(role: TeamRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.viewer;
}
