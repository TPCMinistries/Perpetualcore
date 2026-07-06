/**
 * POST /api/webhooks/rfp-stripe
 *
 * Stripe webhook handler for the RFP product. Signed by
 * RFP_STRIPE_WEBHOOK_SECRET. Idempotent via stripe_webhook_events.
 *
 * Setup (one-time):
 *   1. Stripe Dashboard → Developers → Webhooks → Add endpoint
 *      URL: https://rfp.perpetualcore.com/api/webhooks/rfp-stripe
 *      Events: customer.subscription.created, .updated, .deleted,
 *              checkout.session.completed, invoice.payment_failed
 *   2. Copy the signing secret (whsec_*) → Vercel env
 *      RFP_STRIPE_WEBHOOK_SECRET
 *
 * The webhook only acts on events whose subscription/session metadata
 * carries `product: 'rfp_engine'`. That isolates the RFP product from
 * other webhook events arriving at the same Stripe account.
 */

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/server";
import { getTierForPriceId } from "@/lib/rfp/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIGNING_SECRET = process.env.RFP_STRIPE_WEBHOOK_SECRET ?? "";

function tsToIso(ts: number | null | undefined): string | null {
  if (!ts) return null;
  return new Date(ts * 1000).toISOString();
}

function isRfpEvent(metadata: Stripe.Metadata | null | undefined): boolean {
  if (!metadata) return false;
  return metadata.product === "rfp_engine";
}

/**
 * Pull org_id from wherever Stripe stuffed it. Checkout sessions and
 * subscriptions both carry it in metadata; we read whichever is present.
 */
function readOrgId(
  metadata: Stripe.Metadata | null | undefined,
  fallback: Stripe.Metadata | null | undefined = null,
): string | null {
  const id = metadata?.rfp_org_id ?? fallback?.rfp_org_id ?? null;
  return id || null;
}

/**
 * Stripe SDK v19 dropped top-level `Subscription.current_period_end` from
 * its TypeScript types; the field still ships on the wire under the same
 * key. We read it through a narrow cast to keep type safety elsewhere.
 */
function readPeriodEnd(sub: Stripe.Subscription): number | null {
  const v = (sub as unknown as { current_period_end?: number }).current_period_end;
  if (typeof v === "number") return v;
  // Newer API versions hang period_end on the first item instead.
  const itemEnd = (
    sub.items.data[0] as unknown as { current_period_end?: number } | undefined
  )?.current_period_end;
  return typeof itemEnd === "number" ? itemEnd : null;
}

/**
 * Stripe v19 also moved `Invoice.subscription` off the top-level types.
 * Read it the same way — runtime field exists, types are just stricter.
 */
function readInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const direct = (
    invoice as unknown as {
      subscription?: string | { id?: string } | null;
    }
  ).subscription;
  if (typeof direct === "string") return direct;
  if (direct && typeof direct === "object" && typeof direct.id === "string") {
    return direct.id;
  }
  return null;
}

async function upsertFromSubscription(
  subscription: Stripe.Subscription,
  orgIdHint: string | null,
): Promise<void> {
  const admin = createAdminClient();
  const orgId =
    orgIdHint ?? readOrgId(subscription.metadata, subscription.metadata);
  if (!orgId) {
    console.warn(
      "[rfp-stripe] subscription event without rfp_org_id metadata:",
      subscription.id,
    );
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const tier = getTierForPriceId(priceId);

  // Cast the upsert payload to `never` to bypass the supabase-js generic
  // depth limit (TS2589 "Type instantiation is excessively deep") that
  // fires on chained .upsert() with a typed admin client. Runtime shape
  // matches the schema; tested against rfp_org_subscriptions columns.
  const payload = {
    org_id: orgId,
    stripe_customer_id:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    tier,
    status: subscription.status,
    current_period_end: tsToIso(readPeriodEnd(subscription)),
    trial_ends_at: tsToIso(subscription.trial_end),
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    updated_at: new Date().toISOString(),
  };
  await admin
    .from("rfp_org_subscriptions")
    .upsert(payload as never, { onConflict: "org_id" });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!SIGNING_SECRET) {
    return NextResponse.json(
      { error: "webhook_not_configured" },
      { status: 503 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, SIGNING_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: "bad_signature", detail: msg.slice(0, 200) },
      { status: 400 },
    );
  }

  // Idempotency — reuse the existing stripe_webhook_events table so all
  // products share dedup. If we've already processed this event_id, no-op.
  const admin = createAdminClient();
  const { data: already } = await admin
    .from("stripe_webhook_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();
  if (already) {
    return NextResponse.json({ received: true, deduped: true });
  }

  let processed = false;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!isRfpEvent(session.metadata)) break;
      // Fetch the subscription that was created — checkout.session does
      // NOT include the full subscription object.
      if (typeof session.subscription === "string") {
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        await upsertFromSubscription(sub, readOrgId(session.metadata));
        processed = true;
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      if (!isRfpEvent(sub.metadata)) break;
      await upsertFromSubscription(sub, readOrgId(sub.metadata));
      processed = true;
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = readInvoiceSubscriptionId(invoice);
      if (!subId) break;
      const sub = await stripe.subscriptions.retrieve(subId);
      if (!isRfpEvent(sub.metadata)) break;
      await upsertFromSubscription(sub, readOrgId(sub.metadata));
      processed = true;
      break;
    }
    default:
      // Not an event we handle — record dedup row and return.
      break;
  }

  // Cast for same TS2589 reason as the upsert above. Runtime shape matches
  // the migration in supabase/migrations/stripe_webhook_events_for_rfp.
  const eventPayload = {
    event_id: event.id,
    event_type: event.type,
    status: processed ? "processed" : "ignored",
  };
  await admin.from("stripe_webhook_events").insert(eventPayload as never);

  return NextResponse.json({ received: true, processed });
}
