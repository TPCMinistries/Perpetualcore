/**
 * lib/rfp/billing.ts — RFP-product Stripe billing helpers.
 *
 * Reuses the singleton `stripe` client from lib/stripe/client.ts but has
 * its own product/price wiring + its own subscription tracker
 * (rfp_org_subscriptions). The legacy `subscriptions` table belongs to
 * the Perpetual Core SaaS marketing flow and is not touched here.
 *
 * Env required:
 *   STRIPE_SECRET_KEY                (lib/stripe/client.ts checks this)
 *   RFP_STRIPE_PRICE_PRO             price ID for Pro tier
 *   RFP_STRIPE_PRICE_AGENCY          price ID for Agency tier
 *   NEXT_PUBLIC_APP_URL              for absolute return URLs
 */

import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/server";

export type RfpTier = "pro" | "agency";

export const TRIAL_DAYS = 14;

export function getPriceIdForTier(tier: RfpTier): string {
  const id =
    tier === "pro"
      ? process.env.RFP_STRIPE_PRICE_PRO
      : process.env.RFP_STRIPE_PRICE_AGENCY;
  if (!id) {
    throw new Error(`RFP_STRIPE_PRICE_${tier.toUpperCase()} not configured`);
  }
  return id;
}

export function getTierForPriceId(priceId: string | null | undefined): RfpTier | null {
  if (!priceId) return null;
  if (priceId === process.env.RFP_STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.RFP_STRIPE_PRICE_AGENCY) return "agency";
  return null;
}

interface SubscriptionRow {
  org_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  tier: string | null;
  status: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
  cancel_at_period_end: boolean;
}

export async function getSubscriptionForOrg(
  orgId: string,
): Promise<SubscriptionRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("rfp_org_subscriptions")
    .select(
      "org_id, stripe_customer_id, stripe_subscription_id, tier, status, current_period_end, trial_ends_at, cancel_at_period_end",
    )
    .eq("org_id", orgId)
    .maybeSingle<SubscriptionRow>();
  return data ?? null;
}

/**
 * Returns an existing Stripe customer for the org, creating one if needed.
 * Always persists the customer_id on rfp_org_subscriptions so the second
 * call is cheap.
 */
async function getOrCreateCustomer(opts: {
  orgId: string;
  orgName: string;
  email: string;
  userId: string;
}): Promise<string> {
  const existing = await getSubscriptionForOrg(opts.orgId);
  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: opts.email,
    name: opts.orgName,
    metadata: {
      product: "rfp_engine",
      rfp_org_id: opts.orgId,
      created_by_user_id: opts.userId,
    },
  });

  const admin = createAdminClient();
  // Cast to `never` to bypass supabase-js TS2589 "Type instantiation is
  // excessively deep" on .upsert() chains. Runtime shape matches schema.
  const payload = {
    org_id: opts.orgId,
    stripe_customer_id: customer.id,
    updated_at: new Date().toISOString(),
  };
  await admin
    .from("rfp_org_subscriptions")
    .upsert(payload as never, { onConflict: "org_id" });

  return customer.id;
}

/**
 * Create a Stripe Checkout session for the requested tier. Customer
 * already linked to the org receives the trial only on their FIRST
 * subscription (Stripe default).
 */
export async function createRfpCheckoutSession(opts: {
  orgId: string;
  orgName: string;
  email: string;
  userId: string;
  tier: RfpTier;
}): Promise<{ url: string; session_id: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rfp.perpetualcore.com";
  const customerId = await getOrCreateCustomer({
    orgId: opts.orgId,
    orgName: opts.orgName,
    email: opts.email,
    userId: opts.userId,
  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: getPriceIdForTier(opts.tier), quantity: 1 }],
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: {
        product: "rfp_engine",
        rfp_org_id: opts.orgId,
        tier: opts.tier,
      },
    },
    // The org_id is the durable join key. Webhook reads it from
    // session.metadata to provision the subscription row even if Stripe
    // were to lose subscription_data.metadata for any reason.
    metadata: {
      product: "rfp_engine",
      rfp_org_id: opts.orgId,
      tier: opts.tier,
    },
    allow_promotion_codes: true,
    success_url: `${appUrl}/org/${opts.orgId}/settings/billing?status=success`,
    cancel_url: `${appUrl}/org/${opts.orgId}/settings/billing?status=cancel`,
  });

  if (!session.url) {
    throw new Error("stripe_session_no_url");
  }
  return { url: session.url, session_id: session.id };
}

/**
 * Create a Stripe customer-portal session so the user can manage their
 * subscription self-serve (upgrade/downgrade, cancel, update card).
 */
export async function createRfpPortalSession(opts: {
  orgId: string;
}): Promise<{ url: string }> {
  const sub = await getSubscriptionForOrg(opts.orgId);
  if (!sub?.stripe_customer_id) {
    throw new Error("no_customer_for_org");
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rfp.perpetualcore.com";
  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${appUrl}/org/${opts.orgId}/settings/billing`,
  });
  return { url: portal.url };
}
