import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PREF_KEY = "voice_settings";
const PREF_TYPE = "voice";

/**
 * GET - Fetch user's voice preferences
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: pref } = await supabase
      .from("user_preferences")
      .select("preference_value")
      .eq("user_id", user.id)
      .eq("preference_key", PREF_KEY)
      .single();

    const defaults = {
      voice: "alloy",
      autoProcess: true,
      autoTranscribe: true,
    };

    return NextResponse.json({
      preferences: pref?.preference_value
        ? { ...defaults, ...(pref.preference_value as Record<string, unknown>) }
        : defaults,
    });
  } catch (error) {
    console.error("Voice preferences GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update voice preferences
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const body = await req.json();
    const allowedKeys = ["voice", "autoProcess", "autoTranscribe"];
    const updates: Record<string, unknown> = {};
    for (const key of allowedKeys) {
      if (key in body) updates[key] = body[key];
    }

    const { data, error } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: user.id,
          organization_id: profile?.organization_id || user.id,
          preference_key: PREF_KEY,
          preference_type: PREF_TYPE,
          preference_value: updates,
          is_explicit: true,
        },
        { onConflict: "user_id,preference_key" }
      )
      .select()
      .single();

    if (error) {
      console.error("Voice preferences update error:", error);
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({ preferences: data?.preference_value });
  } catch (error) {
    console.error("Voice preferences PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
