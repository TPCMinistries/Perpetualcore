import { NextRequest, NextResponse } from "next/server";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { createAuthenticClipPackSchema } from "@/lib/press/schemas";
import { asGenerationRun, requireProject, rows } from "@/lib/press/service";
import type { PressGenerationRun } from "@/lib/press/types";
import { requirePressUser } from "@/lib/press/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const project = await requireProject((await params).projectId);
    const admin = createPressAdminClient();
    const { data, error } = await admin.from("press_generation_runs").select("*")
      .eq("project_id", project.id).eq("organization_id", project.organization_id)
      .order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return NextResponse.json({ runs: rows<PressGenerationRun>(data) });
  } catch (error) {
    return pressErrorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const project = await requireProject((await params).projectId);
    const input = createAuthenticClipPackSchema.parse(await request.json());
    const { user } = await requirePressUser();
    const admin = createPressAdminClient();
    const { data, error } = await admin.rpc("press_queue_authentic_clip_pack", {
      p_organization_id: project.organization_id,
      p_project_id: project.id,
      p_created_by: user.id,
      p_title: input.title,
      p_brief: input.brief,
      p_config: {
        clipCount: input.clipCount,
        targetMinSeconds: input.targetMinSeconds,
        targetMaxSeconds: input.targetMaxSeconds,
        goals: input.goals,
        formats: input.formats,
        captions: input.captions,
      },
      p_idempotency_key: input.idempotencyKey,
    });
    if (error) throw error;
    return NextResponse.json({ run: asGenerationRun(data) }, { status: 201 });
  } catch (error) {
    return pressErrorResponse(error);
  }
}
