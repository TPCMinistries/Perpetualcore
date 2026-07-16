import { NextRequest, NextResponse } from "next/server";
import { pressErrorResponse } from "@/lib/press/http";
import { updateProjectSchema } from "@/lib/press/schemas";
import { createPressAdminClient } from "@/lib/press/db";
import { asProject, requireProject } from "@/lib/press/service";
import { rows } from "@/lib/press/service";
import type { PressAsset, PressJob, PressRender } from "@/lib/press/types";

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
    return NextResponse.json({
      project: { ...project, assets, renders },
      assets,
      jobs: rows<PressJob>(jobsResult.data),
      renders,
      clipCount: clipCountResult.count ?? 0,
    });
  }
  catch (error) { return pressErrorResponse(error); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const project = await requireProject((await params).projectId);
    const input = updateProjectSchema.parse(await request.json());
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
