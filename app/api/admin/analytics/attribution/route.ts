import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/analytics/attribution
 *
 * Returns UTM attribution breakdown for the admin analytics dashboard.
 * Query params: days (default 30), group_by (source|medium|campaign, default source)
 */
export async function GET(request: NextRequest) {
  // Verify admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin, is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_super_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const days = parseInt(request.nextUrl.searchParams.get("days") || "30");
  const groupBy = request.nextUrl.searchParams.get("group_by") || "source";
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startISO = startDate.toISOString();

  try {
    // Fetch all events with UTM data in the period
    const { data: events, error } = await admin
      .from("analytics_events")
      .select("event_type, utm_source, utm_medium, utm_campaign, user_id, anonymous_id")
      .gte("created_at", startISO)
      .not(groupBy === "source" ? "utm_source" : groupBy === "medium" ? "utm_medium" : "utm_campaign", "is", null);

    if (error) {
      console.error("[Attribution] Query error:", error);
      return NextResponse.json({ error: "Failed to fetch attribution data" }, { status: 500 });
    }

    // Group by selected dimension
    const groups: Record<
      string,
      {
        key: string;
        utm_source: string;
        utm_medium: string;
        utm_campaign: string;
        visitors: Set<string>;
        signups: Set<string>;
        activations: Set<string>;
        conversions: Set<string>;
      }
    > = {};

    const ACTIVATION_EVENTS = ["first_chat", "first_document", "explore_agents"];

    events?.forEach((event) => {
      const key =
        groupBy === "source"
          ? event.utm_source || "(direct)"
          : groupBy === "medium"
            ? event.utm_medium || "(none)"
            : event.utm_campaign || "(none)";

      if (!groups[key]) {
        groups[key] = {
          key,
          utm_source: event.utm_source || "",
          utm_medium: event.utm_medium || "",
          utm_campaign: event.utm_campaign || "",
          visitors: new Set(),
          signups: new Set(),
          activations: new Set(),
          conversions: new Set(),
        };
      }

      const userId = event.user_id || event.anonymous_id || "";
      if (!userId) return;

      if (event.event_type === "page_view") {
        groups[key].visitors.add(userId);
      }
      if (event.event_type === "signup") {
        groups[key].signups.add(userId);
      }
      if (ACTIVATION_EVENTS.includes(event.event_type)) {
        groups[key].activations.add(userId);
      }
      if (event.event_type === "trial_converted") {
        groups[key].conversions.add(userId);
      }
    });

    // Format response
    const rows = Object.values(groups)
      .map((g) => ({
        key: g.key,
        utm_source: g.utm_source,
        utm_medium: g.utm_medium,
        utm_campaign: g.utm_campaign,
        visitors: g.visitors.size,
        signups: g.signups.size,
        activations: g.activations.size,
        conversions: g.conversions.size,
        signup_rate:
          g.visitors.size > 0
            ? Math.round((g.signups.size / g.visitors.size) * 10000) / 100
            : 0,
        activation_rate:
          g.signups.size > 0
            ? Math.round((g.activations.size / g.signups.size) * 10000) / 100
            : 0,
        conversion_rate:
          g.signups.size > 0
            ? Math.round((g.conversions.size / g.signups.size) * 10000) / 100
            : 0,
      }))
      .sort((a, b) => b.visitors - a.visitors);

    return NextResponse.json({
      rows,
      group_by: groupBy,
      period: { start: startISO, end: new Date().toISOString(), days },
    });
  } catch (error) {
    console.error("[Attribution API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch attribution data" }, { status: 500 });
  }
}
