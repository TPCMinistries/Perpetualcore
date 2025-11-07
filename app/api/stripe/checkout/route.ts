import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/stripe/subscriptions";
import { PlanType } from "@/lib/stripe/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST - Create Stripe Checkout session
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const body = await req.json();
    let { plan, interval = "monthly" } = body as { plan: string; interval?: "monthly" | "annual" };

    // Map new plan names to Stripe plan IDs
    const planMappings: Record<string, PlanType> = {
      starter: "starter",
      professional: "pro", // "professional" maps to "pro" in Stripe
      pro: "pro",
      teams: "team", // "teams" maps to "team" in Stripe
      team: "team",
      business: "enterprise", // "business" uses enterprise pricing
      enterprise: "enterprise",
    };

    const mappedPlan = planMappings[plan.toLowerCase()];

    if (!mappedPlan) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'starter', 'professional', 'teams', 'business', or 'enterprise'" },
        { status: 400 }
      );
    }

    plan = mappedPlan;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/dashboard/settings/billing?success=true`;
    const cancelUrl = `${baseUrl}/dashboard/settings/billing?canceled=true`;

    const session = await createCheckoutSession(
      user.id,
      user.email || "",
      profile.organization_id,
      plan,
      successUrl,
      cancelUrl,
      interval
    );

    return NextResponse.json({
      sessionId: session.sessionId,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
