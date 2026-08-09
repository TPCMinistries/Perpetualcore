import { NextRequest, NextResponse } from "next/server";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { finalizeAssetSchema } from "@/lib/press/schemas";
import { asAsset, asJob, requireAsset, requireProject } from "@/lib/press/service";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const asset = await requireAsset((await params).assetId);
    const project = await requireProject(asset.project_id);
    if (!project.rights_attested_at || !project.rights_attested_by) {
      return NextResponse.json({ error: "Media rights attestation is required before processing" }, { status: 403 });
    }
    const input = finalizeAssetSchema.parse(await request.json());
    if (asset.status !== "awaiting_upload") {
      return NextResponse.json({ error: "Asset is not awaiting upload" }, { status: 409 });
    }
    if (asset.checksum && input.checksum && asset.checksum !== input.checksum) {
      return NextResponse.json({ error: "Checksum does not match upload intent" }, { status: 409 });
    }
    const admin = createPressAdminClient();
    const fileName = asset.storage_path.split("/").pop() ?? "";
    const folder = asset.storage_path.slice(0, -(fileName.length + 1));
    const { data: objects, error: listError } = await admin.storage
      .from(asset.bucket).list(folder, { search: fileName, limit: 2 });
    if (listError) throw listError;
    const object = objects?.find((item) => item.name === fileName);
    if (!object) return NextResponse.json({ error: "Uploaded object not found" }, { status: 409 });
    const sizeValue = Number(object.metadata?.size);
    const actualSize = Number.isFinite(sizeValue) ? sizeValue : null;
    if (actualSize !== null && actualSize !== asset.file_size) {
      return NextResponse.json({ error: "Uploaded object size does not match intent" }, { status: 409 });
    }
    const actualMime = typeof object.metadata?.mimetype === "string" ? object.metadata.mimetype : null;
    if (actualMime && actualMime !== asset.mime_type) {
      return NextResponse.json({ error: "Uploaded object type does not match intent" }, { status: 409 });
    }
    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await admin.from("press_assets").update({
      status: "uploaded", checksum: input.checksum ?? asset.checksum,
      duration_seconds: input.durationSeconds ?? null, updated_at: now,
    }).eq("id", asset.id).eq("organization_id", asset.organization_id).select("*").single();
    if (updateError) throw updateError;
    const { data: job, error: jobError } = await admin.from("press_jobs").insert({
      organization_id: asset.organization_id, project_id: asset.project_id, asset_id: asset.id,
      render_id: null, job_type: "probe_media", status: "pending", priority: 50,
      attempts: 0, max_attempts: 3, progress: 0, payload: { assetId: asset.id }, result: {},
      error_message: null, lease_owner: null, lease_expires_at: null,
      idempotency_key: `probe_media:${asset.id}`,
    }).select("*").single();
    if (jobError) throw jobError;
    await admin.from("press_projects").update({ status: "processing", updated_at: now })
      .eq("id", asset.project_id).eq("organization_id", asset.organization_id);
    return NextResponse.json({ asset: asAsset(updated), job: asJob(job) });
  } catch (error) { return pressErrorResponse(error); }
}
