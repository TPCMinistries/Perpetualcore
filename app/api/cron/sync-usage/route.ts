import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { syncUsageToStripe } from "@/lib/billing/metering";
import { sendAlertNotifications, resetAlertsForBillingPeriod } from "@/lib/billing/alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * POST /api/cron/sync-usage
 * Sync all organization usage to Stripe for metered billing
 *
 * This should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
 * Schedule: Every hour or daily, depending on needs
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authorization
    const authHeader = req.headers.get("authorization");
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const results: Array<{
      organizationId: string;
      success: boolean;
      metersSynced: number;
      alertsSent: number;
      errors: string[];
    }> = [];

    // Get all organizations with active subscriptions
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("organization_id, stripe_subscription_id")
      .eq("status", "active")
      .not("stripe_subscription_id", "is", null);

    if (error) {
      console.error("[SyncUsage] Error fetching subscriptions:", error);
      return Response.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    console.log(`[SyncUsage] Processing ${subscriptions?.length || 0} organizations`);

    // Process each organization
    for (const sub of subscriptions || []) {
      try {
        // Sync usage to Stripe
        const syncResult = await syncUsageToStripe(sub.organization_id);

        // Check and send alerts
        const alerts = await sendAlertNotifications(sub.organization_id);

        results.push({
          organizationId: sub.organization_id,
          success: syncResult.synced,
          metersSynced: syncResult.metersSynced,
          alertsSent: alerts.length,
          errors: syncResult.errors,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.push({
          organizationId: sub.organization_id,
          success: false,
          metersSynced: 0,
          alertsSent: 0,
          errors: [message],
        });
      }
    }

    // Summary
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const totalMetersSynced = results.reduce((sum, r) => sum + r.metersSynced, 0);
    const totalAlertsSent = results.reduce((sum, r) => sum + r.alertsSent, 0);

    console.log(`[SyncUsage] Completed: ${successful} success, ${failed} failed`);
    console.log(`[SyncUsage] Meters synced: ${totalMetersSynced}, Alerts sent: ${totalAlertsSent}`);

    return Response.json({
      success: true,
      summary: {
        organizationsProcessed: results.length,
        successful,
        failed,
        totalMetersSynced,
        totalAlertsSent,
      },
      results,
    });
  } catch (error) {
    console.error("[SyncUsage] Cron job error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/cron/sync-usage
 * Check status of sync job (for monitoring)
 */
export async function GET(req: NextRequest) {
  // Verify authorization
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Get stats on organizations and meters
  const { data: orgCount } = await supabase
    .from("subscriptions")
    .select("organization_id", { count: "exact", head: true })
    .eq("status", "active");

  const { data: meterStats } = await supabase
    .from("usage_meters")
    .select("meter_type, current_usage, overage_units")
    .gte("billing_period_start", new Date(new Date().setDate(1)).toISOString());

  const stats = {
    activeOrganizations: orgCount || 0,
    currentPeriodMeters: meterStats?.length || 0,
    totalUsage: meterStats?.reduce((sum, m) => sum + (m.current_usage || 0), 0) || 0,
    totalOverageUnits: meterStats?.reduce((sum, m) => sum + (m.overage_units || 0), 0) || 0,
  };

  return Response.json({
    status: "healthy",
    lastCheck: new Date().toISOString(),
    stats,
  });
}
