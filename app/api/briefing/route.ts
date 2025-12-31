import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBriefingData, generateBriefingCache } from "@/lib/briefing/actions";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for cached briefing
    const today = new Date().toISOString().split("T")[0];
    const { data: cached } = await supabase
      .from("briefing_cache")
      .select("data, generated_at")
      .eq("user_id", user.id)
      .eq("briefing_date", today)
      .single();

    // Use cache if less than 5 minutes old
    if (cached) {
      const cacheAge = Date.now() - new Date(cached.generated_at).getTime();
      if (cacheAge < 5 * 60 * 1000) {
        return NextResponse.json(cached.data);
      }
    }

    // Generate fresh briefing data
    const briefingData = await getBriefingData(user.id);

    // Cache the result
    await generateBriefingCache(user.id, today, briefingData);

    return NextResponse.json(briefingData);
  } catch (error) {
    console.error("Briefing API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch briefing" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Force refresh - delete cache and regenerate
    const today = new Date().toISOString().split("T")[0];
    await supabase
      .from("briefing_cache")
      .delete()
      .eq("user_id", user.id)
      .eq("briefing_date", today);

    const briefingData = await getBriefingData(user.id);
    await generateBriefingCache(user.id, today, briefingData);

    return NextResponse.json(briefingData);
  } catch (error) {
    console.error("Briefing refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh briefing" },
      { status: 500 }
    );
  }
}
