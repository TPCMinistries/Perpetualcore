import { createClient } from "@/lib/supabase/server";
import { getPendingSuggestions, generateSuggestions } from "@/lib/intelligence";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Get pending suggestions for the user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    const organizationId = profile.organization_id as string;
    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const generate = searchParams.get("generate") === "true";

    // Generate new suggestions if requested
    if (generate) {
      await generateSuggestions(organizationId, user.id);
    }

    // Get pending suggestions
    const suggestions = await getPendingSuggestions(
      organizationId,
      user.id,
      limit
    );

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error("Error getting suggestions:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Update suggestion status (accept, dismiss, etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { suggestionId, status } = await request.json();

    if (!suggestionId || !status) {
      return NextResponse.json(
        { error: "suggestionId and status are required" },
        { status: 400 }
      );
    }

    const updateData: any = { status };

    if (status === "shown") {
      updateData.shown_at = new Date().toISOString();
    } else if (status === "accepted") {
      updateData.accepted_at = new Date().toISOString();
    } else if (status === "dismissed") {
      updateData.dismissed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("predictive_suggestions")
      .update(updateData)
      .eq("id", suggestionId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ suggestion: data });
  } catch (error: any) {
    console.error("Error updating suggestion:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

