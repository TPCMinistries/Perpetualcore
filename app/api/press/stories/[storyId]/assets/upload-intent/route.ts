import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { PressHttpError, requirePressUser } from "@/lib/press/auth";
import { PRESS_ASSET_BUCKET, createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { checkPressMutationRateLimit } from "@/lib/press/rate-limit";
import { asStoryAsset, requireStory } from "@/lib/press/stories/service";
import { uploadIntentSchema } from "@/lib/press/stories/schemas";
import {
  PRESS_STORY_MAX_ASSETS,
  pressStoryAssetPath,
  pressStoryPosterPath,
  type SignedUploadTarget,
  type UploadIntentResponse,
} from "@/lib/press/stories/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PressAdminClient = ReturnType<typeof createPressAdminClient>;

function extensionForMime(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg": return "jpg";
    case "image/png": return "png";
    case "video/mp4": return "mp4";
    case "video/quicktime": return "mov";
    case "video/webm": return "webm";
    default: throw new PressHttpError(400, "Unsupported mime type");
  }
}

async function signUpload(admin: PressAdminClient, path: string): Promise<SignedUploadTarget> {
  const { data, error } = await admin.storage.from(PRESS_ASSET_BUCKET).createSignedUploadUrl(path, { upsert: false });
  if (error || !data) throw error ?? new Error("Unable to create signed upload URL");
  return { path: data.path, signedUrl: data.signedUrl, token: data.token };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ storyId: string }> }) {
  try {
    const { story } = await requireStory((await params).storyId, { mutate: true });
    const input = uploadIntentSchema.parse(await request.json());
    const { user } = await requirePressUser();
    const rateLimited = await checkPressMutationRateLimit(request, user.id);
    if (rateLimited) return rateLimited;

    const admin = createPressAdminClient();
    const { count, error: countError } = await admin.from("press_story_assets")
      .select("id", { count: "exact", head: true }).eq("story_id", story.id);
    if (countError) throw countError;
    if ((count ?? 0) >= PRESS_STORY_MAX_ASSETS) {
      return NextResponse.json({ error: `A story can have at most ${PRESS_STORY_MAX_ASSETS} assets.` }, { status: 429 });
    }

    const assetId = randomUUID();
    const ext = extensionForMime(input.mime_type);
    const path = pressStoryAssetPath(story.organization_id, story.id, assetId, ext);

    const { data: insertedRow, error: insertError } = await admin.from("press_story_assets").insert({
      id: assetId,
      story_id: story.id,
      organization_id: story.organization_id,
      kind: input.kind,
      storage_path: path,
      poster_path: null,
      mime_type: input.mime_type,
      file_size: input.file_size,
      width: input.width ?? null,
      height: input.height ?? null,
      duration_ms: input.duration_ms ?? null,
      original_filename: input.original_filename ?? null,
      caption_hint: input.caption_hint ?? null,
      status: "awaiting_upload",
      sort_order: count ?? 0,
    }).select("*").single();
    if (insertError) throw insertError;

    try {
      const upload = await signUpload(admin, path);
      let posterUpload: SignedUploadTarget | null = null;
      if (input.with_poster && input.kind === "video") {
        const posterPath = pressStoryPosterPath(story.organization_id, story.id, assetId);
        const { error: posterUpdateError } = await admin.from("press_story_assets")
          .update({ poster_path: posterPath }).eq("id", assetId);
        if (posterUpdateError) throw posterUpdateError;
        posterUpload = await signUpload(admin, posterPath);
      }
      const response: UploadIntentResponse = {
        asset: asStoryAsset({ ...insertedRow, poster_path: posterUpload ? pressStoryPosterPath(story.organization_id, story.id, assetId) : null }),
        upload,
        poster_upload: posterUpload,
      };
      return NextResponse.json(response, { status: 201 });
    } catch (storageError) {
      await admin.from("press_story_assets").delete().eq("id", assetId);
      throw storageError;
    }
  } catch (error) { return pressErrorResponse(error); }
}
