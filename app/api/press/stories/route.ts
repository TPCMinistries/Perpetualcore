import { NextRequest, NextResponse } from "next/server";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { requirePressUser } from "@/lib/press/auth";
import { getActiveOrganizationIds, resolveOrganizationId, rows } from "@/lib/press/service";
import { checkPressMutationRateLimit } from "@/lib/press/rate-limit";
import { asStory } from "@/lib/press/stories/service";
import { createStorySchema } from "@/lib/press/stories/schemas";
import type { PressStory } from "@/lib/press/stories/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePressUser();
    const organizationIds = await getActiveOrganizationIds();
    if (organizationIds.length === 0) {
      return NextResponse.json({ stories: [] });
    }
    const admin = createPressAdminClient();
    const { data, error } = await admin.from("press_stories").select("*")
      .in("organization_id", organizationIds).order("updated_at", { ascending: false });
    if (error) throw error;
    const stories = rows<PressStory>(data);
    if (stories.length === 0) return NextResponse.json({ stories: [] });

    const { data: assetRows, error: assetError } = await admin.from("press_story_assets")
      .select("story_id").in("story_id", stories.map((story) => story.id));
    if (assetError) throw assetError;
    const countByStory = new Map<string, number>();
    for (const assetRow of assetRows ?? []) {
      countByStory.set(assetRow.story_id, (countByStory.get(assetRow.story_id) ?? 0) + 1);
    }
    return NextResponse.json({
      stories: stories.map((story) => ({ ...story, asset_count: countByStory.get(story.id) ?? 0 })),
    });
  } catch (error) { return pressErrorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const input = createStorySchema.parse(await request.json());
    const organizationId = await resolveOrganizationId(input.organizationId);
    const { user } = await requirePressUser();
    const rateLimited = await checkPressMutationRateLimit(request, user.id);
    if (rateLimited) return rateLimited;
    const admin = createPressAdminClient();
    const { data, error } = await admin.from("press_stories").insert({
      organization_id: organizationId,
      created_by: user.id,
      title: input.title,
      voice_key: input.voice_key,
      notes: input.notes ?? "",
    }).select("*").single();
    if (error) throw error;
    return NextResponse.json({ story: asStory(data) }, { status: 201 });
  } catch (error) { return pressErrorResponse(error); }
}
