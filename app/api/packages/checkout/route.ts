import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  packageId: z.enum([
    "software-access",
    "guided-setup",
    "first-workflow",
    "operating-lane-deposit",
  ]),
});

const PACKAGE_CATALOG = {
  "software-access": {
    name: "Perpetual Core Software Access",
    description: "Monthly software access for one focused product surface.",
    unitAmount: 29900,
    mode: "subscription",
    recurring: { interval: "month" as const },
  },
  "guided-setup": {
    name: "Perpetual Core Guided Setup",
    description: "One-time guided setup package: product setup, context import, workflow template, and 30-day check-in.",
    unitAmount: 250000,
    mode: "payment",
  },
  "first-workflow": {
    name: "Perpetual Core First Workflow Package",
    description: "One-time first workflow package: workflow map, product configuration, light automation/template build, and next-step recommendation.",
    unitAmount: 750000,
    mode: "payment",
  },
  "operating-lane-deposit": {
    name: "Perpetual Core 90-Day Operating Lane Deposit",
    description: "Deposit to reserve a 90-day managed operating lane. Final monthly scope is confirmed after intake.",
    unitAmount: 500000,
    mode: "payment",
  },
} as const;

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey.includes("your-stripe")) {
    return NextResponse.json(
      {
        error: "stripe_not_configured",
        message: "Stripe is not configured. Set STRIPE_SECRET_KEY to enable package checkout.",
      },
      { status: 503 }
    );
  }

  const pkg = PACKAGE_CATALOG[parsed.data.packageId];
  const stripe = new Stripe(secretKey, {
    apiVersion: "2024-12-18.acacia",
  });

  const requestUrl = new URL(req.url);
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    `${requestUrl.protocol}//${requestUrl.host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: pkg.mode,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      phone_number_collection: { enabled: true },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: pkg.unitAmount,
            product_data: {
              name: pkg.name,
              description: pkg.description,
            },
            ...(pkg.mode === "subscription" ? { recurring: pkg.recurring } : {}),
          },
        },
      ],
      metadata: {
        type: "perpetual_core_package",
        package_id: parsed.data.packageId,
        package_name: pkg.name,
      },
      success_url: `${baseUrl}/packages/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/packages?checkout=cancelled`,
    });

    return NextResponse.json({
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (err) {
    console.error("[packages-checkout] failed:", err);
    return NextResponse.json(
      {
        error: "stripe_error",
        message: err instanceof Error ? err.message : "Unable to create checkout session.",
      },
      { status: 500 }
    );
  }
}
