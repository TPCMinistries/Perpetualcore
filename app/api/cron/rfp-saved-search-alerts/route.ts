import { NextRequest, NextResponse } from "next/server";
import { runSavedSearchAlerts } from "@/lib/rfp/saved-search-alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runSavedSearchAlerts();
    if (result.skipped.resend_not_configured > 0) {
      return NextResponse.json(
        { error: "resend_not_configured", ...result },
        { status: 503 },
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown";
    return NextResponse.json(
      { error: "saved_search_alerts_failed", detail: detail.slice(0, 200) },
      { status: 500 },
    );
  }
}
