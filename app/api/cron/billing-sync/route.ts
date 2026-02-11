import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron endpoint to sync billing status with Stripe
 *
 * Runs daily at 2 AM to:
 * - Sync subscription statuses from Stripe
 * - Handle past due subscriptions
 * - Send payment failure reminders
 * - Clean up canceled subscriptions
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info("[Cron] Starting billing sync");

    const supabase = createAdminClient();
    const results = {
      synced: 0,
      pastDueReminders: 0,
      canceled: 0,
      errors: 0,
    };

    // Get all subscriptions with Stripe subscription IDs
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        organizations (
          name,
          owner_email
        )
      `)
      .not("stripe_subscription_id", "is", null);

    if (error) {
      logger.error("[Cron] Error fetching subscriptions:", { error });
      throw error;
    }

    for (const sub of subscriptions || []) {
      try {
        // Fetch latest subscription status from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);

        const email = (sub.organizations as any)?.owner_email;
        const orgName = (sub.organizations as any)?.name || "your account";

        // Map Stripe status to our status
        let newStatus = sub.status;
        let shouldUpdate = false;

        switch (stripeSubscription.status) {
          case "active":
            if (sub.status !== "active") {
              newStatus = "active";
              shouldUpdate = true;
            }
            break;

          case "past_due":
            if (sub.status !== "past_due") {
              newStatus = "past_due";
              shouldUpdate = true;

              // Send payment failure reminder
              if (email) {
                await sendPaymentFailureEmail(email, orgName, sub.plan);
                results.pastDueReminders++;
              }
            } else {
              // Send reminder if past_due for more than 3 days
              const pastDueSince = new Date(sub.updated_at);
              const daysPastDue = Math.floor((Date.now() - pastDueSince.getTime()) / (24 * 60 * 60 * 1000));

              if (daysPastDue >= 3 && daysPastDue % 3 === 0 && email) {
                await sendPaymentFailureEmail(email, orgName, sub.plan);
                results.pastDueReminders++;
              }
            }
            break;

          case "canceled":
            if (sub.status !== "canceled") {
              newStatus = "canceled";
              shouldUpdate = true;

              // Downgrade to free plan but mark status as canceled
              await supabase
                .from("subscriptions")
                .update({
                  status: "canceled",
                  plan: "free",
                  stripe_subscription_id: null,
                  cancel_at_period_end: false,
                })
                .eq("organization_id", sub.organization_id);

              if (email) {
                await sendSubscriptionCanceledEmail(email, orgName, sub.plan);
              }
              results.canceled++;
              continue;
            }
            break;

          case "trialing":
            if (sub.status !== "trialing") {
              newStatus = "trialing";
              shouldUpdate = true;
            }
            break;

          case "unpaid":
            if (sub.status !== "unpaid") {
              newStatus = "unpaid";
              shouldUpdate = true;

              if (email) {
                await sendPaymentFailureEmail(email, orgName, sub.plan);
                results.pastDueReminders++;
              }
            }
            break;

          case "incomplete":
          case "incomplete_expired":
            // Handle incomplete subscriptions by downgrading
            await supabase
              .from("subscriptions")
              .update({
                status: "canceled",
                plan: "free",
                stripe_subscription_id: null,
              })
              .eq("organization_id", sub.organization_id);
            results.canceled++;
            continue;
        }

        // Update subscription data
        if (shouldUpdate) {
          const updateData: Record<string, any> = {
            status: newStatus,
            updated_at: new Date().toISOString(),
          };

          // Sync other fields from Stripe
          if (stripeSubscription.current_period_end) {
            updateData.current_period_end = new Date(stripeSubscription.current_period_end * 1000).toISOString();
          }
          if (stripeSubscription.current_period_start) {
            updateData.current_period_start = new Date(stripeSubscription.current_period_start * 1000).toISOString();
          }
          if (stripeSubscription.cancel_at_period_end !== undefined) {
            updateData.cancel_at_period_end = stripeSubscription.cancel_at_period_end;
          }

          await supabase
            .from("subscriptions")
            .update(updateData)
            .eq("organization_id", sub.organization_id);

          results.synced++;
        }
      } catch (stripeError: any) {
        // Handle deleted subscriptions in Stripe
        if (stripeError?.type === "StripeInvalidRequestError" && stripeError?.code === "resource_missing") {
          // Subscription no longer exists in Stripe, clean up
          await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              plan: "free",
              stripe_subscription_id: null,
              cancel_at_period_end: false,
            })
            .eq("organization_id", sub.organization_id);
          results.canceled++;
        } else {
          logger.error(`[Cron] Error syncing subscription ${sub.organization_id}:`, { error: stripeError });
          results.errors++;
        }
      }
    }

    // Reset monthly usage on first day of month
    const today = new Date();
    if (today.getDate() === 1) {
      await resetMonthlyUsage(supabase);
    }

    logger.info("[Cron] Billing sync complete", { results });

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Cron] Error in billing sync", { error });
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

async function resetMonthlyUsage(supabase: ReturnType<typeof createAdminClient>) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Create new usage records for all organizations
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id");

  for (const org of orgs || []) {
    await supabase
      .from("usage_tracking")
      .upsert({
        organization_id: org.id,
        month: currentMonth,
        ai_messages_count: 0,
        ai_tokens_used: 0,
        documents_stored: 0,
        storage_bytes: 0,
        emails_synced: 0,
        email_ai_actions: 0,
        whatsapp_messages: 0,
        calendar_events: 0,
      });
  }

  logger.info("[Cron] Monthly usage reset complete");
}

async function sendPaymentFailureEmail(email: string, orgName: string, plan: string) {
  const billingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`;

  await sendEmail(
    email,
    `⚠️ Payment Failed - Action Required`,
    `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Failed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Payment Failed</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                We couldn't process your payment for the <strong>${plan}</strong> subscription for <strong>${orgName}</strong>.
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Please update your payment method to avoid any interruption to your service.
              </p>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Note:</strong> If payment isn't resolved within 7 days, your account will be downgraded to the Free plan.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${billingUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                  Update Payment Method
                </a>
              </div>

              <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                If you believe this is an error, please contact our support team.
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

async function sendSubscriptionCanceledEmail(email: string, orgName: string, previousPlan: string) {
  const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`;

  await sendEmail(
    email,
    `Subscription Canceled - ${orgName}`,
    `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Subscription Canceled</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Subscription Canceled</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your <strong>${previousPlan}</strong> subscription for <strong>${orgName}</strong> has been canceled.
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your account has been moved to the Free plan. All your data remains intact, and you can continue using Perpetual Core with limited features.
              </p>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                We'd love to have you back! If you'd like to reactivate your subscription at any time, you can do so from your billing settings.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${upgradeUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                  Reactivate Subscription
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
