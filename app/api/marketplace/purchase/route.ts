import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

/**
 * POST - Purchase marketplace item
 * Creates Stripe checkout session with automatic 30/70 commission split
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

    // Get user's profile and organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const body = await req.json();
    const { item_id } = body;

    if (!item_id) {
      return NextResponse.json({ error: "item_id is required" }, { status: 400 });
    }

    // Fetch marketplace item
    const { data: item, error: itemError } = await supabase
      .from("marketplace_items")
      .select("*, creator:creator_id(email)")
      .eq("id", item_id)
      .eq("status", "approved")
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: "Item not found or not available for purchase" },
        { status: 404 }
      );
    }

    // Check if user already purchased this item (for one-time purchases)
    if (item.pricing_type === "one_time") {
      const { data: existingPurchase } = await supabase
        .from("marketplace_purchases")
        .select("id")
        .eq("item_id", item_id)
        .eq("buyer_id", user.id)
        .eq("status", "completed")
        .single();

      if (existingPurchase) {
        return NextResponse.json(
          { error: "You have already purchased this item" },
          { status: 400 }
        );
      }
    }

    // Calculate commission (30% platform, 70% creator)
    const price = parseFloat(item.price);
    const platformCommission = price * 0.30;
    const creatorPayout = price * 0.70;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/marketplace/purchase-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/marketplace/${item_id}`;

    // Create Stripe checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: item.pricing_type === "subscription" ? "subscription" : "payment",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
              description: item.description,
              images: item.thumbnail_url ? [item.thumbnail_url] : undefined,
            },
            ...(item.pricing_type === "subscription"
              ? {
                  recurring: {
                    interval: item.subscription_interval as "month" | "year",
                  },
                  unit_amount: Math.round(price * 100),
                }
              : {
                  unit_amount: Math.round(price * 100),
                }),
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "marketplace_purchase",
        item_id: item.id,
        buyer_id: user.id,
        buyer_organization_id: profile.organization_id,
        creator_id: item.creator_id,
        platform_commission: platformCommission.toFixed(2),
        creator_payout: creatorPayout.toFixed(2),
        pricing_type: item.pricing_type,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Create pending purchase record (will be updated to 'completed' by webhook)
    const { error: purchaseError } = await supabase
      .from("marketplace_purchases")
      .insert({
        item_id: item.id,
        buyer_id: user.id,
        buyer_organization_id: profile.organization_id,
        purchase_type: item.pricing_type,
        price_paid: price,
        platform_commission: platformCommission,
        creator_payout: creatorPayout,
        status: "pending",
        ...(item.pricing_type === "subscription" && {
          stripe_subscription_id: null, // Will be set by webhook
          subscription_status: "active",
        }),
      });

    if (purchaseError) {
      console.error("Error creating purchase record:", purchaseError);
      // Continue anyway - webhook will handle it
    }

    return NextResponse.json({
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error: any) {
    console.error("Marketplace purchase error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process purchase" },
      { status: 500 }
    );
  }
}
