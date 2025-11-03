import Stripe from "stripe";
import { stripe } from "./client";
import { createClient } from "@/lib/supabase/server";

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
        console.log("Payment succeeded:", event.data.object.id);
        break;

      case "payment_intent.payment_failed":
        console.log("Payment failed:", event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
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
  const supabase = await createClient();

  const organizationId = subscription.metadata.organizationId;
  const userId = subscription.metadata.userId;
  const plan = subscription.metadata.plan as "free" | "pro" | "enterprise";

  if (!organizationId || !userId) {
    console.error("Missing metadata in subscription:", subscription.id);
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

  console.log(`Subscription ${subscription.id} updated for org ${organizationId}`);
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = await createClient();

  const organizationId = subscription.metadata.organizationId;

  if (!organizationId) {
    console.error("Missing organizationId in subscription:", subscription.id);
    return;
  }

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

  console.log(`Subscription deleted for org ${organizationId}, downgraded to free`);
}

/**
 * Handle trial ending soon
 */
async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organizationId;
  console.log(`Trial ending soon for org ${organizationId}`);

  // TODO: Send email notification to user about trial ending
  // You can implement email notification here
}

/**
 * Handle invoice created/updated
 */
async function handleInvoiceUpdate(invoice: Stripe.Invoice) {
  const supabase = await createClient();

  const customerId = invoice.customer as string;

  // Get organization from customer
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("organization_id, user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!subscription) {
    console.error("No subscription found for customer:", customerId);
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

  console.log(`Invoice ${invoice.id} updated for org ${subscription.organization_id}`);
}

/**
 * Handle invoice paid
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  await handleInvoiceUpdate(invoice);

  const customerId = invoice.customer as string;
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("organization_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (subscription) {
    console.log(`Invoice paid for org ${subscription.organization_id}`);
    // TODO: Send receipt email
  }
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  await handleInvoiceUpdate(invoice);

  const customerId = invoice.customer as string;
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("organization_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (subscription) {
    console.log(`Invoice payment failed for org ${subscription.organization_id}`);
    // TODO: Send payment failed email
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("Checkout completed:", session.id);

  // Subscription will be handled by subscription.created event
  // This is mainly for one-time payments if you add them later
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
