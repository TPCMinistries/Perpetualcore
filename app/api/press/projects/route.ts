import { NextRequest, NextResponse } from "next/server";
import { createProjectSchema, projectStatusSchema } from "@/lib/press/schemas";
import { pressErrorResponse } from "@/lib/press/http";
import { createPressAdminClient } from "@/lib/press/db";
import { requirePressUser } from "@/lib/press/auth";
import { asProject, resolveOrganizationId, rows } from "@/lib/press/service";
import type { PressProject } from "@/lib/press/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requirePressUser();
    const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit")) || 30, 1), 100);
    const offset = Math.max(Number(request.nextUrl.searchParams.get("offset")) || 0, 0);
    const statusParam = request.nextUrl.searchParams.get("status");
    const status = statusParam ? projectStatusSchema.parse(statusParam) : null;
    const { data: memberships, error: membershipError } = await supabase.from("organization_members")
      .select("organization_id").eq("user_id", user.id).or("status.is.null,status.eq.active");
    if (membershipError) throw membershipError;
    const organizationIds = (memberships ?? []).map((membership) => membership.organization_id);
    if (organizationIds.length === 0) {
      return NextResponse.json({ projects: [], total: 0, limit, offset });
    }
    const admin = createPressAdminClient();
    let query = admin.from("press_projects").select("*", { count: "exact" })
      .in("organization_id", organizationIds).order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (status) query = query.eq("status", status);
    const { data, count, error } = await query;
    if (error) throw error;
    return NextResponse.json({ projects: rows<PressProject>(data), total: count ?? 0, limit, offset });
  } catch (error) { return pressErrorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const input = createProjectSchema.parse(await request.json());
    const organizationId = await resolveOrganizationId(input.organizationId);
    const { user } = await requirePressUser();
    const admin = createPressAdminClient();
    const { data, error } = await admin.from("press_projects").insert({
      organization_id: organizationId, created_by: user.id, brand_id: input.brandId ?? null,
      title: input.title, status: "draft", platforms: input.platforms, metadata: {},
      rights_attested_at: new Date().toISOString(), rights_attested_by: user.id,
    }).select("*").single();
    if (error) throw error;
    return NextResponse.json({ project: asProject(data) }, { status: 201 });
  } catch (error) { return pressErrorResponse(error); }
}
