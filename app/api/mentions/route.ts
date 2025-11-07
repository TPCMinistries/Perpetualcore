import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/mentions - Get all mentions for the current user
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    // Build query
    let query = supabase
      .from("mentions")
      .select(`
        *,
        mentioning_user:profiles!mentioning_user_id (
          full_name,
          avatar_url
        )
      `)
      .eq("mentioned_user_id", user.id)
      .order("created_at", { ascending: false });

    // Filter to unread only if requested
    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data: mentions, error: mentionsError } = await query;

    if (mentionsError) {
      console.error("Error fetching mentions:", mentionsError);
      return NextResponse.json(
        { error: "Failed to fetch mentions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ mentions: mentions || [] });
  } catch (error) {
    console.error("Mentions API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
