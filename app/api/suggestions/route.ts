import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    // Build query - use predictive_suggestions table
    let query = supabase
      .from("predictive_suggestions")
      .select("*")
      .eq("user_id", user.id)
      .order("relevance_score", { ascending: false })
      .order("created_at", { ascending: false });

    // Apply status filter
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // predictive_suggestions doesn't have expires_at, skip expiration filter

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data: suggestions, error } = await query;

    if (error) {
      console.error("Error fetching suggestions:", error);
      return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
    }

    // Get stats
    const { data: statsData } = await supabase
      .from("predictive_suggestions")
      .select("status")
      .eq("user_id", user.id);

    const stats = {
      total: statsData?.length || 0,
      pending: statsData?.filter(s => s.status === "pending" || s.status === "viewed").length || 0,
      accepted: statsData?.filter(s => s.status === "accepted").length || 0,
      dismissed: statsData?.filter(s => s.status === "dismissed").length || 0,
    };

    return NextResponse.json({ suggestions: suggestions || [], stats });
  } catch (error) {
    console.error("Suggestions API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      priority,
      suggested_action,
      action_url,
      confidence_score,
      reasoning,
    } = body;

    const { data: suggestion, error: createError } = await supabase
      .from("predictive_suggestions")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        title,
        description,
        suggestion_type: category || "recommendation",
        priority: priority || "medium",
        suggested_action: suggested_action || {},
        relevance_score: confidence_score || 0.5,
        confidence: confidence_score || 0.5,
        context_tags: [],
        based_on_insights: [],
        based_on_patterns: [],
        based_on_preferences: [],
        status: "pending",
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating suggestion:", createError);
      return NextResponse.json({ error: "Failed to create suggestion" }, { status: 500 });
    }

    return NextResponse.json({ suggestion }, { status: 201 });
  } catch (error) {
    console.error("Create suggestion API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
