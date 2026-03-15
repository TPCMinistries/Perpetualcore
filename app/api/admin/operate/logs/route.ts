import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/operate/logs
 * Get the GHL provisioning audit log.
 */
export async function GET() {
  const auth = await requirePermission("users.read");
  if (auth.response) return auth.response;

  const supabase = createAdminClient();

  const { data: logs, error } = await supabase
    .from("ghl_provisioning_log")
    .select("id, user_id, ghl_location_id, action, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs });
}
