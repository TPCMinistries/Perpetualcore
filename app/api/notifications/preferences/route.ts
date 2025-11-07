import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET - Fetch notification preferences
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: prefs, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching preferences:", error);
      return NextResponse.json(
        { error: "Failed to fetch preferences" },
        { status: 500 }
      );
    }

    // Return default if not found
    if (!prefs) {
      return NextResponse.json({
        preferences: {
          enable_in_app: true,
          enable_email: true,
          enable_push: false,
          enable_ai_prioritization: true,
          enable_smart_digest: true,
          digest_frequency: "daily",
        },
      });
    }

    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    console.error("Preferences GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

/**
 * POST - Update notification preferences
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: user.id,
        ...body,
      })
      .select()
      .single();

    if (error) {
      console.error("Error updating preferences:", error);
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, preferences: data });
  } catch (error) {
    console.error("Preferences POST error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
