import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  UTM_COOKIE_NAME,
  deserializeUTM,
} from "@/lib/analytics/utm-store";
import type { AnalyticsEventType } from "@/lib/analytics/types";

const VALID_EVENTS: AnalyticsEventType[] = [
  "page_view",
  "cta_click",
  "signup",
  "onboarding_complete",
  "first_chat",
  "first_document",
  "explore_agents",
  "trial_started",
  "trial_converted",
  "upgrade",
  "downgrade",
  "churn",
];

/**
 * POST /api/analytics/track
 *
 * Client-side event tracking endpoint. Merges UTM cookies with event data
 * and stores via createAdminClient (bypasses RLS for insert).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_type, event_name, anonymous_id, session_id, page_url, page_path, metadata } =
      body;

    // Validate event type
    if (!event_type || !VALID_EVENTS.includes(event_type)) {
      return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
    }

    // Get authenticated user if available
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // Anonymous visitor — that's fine
    }

    // Read UTM from cookie
    const utmCookie = request.cookies.get(UTM_COOKIE_NAME)?.value;
    const utm = utmCookie ? deserializeUTM(utmCookie) : null;

    // Extract request metadata
    const userAgent = request.headers.get("user-agent") || undefined;
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      undefined;
    const referer = request.headers.get("referer") || undefined;

    // Insert via admin client (server-side, bypasses RLS)
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.rpc("track_analytics_event", {
      p_event_type: event_type,
      p_event_name: event_name || null,
      p_user_id: userId,
      p_anonymous_id: anonymous_id || null,
      p_session_id: session_id || null,
      p_utm_source: utm?.utm_source || null,
      p_utm_medium: utm?.utm_medium || null,
      p_utm_campaign: utm?.utm_campaign || null,
      p_utm_term: utm?.utm_term || null,
      p_utm_content: utm?.utm_content || null,
      p_referrer: utm?.referrer || referer || null,
      p_page_url: page_url || null,
      p_page_path: page_path || null,
      p_metadata: metadata || {},
      p_user_agent: userAgent || null,
      p_ip_address: ip || null,
    });

    if (error) {
      console.error("[Analytics Track] Error:", error);
      return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Analytics Track] Unexpected error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
