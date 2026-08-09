import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { PRESS_ASSET_BUCKET, createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { uploadIntentSchema } from "@/lib/press/schemas";
import { asAsset, requireProject } from "@/lib/press/service";
import { PRESS_EDITOR_ROLES, requirePressUser } from "@/lib/press/auth";
import { assertPressUploadCapacity } from "@/lib/press/limits";
import { checkPressMutationRateLimit } from "@/lib/press/rate-limit";

export const runtime = "nodejs";

function safeFileName(name: string): string {
  const normalized = name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized.slice(-180) || "source-media";
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const project = await requireProject((await params).projectId, PRESS_EDITOR_ROLES);
    if (!project.rights_attested_at || !project.rights_attested_by) {
      return NextResponse.json({ error: "Media rights attestation is required before upload" }, { status: 403 });
    }
    const input = uploadIntentSchema.parse(await request.json());
    const { user } = await requirePressUser();
    const rateLimited = await checkPressMutationRateLimit(request, user.id);
    if (rateLimited) return rateLimited;
    const assetId = randomUUID();
    const path = `${project.organization_id}/${project.id}/${assetId}/${safeFileName(input.fileName)}`;
    const admin = createPressAdminClient();
    await assertPressUploadCapacity(admin, {
      organizationId: project.organization_id,
      projectId: project.id,
      fileSize: input.fileSize,
    });
    const { data, error } = await admin.rpc("press_reserve_asset_upload", {
      p_asset_id: assetId,
      p_project_id: project.id,
      p_organization_id: project.organization_id,
      p_kind: input.mimeType.startsWith("video/") ? "source_video" : "source_audio",
      p_bucket: PRESS_ASSET_BUCKET,
      p_storage_path: path,
      p_original_filename: input.fileName,
      p_mime_type: input.mimeType,
      p_file_size: input.fileSize,
      p_checksum: input.checksum ?? undefined,
    });
    if (error) throw error;

    const { data: signed, error: signError } = await admin.storage
      .from(PRESS_ASSET_BUCKET).createSignedUploadUrl(path, { upsert: false });
    if (signError || !signed) {
      await admin.from("press_assets").delete().eq("id", assetId);
      throw signError ?? new Error("Unable to create signed upload URL");
    }
    return NextResponse.json({
      asset: asAsset(data),
      upload: { bucket: PRESS_ASSET_BUCKET, path: signed.path, token: signed.token },
    }, { status: 201 });
  } catch (error) { return pressErrorResponse(error); }
}
