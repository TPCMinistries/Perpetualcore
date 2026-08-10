import { NextRequest, NextResponse } from "next/server";
import { PRESS_EDITOR_ROLES, requirePressUser } from "@/lib/press/auth";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { checkPressMutationRateLimit } from "@/lib/press/rate-limit";
import { assertProjectIsMutable, requireAsset, requireProject } from "@/lib/press/service";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  try {
    const asset = await requireAsset((await params).assetId, PRESS_EDITOR_ROLES);
    assertProjectIsMutable(await requireProject(asset.project_id, PRESS_EDITOR_ROLES));
    if (asset.status !== "awaiting_upload") {
      return NextResponse.json({ error: "This upload can no longer be resumed." }, { status: 409 });
    }
    const { user } = await requirePressUser();
    const rateLimited = await checkPressMutationRateLimit(request, user.id);
    if (rateLimited) return rateLimited;

    const admin = createPressAdminClient();
    const { data, error } = await admin.storage
      .from(asset.bucket)
      .createSignedUploadUrl(asset.storage_path, { upsert: false });
    if (error || !data) throw error ?? new Error("Unable to refresh the upload token");

    return NextResponse.json({
      upload: { bucket: asset.bucket, path: data.path, token: data.token },
    });
  } catch (error) {
    return pressErrorResponse(error);
  }
}
