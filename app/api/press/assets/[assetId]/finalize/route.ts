import { NextRequest, NextResponse } from "next/server";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { finalizeAssetSchema } from "@/lib/press/schemas";
import { asAsset, asJob, assertProjectIsMutable, requireAsset, requireProject } from "@/lib/press/service";
import { PRESS_EDITOR_ROLES, requirePressUser } from "@/lib/press/auth";
import { assertPressJobCapacity } from "@/lib/press/limits";
import { checkPressJobRateLimit } from "@/lib/press/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const asset = await requireAsset((await params).assetId, PRESS_EDITOR_ROLES);
    const project = await requireProject(asset.project_id, PRESS_EDITOR_ROLES);
    assertProjectIsMutable(project);
    if (!project.rights_attested_at || !project.rights_attested_by) {
      return NextResponse.json({ error: "Media rights attestation is required before processing" }, { status: 403 });
    }
    const input = finalizeAssetSchema.parse(await request.json());
    const { user } = await requirePressUser();
    const rateLimited = await checkPressJobRateLimit(request, user.id);
    if (rateLimited) return rateLimited;
    if (!(asset.status === "awaiting_upload" || asset.status === "uploaded")) {
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
    // A replay after a lost response is already finalized transactionally and
    // must not fail merely because that first job filled the active-job quota.
    if (asset.status === "awaiting_upload") {
      await assertPressJobCapacity(admin, asset.organization_id);
    }
    const { data: finalized, error: finalizeError } = await admin.rpc("press_finalize_asset_upload", {
      p_asset_id: asset.id,
      p_checksum: input.checksum ?? undefined,
      p_duration_seconds: input.durationSeconds ?? undefined,
    });
    if (finalizeError) throw finalizeError;
    const result = finalized as unknown as { asset: unknown; job: unknown };
    return NextResponse.json({ asset: asAsset(result.asset), job: asJob(result.job) });
  } catch (error) { return pressErrorResponse(error); }
}
