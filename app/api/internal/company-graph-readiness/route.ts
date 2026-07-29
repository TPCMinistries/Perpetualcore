import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC_CTA_EVENTS = [
  "home_primary_marketplace",
  "home_primary_contact",
  "home_product_open",
  "home_operated_system_open",
  "home_engagement_open",
  "marketplace_product_open",
  "marketplace_contact_intent",
  "product_live_surface_open",
  "contact_sales_submit_success",
  "newsletter_submit_success",
  "case_study_contact",
];

function authorized(request: Request): boolean {
  const expected = process.env.PERPETUAL_CORE_COMPANY_GRAPH_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !supplied) return false;

  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return (
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}

function previousCompletedHour(now: Date): { start: Date; end: Date } {
  const end = new Date(now);
  end.setUTCMinutes(0, 0, 0);
  return {
    start: new Date(end.getTime() - 60 * 60 * 1000),
    end,
  };
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const startedAt = performance.now();
  const checkedAt = new Date();
  const window = previousCompletedHour(checkedAt);
  const from = window.start.toISOString();
  const to = window.end.toISOString();
  const supabase = createAdminClient();
  let queryErrorCount = 0;

  const count = async (
    table: "analytics_events" | "sales_contacts" | "enterprise_demo_requests",
    configure?: (
      query: ReturnType<typeof supabase.from>
    ) => ReturnType<typeof supabase.from>
  ): Promise<number | null> => {
    let query = supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .gte("created_at", from)
      .lt("created_at", to);
    if (configure) query = configure(query);
    const { count: result, error } = await query;
    if (error) {
      queryErrorCount += 1;
      return null;
    }
    return result ?? 0;
  };

  const [
    pageViews,
    ctaClicks,
    signups,
    salesInquiries,
    demoRequests,
  ] = await Promise.all([
    count("analytics_events", (query) =>
      query.eq("event_type", "page_view").eq("event_name", "public_page_view")
    ),
    count("analytics_events", (query) =>
      query.eq("event_type", "cta_click").in("event_name", PUBLIC_CTA_EVENTS)
    ),
    count("analytics_events", (query) => query.eq("event_type", "signup")),
    count("sales_contacts"),
    count("enterprise_demo_requests"),
  ]);

  const responseMs = Math.round(performance.now() - startedAt);
  const dbReachable = queryErrorCount < 5;

  return NextResponse.json(
    {
      schemaVersion: 1,
      checkedAt: checkedAt.toISOString(),
      windowStart: from,
      windowEnd: to,
      health: {
        status: queryErrorCount === 0 ? "healthy" : dbReachable ? "degraded" : "unknown",
        dbReachable,
        responseMs,
        queryErrorCount,
      },
      conversions: {
        pageViews,
        ctaClicks,
        signups,
        salesInquiries,
        demoRequests,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
