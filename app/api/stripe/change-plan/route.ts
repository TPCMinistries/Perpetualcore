import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const PRICE_IDS = {
  pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY!,
  pro_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY!,
  team_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM_MONTHLY!,
  team_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM_YEARLY!,
};

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

    // Determine the new price ID
    const priceKey = `${newPlan}_${interval}` as keyof typeof PRICE_IDS;
    const newPriceId = PRICE_IDS[priceKey];

    if (!newPriceId) {
      return NextResponse.json(
        { error: "Invalid plan or interval" },
        { status: 400 }
      );
    }

    // Get the current Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    );

    // Handle downgrade to free plan
    if (newPlan === "free") {
      // Cancel subscription at period end
      const updated = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: true,
        }
      );

      return NextResponse.json({
        success: true,
        message: `Subscription will be downgraded to Free plan on ${new Date(
          updated.current_period_end * 1000
        ).toLocaleDateString()}`,
        effectiveDate: new Date(updated.current_period_end * 1000).toISOString(),
      });
    }

    // Update the subscription
    const updateParams: Stripe.SubscriptionUpdateParams = {
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

    // Determine proration behavior
    if (changeAt === "period_end") {
      // Change at end of current billing period (no immediate charge/credit)
      updateParams.proration_behavior = "none";
      updateParams.billing_cycle_anchor = "unchanged";
    } else {
      // Immediate change with proration (default)
      updateParams.proration_behavior = "create_prorations";
      updateParams.billing_cycle_anchor = "now";
    }

    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      updateParams
    );

    // Calculate proration amount
    let prorationAmount = 0;
    if (changeAt !== "period_end") {
      const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
        customer: subscription.stripe_customer_id!,
        subscription: subscription.stripe_subscription_id,
      });
      prorationAmount = upcomingInvoice.amount_due / 100; // Convert from cents to dollars
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
  } catch (error: any) {
    console.error("Change plan error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to change plan" },
      { status: 500 }
    );
  }
}
