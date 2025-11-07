import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncGmailMessages } from "@/lib/email/gmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sync emails from Gmail
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const body = await req.json();
    const maxResults = body.maxResults || 50;

    // Sync Gmail messages
    const result = await syncGmailMessages(
      user.id,
      profile.organization_id,
      maxResults
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Sync failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailsCount: result.emailsCount,
    });
  } catch (error) {
    console.error("Email sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync emails" },
      { status: 500 }
    );
  }
}
