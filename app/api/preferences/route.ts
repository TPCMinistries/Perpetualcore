import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const isDev = process.env.NODE_ENV === "development";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user preferences from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .single();

    if (profileError) {
      if (isDev) console.error("Error loading preferences:", profileError);
      return NextResponse.json(
        { error: "Failed to load preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      preferences: profile?.preferences || {}
    });
  } catch (error) {
    if (isDev) console.error("Error in GET /api/preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { preferences } = body;

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: "Invalid preferences data" },
        { status: 400 }
      );
    }

    // Update user preferences in profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ preferences })
      .eq("id", user.id);

    if (updateError) {
      if (isDev) console.error("Error saving preferences:", updateError);
      return NextResponse.json(
        { error: "Failed to save preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Preferences saved successfully"
    });
  } catch (error) {
    if (isDev) console.error("Error in POST /api/preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
