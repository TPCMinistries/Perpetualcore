import { NextRequest, NextResponse } from "next/server";
import { PRESS_ADMIN_ROLES, requirePressUser } from "@/lib/press/auth";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { deletePressProjectStorage } from "@/lib/press/lifecycle";
import { checkPressMutationRateLimit } from "@/lib/press/rate-limit";
import { deleteProjectSchema } from "@/lib/press/schemas";
import { requireProject } from "@/lib/press/service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const project = await requireProject((await params).projectId, PRESS_ADMIN_ROLES);
    const input = deleteProjectSchema.parse(await request.json());
    if (input.confirmationTitle !== project.title) {
      return NextResponse.json({ error: "Type the recording title exactly to confirm deletion." }, { status: 400 });
    }
    if (project.status !== "archived") {
      return NextResponse.json({ error: "Archive this recording before permanently deleting it." }, { status: 409 });
    }
    const { user } = await requirePressUser();
    const rateLimited = await checkPressMutationRateLimit(request, user.id);
    if (rateLimited) return rateLimited;

    const admin = createPressAdminClient();
    const { count, error: activeError } = await admin.from("press_jobs")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id)
      .eq("organization_id", project.organization_id)
      .eq("status", "processing")
      .gt("lease_expires_at", new Date().toISOString());
    if (activeError) throw activeError;
    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: "Processing is still active. Try deletion after that lease ends." }, { status: 409 });
    }
    const { count: unfinishedUploads, error: uploadError } = await admin.from("press_assets")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id)
      .eq("organization_id", project.organization_id)
      .eq("status", "awaiting_upload");
    if (uploadError) throw uploadError;
    const archiveAgeMs = Date.now() - new Date(project.updated_at).getTime();
    if ((unfinishedUploads ?? 0) > 0 && archiveAgeMs < 48 * 60 * 60 * 1000) {
      return NextResponse.json({
        error: "An unfinished upload is still expiring. Permanent deletion will be available 48 hours after archive.",
      }, { status: 409 });
    }

    const cleanup = await deletePressProjectStorage(admin, {
      projectId: project.id,
      organizationId: project.organization_id,
    });
    const { error: deleteError } = await admin.from("press_projects").delete()
      .eq("id", project.id).eq("organization_id", project.organization_id);
    if (deleteError) throw deleteError;

    return NextResponse.json({ deleted: true, removedObjects: cleanup.removedObjects });
  } catch (error) {
    return pressErrorResponse(error);
  }
}
