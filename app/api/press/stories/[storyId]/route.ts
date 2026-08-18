import { NextRequest, NextResponse } from "next/server";
import { PRESS_ADMIN_ROLES, requireOrganizationAccess, requirePressUser } from "@/lib/press/auth";
import { PRESS_ASSET_BUCKET, createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { checkPressMutationRateLimit } from "@/lib/press/rate-limit";
import { rows } from "@/lib/press/service";
import { asStory, requireStory, signStoryAssets, toStoryView } from "@/lib/press/stories/service";
import { updateStorySchema } from "@/lib/press/stories/schemas";
import type { PressStoryAsset } from "@/lib/press/stories/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ storyId: string }> }) {
  try {
    const { story } = await requireStory((await params).storyId);
    const admin = createPressAdminClient();
    const { data, error } = await admin.from("press_story_assets").select("*")
      .eq("story_id", story.id).order("sort_order", { ascending: true });
    if (error) throw error;
    const assets = await signStoryAssets(admin, rows<PressStoryAsset>(data));
    return NextResponse.json({ story: toStoryView(story, assets) });
  } catch (error) { return pressErrorResponse(error); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ storyId: string }> }) {
  try {
    const { story } = await requireStory((await params).storyId, { mutate: true });
    const input = updateStorySchema.parse(await request.json());
    const { user } = await requirePressUser();
    const rateLimited = await checkPressMutationRateLimit(request, user.id);
    if (rateLimited) return rateLimited;
    const updates: Record<string, unknown> = {};
    if (input.title !== undefined) updates.title = input.title;
    if (input.voice_key !== undefined) updates.voice_key = input.voice_key;
    if (input.notes !== undefined) updates.notes = input.notes;
    if (input.interview_complete !== undefined) updates.interview_complete = input.interview_complete;
    const admin = createPressAdminClient();
    const { data, error } = await admin.from("press_stories").update(updates)
      .eq("id", story.id).eq("organization_id", story.organization_id).select("*").single();
    if (error) throw error;
    return NextResponse.json({ story: asStory(data) });
  } catch (error) { return pressErrorResponse(error); }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ storyId: string }> }) {
  try {
    const { story } = await requireStory((await params).storyId);
    await requireOrganizationAccess(story.organization_id, PRESS_ADMIN_ROLES);
    const admin = createPressAdminClient();
    const { data: assets, error: assetsError } = await admin.from("press_story_assets")
      .select("storage_path, poster_path").eq("story_id", story.id);
    if (assetsError) throw assetsError;
    const paths = (assets ?? []).flatMap((asset) =>
      [asset.storage_path, asset.poster_path].filter((path): path is string => Boolean(path)),
    );
    if (paths.length > 0) {
      const { error: removeError } = await admin.storage.from(PRESS_ASSET_BUCKET).remove(paths);
      if (removeError) throw removeError;
    }
    const { error } = await admin.from("press_stories").delete().eq("id", story.id);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) { return pressErrorResponse(error); }
}
