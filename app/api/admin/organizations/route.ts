import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only super admins (owner role) can list all organizations
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "owner") {
    return NextResponse.json({ error: "Forbidden: super admin access required" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Get all organizations with member counts and plan info
  const { data: orgs, error } = await admin
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 });
  }

  // Enrich with member counts
  const enriched = await Promise.all(
    (orgs ?? []).map(async (org) => {
      const { count: memberCount } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", org.id);

      const { data: ssoProviders } = await admin
        .from("sso_providers")
        .select("id, enabled")
        .eq("organization_id", org.id)
        .eq("enabled", true);

      return {
        ...org,
        member_count: memberCount ?? 0,
        has_sso: (ssoProviders?.length ?? 0) > 0,
        plan: null, // Populated by subscription lookup if needed
        compliance_score: null,
      };
    })
  );

  return NextResponse.json({ organizations: enriched });
}
