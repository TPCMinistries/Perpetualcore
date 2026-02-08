/**
 * Morning Briefing API
 * GET - Get today's briefing (generate if not exists)
 * POST - Force generate a new briefing and deliver via preferred channel
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  gatherBriefingData,
  generateBriefingContent,
  getUserBriefingPrefs,
  deliverMorningBriefing,
} from "@/lib/briefings/morning-briefing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/user/briefing
 * Returns today's briefing data (generates if needed)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile for organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check if we already have today's briefing
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: existingBriefing } = await supabase
      .from("briefing_history")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", todayStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingBriefing) {
      return NextResponse.json({
        briefing: existingBriefing.briefing_content,
        data: existingBriefing.briefing_data,
        delivered: existingBriefing.delivered,
        deliveredAt: existingBriefing.delivered_at,
        cached: true,
      });
    }

    // Generate new briefing
    const data = await gatherBriefingData(user.id, profile.organization_id);
    const briefing = await generateBriefingContent(data, "concise");

    // Store it
    await supabase.from("briefing_history").insert({
      user_id: user.id,
      channel: "in_app",
      briefing_data: data,
      briefing_content: briefing,
      delivered: false,
    });

    return NextResponse.json({
      briefing,
      data,
      delivered: false,
      cached: false,
    });
  } catch (error: any) {
    console.error("Briefing GET error:", error);
    return NextResponse.json(
      { error: "Failed to get briefing: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/briefing
 * Generate and deliver a new briefing via preferred channel
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { channel } = body; // Optional: override preferred channel

    // Get user's preferences
    const prefs = await getUserBriefingPrefs(user.id);

    if (!prefs) {
      return NextResponse.json({ error: "User preferences not found" }, { status: 404 });
    }

    // Override channel if specified
    if (channel) {
      prefs.preferredChannel = channel;
    }

    // Deliver briefing
    const result = await deliverMorningBriefing(prefs);

    if (result.success) {
      return NextResponse.json({
        success: true,
        channel: result.channel,
        message: `Briefing delivered via ${result.channel}`,
      });
    } else {
      return NextResponse.json({
        success: false,
        channel: result.channel,
        error: result.error,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Briefing POST error:", error);
    return NextResponse.json(
      { error: "Failed to deliver briefing: " + error.message },
      { status: 500 }
    );
  }
}
