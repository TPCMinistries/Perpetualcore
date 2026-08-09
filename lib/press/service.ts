import {
  PRESS_EDITOR_ROLES,
  PRESS_READ_ROLES,
  PressHttpError,
  canProvisionPressWorkspace,
  requireOrganizationAccess,
  requirePressUser,
  type PressOrganizationRole,
} from "./auth";
import { createPressAdminClient } from "./db";
import type {
  PressAsset, PressClip, PressJob, PressProject, PressPublication,
  PressGenerationRun, PressPublishTarget, PressRender,
} from "./types";

function row<T>(value: unknown): T { return value as T; }
export function rows<T>(value: unknown): T[] { return (value ?? []) as T[]; }

export async function resolveOrganizationId(requested?: string): Promise<string> {
  const { user, supabase } = await requirePressUser();
  if (requested) {
    await requireOrganizationAccess(requested, PRESS_EDITOR_ROLES);
    return requested;
  }
  const { data: memberships, error } = await supabase.from("organization_members")
    .select("organization_id, role, status").eq("user_id", user.id)
    .or("status.is.null,status.eq.active").order("created_at", { ascending: true }).limit(100);
  if (error) throw error;
  const editableMembership = memberships?.find((membership) =>
    (PRESS_EDITOR_ROLES as readonly string[]).includes(membership.role),
  );
  let organizationId = editableMembership?.organization_id;
  if (!organizationId && memberships && memberships.length > 0) {
    throw new PressHttpError(403, "Your organization role does not allow creating Press projects.");
  }
  if (!organizationId) {
    if (!canProvisionPressWorkspace(user.email)) {
      throw new PressHttpError(403, "Press is currently invite-only. Ask the workspace owner to add your email.");
    }
    const admin = createPressAdminClient();
    const { data: ensuredOrganizationId, error: ensureError } = await admin.rpc(
      "press_ensure_workspace",
      { p_user_id: user.id },
    );
    if (ensureError) throw ensureError;
    organizationId = ensuredOrganizationId;
  }
  if (!organizationId) {
    throw new PressHttpError(403, "No active organization membership. Complete organization setup first.");
  }
  return organizationId;
}

export async function getActiveOrganizationIds(): Promise<string[]> {
  const { user, supabase } = await requirePressUser();
  const { data, error } = await supabase.from("organization_members")
    .select("organization_id").eq("user_id", user.id).or("status.is.null,status.eq.active");
  if (error) throw error;
  return [...new Set((data ?? []).map((membership) => membership.organization_id))];
}

export async function requireProject(
  projectId: string,
  allowedRoles: readonly PressOrganizationRole[] = PRESS_READ_ROLES,
): Promise<PressProject> {
  const admin = createPressAdminClient();
  const { data, error } = await admin.from("press_projects").select("*").eq("id", projectId).maybeSingle();
  if (error) throw error;
  if (!data) throw new PressHttpError(404, "Press project not found");
  const project = row<PressProject>(data);
  await requireOrganizationAccess(project.organization_id, allowedRoles);
  return project;
}

export async function requireAsset(
  assetId: string,
  allowedRoles: readonly PressOrganizationRole[] = PRESS_READ_ROLES,
): Promise<PressAsset> {
  const admin = createPressAdminClient();
  const { data, error } = await admin.from("press_assets").select("*").eq("id", assetId).maybeSingle();
  if (error) throw error;
  if (!data) throw new PressHttpError(404, "Press asset not found");
  const asset = row<PressAsset>(data);
  await requireOrganizationAccess(asset.organization_id, allowedRoles);
  return asset;
}

export async function requireClip(
  clipId: string,
  allowedRoles: readonly PressOrganizationRole[] = PRESS_READ_ROLES,
): Promise<PressClip> {
  const admin = createPressAdminClient();
  const { data, error } = await admin.from("press_clips").select("*").eq("id", clipId).maybeSingle();
  if (error) throw error;
  if (!data) throw new PressHttpError(404, "Press clip not found");
  const clip = row<PressClip>(data);
  await requireOrganizationAccess(clip.organization_id, allowedRoles);
  return clip;
}

export async function requireRender(
  renderId: string,
  allowedRoles: readonly PressOrganizationRole[] = PRESS_READ_ROLES,
): Promise<PressRender> {
  const admin = createPressAdminClient();
  const { data, error } = await admin.from("press_renders").select("*").eq("id", renderId).maybeSingle();
  if (error) throw error;
  if (!data) throw new PressHttpError(404, "Press render not found");
  const render = row<PressRender>(data);
  await requireOrganizationAccess(render.organization_id, allowedRoles);
  return render;
}

export function asJob(value: unknown): PressJob { return row<PressJob>(value); }
export function asGenerationRun(value: unknown): PressGenerationRun { return row<PressGenerationRun>(value); }
export function asProject(value: unknown): PressProject { return row<PressProject>(value); }
export function asAsset(value: unknown): PressAsset { return row<PressAsset>(value); }
export function asClip(value: unknown): PressClip { return row<PressClip>(value); }
export function asRender(value: unknown): PressRender { return row<PressRender>(value); }
export function asPublishTarget(value: unknown): PressPublishTarget { return row<PressPublishTarget>(value); }
export function asPublication(value: unknown): PressPublication { return row<PressPublication>(value); }

export function getPublishCapabilities(target: PressPublishTarget) {
  const enabledProviders = new Set(
    (process.env.PRESS_PUBLISH_ADAPTERS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean),
  );
  const configFlag = target.adapter_configured === true || target.non_secret_config?.adapterConfigured === true;
  const adapterConfigured = configFlag && enabledProviders.has(target.provider.toLowerCase());
  return {
    manualExport: target.status === "active",
    scheduling: target.status === "active" && adapterConfigured,
    directPublish: false,
  };
}
