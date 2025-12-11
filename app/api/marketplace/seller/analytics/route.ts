import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Fetch seller analytics
 * Returns earnings, sales, listings, and recent transactions
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

    // Get seller's marketplace items
    const { data: listings, error: listingsError } = await supabase
      .from("marketplace_items")
      .select("*")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });

    if (listingsError) {
      console.error("Error fetching listings:", listingsError);
    }

    // Get seller's sales/purchases
    const { data: purchases, error: purchasesError } = await supabase
      .from("marketplace_purchases")
      .select(`
        *,
        item:item_id (
          name,
          type,
          price
        ),
        buyer:buyer_id (
          email
        )
      `)
      .eq("status", "completed")
      .in("item_id", (listings || []).map((l) => l.id))
      .order("created_at", { ascending: false });

    if (purchasesError) {
      console.error("Error fetching purchases:", purchasesError);
    }

    // Calculate stats
    const completedPurchases = purchases || [];
    const totalEarnings = completedPurchases.reduce(
      (sum, p) => sum + (parseFloat(p.creator_payout) || 0),
      0
    );
    const totalSales = completedPurchases.length;
    const activeListings = (listings || []).filter(
      (l) => l.status === "approved"
    ).length;

    // Get pending payout (sales in last 30 days not yet paid out)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const pendingPayout = completedPurchases
      .filter((p) => new Date(p.created_at) >= thirtyDaysAgo)
      .reduce((sum, p) => sum + (parseFloat(p.creator_payout) || 0), 0);

    // Calculate average rating from reviews (if you have a reviews table)
    // For now, return placeholder
    const averageRating = 0;
    const totalReviews = 0;

    // Get recent sales (last 10)
    const recentSales = completedPurchases.slice(0, 10).map((sale) => ({
      id: sale.id,
      item_name: sale.item?.name || "Unknown Item",
      buyer: sale.buyer?.email?.split("@")[0] || "Anonymous",
      price: parseFloat(sale.price_paid) || 0,
      creator_payout: parseFloat(sale.creator_payout) || 0,
      date: sale.created_at,
    }));

    // Format listings for response
    const formattedListings = (listings || []).map((listing) => {
      const listingSales = completedPurchases.filter(
        (p) => p.item_id === listing.id
      );
      const totalRevenue = listingSales.reduce(
        (sum, p) => sum + (parseFloat(p.price_paid) || 0),
        0
      );

      return {
        id: listing.id,
        type: listing.type,
        name: listing.name,
        status: listing.status,
        price: parseFloat(listing.price) || 0,
        pricing_type: listing.pricing_type,
        subscription_interval: listing.subscription_interval,
        total_sales: listingSales.length,
        total_revenue: totalRevenue,
        average_rating: 0, // Would come from reviews table
        review_count: 0, // Would come from reviews table
        created_at: listing.created_at,
      };
    });

    // Calculate daily sales for analytics chart (last 30 days)
    const dailySales: Record<string, { sales: number; revenue: number }> = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dailySales[dateStr] = { sales: 0, revenue: 0 };
    }

    completedPurchases.forEach((purchase) => {
      const dateStr = new Date(purchase.created_at).toISOString().split("T")[0];
      if (dailySales[dateStr]) {
        dailySales[dateStr].sales += 1;
        dailySales[dateStr].revenue += parseFloat(purchase.creator_payout) || 0;
      }
    });

    const chartData = Object.entries(dailySales)
      .map(([date, data]) => ({
        date,
        sales: data.sales,
        revenue: data.revenue,
      }))
      .reverse();

    return NextResponse.json({
      stats: {
        totalEarnings,
        pendingPayout,
        totalSales,
        activeListings,
        averageRating,
        totalReviews,
      },
      listings: formattedListings,
      recentSales,
      chartData,
    });
  } catch (error: any) {
    console.error("Seller analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
