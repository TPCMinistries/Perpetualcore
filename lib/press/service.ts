import { PressHttpError, requireOrganizationAccess, requirePressUser } from "./auth";
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
    await requireOrganizationAccess(requested);
    return requested;
  }
  const { data: memberships, error } = await supabase.from("organization_members")
    .select("organization_id, status").eq("user_id", user.id)
    .or("status.is.null,status.eq.active").order("created_at", { ascending: true }).limit(1);
  if (error) throw error;
  const organizationId = memberships?.[0]?.organization_id;
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

export async function requireProject(projectId: string): Promise<PressProject> {
  const admin = createPressAdminClient();
  const { data, error } = await admin.from("press_projects").select("*").eq("id", projectId).maybeSingle();
  if (error) throw error;
  if (!data) throw new PressHttpError(404, "Press project not found");
  const project = row<PressProject>(data);
  await requireOrganizationAccess(project.organization_id);
  return project;
}

export async function requireAsset(assetId: string): Promise<PressAsset> {
  const admin = createPressAdminClient();
  const { data, error } = await admin.from("press_assets").select("*").eq("id", assetId).maybeSingle();
  if (error) throw error;
  if (!data) throw new PressHttpError(404, "Press asset not found");
  const asset = row<PressAsset>(data);
  await requireOrganizationAccess(asset.organization_id);
  return asset;
}

export async function requireClip(clipId: string): Promise<PressClip> {
  const admin = createPressAdminClient();
  const { data, error } = await admin.from("press_clips").select("*").eq("id", clipId).maybeSingle();
  if (error) throw error;
  if (!data) throw new PressHttpError(404, "Press clip not found");
  const clip = row<PressClip>(data);
  await requireOrganizationAccess(clip.organization_id);
  return clip;
}

export async function requireRender(renderId: string): Promise<PressRender> {
  const admin = createPressAdminClient();
  const { data, error } = await admin.from("press_renders").select("*").eq("id", renderId).maybeSingle();
  if (error) throw error;
  if (!data) throw new PressHttpError(404, "Press render not found");
  const render = row<PressRender>(data);
  await requireOrganizationAccess(render.organization_id);
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
