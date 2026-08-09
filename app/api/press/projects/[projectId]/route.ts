import { NextRequest, NextResponse } from "next/server";
import { pressErrorResponse } from "@/lib/press/http";
import { updateProjectSchema } from "@/lib/press/schemas";
import { createPressAdminClient } from "@/lib/press/db";
import { asProject, requireProject } from "@/lib/press/service";
import { rows } from "@/lib/press/service";
import type { PressAsset, PressJob, PressRender } from "@/lib/press/types";
import { PRESS_EDITOR_ROLES, requirePressUser } from "@/lib/press/auth";
import { checkPressMutationRateLimit } from "@/lib/press/rate-limit";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const project = await requireProject((await params).projectId);
    const admin = createPressAdminClient();
    const [assetsResult, jobsResult, rendersResult, clipCountResult] = await Promise.all([
      admin.from("press_assets").select("*").eq("project_id", project.id).order("created_at", { ascending: false }),
      admin.from("press_jobs").select("*").eq("project_id", project.id).order("created_at", { ascending: false }).limit(50),
      admin.from("press_renders").select("*").eq("project_id", project.id).order("created_at", { ascending: false }),
      admin.from("press_clips").select("id", { count: "exact", head: true }).eq("project_id", project.id),
    ]);
    if (assetsResult.error) throw assetsResult.error;
    if (jobsResult.error) throw jobsResult.error;
    if (rendersResult.error) throw rendersResult.error;
    if (clipCountResult.error) throw clipCountResult.error;
    const orderedAssets = rows<PressAsset>(assetsResult.data).sort((a, b) => {
      const aSource = a.kind.startsWith("source") ? 0 : 1;
      const bSource = b.kind.startsWith("source") ? 0 : 1;
      return aSource - bSource;
    });
    const assets = await Promise.all(orderedAssets.map(async (asset) => {
      const { data } = await admin.storage.from(asset.bucket).createSignedUrl(asset.storage_path, 900);
      return { ...asset, signed_url: data?.signedUrl ?? null };
    }));
    const renders = rows<PressRender>(rendersResult.data);
    const jobs = rows<PressJob>(jobsResult.data).map((job) => ({
      id: job.id,
      type: job.job_type,
      status: job.status,
      progress: job.progress,
      attempts: job.attempts,
      maxAttempts: job.max_attempts,
      errorMessage: customerJobError(job.error_message),
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    }));
    return NextResponse.json({
      project: { ...project, assets, renders },
      assets,
      jobs,
      renders,
      clipCount: clipCountResult.count ?? 0,
    });
  }
  catch (error) { return pressErrorResponse(error); }
}

function customerJobError(message: string | null): string | null {
  if (!message) return null;
  const normalized = message.toLowerCase();
  if (normalized.includes("download limit") || normalized.includes("too large")) {
    return "The source is larger than this workspace can process.";
  }
  if (normalized.includes("abort") || normalized.includes("timed out") || normalized.includes("timeout")) {
    return "Processing took too long and stopped safely.";
  }
  if (normalized.includes("video") || normalized.includes("0:v")) {
    return "A video stream could not be found for this export.";
  }
  return "Processing stopped before this step completed.";
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const project = await requireProject((await params).projectId, PRESS_EDITOR_ROLES);
    const input = updateProjectSchema.parse(await request.json());
    const { user } = await requirePressUser();
    const rateLimited = await checkPressMutationRateLimit(request, user.id);
    if (rateLimited) return rateLimited;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.title !== undefined) updates.title = input.title;
    if (input.status !== undefined) updates.status = input.status;
    if (input.platforms !== undefined) updates.platforms = input.platforms;
    const admin = createPressAdminClient();
    const { data, error } = await admin.from("press_projects").update(updates)
      .eq("id", project.id).eq("organization_id", project.organization_id).select("*").single();
    if (error) throw error;
    return NextResponse.json({ project: asProject(data) });
  } catch (error) { return pressErrorResponse(error); }
}
