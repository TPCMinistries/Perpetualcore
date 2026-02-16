/**
 * Team Shared Resources
 *
 * Share skills, credentials, and documents across team members.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { TeamSkill, TeamCredential } from "./types";
import { encryptSecret, decryptSecret } from "@/lib/crypto/encryption";

/**
 * Share a skill with the team
 */
export async function shareSkill(
  teamId: string,
  skillId: string,
  sharedBy: string,
  config?: Record<string, any>
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("team_skills")
    .upsert(
      {
        team_id: teamId,
        skill_id: skillId,
        shared_by: sharedBy,
        config: config || {},
      },
      { onConflict: "team_id,skill_id" }
    );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Unshare a skill from the team
 */
export async function unshareSkill(
  teamId: string,
  skillId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("team_skills")
    .delete()
    .eq("team_id", teamId)
    .eq("skill_id", skillId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Also remove associated credential
  await supabase
    .from("team_credentials")
    .delete()
    .eq("team_id", teamId)
    .eq("skill_id", skillId);

  return { success: true, error: null };
}

/**
 * Get all skills shared with a team
 */
export async function getTeamSkills(teamId: string): Promise<TeamSkill[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("team_skills")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  return (data || []).map((s: any) => ({
    id: s.id,
    teamId: s.team_id,
    skillId: s.skill_id,
    sharedBy: s.shared_by,
    config: s.config || {},
    credentialId: s.credential_id,
    createdAt: s.created_at,
  }));
}

/**
 * Share a credential with the team (encrypted)
 */
export async function shareCredential(
  teamId: string,
  skillId: string,
  credentialKey: string,
  credentialValue: string,
  sharedBy: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient();

  const encrypted = encryptSecret(credentialValue);

  const { error } = await supabase
    .from("team_credentials")
    .upsert(
      {
        team_id: teamId,
        skill_id: skillId,
        credential_key: credentialKey,
        credential_value: encrypted,
        shared_by: sharedBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "team_id,skill_id,credential_key" }
    );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Resolve a team credential
 */
export async function resolveTeamCredential(
  teamId: string,
  skillId: string,
  credentialKey: string
): Promise<string | null> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("team_credentials")
    .select("credential_value")
    .eq("team_id", teamId)
    .eq("skill_id", skillId)
    .eq("credential_key", credentialKey)
    .single();

  if (!data?.credential_value) return null;

  try {
    return decryptSecret(data.credential_value);
  } catch {
    return null;
  }
}

/**
 * Get all credentials shared with a team (without values)
 */
export async function getTeamCredentials(
  teamId: string
): Promise<Array<{ skillId: string; credentialKey: string; sharedBy: string; updatedAt: string }>> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("team_credentials")
    .select("skill_id, credential_key, shared_by, updated_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  return (data || []).map((c: any) => ({
    skillId: c.skill_id,
    credentialKey: c.credential_key,
    sharedBy: c.shared_by,
    updatedAt: c.updated_at,
  }));
}

/**
 * Remove a shared credential
 */
export async function removeTeamCredential(
  teamId: string,
  skillId: string,
  credentialKey: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("team_credentials")
    .delete()
    .eq("team_id", teamId)
    .eq("skill_id", skillId)
    .eq("credential_key", credentialKey);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
