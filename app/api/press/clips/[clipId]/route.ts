import { NextRequest, NextResponse } from "next/server";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { clipActionSchema } from "@/lib/press/schemas";
import { asClip, assertProjectIsMutable, requireClip, requireProject } from "@/lib/press/service";
import { PRESS_EDITOR_ROLES, requirePressUser } from "@/lib/press/auth";
import { PRESS_MAX_CLIP_DURATION_MS } from "@/lib/press/media";
import { checkPressMutationRateLimit } from "@/lib/press/rate-limit";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ clipId: string }> }) {
  try {
    const clip = await requireClip((await params).clipId, PRESS_EDITOR_ROLES);
    assertProjectIsMutable(await requireProject(clip.project_id, PRESS_EDITOR_ROLES));
    const input = clipActionSchema.parse(await request.json());
    if (clip.version !== input.version) {
      return NextResponse.json({ error: "Clip changed", currentVersion: clip.version }, { status: 409 });
    }
    const { user } = await requirePressUser();
    const rateLimited = await checkPressMutationRateLimit(request, user.id);
    if (rateLimited) return rateLimited;
    const updates: Record<string, unknown> = { version: input.version + 1, updated_at: new Date().toISOString() };
    if (input.action === "approve") {
      updates.status = "approved"; updates.rejection_reason = null;
      updates.reviewed_by = user.id; updates.reviewed_at = new Date().toISOString();
    } else if (input.action === "reject") {
      updates.status = "rejected"; updates.rejection_reason = input.rejectionReason;
      updates.reviewed_by = user.id; updates.reviewed_at = new Date().toISOString();
    } else {
      const start = input.startMs ?? clip.start_ms;
      const end = input.endMs ?? clip.end_ms;
      if (end <= start) return NextResponse.json({ error: "endMs must be after startMs" }, { status: 400 });
      if (end - start > PRESS_MAX_CLIP_DURATION_MS) {
        return NextResponse.json({ error: "Clips can be at most two minutes long." }, { status: 400 });
      }
      if (input.startMs !== undefined) updates.start_ms = input.startMs;
      if (input.endMs !== undefined) updates.end_ms = input.endMs;
      if (input.title !== undefined) updates.title = input.title;
      if (input.hook !== undefined) updates.hook = input.hook;
      if (clip.status === "approved") {
        updates.status = "proposed";
        updates.reviewed_by = null;
        updates.reviewed_at = null;
        updates.rejection_reason = null;
      }
    }
    const admin = createPressAdminClient();
    if (input.action !== "reject") {
      const start = input.action === "update" ? input.startMs ?? clip.start_ms : clip.start_ms;
      const end = input.action === "update" ? input.endMs ?? clip.end_ms : clip.end_ms;
      const { data: source, error: sourceError } = await admin.from("press_assets")
        .select("duration_seconds")
        .eq("project_id", clip.project_id)
        .eq("organization_id", clip.organization_id)
        .in("kind", ["source", "source_video", "source_audio"])
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (sourceError) throw sourceError;
      const sourceDurationMs = source?.duration_seconds === null || source?.duration_seconds === undefined
        ? null
        : Number(source.duration_seconds) * 1000;
      if (end - start > PRESS_MAX_CLIP_DURATION_MS || (sourceDurationMs !== null && end > sourceDurationMs + 1000)) {
        return NextResponse.json({ error: "Clip timing must stay within the source and the two-minute limit." }, { status: 400 });
      }
    }
    const { data, error } = await admin.from("press_clips").update(updates)
      .eq("id", clip.id).eq("organization_id", clip.organization_id).eq("version", input.version)
      .select("*").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Clip changed" }, { status: 409 });
    return NextResponse.json({ clip: asClip(data) });
  } catch (error) { return pressErrorResponse(error); }
}
