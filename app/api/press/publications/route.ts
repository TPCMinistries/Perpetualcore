import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { createPublicationSchema } from "@/lib/press/schemas";
import {
  asPublication, asPublishTarget, assertProjectIsMutable, getPublishCapabilities,
  requireClip, requireProject, requireRender,
} from "@/lib/press/service";
import {
  PRESS_ADMIN_ROLES,
  PRESS_EDITOR_ROLES,
  requireOrganizationAccess,
  requirePressUser,
} from "@/lib/press/auth";
import { checkPressMutationRateLimit } from "@/lib/press/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const input = createPublicationSchema.parse(await request.json());
    const render = await requireRender(input.renderId, PRESS_EDITOR_ROLES);
    if (render.status !== "completed" || !render.output_bucket || !render.output_path) {
      return NextResponse.json({ error: "A completed render is required" }, { status: 409 });
    }
    const [clip, project] = await Promise.all([
      requireClip(render.clip_id, PRESS_EDITOR_ROLES),
      requireProject(render.project_id, PRESS_EDITOR_ROLES),
    ]);
    if (clip.project_id !== project.id || render.clip_id !== clip.id) {
      return NextResponse.json({ error: "Render lineage is invalid" }, { status: 409 });
    }
    assertProjectIsMutable(project);
    if (!project.rights_attested_at || !project.rights_attested_by) {
      return NextResponse.json({ error: "Media rights attestation is required" }, { status: 403 });
    }
    if (!(["approved", "rendered"] as string[]).includes(clip.status)) {
      return NextResponse.json({ error: "Clip must be approved before publication" }, { status: 409 });
    }

    const admin = createPressAdminClient();
    let target: ReturnType<typeof asPublishTarget> | null = null;
    let capabilities = { manualExport: true, scheduling: false, directPublish: false };
    if (input.mode === "scheduled") {
      await requireOrganizationAccess(project.organization_id, PRESS_ADMIN_ROLES);
      const { data: targetData, error: targetError } = await admin.from("press_publish_targets")
        .select("id, organization_id, provider, account_label, external_account_id, status, adapter_configured, non_secret_config, created_at, updated_at")
        .eq("id", input.publishTargetId ?? "").eq("organization_id", project.organization_id).maybeSingle();
      if (targetError) throw targetError;
      if (!targetData) return NextResponse.json({ error: "Publish target not found" }, { status: 404 });
      target = asPublishTarget(targetData);
      capabilities = getPublishCapabilities(target);
      if (!capabilities.scheduling) {
        return NextResponse.json({ error: "Target must be active with an explicitly configured provider adapter" }, { status: 409 });
      }
    }

    const { user } = await requirePressUser();
    const rateLimited = await checkPressMutationRateLimit(request, user.id);
    if (rateLimited) return rateLimited;
    const idempotencyKey = input.idempotencyKey ?? `${input.mode}:${render.id}:${target?.id ?? "manual"}:${randomUUID()}`;
    const insert = {
      organization_id: project.organization_id, project_id: project.id, clip_id: clip.id,
      render_id: render.id, publish_target_id: target?.id ?? null, provider: target?.provider ?? "manual",
      mode: input.mode, status: input.mode === "manual_export" ? "export_ready" : "scheduled",
      scheduled_for: input.scheduledFor ?? null, external_content_id: null, external_url: null,
      idempotency_key: idempotencyKey, created_by: user.id, error_message: null,
      approved_by: user.id, approved_at: new Date().toISOString(),
    };
    let { data: publicationData, error: publicationError } = await admin.from("press_publications")
      .insert(insert).select("*").single();
    if (publicationError?.code === "23505") {
      const existing = await admin.from("press_publications").select("*")
        .eq("organization_id", project.organization_id).eq("idempotency_key", idempotencyKey).maybeSingle();
      publicationData = existing.data;
      publicationError = existing.error;
    }
    if (publicationError || !publicationData) throw publicationError ?? new Error("Publication was not created");

    let download: { url: string; expiresAt: string } | null = null;
    if (input.mode === "manual_export") {
      const expiresIn = 900;
      const { data: signed, error: signError } = await admin.storage.from(render.output_bucket)
        .createSignedUrl(render.output_path, expiresIn, { download: true });
      if (signError || !signed?.signedUrl) throw signError ?? new Error("Unable to sign export");
      download = { url: signed.signedUrl, expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString() };
    }
    return NextResponse.json({
      publication: asPublication(publicationData), capabilities, download: download ?? undefined,
    }, { status: 201 });
  } catch (error) { return pressErrorResponse(error); }
}
