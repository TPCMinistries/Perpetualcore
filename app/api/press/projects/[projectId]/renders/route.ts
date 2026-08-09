import { NextRequest, NextResponse } from "next/server";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { requireProject, rows } from "@/lib/press/service";
import type { PressRender } from "@/lib/press/types";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const project = await requireProject((await params).projectId);
    const admin = createPressAdminClient();
    const { data, error } = await admin.from("press_renders").select("*")
      .eq("project_id", project.id).eq("organization_id", project.organization_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ renders: rows<PressRender>(data) });
  } catch (error) { return pressErrorResponse(error); }
}
