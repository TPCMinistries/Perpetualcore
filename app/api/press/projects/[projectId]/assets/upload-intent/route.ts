import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { PRESS_ASSET_BUCKET, createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { uploadIntentSchema } from "@/lib/press/schemas";
import { asAsset, requireProject } from "@/lib/press/service";

export const runtime = "nodejs";

function safeFileName(name: string): string {
  const normalized = name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized.slice(-180) || "source-media";
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const project = await requireProject((await params).projectId);
    if (!project.rights_attested_at || !project.rights_attested_by) {
      return NextResponse.json({ error: "Media rights attestation is required before upload" }, { status: 403 });
    }
    const input = uploadIntentSchema.parse(await request.json());
    const assetId = randomUUID();
    const path = `${project.organization_id}/${project.id}/${assetId}/${safeFileName(input.fileName)}`;
    const admin = createPressAdminClient();
    const { data, error } = await admin.from("press_assets").insert({
      id: assetId, project_id: project.id, organization_id: project.organization_id,
      kind: input.mimeType.startsWith("video/") ? "source_video" : "source_audio",
      bucket: PRESS_ASSET_BUCKET, storage_path: path,
      original_filename: input.fileName, mime_type: input.mimeType, file_size: input.fileSize,
      checksum: input.checksum ?? null, duration_seconds: null, status: "awaiting_upload", metadata: {},
    }).select("*").single();
    if (error) throw error;

    const { data: signed, error: signError } = await admin.storage
      .from(PRESS_ASSET_BUCKET).createSignedUploadUrl(path, { upsert: false });
    if (signError || !signed) {
      await admin.from("press_assets").delete().eq("id", assetId);
      throw signError ?? new Error("Unable to create signed upload URL");
    }
    await admin.from("press_projects").update({ status: "uploading", updated_at: new Date().toISOString() })
      .eq("id", project.id).eq("organization_id", project.organization_id);
    return NextResponse.json({
      asset: asAsset(data),
      upload: { bucket: PRESS_ASSET_BUCKET, path: signed.path, token: signed.token },
    }, { status: 201 });
  } catch (error) { return pressErrorResponse(error); }
}
