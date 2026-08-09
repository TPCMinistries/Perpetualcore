import { NextRequest, NextResponse } from "next/server";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { requireProject, rows } from "@/lib/press/service";
import type { PressPublication } from "@/lib/press/types";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const project = await requireProject((await params).projectId);
    const admin = createPressAdminClient();
    const { data, error } = await admin.from("press_publications")
      .select("id, organization_id, project_id, clip_id, render_id, publish_target_id, provider, mode, status, scheduled_for, external_content_id, external_url, idempotency_key, created_by, error_message, created_at, updated_at")
      .eq("project_id", project.id).eq("organization_id", project.organization_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ publications: rows<PressPublication>(data) });
  } catch (error) { return pressErrorResponse(error); }
}
