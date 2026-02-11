import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  sendMarketplacePurchaseEmail,
  sendPaymentReceiptEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCanceledEmail,
} from "@/lib/email";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Check if a webhook event has already been processed (idempotency check)
 * This prevents duplicate processing when Stripe retries webhooks
 */
async function isEventProcessed(supabase: any, eventId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("stripe_webhook_events")
    .select("id")
    .eq("event_id", eventId)
    .single();

  return !!data && !error;
}

/**
 * Mark a webhook event as processed
 */
async function markEventProcessed(
  supabase: any,
  eventId: string,
  eventType: string,
  status: "processed" | "failed" = "processed",
  errorMessage?: string
): Promise<void> {
  await supabase.from("stripe_webhook_events").upsert({
    event_id: eventId,
    event_type: eventType,
    status,
    error_message: errorMessage || null,
    processed_at: new Date().toISOString(),
  });
}

/**
 * POST - Handle Stripe webhook events
 * Processes subscription, marketplace, API billing, and partner commission events
 *
 * IMPORTANT: This handler is idempotent - it tracks processed event IDs
 * to prevent duplicate processing on webhook retries.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    if (isDev) console.error(`Webhook signature verification failed:`, errorMessage);
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Idempotency check: Skip if we've already processed this event
  if (await isEventProcessed(supabase, event.id)) {
    if (isDev) console.log(`Event already processed: ${event.id}`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      // ===== SUBSCRIPTION CHECKOUT COMPLETED =====
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }

      // ===== SUBSCRIPTION CREATED =====
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(supabase, subscription);
        break;
      }

      // ===== SUBSCRIPTION UPDATED =====
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabase, subscription);
        break;
      }

      // ===== SUBSCRIPTION DELETED (CANCELLED) =====
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      // ===== INVOICE PAYMENT SUCCEEDED =====
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(supabase, invoice);
        break;
      }

      // ===== INVOICE PAYMENT FAILED =====
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(supabase, invoice);
        break;
      }

      default:
        if (isDev) console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as successfully processed
    await markEventProcessed(supabase, event.id, event.type, "processed");

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    if (isDev) console.error(`Error processing webhook:`, errorMessage);

    // Mark event as failed (but still record it to prevent infinite retries)
    await markEventProcessed(supabase, event.id, event.type, "failed", errorMessage);

    return NextResponse.json(
      { error: `Webhook handler failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed
 * Determines if it's a regular subscription, marketplace purchase, or other
 */
async function handleCheckoutCompleted(
  supabase: any,
  session: Stripe.Checkout.Session
) {
  const metadata = session.metadata || {};

  // Check if this is a marketplace purchase
  if (metadata.type === "marketplace_purchase") {
    await handleMarketplacePurchaseCompleted(supabase, session, metadata);
    return;
  }

  // Otherwise, it's a regular subscription checkout
  // The subscription will be handled by customer.subscription.created
  console.log("Checkout completed for subscription:", session.subscription);
}

/**
 * Handle marketplace purchase completion
 */
async function handleMarketplacePurchaseCompleted(
  supabase: any,
  session: Stripe.Checkout.Session,
  metadata: any
) {
  const {
    item_id,
    buyer_id,
    buyer_organization_id,
    creator_id,
    platform_commission,
    creator_payout,
    pricing_type,
  } = metadata;

  // Update purchase record to completed
  const { error: purchaseError } = await supabase
    .from("marketplace_purchases")
    .update({
      status: "completed",
      stripe_subscription_id:
        pricing_type === "subscription" ? session.subscription : null,
    })
    .eq("item_id", item_id)
    .eq("buyer_id", buyer_id)
    .eq("status", "pending");

  if (purchaseError) {
    console.error("Error updating marketplace purchase:", purchaseError);
    throw purchaseError;
  }

  // Update item stats
  await supabase.rpc("increment_marketplace_sales", {
    p_item_id: item_id,
    p_revenue: parseFloat(platform_commission) + parseFloat(creator_payout),
  });

  // Update creator's pending payout
  await supabase
    .from("marketplace_items")
    .update({
      total_sales: supabase.raw("total_sales + 1"),
      total_revenue: supabase.raw(
        `total_revenue + ${parseFloat(platform_commission) + parseFloat(creator_payout)}`
      ),
    })
    .eq("id", item_id);

  // Get purchase details for email
  const { data: purchase } = await supabase
    .from("marketplace_purchases")
    .select(`
      id,
      price_paid,
      buyer:buyer_id (
        email,
        full_name
      ),
      item:item_id (
        name,
        type,
        file_url
      )
    `)
    .eq("item_id", item_id)
    .eq("buyer_id", buyer_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Send purchase confirmation email to buyer
  if (purchase && purchase.buyer) {
    await sendMarketplacePurchaseEmail({
      buyer_email: purchase.buyer.email || "",
      buyer_name: purchase.buyer.full_name || "Customer",
      item_name: purchase.item.name,
      item_type: purchase.item.type,
      price: purchase.price_paid,
      purchase_id: purchase.id,
      download_url: purchase.item.file_url || undefined,
    });
  }

  console.log("Marketplace purchase completed:", item_id);
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  // Get customer email
  const customer = await stripe.customers.retrieve(customerId);
  const email = (customer as Stripe.Customer).email;

  if (!email) {
    console.error("No email found for customer:", customerId);
    return;
  }

  // Find user by email
  const { data: user } = await supabase
    .from("auth.users")
    .select("id")
    .eq("email", email)
    .single();

  if (!user) {
    console.error("No user found for email:", email);
    return;
  }

  // Get organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    console.error("No profile found for user:", user.id);
    return;
  }

  // Get plan details from subscription items
  const priceId = subscription.items.data[0]?.price.id;
  const amount = subscription.items.data[0]?.price.unit_amount || 0;
  const interval = subscription.items.data[0]?.price.recurring?.interval;

  // Determine plan type (you may need to map price IDs to plan names)
  // For now, we'll use metadata or price ID
  const planType = subscription.metadata?.plan || "pro";

  // Update organization subscription
  const { error: subError } = await supabase
    .from("subscriptions")
    .upsert({
      organization_id: profile.organization_id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      status,
      plan_name: planType,
      plan_interval: interval,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq("organization_id", profile.organization_id);

  if (subError) {
    console.error("Error creating subscription:", subError);
    throw subError;
  }

  console.log("Subscription created:", subscriptionId);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const subscriptionId = subscription.id;
  const status = subscription.status;

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }

  console.log("Subscription updated:", subscriptionId);
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const subscriptionId = subscription.id;

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error("Error deleting subscription:", error);
    throw error;
  }

  // Send cancellation email
  const customerId = subscription.customer as string;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    const customerEmail = (customer as Stripe.Customer).email;
    if (customerEmail) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("email", customerEmail)
        .single();

      await sendSubscriptionCanceledEmail({
        email: customerEmail,
        name: profile?.full_name || "there",
        planName: subscription.metadata?.plan || "Pro",
      });
    }
  } catch (emailErr) {
    console.error("Failed to send canceled email:", emailErr);
  }

  // If this is a marketplace subscription, mark referral as churned
  const { data: purchase } = await supabase
    .from("marketplace_purchases")
    .select("id, item_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (purchase) {
    await supabase
      .from("marketplace_purchases")
      .update({
        subscription_status: "canceled",
      })
      .eq("id", purchase.id);
  }

  console.log("Subscription deleted:", subscriptionId);
}

/**
 * Handle invoice payment succeeded
 * Used for tracking API usage billing and partner commissions
 */
async function handleInvoicePaymentSucceeded(
  supabase: any,
  invoice: Stripe.Invoice
) {
  const subscriptionId = invoice.subscription as string;
  const amountPaid = invoice.amount_paid / 100; // Convert from cents

  if (!subscriptionId) {
    return; // Not a subscription invoice
  }

  // Check if this is an API subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("organization_id, plan_name")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (subscription) {
    // Record API billing
    const periodStart = new Date(invoice.period_start * 1000);
    const periodEnd = new Date(invoice.period_end * 1000);

    await supabase.from("api_billing").upsert({
      organization_id: subscription.organization_id,
      billing_period_start: periodStart,
      billing_period_end: periodEnd,
      total_cost_usd: amountPaid,
      stripe_invoice_id: invoice.id,
      status: "paid",
      paid_at: new Date(),
    });
  }

  // Send payment receipt email
  if (subscription) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("organization_id", subscription.organization_id)
      .limit(1)
      .single();

    if (profile?.email) {
      sendPaymentReceiptEmail({
        email: profile.email,
        name: profile.full_name || "there",
        amount: invoice.amount_paid,
        currency: invoice.currency,
        invoiceUrl: invoice.hosted_invoice_url || undefined,
        invoicePdf: invoice.invoice_pdf || undefined,
      }).catch((err) => console.error("Failed to send receipt email:", err));
    }
  }

  // Check for partner referrals
  const { data: referral } = await supabase
    .from("partner_referrals")
    .select("id, partner_id, plan_price, commission_rate")
    .eq("subscription_id", subscriptionId)
    .eq("status", "active")
    .single();

  if (referral) {
    // Calculate and record commission
    const commissionAmount =
      referral.plan_price * (referral.commission_rate / 100);

    await supabase.from("partner_commissions").insert({
      partner_id: referral.partner_id,
      referral_id: referral.id,
      billing_period_start: new Date(invoice.period_start * 1000),
      billing_period_end: new Date(invoice.period_end * 1000),
      subscription_revenue: referral.plan_price,
      commission_rate: referral.commission_rate,
      commission_amount: commissionAmount,
      status: "approved",
    });

    // Update partner stats
    await supabase.rpc("update_partner_earnings", {
      p_partner_id: referral.partner_id,
      p_amount: commissionAmount,
    });
  }

  console.log("Invoice payment succeeded:", invoice.id);
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(
  supabase: any,
  invoice: Stripe.Invoice
) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    return;
  }

  // Mark subscription as past_due
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("organization_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
    })
    .eq("stripe_subscription_id", subscriptionId);

  // Send payment failed email
  if (sub) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("organization_id", sub.organization_id)
      .limit(1)
      .single();

    if (profile?.email) {
      sendPaymentFailedEmail({
        email: profile.email,
        name: profile.full_name || "there",
        amount: invoice.amount_due,
        currency: invoice.currency,
      }).catch((err) => console.error("Failed to send payment failed email:", err));
    }
  }

  console.log("Invoice payment failed:", invoice.id);
}
