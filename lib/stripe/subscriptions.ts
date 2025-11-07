import { stripe, STRIPE_PLANS, PlanType } from "./client";
import { createClient } from "@/lib/supabase/server";

/**
 * Create or retrieve Stripe customer
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  organizationId: string
): Promise<string> {
  const supabase = createClient();

  // Check if customer already exists
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("organization_id", organizationId)
    .single();

  if (subscription?.stripe_customer_id) {
    return subscription.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
      organizationId,
    },
  });

  // Save customer ID to database
  await supabase.from("subscriptions").upsert({
    organization_id: organizationId,
    user_id: userId,
    stripe_customer_id: customer.id,
    plan: "free",
    status: "active",
  });

  return customer.id;
}

/**
 * Create Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  organizationId: string,
  plan: PlanType,
  successUrl: string,
  cancelUrl: string,
  interval: "monthly" | "annual" = "monthly"
): Promise<{ sessionId: string; url: string }> {
  if (plan === "free") {
    throw new Error("Cannot create checkout session for free plan");
  }

  const customerId = await getOrCreateCustomer(userId, email, organizationId);
  const planConfig = STRIPE_PLANS[plan];

  // Select the correct price ID based on interval
  const priceId = interval === "annual" ? planConfig.priceAnnualId : planConfig.priceMonthlyId;

  if (!priceId) {
    throw new Error(`Price ID not configured for ${plan} plan (${interval})`);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      organizationId,
      plan,
      interval,
    },
    subscription_data: {
      metadata: {
        userId,
        organizationId,
        plan,
        interval,
      },
      trial_period_days: 14, // 14-day free trial
    },
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session");
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Create Stripe Customer Portal session
 */
export async function createPortalSession(
  organizationId: string,
  returnUrl: string
): Promise<{ url: string }> {
  const supabase = createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("organization_id", organizationId)
    .single();

  if (!subscription?.stripe_customer_id) {
    throw new Error("No Stripe customer found");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: returnUrl,
  });

  return { url: session.url };
}

/**
 * Get subscription details
 */
export async function getSubscription(organizationId: string) {
  const supabase = createClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("organization_id", organizationId)
    .single();

  if (error) {
    console.error("Error fetching subscription:", error);
    return null;
  }

  return subscription;
}

/**
 * Get current usage for organization
 */
export async function getCurrentUsage(organizationId: string) {
  const supabase = createClient();

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const { data: usage } = await supabase
    .from("usage_tracking")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("month", currentMonth)
    .single();

  return usage || {
    ai_messages_count: 0,
    ai_tokens_used: 0,
    documents_stored: 0,
    storage_bytes: 0,
    emails_synced: 0,
    email_ai_actions: 0,
    whatsapp_messages: 0,
    calendar_events: 0,
  };
}

/**
 * Check if organization has reached usage limit
 */
export async function checkUsageLimit(
  organizationId: string,
  limitType: "ai_messages" | "documents" | "storage"
): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("check_usage_limit", {
    org_id: organizationId,
    limit_type: limitType,
  });

  if (error) {
    console.error("Error checking usage limit:", error);
    return false;
  }

  return data as boolean;
}

/**
 * Increment usage counter
 */
export async function incrementUsage(
  organizationId: string,
  userId: string,
  usageType: "ai_messages" | "documents" | "emails" | "whatsapp" | "calendar",
  incrementBy: number = 1
): Promise<void> {
  const supabase = createClient();

  await supabase.rpc("increment_usage", {
    org_id: organizationId,
    usr_id: userId,
    usage_type: usageType,
    increment_by: incrementBy,
  });
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  organizationId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<void> {
  const supabase = createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("organization_id", organizationId)
    .single();

  if (!subscription?.stripe_subscription_id) {
    throw new Error("No active subscription found");
  }

  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    cancel_at_period_end: cancelAtPeriodEnd,
  });

  // Update database
  await supabase
    .from("subscriptions")
    .update({
      cancel_at_period_end: cancelAtPeriodEnd,
      canceled_at: cancelAtPeriodEnd ? new Date().toISOString() : null,
    })
    .eq("organization_id", organizationId);
}

/**
 * Reactivate canceled subscription
 */
export async function reactivateSubscription(
  organizationId: string
): Promise<void> {
  const supabase = createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("organization_id", organizationId)
    .single();

  if (!subscription?.stripe_subscription_id) {
    throw new Error("No subscription found");
  }

  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    cancel_at_period_end: false,
  });

  // Update database
  await supabase
    .from("subscriptions")
    .update({
      cancel_at_period_end: false,
      canceled_at: null,
    })
    .eq("organization_id", organizationId);
}

/**
 * Get plan limits for organization
 */
export async function getPlanLimits(organizationId: string) {
  const supabase = createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("organization_id", organizationId)
    .single();

  const plan = subscription?.plan || "free";

  const { data: limits } = await supabase
    .from("plan_limits")
    .select("*")
    .eq("plan", plan)
    .single();

  return limits;
}
