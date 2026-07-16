import { NextRequest, NextResponse } from "next/server";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import { analyticsPeriodSchema } from "@/lib/press/schemas";
import { requireProject } from "@/lib/press/service";

interface ProviderSummary { events: number; metrics: Record<string, number> }
interface DailySummary { date: string; metrics: Record<string, number> }

export async function GET(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const project = await requireProject((await params).projectId);
    const days = analyticsPeriodSchema.parse(request.nextUrl.searchParams.get("days") ?? undefined);
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    const admin = createPressAdminClient();
    const [eventsResult, publicationCountResult] = await Promise.all([
      admin.from("press_analytics_events").select("provider, metric, value, observed_at")
        .eq("project_id", project.id).eq("organization_id", project.organization_id)
        .gte("observed_at", from.toISOString()).lte("observed_at", to.toISOString())
        .order("observed_at", { ascending: true }),
      admin.from("press_publications").select("id", { count: "exact", head: true })
        .eq("project_id", project.id).eq("organization_id", project.organization_id)
        .gte("created_at", from.toISOString()).lte("created_at", to.toISOString()),
    ]);
    if (eventsResult.error) throw eventsResult.error;
    if (publicationCountResult.error) throw publicationCountResult.error;

    const byMetric: Record<string, number> = {};
    const byProvider: Record<string, ProviderSummary> = {};
    const dailyMap = new Map<string, DailySummary>();
    for (const event of eventsResult.data ?? []) {
      const metric = String(event.metric);
      const provider = String(event.provider);
      const value = Number(event.value);
      if (!Number.isFinite(value)) continue;
      byMetric[metric] = (byMetric[metric] ?? 0) + value;
      const providerSummary = byProvider[provider] ?? { events: 0, metrics: {} };
      providerSummary.events += 1;
      providerSummary.metrics[metric] = (providerSummary.metrics[metric] ?? 0) + value;
      byProvider[provider] = providerSummary;
      const date = String(event.observed_at).slice(0, 10);
      const day = dailyMap.get(date) ?? { date, metrics: {} };
      day.metrics[metric] = (day.metrics[metric] ?? 0) + value;
      dailyMap.set(date, day);
    }
    const publications = publicationCountResult.count ?? 0;
    const engagements = ["like", "comment", "share", "save", "click"]
      .reduce((sum, metric) => sum + (byMetric[metric] ?? 0), 0);
    return NextResponse.json({
      summary: {
        period: { days, from: from.toISOString(), to: to.toISOString() },
        totals: {
          events: eventsResult.data?.length ?? 0,
          publications,
          impressions: byMetric.impression ?? 0,
          views: byMetric.view ?? 0,
          engagements,
          watchTimeMs: byMetric.watch_time_ms ?? 0,
        },
        byMetric,
        byProvider,
        daily: [...dailyMap.values()],
        publicationCount: publications,
      },
    });
  } catch (error) { return pressErrorResponse(error); }
}
