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

  // Get SSO sessions as proxy for active sessions
  const { data: sessions, error } = await admin
    .from("sso_sessions")
    .select(`
      id,
      user_id,
      ip_address,
      user_agent,
      login_at,
      logout_at,
      expires_at,
      created_at
    `)
    .is("logout_at", null)
    .order("login_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }

  // Enrich with user profiles
  const userIds = [...new Set(sessions?.map((s) => s.user_id).filter(Boolean) ?? [])];
  let profileMap: Record<string, { email: string; full_name: string | null }> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    profileMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, { email: p.email, full_name: p.full_name }])
    );
  }

  const enriched = (sessions ?? []).map((s) => ({
    id: s.id,
    user_id: s.user_id,
    user_email: profileMap[s.user_id]?.email ?? "Unknown",
    user_name: profileMap[s.user_id]?.full_name ?? null,
    ip_address: s.ip_address,
    user_agent: s.user_agent,
    login_at: s.login_at,
    last_active_at: s.login_at,
    provider: "sso",
  }));

  return NextResponse.json({ sessions: enriched });
}

export async function DELETE(request: NextRequest) {
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

  if (!profile || !["owner", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Mark session as logged out
  const { error } = await admin
    .from("sso_sessions")
    .update({ logout_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) {
    return NextResponse.json({ error: "Failed to terminate session" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
