import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Fetch single marketplace item by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch item with creator info
    const { data: item, error } = await supabase
      .from("marketplace_items")
      .select(`
        *,
        creator:profiles!marketplace_items_creator_id_fkey(
          id,
          full_name,
          email,
          created_at
        )
      `)
      .eq("id", id)
      .single();

    if (error || !item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Check if item is approved or user is the creator
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (item.status !== "approved" && (!user || user.id !== item.creator_id)) {
      return NextResponse.json(
        { error: "Item not found or not available" },
        { status: 404 }
      );
    }

    // Fetch reviews for this item
    const { data: reviews } = await supabase
      .from("marketplace_reviews")
      .select(`
        id,
        rating,
        title,
        comment,
        created_at,
        reviewer:profiles!marketplace_reviews_reviewer_id_fkey(
          full_name
        )
      `)
      .eq("item_id", id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get review stats
    const { data: reviewStats } = await supabase
      .from("marketplace_reviews")
      .select("rating")
      .eq("item_id", id);

    const totalReviews = reviewStats?.length || 0;
    const avgRating = totalReviews > 0
      ? reviewStats!.reduce((acc, r) => acc + r.rating, 0) / totalReviews
      : 0;

    // Get sales count
    const { count: salesCount } = await supabase
      .from("marketplace_purchases")
      .select("*", { count: "exact", head: true })
      .eq("item_id", id)
      .eq("status", "completed");

    // Get creator stats
    const { count: creatorItemCount } = await supabase
      .from("marketplace_items")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", item.creator_id)
      .eq("status", "approved");

    const { count: creatorSalesCount } = await supabase
      .from("marketplace_purchases")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .in(
        "item_id",
        await supabase
          .from("marketplace_items")
          .select("id")
          .eq("creator_id", item.creator_id)
          .then(({ data }) => data?.map((i) => i.id) || [])
      );

    // Check if current user already purchased
    let alreadyPurchased = false;
    if (user) {
      const { data: purchase } = await supabase
        .from("marketplace_purchases")
        .select("id")
        .eq("item_id", id)
        .eq("buyer_id", user.id)
        .eq("status", "completed")
        .single();

      alreadyPurchased = !!purchase;
    }

    return NextResponse.json({
      item: {
        ...item,
        rating: Math.round(avgRating * 10) / 10,
        review_count: totalReviews,
        total_sales: salesCount || 0,
        creator: {
          name: item.creator?.full_name || "Creator",
          verified: true, // Could be a field on profiles
          total_items: creatorItemCount || 0,
          total_sales: creatorSalesCount || 0,
          member_since: item.creator?.created_at,
        },
        reviews: reviews?.map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          reviewer: r.reviewer?.full_name || "Anonymous",
          verified_purchase: true,
          created_at: r.created_at,
        })) || [],
      },
      alreadyPurchased,
    });
  } catch (error: any) {
    console.error("Error fetching marketplace item:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch item" },
      { status: 500 }
    );
  }
}
