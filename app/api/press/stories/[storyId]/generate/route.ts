import { NextRequest, NextResponse } from "next/server";
import { PressHttpError, requirePressUser } from "@/lib/press/auth";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { rows } from "@/lib/press/service";
import { asStory, requireStory, signStoryAssets, toStoryView } from "@/lib/press/stories/service";
import { generateStoryOutputs } from "@/lib/press/stories/claude";
import type { PressStoryAsset } from "@/lib/press/stories/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(_request: NextRequest, { params }: { params: Promise<{ storyId: string }> }) {
  try {
    const { story } = await requireStory((await params).storyId, { mutate: true });
    await requirePressUser();
    const admin = createPressAdminClient();

    const { data: assetRows, error: assetError } = await admin.from("press_story_assets")
      .select("*").eq("story_id", story.id).order("sort_order", { ascending: true });
    if (assetError) throw assetError;
    const assets = rows<PressStoryAsset>(assetRows);

    const { error: startError } = await admin.from("press_stories")
      .update({ status: "generating", error_message: null }).eq("id", story.id);
    if (startError) throw startError;

    try {
      const outputs = await generateStoryOutputs(story, assets);
      const { data: updated, error: updateError } = await admin.from("press_stories")
        .update({ status: "ready", outputs, error_message: null })
        .eq("id", story.id).select("*").single();
      if (updateError) throw updateError;
      const signedAssets = await signStoryAssets(admin, assets);
      return NextResponse.json({ story: toStoryView(asStory(updated), signedAssets) });
    } catch (generationError) {
      const message = generationError instanceof Error ? generationError.message : "Generation failed";
      await admin.from("press_stories").update({ status: "failed", error_message: message }).eq("id", story.id);
      throw new PressHttpError(502, "Press could not generate content for this story.");
    }
  } catch (error) { return pressErrorResponse(error); }
}
