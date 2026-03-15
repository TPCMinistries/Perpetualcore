import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/rbac";
import { createSubAccount, deleteSubAccount, planIncludesOperate } from "@/lib/ghl/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/operate
 * List all users with their GHL/OPERATE status.
 */
export async function GET() {
  const auth = await requirePermission("users.read");
  if (auth.response) return auth.response;

  const supabase = createAdminClient();

  const { data: users, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, organization_id, ghl_location_id, ghl_provisioned, ghl_snapshot_applied"
    )
    .order("full_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get subscription plans for all orgs
  const orgIds = Array.from(new Set(users?.map((u) => u.organization_id).filter(Boolean)));
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("organization_id, plan, status")
    .in("organization_id", orgIds)
    .in("status", ["active", "trialing"]);

  const planByOrg: Record<string, string> = {};
  for (const sub of subs || []) {
    planByOrg[sub.organization_id] = sub.plan;
  }

  const enriched = (users || []).map((u) => ({
    ...u,
    plan: planByOrg[u.organization_id] || "free",
    operate_eligible: planIncludesOperate(planByOrg[u.organization_id] || "free"),
  }));

  return NextResponse.json({ users: enriched });
}

/**
 * POST /api/admin/operate
 * Manually link or provision a GHL location for a user.
 *
 * Body: { userId: string, locationId?: string }
 *   - If locationId provided: directly links it (no GHL API call)
 *   - If no locationId: provisions a new sub-account via GHL API
 */
export async function POST(req: NextRequest) {
  const auth = await requirePermission("users.manage_roles");
  if (auth.response) return auth.response;

  const { userId, locationId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, organization_id, ghl_provisioned, ghl_location_id")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let finalLocationId = locationId;

  // If no locationId provided, provision via GHL API
  if (!finalLocationId) {
    try {
      const location = await createSubAccount({
        name: profile.full_name || "Perpetual Core User",
        email: profile.email,
      });
      finalLocationId = location.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json(
        { error: `GHL provisioning failed: ${message}` },
        { status: 500 }
      );
    }
  }

  // Update profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      ghl_location_id: finalLocationId,
      ghl_provisioned: true,
      ghl_snapshot_applied: !!locationId, // if manually linked, assume snapshot already applied
    })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Audit log
  await supabase.from("ghl_provisioning_log").insert({
    user_id: userId,
    organization_id: profile.organization_id,
    ghl_location_id: finalLocationId,
    action: locationId ? "admin_linked" : "admin_provisioned",
    metadata: {
      admin_user_id: auth.user!.id,
      manual_link: !!locationId,
    },
  });

  return NextResponse.json({ success: true, location_id: finalLocationId });
}

/**
 * DELETE /api/admin/operate
 * Deprovision a user's GHL location (unlink only — does NOT delete the GHL sub-account).
 *
 * Body: { userId: string, deleteFromGhl?: boolean }
 */
export async function DELETE(req: NextRequest) {
  const auth = await requirePermission("users.manage_roles");
  if (auth.response) return auth.response;

  const { userId, deleteFromGhl } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, ghl_location_id, organization_id")
    .eq("id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Optionally delete from GHL (dangerous — removes all their data)
  if (deleteFromGhl && profile.ghl_location_id) {
    try {
      await deleteSubAccount(profile.ghl_location_id);
    } catch (err) {
      console.error("Failed to delete GHL sub-account:", err);
      // Continue with unlinking even if GHL delete fails
    }
  }

  // Unlink from profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      ghl_location_id: null,
      ghl_provisioned: false,
      ghl_snapshot_applied: false,
    })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Audit log
  await supabase.from("ghl_provisioning_log").insert({
    user_id: userId,
    organization_id: profile.organization_id,
    ghl_location_id: profile.ghl_location_id,
    action: deleteFromGhl ? "admin_deleted" : "admin_unlinked",
    metadata: { admin_user_id: auth.user!.id },
  });

  return NextResponse.json({ success: true });
}
