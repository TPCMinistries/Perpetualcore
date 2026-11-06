import { NextRequest, NextResponse } from "next/server";
import { requirePressUser } from "@/lib/press/auth";
import { PRESS_ASSET_BUCKET, createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { checkPressMutationRateLimit } from "@/lib/press/rate-limit";
import { asStoryAsset, requireStoryAsset, signStoryAssets } from "@/lib/press/stories/service";
import { finalizeAssetSchema } from "@/lib/press/stories/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PressAdminClient = ReturnType<typeof createPressAdminClient>;

async function findObject(admin: PressAdminClient, path: string) {
  const fileName = path.split("/").pop() ?? "";
  const folder = path.slice(0, -(fileName.length + 1));
  const { data: objects, error } = await admin.storage.from(PRESS_ASSET_BUCKET).list(folder, { search: fileName, limit: 2 });
  if (error) throw error;
  return objects?.find((item) => item.name === fileName) ?? null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string; assetId: string }> },
) {
  try {
    const { storyId, assetId } = await params;
    const { asset } = await requireStoryAsset(storyId, assetId, { mutate: true });
    const input = finalizeAssetSchema.parse(await request.json());
    const { user } = await requirePressUser();
    const rateLimited = await checkPressMutationRateLimit(request, user.id);
    if (rateLimited) return rateLimited;

    if (asset.status !== "awaiting_upload" && asset.status !== "uploaded") {
      return NextResponse.json({ error: "Asset is not awaiting upload" }, { status: 409 });
    }

    const admin = createPressAdminClient();
    const object = await findObject(admin, asset.storage_path);
    if (!object) return NextResponse.json({ error: "Uploaded object not found" }, { status: 409 });
    const sizeValue = Number(object.metadata?.size);
    const actualSize = Number.isFinite(sizeValue) ? sizeValue : null;
    if (actualSize !== null) {
      const diffRatio = Math.abs(actualSize - input.file_size) / Math.max(actualSize, input.file_size, 1);
      if (diffRatio > 0.05) {
        return NextResponse.json({ error: "Uploaded object size does not match intent" }, { status: 409 });
      }
    }

    const updates: Record<string, unknown> = { status: "uploaded", file_size: input.file_size };
    if (asset.poster_path) {
      if (input.poster_uploaded) {
        const posterObject = await findObject(admin, asset.poster_path);
        if (!posterObject) return NextResponse.json({ error: "Poster object not found" }, { status: 409 });
      } else {
        updates.poster_path = null;
      }
    }

    const { data: updated, error: updateError } = await admin.from("press_story_assets")
      .update(updates).eq("id", asset.id).select("*").single();
    if (updateError) throw updateError;

    // Finalizing an asset never advances the story's own status — it stays
    // "collecting" (or whatever it already was) until the interview starts.
    const [signed] = await signStoryAssets(admin, [asStoryAsset(updated)]);
    return NextResponse.json({ asset: signed });
  } catch (error) { return pressErrorResponse(error); }
}
