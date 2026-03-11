import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  createSubAccount,
  planIncludesOperate,
} from "@/lib/ghl/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ghl/provision
 *
 * Provisions a GHL sub-account for a user.
 * Called when a user upgrades to a plan that includes OPERATE,
 * or when they first visit /dashboard/operate.
 *
 * Body: { userId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, organization_id, ghl_provisioned, ghl_location_id")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Already provisioned — return existing location
    if (profile.ghl_provisioned && profile.ghl_location_id) {
      return NextResponse.json({
        already_provisioned: true,
        location_id: profile.ghl_location_id,
      });
    }

    // Verify user has an OPERATE-eligible plan
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("organization_id", profile.organization_id)
      .in("status", ["active", "trialing"])
      .single();

    const currentPlan = subscription?.plan || "free";

    if (!planIncludesOperate(currentPlan)) {
      return NextResponse.json(
        {
          error: "Plan does not include OPERATE access",
          plan: currentPlan,
          required: "pro or above",
        },
        { status: 403 }
      );
    }

    // Get organization name for sub-account
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .single();

    const accountName = org?.name || profile.full_name || "Perpetual Core User";

    // Create GHL sub-account
    const location = await createSubAccount({
      name: accountName,
      email: profile.email,
    });

    // Store location ID on profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        ghl_location_id: location.id,
        ghl_provisioned: true,
        ghl_snapshot_applied: !!process.env.GHL_DEFAULT_SNAPSHOT_ID,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to update profile with GHL location:", updateError);
      // Still log the provisioning so we can recover
    }

    // Log the provisioning event
    await supabase.from("ghl_provisioning_log").insert({
      user_id: userId,
      organization_id: profile.organization_id,
      ghl_location_id: location.id,
      action: "provisioned",
      metadata: {
        plan: currentPlan,
        snapshot_applied: !!process.env.GHL_DEFAULT_SNAPSHOT_ID,
        account_name: accountName,
      },
    });

    return NextResponse.json({
      success: true,
      location_id: location.id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GHL provision error:", message);

    return NextResponse.json(
      { error: `Failed to provision GHL account: ${message}` },
      { status: 500 }
    );
  }
}
