import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - List reviews for a marketplace skill
 *
 * Query params:
 *   page  - page number (default: 1)
 *   limit - results per page (default: 10, max: 50)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10))
    );
    const offset = (page - 1) * limit;

    // Check both skill_reviews and marketplace_reviews tables
    // skill_reviews is the new Phase 6 table, marketplace_reviews is the original
    const { data: skillReviews, count: skillReviewCount } = await supabase
      .from("skill_reviews")
      .select(
        `
        id,
        skill_id,
        user_id,
        rating,
        review,
        created_at,
        updated_at
      `,
        { count: "exact" }
      )
      .eq("skill_id", id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Also fetch from marketplace_reviews for backward compatibility
    const { data: marketplaceReviews } = await supabase
      .from("marketplace_reviews")
      .select(
        `
        id,
        item_id,
        reviewer_id,
        rating,
        title,
        comment,
        created_at,
        reviewer:profiles!marketplace_reviews_reviewer_id_fkey(
          full_name
        )
      `
      )
      .eq("item_id", id)
      .order("created_at", { ascending: false });

    // Fetch user profiles for skill_reviews
    const userIds = (skillReviews || []).map((r) => r.user_id);
    const { data: profiles } = userIds.length
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds)
      : { data: [] };

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p.full_name])
    );

    // Check if current user has a purchase (for verified purchase badge)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let purchasedUserIds = new Set<string>();
    if (userIds.length > 0) {
      const { data: purchases } = await supabase
        .from("marketplace_purchases")
        .select("buyer_id")
        .eq("item_id", id)
        .eq("status", "completed")
        .in("buyer_id", userIds);

      purchasedUserIds = new Set(
        (purchases || []).map((p) => p.buyer_id)
      );
    }

    // Merge reviews from both tables, deduplicate by user
    const seenUsers = new Set<string>();
    const allReviews: Array<{
      id: string;
      rating: number;
      title: string | null;
      review: string;
      reviewer_name: string;
      verified_purchase: boolean;
      created_at: string;
    }> = [];

    // New skill_reviews first (higher priority)
    for (const r of skillReviews || []) {
      seenUsers.add(r.user_id);
      allReviews.push({
        id: r.id,
        rating: r.rating,
        title: null,
        review: r.review,
        reviewer_name: profileMap.get(r.user_id) || "Anonymous",
        verified_purchase: purchasedUserIds.has(r.user_id),
        created_at: r.created_at,
      });
    }

    // Then marketplace_reviews (backward compat, skip if user already reviewed)
    for (const r of marketplaceReviews || []) {
      if (r.reviewer_id && seenUsers.has(r.reviewer_id)) continue;
      if (r.reviewer_id) seenUsers.add(r.reviewer_id);

      allReviews.push({
        id: r.id,
        rating: r.rating,
        title: r.title,
        review: r.comment,
        reviewer_name: r.reviewer?.full_name || "Anonymous",
        verified_purchase: true, // Marketplace reviews required purchase
        created_at: r.created_at,
      });
    }

    // Calculate aggregated stats from all reviews
    const totalCount = allReviews.length;
    const avgRating =
      totalCount > 0
        ? Math.round(
            (allReviews.reduce((acc, r) => acc + r.rating, 0) / totalCount) * 10
          ) / 10
        : 0;

    // Rating distribution (1-5 stars)
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of allReviews) {
      const bucket = Math.min(5, Math.max(1, Math.round(r.rating)));
      distribution[bucket]++;
    }

    return NextResponse.json({
      reviews: allReviews.slice(0, limit),
      avgRating,
      count: totalCount,
      distribution,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      currentUserId: user?.id || null,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch reviews";
    console.error("Error fetching reviews:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST - Submit a review for a marketplace skill
 *
 * Body: { rating: 1-5, review: string }
 * Auth required. Upserts (one review per user per skill).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: skillId } = await params;
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rating, review } = body;

    // Validate rating
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    // Validate review text
    if (!review || typeof review !== "string" || review.trim().length === 0) {
      return NextResponse.json(
        { error: "Review text is required" },
        { status: 400 }
      );
    }

    if (review.trim().length > 2000) {
      return NextResponse.json(
        { error: "Review text must be 2000 characters or less" },
        { status: 400 }
      );
    }

    // Check if the item exists
    const { data: item } = await supabase
      .from("marketplace_items")
      .select("id, creator_id")
      .eq("id", skillId)
      .single();

    if (!item) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      );
    }

    // Prevent self-reviews
    if (item.creator_id === user.id) {
      return NextResponse.json(
        { error: "You cannot review your own skill" },
        { status: 400 }
      );
    }

    // Upsert: check if user already has a review
    const { data: existingReview } = await supabase
      .from("skill_reviews")
      .select("id")
      .eq("skill_id", skillId)
      .eq("user_id", user.id)
      .maybeSingle();

    let reviewData;

    if (existingReview) {
      // Update existing review
      const { data, error } = await supabase
        .from("skill_reviews")
        .update({
          rating: Math.round(rating),
          review: review.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingReview.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating review:", error);
        return NextResponse.json(
          { error: "Failed to update review" },
          { status: 500 }
        );
      }

      reviewData = data;
    } else {
      // Create new review
      const { data, error } = await supabase
        .from("skill_reviews")
        .insert({
          skill_id: skillId,
          user_id: user.id,
          rating: Math.round(rating),
          review: review.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating review:", error);
        return NextResponse.json(
          { error: "Failed to create review" },
          { status: 500 }
        );
      }

      reviewData = data;
    }

    return NextResponse.json({
      success: true,
      review: reviewData,
      updated: !!existingReview,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to submit review";
    console.error("Error submitting review:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
