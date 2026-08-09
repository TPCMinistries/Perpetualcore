import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createPressAdminClient, PRESS_RENDER_BUCKET } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { createRendersSchema } from "@/lib/press/schemas";
import { asJob, asRender, requireClip } from "@/lib/press/service";
import { PRESS_EDITOR_ROLES, requirePressUser } from "@/lib/press/auth";
import { assertPressJobCapacity } from "@/lib/press/limits";
import { checkPressJobRateLimit } from "@/lib/press/rate-limit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ clipId: string }> }) {
  try {
    const clip = await requireClip((await params).clipId, PRESS_EDITOR_ROLES);
    if (clip.status !== "approved") {
      return NextResponse.json({ error: "Clip must be approved before rendering" }, { status: 409 });
    }
    const input = createRendersSchema.parse(await request.json());
    const { user } = await requirePressUser();
    const rateLimited = await checkPressJobRateLimit(request, user.id);
    if (rateLimited) return rateLimited;
    const renderRows = input.formats.map((format) => ({
      id: randomUUID(), project_id: clip.project_id, clip_id: clip.id,
      organization_id: clip.organization_id, aspect_ratio: format.aspectRatio,
      template: format.template,
      caption_style: format.captionStyle,
      status: "queued", output_bucket: PRESS_RENDER_BUCKET,
      output_path: `${clip.organization_id}/${clip.project_id}/renders/${randomUUID()}.mp4`,
      settings: {
        aspectRatio: format.aspectRatio,
        template: format.template,
        captionStyle: format.captionStyle,
        focalPoint: format.settings.focalPoint,
        captionPosition: format.settings.captionPosition,
      },
    }));
    const admin = createPressAdminClient();
    const { data: source, error: sourceError } = await admin.from("press_assets")
      .select("kind")
      .eq("project_id", clip.project_id)
      .eq("organization_id", clip.organization_id)
      .in("kind", ["source", "source_video", "source_audio"])
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (sourceError) throw sourceError;
    if (!source || source.kind === "source_audio") {
      return NextResponse.json({ error: "Video exports currently require a video source." }, { status: 409 });
    }
    await assertPressJobCapacity(admin, clip.organization_id, renderRows.length);
    const { data: renders, error: renderError } = await admin.from("press_renders")
      .insert(renderRows).select("*");
    if (renderError) throw renderError;
    const jobRows = renderRows.map((render) => ({
      organization_id: clip.organization_id, project_id: clip.project_id, asset_id: null,
      render_id: render.id, job_type: "render_clip", status: "pending", priority: 50,
      attempts: 0, max_attempts: 3, progress: 0,
      payload: { clipId: clip.id, renderId: render.id }, result: {}, error_message: null,
      lease_owner: null, lease_expires_at: null, idempotency_key: `render_clip:${render.id}`,
    }));
    const { data: jobs, error: jobError } = await admin.from("press_jobs").insert(jobRows).select("*");
    if (jobError) {
      await admin.from("press_renders").delete().in("id", renderRows.map((render) => render.id));
      throw jobError;
    }
    const now = new Date().toISOString();
    await Promise.all([
      admin.from("press_clips").update({ status: "rendering", updated_at: now })
        .eq("id", clip.id).eq("organization_id", clip.organization_id),
      admin.from("press_projects").update({ status: "rendering", updated_at: now })
        .eq("id", clip.project_id).eq("organization_id", clip.organization_id),
    ]);
    return NextResponse.json({
      renders: (renders ?? []).map(asRender), jobs: (jobs ?? []).map(asJob),
    }, { status: 201 });
  } catch (error) { return pressErrorResponse(error); }
}
