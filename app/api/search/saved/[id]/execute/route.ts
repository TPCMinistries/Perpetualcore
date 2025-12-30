import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const isDev = process.env.NODE_ENV === "development";

// POST /api/search/saved/[id]/execute
// Execute a saved search and increment usage counter
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: searchId } = await params;

    // Get the saved search
    const { data: savedSearch, error: searchError } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("id", searchId)
      .single();

    if (searchError || !savedSearch) {
      return NextResponse.json(
        { error: "Saved search not found" },
        { status: 404 }
      );
    }

    // Verify access (owner or shared in same org)
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    const hasAccess =
      savedSearch.user_id === user.id ||
      (savedSearch.is_shared && savedSearch.organization_id === profile?.organization_id);

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Increment usage count (only if user is the owner)
    if (savedSearch.user_id === user.id) {
      await supabase.rpc("increment_saved_search_usage", { search_id: searchId });
    }

    // Return the search configuration to be executed on the client
    return NextResponse.json({
      query: savedSearch.query,
      filters: savedSearch.filters,
      name: savedSearch.name,
    });
  } catch (error) {
    if (isDev) console.error("Execute saved search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
