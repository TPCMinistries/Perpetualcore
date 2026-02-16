import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const VALID_RESOURCE_TYPES = ["audit_logs", "conversations", "documents", "voice_memos", "analytics"] as const;

export async function GET() {
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
  const { data: policies, error } = await admin
    .from("data_retention_policies")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("resource_type");

  if (error) {
    return NextResponse.json({ error: "Failed to fetch policies" }, { status: 500 });
  }

  return NextResponse.json({ policies: policies ?? [] });
}

export async function PATCH(request: NextRequest) {
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
  const { resource_type, retention_days, auto_delete, archive_before_delete } = body;

  if (!resource_type || !VALID_RESOURCE_TYPES.includes(resource_type)) {
    return NextResponse.json({ error: "Invalid resource_type" }, { status: 400 });
  }

  if (retention_days !== undefined && (typeof retention_days !== "number" || retention_days < 1)) {
    return NextResponse.json({ error: "retention_days must be a positive number" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: policy, error } = await admin
    .from("data_retention_policies")
    .upsert(
      {
        organization_id: profile.organization_id,
        resource_type,
        retention_days: retention_days ?? 365,
        auto_delete: auto_delete ?? false,
        archive_before_delete: archive_before_delete ?? true,
      },
      { onConflict: "organization_id,resource_type" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update retention policy" }, { status: 500 });
  }

  return NextResponse.json({ policy });
}
