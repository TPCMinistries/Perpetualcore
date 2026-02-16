import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Search marketplace skills with filtering and sorting
 *
 * Query params:
 *   q        - search text (matches name, description, tags)
 *   category - filter by category
 *   sort     - popular | newest | rating (default: popular)
 *   page     - page number (default: 1)
 *   limit    - results per page (default: 20, max: 50)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") || "popular";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const offset = (page - 1) * limit;

    // Build query - only show approved items
    let query = supabase
      .from("marketplace_items")
      .select("*", { count: "exact" })
      .eq("status", "approved");

    // Text search across name, description
    if (q) {
      // Use ilike for text search across name and description
      query = query.or(
        `name.ilike.%${q}%,description.ilike.%${q}%`
      );
    }

    // Category filter
    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    // Sorting
    switch (sort) {
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "rating":
        // We'll sort by rating after fetching since rating is computed
        query = query.order("created_at", { ascending: false });
        break;
      case "popular":
      default:
        // Sort by created_at as a fallback, then re-sort by install count
        query = query.order("created_at", { ascending: false });
        break;
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: items, error, count } = await query;

    if (error) {
      console.error("Error searching marketplace:", error);
      return NextResponse.json(
        { error: "Failed to search marketplace" },
        { status: 500 }
      );
    }

    // For each item, get install count and avg rating from related tables
    const enrichedItems = await Promise.all(
      (items || []).map(async (item) => {
        // Get install count
        const { count: installCount } = await supabase
          .from("skill_installs")
          .select("*", { count: "exact", head: true })
          .eq("skill_id", item.id)
          .is("uninstalled_at", null);

        // Get review stats
        const { data: reviewStats } = await supabase
          .from("skill_reviews")
          .select("rating")
          .eq("skill_id", item.id);

        const reviewCount = reviewStats?.length || 0;
        const avgRating =
          reviewCount > 0
            ? Math.round(
                (reviewStats!.reduce((acc, r) => acc + r.rating, 0) /
                  reviewCount) *
                  10
              ) / 10
            : 0;

        // Also check marketplace_reviews for backward compatibility
        const { data: marketplaceReviewStats } = await supabase
          .from("marketplace_reviews")
          .select("rating")
          .eq("item_id", item.id);

        const mReviewCount = marketplaceReviewStats?.length || 0;
        const mAvgRating =
          mReviewCount > 0
            ? Math.round(
                (marketplaceReviewStats!.reduce(
                  (acc, r) => acc + r.rating,
                  0
                ) /
                  mReviewCount) *
                  10
              ) / 10
            : 0;

        // Get sales count for popularity
        const { count: salesCount } = await supabase
          .from("marketplace_purchases")
          .select("*", { count: "exact", head: true })
          .eq("item_id", item.id)
          .eq("status", "completed");

        // Check for approved submission (security verified)
        const { data: submission } = await supabase
          .from("skill_submissions")
          .select("status, security_scan_result")
          .eq("skill_id", item.id)
          .eq("status", "approved")
          .limit(1)
          .maybeSingle();

        return {
          ...item,
          install_count: (installCount || 0) + (salesCount || 0),
          avg_rating: avgRating || mAvgRating,
          review_count: reviewCount + mReviewCount,
          sales_count: salesCount || 0,
          security_verified: !!submission,
          security_score: submission?.security_scan_result
            ? (submission.security_scan_result as Record<string, unknown>)
                .score || null
            : null,
        };
      })
    );

    // Re-sort by the enriched fields
    let sortedItems = enrichedItems;
    switch (sort) {
      case "popular":
        sortedItems = enrichedItems.sort(
          (a, b) => b.install_count - a.install_count
        );
        break;
      case "rating":
        sortedItems = enrichedItems.sort(
          (a, b) => b.avg_rating - a.avg_rating
        );
        break;
      // newest is already sorted by DB query
    }

    return NextResponse.json({
      skills: sortedItems,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to search marketplace";
    console.error("Marketplace search error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
