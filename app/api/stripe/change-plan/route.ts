import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, STRIPE_PLANS, PlanType } from "@/lib/stripe/client";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newPlan, interval, changeAt } = await request.json();

    if (!newPlan || !interval) {
      return NextResponse.json(
        { error: "Missing newPlan or interval" },
        { status: 400 }
      );
    }

    // Validate plan
    if (!STRIPE_PLANS[newPlan as PlanType]) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // Get user profile with organization
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*, organization:organizations(*)")
      .eq("user_id", user.id)
      .single();

    if (!profile || !profile.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 }
      );
    }

    // Get current subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .single();

    if (!subscription || !subscription.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    // Handle downgrade to free plan
    if (newPlan === "free") {
      const updated = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        { cancel_at_period_end: true }
      );

      return NextResponse.json({
        success: true,
        message: `Subscription will be downgraded to Free plan on ${new Date(
          updated.current_period_end * 1000
        ).toLocaleDateString()}`,
        effectiveDate: new Date(updated.current_period_end * 1000).toISOString(),
      });
    }

    // Get the new price ID from centralized config
    const planConfig = STRIPE_PLANS[newPlan as PlanType];
    const newPriceId = interval === "annual"
      ? planConfig.priceAnnualId
      : planConfig.priceMonthlyId;

    if (!newPriceId) {
      return NextResponse.json(
        { error: `Price not configured for ${newPlan} plan (${interval})` },
        { status: 400 }
      );
    }

    // Get the current Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    );

    // Update the subscription
    const updateParams: Parameters<typeof stripe.subscriptions.update>[1] = {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      metadata: {
        user_id: user.id,
        organization_id: profile.organization_id,
        plan_id: newPlan,
      },
    };

    if (changeAt === "period_end") {
      updateParams!.proration_behavior = "none";
      updateParams!.billing_cycle_anchor = "unchanged";
    } else {
      updateParams!.proration_behavior = "create_prorations";
      updateParams!.billing_cycle_anchor = "now";
    }

    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      updateParams!
    );

    // Calculate proration amount for immediate changes
    let prorationAmount = 0;
    if (changeAt !== "period_end") {
      try {
        const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
          customer: subscription.stripe_customer_id!,
          subscription: subscription.stripe_subscription_id,
        });
        prorationAmount = upcomingInvoice.amount_due / 100;
      } catch {
        // Proration calculation may fail if invoice is being generated
      }
    }

    return NextResponse.json({
      success: true,
      message:
        changeAt === "period_end"
          ? `Plan will change to ${newPlan} on ${new Date(
              updatedSubscription.current_period_end * 1000
            ).toLocaleDateString()}`
          : `Plan changed to ${newPlan} immediately`,
      prorationAmount,
      effectiveDate:
        changeAt === "period_end"
          ? new Date(updatedSubscription.current_period_end * 1000).toISOString()
          : new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to change plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
