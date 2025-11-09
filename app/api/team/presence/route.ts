import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/team/presence
 * Get online team members
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "User has no organization" }, { status: 400 });
    }

    // Get online members (active in last 5 minutes)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const { data: onlineMembers, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, is_online, last_active_at")
      .eq("organization_id", profile.organization_id)
      .eq("is_online", true)
      .order("last_active_at", { ascending: false });

    if (error) {
      console.error("Error fetching online members:", error);
      return NextResponse.json(
        { error: "Failed to fetch online members", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      online_members: onlineMembers || [],
      count: onlineMembers?.length || 0
    });
  } catch (error: any) {
    console.error("Error in GET /api/team/presence:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/team/presence
 * Update user's online status
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { is_online } = body;

    if (is_online === undefined) {
      return NextResponse.json({ error: "is_online is required" }, { status: 400 });
    }

    // Update user's online status
    const { error } = await supabase
      .from("profiles")
      .update({
        is_online,
        last_active_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating presence:", error);
      return NextResponse.json(
        { error: "Failed to update presence", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Presence updated successfully" });
  } catch (error: any) {
    console.error("Error in POST /api/team/presence:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
