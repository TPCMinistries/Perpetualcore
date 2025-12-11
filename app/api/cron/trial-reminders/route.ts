import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron endpoint to send trial expiry reminders
 *
 * Runs daily at 10 AM to:
 * - Check trials expiring in 3 days, 1 day, and today
 * - Send reminder emails to users
 * - Downgrade expired trials to free plan
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info("[Cron] Starting trial reminders check");

    const supabase = createAdminClient();
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    const results = {
      threeDayReminders: 0,
      oneDayReminders: 0,
      expiryNotices: 0,
      downgraded: 0,
    };

    // Find trials expiring in 3 days
    const { data: threeDayTrials } = await supabase
      .from("subscriptions")
      .select(`
        *,
        organizations (
          name,
          owner_email
        )
      `)
      .eq("status", "trialing")
      .gte("trial_end", now.toISOString())
      .lte("trial_end", threeDaysFromNow.toISOString())
      .gt("trial_end", oneDayFromNow.toISOString());

    for (const trial of threeDayTrials || []) {
      const email = (trial.organizations as any)?.owner_email;
      const orgName = (trial.organizations as any)?.name || "your account";
      if (!email) continue;

      // Check if we already sent this reminder
      const { data: existingReminder } = await supabase
        .from("email_logs")
        .select("id")
        .eq("recipient", email)
        .eq("template", "trial_3_day")
        .gte("sent_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (!existingReminder) {
        const daysLeft = Math.ceil((new Date(trial.trial_end).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        await sendTrialReminderEmail(email, orgName, daysLeft, trial.plan);

        await supabase.from("email_logs").insert({
          recipient: email,
          template: "trial_3_day",
          subject: `Your trial ends in ${daysLeft} days`,
          sent_at: now.toISOString(),
        });

        results.threeDayReminders++;
      }
    }

    // Find trials expiring in 1 day
    const { data: oneDayTrials } = await supabase
      .from("subscriptions")
      .select(`
        *,
        organizations (
          name,
          owner_email
        )
      `)
      .eq("status", "trialing")
      .gte("trial_end", now.toISOString())
      .lte("trial_end", oneDayFromNow.toISOString());

    for (const trial of oneDayTrials || []) {
      const email = (trial.organizations as any)?.owner_email;
      const orgName = (trial.organizations as any)?.name || "your account";
      if (!email) continue;

      const { data: existingReminder } = await supabase
        .from("email_logs")
        .select("id")
        .eq("recipient", email)
        .eq("template", "trial_1_day")
        .gte("sent_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (!existingReminder) {
        await sendTrialExpiringEmail(email, orgName, trial.plan);

        await supabase.from("email_logs").insert({
          recipient: email,
          template: "trial_1_day",
          subject: "Your trial ends tomorrow",
          sent_at: now.toISOString(),
        });

        results.oneDayReminders++;
      }
    }

    // Find and downgrade expired trials
    const { data: expiredTrials } = await supabase
      .from("subscriptions")
      .select(`
        *,
        organizations (
          name,
          owner_email
        )
      `)
      .eq("status", "trialing")
      .lt("trial_end", now.toISOString());

    for (const trial of expiredTrials || []) {
      const email = (trial.organizations as any)?.owner_email;
      const orgName = (trial.organizations as any)?.name || "your account";

      // Downgrade to free
      await supabase
        .from("subscriptions")
        .update({
          status: "active",
          plan: "free",
          trial_end: null,
          updated_at: now.toISOString(),
        })
        .eq("organization_id", trial.organization_id);

      if (email) {
        await sendTrialExpiredEmail(email, orgName, trial.plan);

        await supabase.from("email_logs").insert({
          recipient: email,
          template: "trial_expired",
          subject: "Your trial has ended",
          sent_at: now.toISOString(),
        });
      }

      results.downgraded++;
      results.expiryNotices++;
    }

    logger.info("[Cron] Trial reminders check complete", { results });

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Cron] Error in trial reminders check", { error });
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

async function sendTrialReminderEmail(email: string, orgName: string, daysLeft: number, plan: string) {
  const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`;

  await sendEmail(
    email,
    `Your ${plan} Trial Ends in ${daysLeft} Days`,
    `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Trial Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">⏰ ${daysLeft} Days Left</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your free trial of the <strong>${plan}</strong> plan for <strong>${orgName}</strong> ends in <strong>${daysLeft} days</strong>.
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                To continue enjoying all premium features without interruption, upgrade to a paid subscription before your trial ends.
              </p>

              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px; color: #111827;">What you'll keep with ${plan}:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li>Unlimited AI conversations</li>
                  <li>Document analysis & insights</li>
                  <li>Email & calendar integration</li>
                  <li>Custom AI agents</li>
                  <li>Priority support</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${upgradeUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                  Subscribe Now
                </a>
              </div>

              <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                Questions? Reply to this email and we'll help you out.
              </p>
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

async function sendTrialExpiringEmail(email: string, orgName: string, plan: string) {
  const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`;

  await sendEmail(
    email,
    `⚠️ Your Trial Ends Tomorrow`,
    `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Trial Ending Tomorrow</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Last Day of Your Trial!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your free trial of <strong>${plan}</strong> for <strong>${orgName}</strong> ends <strong>tomorrow</strong>.
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                After your trial ends, you'll be moved to the Free plan with limited features. Subscribe now to keep all your premium benefits.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${upgradeUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 16px 40px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 18px;">
                  Subscribe Now
                </a>
              </div>

              <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                Need more time? Reply to this email and let us know.
              </p>
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

async function sendTrialExpiredEmail(email: string, orgName: string, previousPlan: string) {
  const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`;

  await sendEmail(
    email,
    `Your Trial Has Ended`,
    `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Trial Ended</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Trial Ended</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your free trial of <strong>${previousPlan}</strong> for <strong>${orgName}</strong> has ended. Your account has been moved to the Free plan.
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Don't worry - your data is safe! You can upgrade anytime to regain access to premium features.
              </p>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Note:</strong> Some features may be limited on the Free plan. Upgrade to restore full access.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${upgradeUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                  Upgrade to ${previousPlan}
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
