import Stripe from "stripe";
import { stripe } from "./client";
import { createAdminClient } from "@/lib/supabase/server";
import {
  sendTrialEndingEmail,
  sendPaymentReceiptEmail,
  sendPaymentFailedEmail,
  sendMarketplacePurchaseEmail,
  sendSubscriptionCanceledEmail,
} from "@/lib/email";

/**
 * Handle Stripe webhook events
 * Called from /api/stripe/webhook
 */
export async function handleStripeWebhook(
  event: Stripe.Event
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (event.type) {
      // Subscription events
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      // Invoice events
      case "invoice.created":
      case "invoice.updated":
        await handleInvoiceUpdate(event.data.object as Stripe.Invoice);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      // Checkout events
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      // Payment events
      case "payment_intent.succeeded":
        // Payment succeeded - logged for debugging in dev only
        if (process.env.NODE_ENV === "development") {
          console.log("Payment succeeded:", event.data.object.id);
        }
        break;

      case "payment_intent.payment_failed":
        // Payment failed - logged for debugging in dev only
        if (process.env.NODE_ENV === "development") {
          console.log("Payment failed:", event.data.object.id);
        }
        break;

      default:
        // Unhandled events - only log in development
        if (process.env.NODE_ENV === "development") {
          console.log(`Unhandled event type: ${event.type}`);
        }
    }

    return { success: true };
  } catch (error) {
    console.error("Error handling webhook:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const supabase = createAdminClient();

  const organizationId = subscription.metadata.organizationId;
  const userId = subscription.metadata.userId;
  const plan = subscription.metadata.plan as "free" | "pro" | "enterprise";

  if (!organizationId || !userId) {
    // Missing metadata - this subscription wasn't created through our app
    return;
  }

  // Map Stripe status to our status
  const status = mapStripeStatus(subscription.status);

  await supabase.from("subscriptions").upsert({
    organization_id: organizationId,
    user_id: userId,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items.data[0]?.price.id,
    plan,
    status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  });

  // Subscription updated successfully
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = createAdminClient();

  const organizationId = subscription.metadata.organizationId;

  if (!organizationId) {
    // Missing metadata - subscription wasn't created through our app
    return;
  }

  // Get user details before downgrading
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id, plan")
    .eq("organization_id", organizationId)
    .single();

  // Downgrade to free plan
  await supabase
    .from("subscriptions")
    .update({
      plan: "free",
      status: "canceled",
      stripe_subscription_id: null,
      stripe_price_id: null,
      canceled_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId);

  // Send cancellation email
  if (sub?.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", sub.user_id)
      .single();

    if (profile?.email) {
      await sendSubscriptionCanceledEmail({
        email: profile.email,
        name: profile.full_name || "there",
        planName: sub.plan || "Pro",
      });
    }
  }
}

/**
 * Handle trial ending soon
 */
async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organizationId;
  const userId = subscription.metadata.userId;
  const plan = subscription.metadata.plan || "Pro";

  if (!userId) return;

  const supabase = createAdminClient();

  // Get user details
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .single();

  if (profile?.email) {
    // Calculate days remaining
    const trialEnd = subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );

    await sendTrialEndingEmail({
      email: profile.email,
      name: profile.full_name || "there",
      daysRemaining,
      plan,
    });
  }
}

/**
 * Handle invoice created/updated
 */
async function handleInvoiceUpdate(invoice: Stripe.Invoice) {
  const supabase = createAdminClient();

  const customerId = invoice.customer as string;

  // Get organization from customer
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("organization_id, user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!subscription) {
    // No subscription found for this customer
    return;
  }

  await supabase.from("invoices").upsert({
    organization_id: subscription.organization_id,
    user_id: subscription.user_id,
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: invoice.payment_intent as string | null,
    amount_due: invoice.amount_due,
    amount_paid: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status || "draft",
    invoice_date: invoice.created ? new Date(invoice.created * 1000).toISOString() : null,
    due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
    paid_at: invoice.status_transitions?.paid_at
      ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
      : null,
    invoice_pdf: invoice.invoice_pdf || null,
    hosted_invoice_url: invoice.hosted_invoice_url || null,
  });

  // Invoice updated successfully
}

/**
 * Handle invoice paid
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  await handleInvoiceUpdate(invoice);

  const customerId = invoice.customer as string;
  const supabase = createAdminClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("organization_id, user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (subscription) {

    // Get user details
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", subscription.user_id)
      .single();

    if (profile?.email) {
      await sendPaymentReceiptEmail({
        email: profile.email,
        name: profile.full_name || "there",
        amount: invoice.amount_paid,
        currency: invoice.currency,
        invoiceUrl: invoice.hosted_invoice_url || undefined,
        invoicePdf: invoice.invoice_pdf || undefined,
      });
    }
  }
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  await handleInvoiceUpdate(invoice);

  const customerId = invoice.customer as string;
  const supabase = createAdminClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("organization_id, user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (subscription) {

    // Get user details
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", subscription.user_id)
      .single();

    if (profile?.email) {
      await sendPaymentFailedEmail({
        email: profile.email,
        name: profile.full_name || "there",
        amount: invoice.amount_due,
        currency: invoice.currency,
      });
    }
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;

  // Handle marketplace purchases
  if (metadata?.type === "marketplace_purchase") {
    const supabase = createAdminClient();

    const itemId = metadata.item_id;
    const buyerId = metadata.buyer_id;
    const pricingType = metadata.pricing_type;

    // Update purchase record to completed
    const { error: updateError } = await supabase
      .from("marketplace_purchases")
      .update({
        status: "completed",
        stripe_session_id: session.id,
        ...(pricingType === "subscription" && session.subscription
          ? { stripe_subscription_id: session.subscription as string }
          : {}),
      })
      .eq("item_id", itemId)
      .eq("buyer_id", buyerId)
      .eq("status", "pending");

    if (updateError) {
      console.error("Error updating marketplace purchase:", updateError);
    }

    // Get item and buyer details for email
    const { data: item } = await supabase
      .from("marketplace_items")
      .select("name, type")
      .eq("id", itemId)
      .single();

    const { data: buyer } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", buyerId)
      .single();

    if (item && buyer?.email) {
      // Send purchase confirmation email
      await sendMarketplacePurchaseEmail({
        buyer_email: buyer.email,
        buyer_name: buyer.full_name || "there",
        item_name: item.name,
        item_type: item.type,
        price: (session.amount_total || 0) / 100,
        purchase_id: session.id,
        download_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/my-purchases`,
      });
    }
  }

  // Subscription will be handled by subscription.created event
}

/**
 * Map Stripe subscription status to our status enum
 */
function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): "active" | "canceled" | "past_due" | "trialing" | "incomplete" | "incomplete_expired" | "unpaid" {
  const statusMap: Record<Stripe.Subscription.Status, any> = {
    active: "active",
    canceled: "canceled",
    incomplete: "incomplete",
    incomplete_expired: "incomplete_expired",
    past_due: "past_due",
    trialing: "trialing",
    unpaid: "unpaid",
    paused: "canceled",
  };

  return statusMap[stripeStatus] || "active";
}

/**
 * Verify Stripe webhook signature
 */
export function verifyStripeWebhook(
  payload: string,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
