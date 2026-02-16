import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

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
  const { data: policy } = await admin
    .from("session_policies")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .single();

  return NextResponse.json({
    policy: policy ?? {
      max_session_duration_hours: 24,
      idle_timeout_minutes: 60,
      enforce_mfa: false,
      max_concurrent_sessions: 5,
      require_re_auth_for_sensitive: false,
      allowed_auth_methods: ["password", "sso", "magic_link"],
    },
  });
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
  const {
    enforce_mfa,
    max_session_duration_hours,
    idle_timeout_minutes,
    max_concurrent_sessions,
    require_re_auth_for_sensitive,
    allowed_auth_methods,
  } = body;

  const admin = createAdminClient();
  const { data: policy, error } = await admin
    .from("session_policies")
    .upsert(
      {
        organization_id: profile.organization_id,
        enforce_mfa: enforce_mfa ?? false,
        max_session_duration_hours: max_session_duration_hours ?? 24,
        idle_timeout_minutes: idle_timeout_minutes ?? 60,
        max_concurrent_sessions: max_concurrent_sessions ?? 5,
        require_re_auth_for_sensitive: require_re_auth_for_sensitive ?? false,
        allowed_auth_methods: allowed_auth_methods ?? ["password", "sso", "magic_link"],
      },
      { onConflict: "organization_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update session policy" }, { status: 500 });
  }

  return NextResponse.json({ policy });
}
