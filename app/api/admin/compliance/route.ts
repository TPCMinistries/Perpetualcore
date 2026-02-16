import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateComplianceScore } from "@/lib/compliance/readiness";

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

  if (!profile || !["owner", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!profile.organization_id) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  try {
    const score = await calculateComplianceScore(profile.organization_id);
    return NextResponse.json(score);
  } catch {
    return NextResponse.json({ error: "Failed to calculate compliance score" }, { status: 500 });
  }
}
