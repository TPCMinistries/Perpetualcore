import { NextRequest, NextResponse } from "next/server";
import { PRESS_ASSET_BUCKET, createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { requireStoryAsset } from "@/lib/press/stories/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ storyId: string; assetId: string }> },
) {
  try {
    const { storyId, assetId } = await params;
    const { asset } = await requireStoryAsset(storyId, assetId, { mutate: true });
    const admin = createPressAdminClient();
    const paths = [asset.storage_path, asset.poster_path].filter((path): path is string => Boolean(path));
    if (paths.length > 0) {
      const { error: removeError } = await admin.storage.from(PRESS_ASSET_BUCKET).remove(paths);
      if (removeError) throw removeError;
    }
    const { error } = await admin.from("press_story_assets").delete().eq("id", asset.id);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) { return pressErrorResponse(error); }
}
