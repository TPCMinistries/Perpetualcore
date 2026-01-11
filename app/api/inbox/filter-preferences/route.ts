import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface FilterPreferences {
  skip_promotions: boolean;
  skip_social: boolean;
  skip_updates: boolean;
  skip_forums: boolean;
  trusted_only: boolean;
}

const DEFAULT_PREFERENCES: FilterPreferences = {
  skip_promotions: false,
  skip_social: false,
  skip_updates: false,
  skip_forums: false,
  trusted_only: false,
};

// GET - Fetch user's filter preferences
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get preferences from profile metadata or dedicated table
    const { data: profile } = await supabase
      .from("profiles")
      .select("email_filter_preferences")
      .eq("id", user.id)
      .single();

    const preferences = profile?.email_filter_preferences || DEFAULT_PREFERENCES;

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Error fetching filter preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// POST - Save user's filter preferences
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json({ error: "No preferences provided" }, { status: 400 });
    }

    // Validate preferences
    const validPrefs: FilterPreferences = {
      skip_promotions: Boolean(preferences.skip_promotions),
      skip_social: Boolean(preferences.skip_social),
      skip_updates: Boolean(preferences.skip_updates),
      skip_forums: Boolean(preferences.skip_forums),
      trusted_only: Boolean(preferences.trusted_only),
    };

    // Save to profile
    const { error } = await supabase
      .from("profiles")
      .update({
        email_filter_preferences: validPrefs,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error saving preferences:", error);
      return NextResponse.json(
        { error: "Failed to save preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, preferences: validPrefs });
  } catch (error) {
    console.error("Error saving filter preferences:", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}
