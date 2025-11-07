import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/search/saved
// Fetch all saved searches for the current user
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile for organization
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const pinnedOnly = searchParams.get("pinned") === "true";

    let query = supabase
      .from("saved_searches")
      .select("*")
      .or(`user_id.eq.${user.id},and(is_shared.eq.true,organization_id.eq.${profile.organization_id})`)
      .order("is_pinned", { ascending: false })
      .order("usage_count", { ascending: false });

    if (pinnedOnly) {
      query = query.eq("is_pinned", true);
    }

    const { data: savedSearches, error: searchError } = await query;

    if (searchError) {
      console.error("Error fetching saved searches:", searchError);
      return NextResponse.json(
        { error: "Failed to fetch saved searches" },
        { status: 500 }
      );
    }

    return NextResponse.json({ savedSearches: savedSearches || [] });
  } catch (error) {
    console.error("Saved searches API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/search/saved
// Create a new saved search
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile for organization
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, query, filters, is_pinned, is_shared, notifications_enabled } = body;

    if (!name || !query) {
      return NextResponse.json(
        { error: "Name and query are required" },
        { status: 400 }
      );
    }

    const { data: savedSearch, error: insertError } = await supabase
      .from("saved_searches")
      .insert({
        user_id: user.id,
        organization_id: profile.organization_id,
        name,
        description,
        query,
        filters: filters || {},
        is_pinned: is_pinned || false,
        is_shared: is_shared || false,
        notifications_enabled: notifications_enabled || false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating saved search:", insertError);
      return NextResponse.json(
        { error: "Failed to create saved search" },
        { status: 500 }
      );
    }

    return NextResponse.json({ savedSearch }, { status: 201 });
  } catch (error) {
    console.error("Create saved search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
