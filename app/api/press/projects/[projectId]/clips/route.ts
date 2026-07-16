import { NextRequest, NextResponse } from "next/server";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { requireProject, rows } from "@/lib/press/service";
import type { PressClip } from "@/lib/press/types";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const project = await requireProject((await params).projectId);
    const admin = createPressAdminClient();
    const { data, error } = await admin.from("press_clips").select("*")
      .eq("project_id", project.id).eq("organization_id", project.organization_id)
      .order("score", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return NextResponse.json({ clips: rows<PressClip>(data) });
  } catch (error) { return pressErrorResponse(error); }
}
