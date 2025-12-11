import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST - Create new marketplace item
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile and organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const body = await req.json();
    const {
      type,
      name,
      description,
      long_description,
      pricing_type,
      price,
      subscription_interval,
      category,
      tags,
      features,
      config,
      preview_image,
    } = body;

    // Validate required fields
    if (!type || !name || !description || !pricing_type || !price || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate type
    if (!["agent", "workflow"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be 'agent' or 'workflow'" },
        { status: 400 }
      );
    }

    // Validate pricing type
    if (!["one_time", "subscription"].includes(pricing_type)) {
      return NextResponse.json(
        { error: "Pricing type must be 'one_time' or 'subscription'" },
        { status: 400 }
      );
    }

    // Validate subscription interval if subscription
    if (pricing_type === "subscription") {
      if (!subscription_interval || !["monthly", "yearly"].includes(subscription_interval)) {
        return NextResponse.json(
          { error: "Subscription interval must be 'monthly' or 'yearly'" },
          { status: 400 }
        );
      }
    }

    // Create marketplace item
    const { data: item, error: itemError } = await supabase
      .from("marketplace_items")
      .insert({
        creator_id: user.id,
        organization_id: profile.organization_id,
        type,
        name,
        description,
        long_description: long_description || null,
        pricing_type,
        price,
        subscription_interval: pricing_type === "subscription" ? subscription_interval : null,
        category,
        tags: tags || [],
        features: features || [],
        config: config || {},
        preview_image: preview_image || null,
        status: "pending_review",
      })
      .select()
      .single();

    if (itemError) {
      console.error("Error creating marketplace item:", itemError);
      return NextResponse.json(
        { error: "Failed to create marketplace item" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (error: any) {
    console.error("Marketplace item creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create marketplace item" },
      { status: 500 }
    );
  }
}

/**
 * GET - Fetch marketplace items (with filters)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const creator_id = searchParams.get("creator_id");

    let query = supabase
      .from("marketplace_items")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply filters
    if (type) {
      query = query.eq("type", type);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (status) {
      query = query.eq("status", status);
    } else {
      // Default to only approved items for public
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !creator_id || creator_id !== user.id) {
        query = query.eq("status", "approved");
      }
    }

    if (creator_id) {
      query = query.eq("creator_id", creator_id);
    }

    const { data: items, error } = await query;

    if (error) {
      console.error("Error fetching marketplace items:", error);
      return NextResponse.json(
        { error: "Failed to fetch marketplace items" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      items: items || [],
    });
  } catch (error: any) {
    console.error("Marketplace items fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch marketplace items" },
      { status: 500 }
    );
  }
}
