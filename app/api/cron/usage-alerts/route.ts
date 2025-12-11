import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron endpoint to check usage levels and send alerts
 *
 * Runs daily at 9 AM to:
 * - Check organizations approaching usage limits (80%, 90%, 100%)
 * - Send email notifications to users
 * - Track alerts sent to avoid spam
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info("[Cron] Starting usage alerts check");

    const supabase = createAdminClient();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const alerts: { type: string; orgId: string; email: string; percentage: number }[] = [];

    // Get all active subscriptions with usage data
    const { data: orgsWithUsage, error } = await supabase
      .from("subscriptions")
      .select(`
        organization_id,
        plan,
        organizations (
          name,
          owner_email
        )
      `)
      .eq("status", "active");

    if (error) {
      logger.error("[Cron] Error fetching subscriptions:", { error });
      throw error;
    }

    // Get plan limits
    const { data: planLimits } = await supabase
      .from("plan_limits")
      .select("*");

    const limitsMap = new Map(planLimits?.map(l => [l.plan, l]) || []);

    for (const org of orgsWithUsage || []) {
      const limits = limitsMap.get(org.plan) || limitsMap.get("free");
      if (!limits) continue;

      // Get current usage
      const { data: usage } = await supabase
        .from("usage_tracking")
        .select("*")
        .eq("organization_id", org.organization_id)
        .eq("month", currentMonth)
        .single();

      if (!usage) continue;

      const ownerEmail = (org.organizations as any)?.owner_email;
      const orgName = (org.organizations as any)?.name || "Your organization";
      if (!ownerEmail) continue;

      // Check AI messages limit
      if (limits.ai_messages_limit > 0) {
        const percentage = (usage.ai_messages_count / limits.ai_messages_limit) * 100;
        if (percentage >= 80) {
          const alertType = percentage >= 100 ? "limit_reached" : percentage >= 90 ? "90_percent" : "80_percent";

          // Check if we already sent this alert today
          const { data: existingAlert } = await supabase
            .from("usage_alerts")
            .select("id")
            .eq("organization_id", org.organization_id)
            .eq("alert_type", alertType)
            .eq("metric", "ai_messages")
            .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .single();

          if (!existingAlert) {
            alerts.push({ type: alertType, orgId: org.organization_id, email: ownerEmail, percentage });

            // Send email
            await sendUsageAlertEmail(ownerEmail, orgName, "AI Messages", percentage, usage.ai_messages_count, limits.ai_messages_limit, org.plan);

            // Record alert
            await supabase.from("usage_alerts").insert({
              organization_id: org.organization_id,
              alert_type: alertType,
              metric: "ai_messages",
              current_value: usage.ai_messages_count,
              limit_value: limits.ai_messages_limit,
              percentage,
            });
          }
        }
      }

      // Check documents limit
      if (limits.documents_limit > 0) {
        const percentage = (usage.documents_stored / limits.documents_limit) * 100;
        if (percentage >= 80) {
          const alertType = percentage >= 100 ? "limit_reached" : percentage >= 90 ? "90_percent" : "80_percent";

          const { data: existingAlert } = await supabase
            .from("usage_alerts")
            .select("id")
            .eq("organization_id", org.organization_id)
            .eq("alert_type", alertType)
            .eq("metric", "documents")
            .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .single();

          if (!existingAlert) {
            alerts.push({ type: alertType, orgId: org.organization_id, email: ownerEmail, percentage });

            await sendUsageAlertEmail(ownerEmail, orgName, "Documents", percentage, usage.documents_stored, limits.documents_limit, org.plan);

            await supabase.from("usage_alerts").insert({
              organization_id: org.organization_id,
              alert_type: alertType,
              metric: "documents",
              current_value: usage.documents_stored,
              limit_value: limits.documents_limit,
              percentage,
            });
          }
        }
      }

      // Check storage limit
      if (limits.storage_limit_gb > 0) {
        const storageGb = usage.storage_bytes / (1024 * 1024 * 1024);
        const percentage = (storageGb / limits.storage_limit_gb) * 100;
        if (percentage >= 80) {
          const alertType = percentage >= 100 ? "limit_reached" : percentage >= 90 ? "90_percent" : "80_percent";

          const { data: existingAlert } = await supabase
            .from("usage_alerts")
            .select("id")
            .eq("organization_id", org.organization_id)
            .eq("alert_type", alertType)
            .eq("metric", "storage")
            .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .single();

          if (!existingAlert) {
            alerts.push({ type: alertType, orgId: org.organization_id, email: ownerEmail, percentage });

            await sendUsageAlertEmail(ownerEmail, orgName, "Storage", percentage, storageGb, limits.storage_limit_gb, org.plan);

            await supabase.from("usage_alerts").insert({
              organization_id: org.organization_id,
              alert_type: alertType,
              metric: "storage",
              current_value: storageGb,
              limit_value: limits.storage_limit_gb,
              percentage,
            });
          }
        }
      }
    }

    logger.info("[Cron] Usage alerts check complete", { alertsSent: alerts.length });

    return NextResponse.json({
      success: true,
      alertsSent: alerts.length,
      alerts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Cron] Error in usage alerts check", { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

async function sendUsageAlertEmail(
  email: string,
  orgName: string,
  metric: string,
  percentage: number,
  current: number,
  limit: number,
  plan: string
) {
  const isLimitReached = percentage >= 100;
  const subject = isLimitReached
    ? `⚠️ ${metric} Limit Reached - ${orgName}`
    : `📊 ${Math.round(percentage)}% of ${metric} Used - ${orgName}`;

  const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`;

  await sendEmail(
    email,
    subject,
    `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Usage Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, ${isLimitReached ? '#ef4444' : '#f59e0b'} 0%, ${isLimitReached ? '#dc2626' : '#d97706'} 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">
                ${isLimitReached ? 'Usage Limit Reached' : 'Usage Alert'}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${isLimitReached
                  ? `Your organization <strong>${orgName}</strong> has reached the ${metric.toLowerCase()} limit for your ${plan} plan.`
                  : `Your organization <strong>${orgName}</strong> has used <strong>${Math.round(percentage)}%</strong> of its ${metric.toLowerCase()} quota.`
                }
              </p>

              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #6b7280; font-size: 14px;">${metric} Usage</span>
                  <span style="color: #111827; font-weight: 600;">${Math.round(current)} / ${limit}</span>
                </div>
                <div style="background-color: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
                  <div style="background: ${isLimitReached ? '#ef4444' : percentage >= 90 ? '#f59e0b' : '#10b981'}; height: 100%; width: ${Math.min(percentage, 100)}%;"></div>
                </div>
              </div>

              ${isLimitReached ? `
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                You won't be able to use additional ${metric.toLowerCase()} until your plan resets or you upgrade.
              </p>
              ` : ''}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${upgradeUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                  Upgrade Your Plan
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  );
}
