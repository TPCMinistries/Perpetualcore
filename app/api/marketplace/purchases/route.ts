import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Fetch user's marketplace purchases
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's purchases with item details
    const { data: purchases, error } = await supabase
      .from("marketplace_purchases")
      .select(`
        id,
        purchase_type,
        price_paid,
        status,
        subscription_status,
        stripe_subscription_id,
        created_at,
        item:marketplace_items(
          id,
          name,
          type,
          description,
          category,
          creator:profiles!marketplace_items_creator_id_fkey(
            full_name
          )
        )
      `)
      .eq("buyer_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching purchases:", error);
      return NextResponse.json(
        { error: "Failed to fetch purchases" },
        { status: 500 }
      );
    }

    // Calculate subscription end dates based on purchase date
    const purchasesWithDates = purchases?.map((p) => {
      let subscription_end_date = null;
      if (p.purchase_type === "subscription" && p.subscription_status === "active") {
        const purchaseDate = new Date(p.created_at);
        // Add 30 days for monthly subscriptions
        subscription_end_date = new Date(purchaseDate);
        subscription_end_date.setDate(subscription_end_date.getDate() + 30);
      }

      return {
        id: p.id,
        item: {
          id: p.item?.id,
          name: p.item?.name,
          type: p.item?.type,
          description: p.item?.description,
          category: p.item?.category,
          creator_name: p.item?.creator?.full_name || "Creator",
        },
        purchase_type: p.purchase_type,
        price_paid: p.price_paid,
        subscription_status: p.subscription_status,
        subscription_end_date: subscription_end_date?.toISOString(),
        purchased_at: p.created_at,
        status: p.status,
      };
    }) || [];

    // Calculate stats
    const totalPurchases = purchasesWithDates.length;
    const activeSubscriptions = purchasesWithDates.filter(
      (p) => p.subscription_status === "active"
    ).length;
    const totalSpent = purchasesWithDates.reduce(
      (acc, p) => acc + (p.price_paid || 0),
      0
    );

    return NextResponse.json({
      purchases: purchasesWithDates,
      stats: {
        totalPurchases,
        activeSubscriptions,
        totalSpent,
      },
    });
  } catch (error: any) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch purchases" },
      { status: 500 }
    );
  }
}
