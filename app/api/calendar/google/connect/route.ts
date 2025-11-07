import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAuthUrl } from "@/lib/calendar/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Initiate Google Calendar OAuth flow
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate OAuth URL
    const authUrl = getGoogleAuthUrl(user.id);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Google Calendar connect error:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
