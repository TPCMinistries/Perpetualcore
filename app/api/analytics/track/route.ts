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

const PUBLIC_METADATA_KEYS = new Set([
  "surface",
  "placement",
  "product",
  "status",
  "delivery",
  "destinationHost",
  "metric",
  "rating",
  "value",
]);

function sanitizePublicMetadata(value: unknown): Record<string, string | number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const sanitized: Record<string, string | number> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!PUBLIC_METADATA_KEYS.has(key)) continue;
    if (typeof item === "string") sanitized[key] = item.slice(0, 120);
    if (typeof item === "number" && Number.isFinite(item)) sanitized[key] = item;
  }
  return sanitized;
}

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
    if (
      (event_name !== undefined &&
        event_name !== null &&
        (typeof event_name !== "string" || event_name.length > 120)) ||
      (page_path !== undefined &&
        page_path !== null &&
        (typeof page_path !== "string" || page_path.length > 300)) ||
      (page_url !== undefined &&
        page_url !== null &&
        (typeof page_url !== "string" || page_url.length > 1000))
    ) {
      return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
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

    const hasConsent = request.cookies.get("pc_consent")?.value === "accepted";
    if (!userId && !hasConsent) {
      return new NextResponse(null, { status: 204 });
    }

    const isPublicEvent =
      !userId &&
      typeof metadata === "object" &&
      metadata !== null &&
      !Array.isArray(metadata) &&
      (metadata as Record<string, unknown>).surface === "public";
    const safeMetadata = isPublicEvent
      ? sanitizePublicMetadata(metadata)
      : metadata && typeof metadata === "object" && !Array.isArray(metadata)
        ? metadata
        : {};

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
      p_metadata: safeMetadata,
      p_user_agent: isPublicEvent ? null : userAgent || null,
      p_ip_address: isPublicEvent ? null : ip || null,
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
