import { NextRequest, NextResponse } from "next/server";
import { requirePressUser } from "@/lib/press/auth";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { checkPressMutationRateLimit } from "@/lib/press/rate-limit";
import { rows } from "@/lib/press/service";
import { asStory, requireStory } from "@/lib/press/stories/service";
import { interviewInputSchema } from "@/lib/press/stories/schemas";
import { askNextInterviewQuestion } from "@/lib/press/stories/claude";
import type { InterviewResponse, PressStoryAsset, PressStoryInterviewTurn } from "@/lib/press/stories/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest, { params }: { params: Promise<{ storyId: string }> }) {
  try {
    const { story } = await requireStory((await params).storyId, { mutate: true });
    const input = interviewInputSchema.parse(await request.json());
    const { user } = await requirePressUser();
    const rateLimited = await checkPressMutationRateLimit(request, user.id);
    if (rateLimited) return rateLimited;

    if (story.interview_complete) {
      const response: InterviewResponse = { story, question: null, complete: true };
      return NextResponse.json(response);
    }

    const admin = createPressAdminClient();
    const interview: PressStoryInterviewTurn[] = [...story.interview];
    if (input.answer) {
      interview.push({ role: "user", text: input.answer, at: new Date().toISOString() });
    }

    const { data: assetRows, error: assetError } = await admin.from("press_story_assets")
      .select("*").eq("story_id", story.id).order("sort_order", { ascending: true });
    if (assetError) throw assetError;
    const assets = rows<PressStoryAsset>(assetRows);

    const decision = await askNextInterviewQuestion({ ...story, interview }, assets);
    if (!decision.complete && decision.question) {
      interview.push({ role: "assistant", text: decision.question, at: new Date().toISOString() });
    }

    const { data: updated, error: updateError } = await admin.from("press_stories").update({
      interview,
      interview_complete: decision.complete,
      status: "interviewing",
    }).eq("id", story.id).select("*").single();
    if (updateError) throw updateError;

    const response: InterviewResponse = {
      story: asStory(updated),
      question: decision.complete ? null : decision.question,
      complete: decision.complete,
    };
    return NextResponse.json(response);
  } catch (error) { return pressErrorResponse(error); }
}
