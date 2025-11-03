import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { handleStripeWebhook, verifyStripeWebhook } from "@/lib/stripe/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST - Stripe webhook handler
 *
 * Configure in Stripe Dashboard:
 * Developers → Webhooks → Add endpoint
 * URL: https://your-domain.com/api/stripe/webhook
 *
 * Events to subscribe to:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - customer.subscription.trial_will_end
 * - invoice.created
 * - invoice.updated
 * - invoice.paid
 * - invoice.payment_failed
 * - checkout.session.completed
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Verify webhook signature
    const event = verifyStripeWebhook(body, signature, webhookSecret);

    console.log(`Received Stripe webhook: ${event.type}`);

    // Handle the event
    const result = await handleStripeWebhook(event);

    if (!result.success) {
      console.error("Failed to handle webhook:", result.error);
      return NextResponse.json(
        { error: result.error || "Failed to process webhook" },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);

    // Return 200 to prevent Stripe from retrying on signature verification errors
    if (error instanceof Error && error.message.includes("signature")) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * GET - Webhook info (for testing)
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "Stripe webhook endpoint",
    method: "POST",
    description: "Receives webhook events from Stripe",
    events: [
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "customer.subscription.trial_will_end",
      "invoice.created",
      "invoice.updated",
      "invoice.paid",
      "invoice.payment_failed",
      "checkout.session.completed",
      "payment_intent.succeeded",
      "payment_intent.payment_failed",
    ],
  });
}
