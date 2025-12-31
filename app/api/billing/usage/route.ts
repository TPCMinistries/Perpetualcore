import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import {
  getUsageSummary,
  getOrganizationMeters,
  trackAITokens,
  trackAPICall,
} from "@/lib/billing/metering";
import {
  getOverageBreakdown,
  checkOverageAllowed,
  projectUsage,
} from "@/lib/billing/overage";
import { sendAlertNotifications } from "@/lib/billing/alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/billing/usage
 * Get current usage summary for the authenticated user's organization
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return Response.json({ error: "No organization found" }, { status: 404 });
    }

    const organizationId = profile.organization_id;

    const { searchParams } = new URL(req.url);
    const includeProjections = searchParams.get("projections") === "true";
    const includeAlerts = searchParams.get("alerts") === "true";

    // Get usage summary
    const usageSummary = await getUsageSummary(organizationId);

    // Get overage breakdown
    const overageBreakdown = await getOverageBreakdown(organizationId);

    // Check if overage is allowed
    const overageStatus = await checkOverageAllowed(organizationId);

    // Build response
    const response: Record<string, any> = {
      meters: usageSummary.meters,
      totalOverageCost: usageSummary.totalOverageCost,
      hasOverage: usageSummary.hasOverage,
      overageStatus,
      breakdown: overageBreakdown.byMeter,
      plan: overageBreakdown.planConfig?.plan || "free",
    };

    // Include projections if requested
    if (includeProjections) {
      const projections: Record<string, any> = {};
      for (const meter of usageSummary.meters) {
        const projection = await projectUsage(organizationId, meter.meter.meter_type);
        if (projection) {
          projections[meter.meter.meter_type] = projection;
        }
      }
      response.projections = projections;
    }

    // Check and send alerts if requested
    if (includeAlerts) {
      const alerts = await sendAlertNotifications(organizationId);
      response.alertsSent = alerts;
    }

    return Response.json(response);
  } catch (error) {
    console.error("Usage API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/billing/usage
 * Record usage (for internal/webhook use)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return Response.json({ error: "No organization found" }, { status: 404 });
    }

    const body = await req.json();
    const { meter_type, amount } = body;

    if (!meter_type || amount === undefined) {
      return Response.json(
        { error: "meter_type and amount are required" },
        { status: 400 }
      );
    }

    // Track usage based on type
    let result;
    switch (meter_type) {
      case "ai_tokens":
        result = await trackAITokens(profile.organization_id, amount);
        break;
      case "api_calls":
        result = await trackAPICall(profile.organization_id);
        break;
      default:
        return Response.json(
          { error: `Invalid meter_type: ${meter_type}` },
          { status: 400 }
        );
    }

    if (!result) {
      return Response.json(
        { error: "Failed to record usage" },
        { status: 500 }
      );
    }

    // Check if we should send alerts
    await sendAlertNotifications(profile.organization_id);

    return Response.json({
      success: true,
      meter: result.meter,
      percentUsed: result.percentUsed,
      isOverage: result.isOverage,
      overageCost: result.overageCost,
    });
  } catch (error) {
    console.error("Usage POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
