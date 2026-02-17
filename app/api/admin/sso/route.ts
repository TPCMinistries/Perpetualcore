import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["owner", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: providers, error } = await admin
    .from("sso_providers")
    .select(`
      id,
      organization_id,
      provider_type,
      provider_name,
      enabled,
      enforce_sso,
      auto_provision_users,
      allowed_domains,
      created_at,
      updated_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch SSO providers" }, { status: 500 });
  }

  // Enrich with org names
  const orgIds = [...new Set((providers ?? []).map((p) => p.organization_id))];
  let orgMap: Record<string, string> = {};

  if (orgIds.length > 0) {
    const { data: orgs } = await admin
      .from("organizations")
      .select("id, name")
      .in("id", orgIds);

    orgMap = Object.fromEntries((orgs ?? []).map((o) => [o.id, o.name]));
  }

  const enriched = (providers ?? []).map((p) => ({
    ...p,
    organization_name: orgMap[p.organization_id] ?? "Unknown",
  }));

  return NextResponse.json({ providers: enriched });
}
