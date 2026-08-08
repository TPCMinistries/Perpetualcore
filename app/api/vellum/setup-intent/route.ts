/**
 * /api/vellum/setup-intent — create a Stripe setup_intent for Vellum
 * paid-tier preference capture.
 *
 * Used by /products/vellum waitlist form (Plan 12-05) when a user picks
 * Operator ($299/mo) or Team ($1,500/mo) tier preference. Captures payment
 * method without charging. The setup_intent ID is then attached to the
 * vellum_early_access row via /api/early-access (setup_intent_id field).
 *
 * Free + Institution tier preferences do NOT hit this endpoint.
 *
 * IMPORTANT: Only stripe.setupIntents.create is used here — NOT
 * paymentIntents.create or checkout.sessions.create. No charge is created.
 * Lorenzo charges off_session when invitations go out.
 *
 * Stripe API version: "2024-12-18.acacia" — matches existing repo convention
 * (see app/api/stripe/create-checkout-session/route.ts).
 *
 * STUDIO-VW-01 / Plan 12-04.
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const schema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(254, "Email is too long")
    .toLowerCase()
    .trim(),
  tier_preference: z.enum(["operator", "team"]),
  is_501c3: z.boolean().optional(),
});

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, tier_preference, is_501c3 } = parsed.data;

  try {
    // Find or create a Stripe Customer — keyed by email so re-signups
    // dedupe to a single customer record.
    const existing = await stripe.customers.list({ email, limit: 1 });
    const customer =
      existing.data[0] ??
      (await stripe.customers.create({
        email,
        metadata: {
          source: "vellum-waitlist",
          tier_preference,
          is_501c3: String(is_501c3 ?? false),
        },
      }));

    // Create a setup_intent (NOT a charge) for off-session payment
    // method capture. Lorenzo charges when invitations go out.
    const intent = await stripe.setupIntents.create({
      customer: customer.id,
      usage: "off_session",
      metadata: {
        source: "vellum-waitlist",
        tier_preference,
        is_501c3: String(is_501c3 ?? false),
      },
    });

    return NextResponse.json({
      client_secret: intent.client_secret,
      setup_intent_id: intent.id,
      customer_id: customer.id,
    });
  } catch (err) {
    console.error("[vellum-setup-intent] failed:", err);
    return NextResponse.json(
      {
        error: "stripe_error",
        message: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}
