import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || !["owner", "admin"].includes(profile.role) || !profile.organization_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.ip_range !== undefined) updates.ip_range = body.ip_range;
  if (body.label !== undefined) updates.label = body.label;
  if (body.description !== undefined) updates.description = body.description;
  if (body.enabled !== undefined) updates.enabled = body.enabled;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: rule, error } = await admin
    .from("ip_whitelist")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 });
  }

  return NextResponse.json({ rule });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || !["owner", "admin"].includes(profile.role) || !profile.organization_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("ip_whitelist")
    .delete()
    .eq("id", id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
