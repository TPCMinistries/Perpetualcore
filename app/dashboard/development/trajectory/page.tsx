import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDashed,
  Eye,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DevelopmentNav } from "@/components/development-intelligence/DevelopmentNav";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import {
  getDevelopmentTrajectory,
  type DevelopmentTrajectoryMetric,
} from "@/lib/development-intelligence/store";

export const dynamic = "force-dynamic";

const lensLabels: Record<string, string> = {
  enterprise_meeting: "Team meeting",
  interview_coaching: "Interview coaching",
  interviewer_quality: "Interviewer practice",
  leadership_coaching: "Leadership conversation",
};

const directionStyles: Record<
  DevelopmentTrajectoryMetric["direction"],
  { label: string; className: string }
> = {
  improving: {
    label: "Improving",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  steady: {
    label: "Steady",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  },
  watch: {
    label: "Coach next",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  new: {
    label: "New signal",
    className: "border-indigo-200 bg-indigo-50 text-indigo-800",
  },
};

function formatLevel(level: string) {
  return level.replaceAll("_", " ");
}

export default async function DevelopmentTrajectoryPage() {
  const identity = await getDevelopmentIdentity();
  if (!identity) notFound();

  const trajectory = await getDevelopmentTrajectory(identity);
  const improving = trajectory.metrics.filter(
    (metric) => metric.direction === "improving"
  ).length;
  const coachingNext = trajectory.metrics.filter(
    (metric) => metric.direction === "watch" || metric.currentLevel === "emerging"
  ).length;

  return (
    <div className="space-y-8 pb-12">
      <DevelopmentNav />
      <Link
        href="/dashboard/development"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Development Intelligence
      </Link>

      <section className="overflow-hidden rounded-[28px] border border-indigo-200 bg-[#f5f3ff] p-6 sm:p-9">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Badge className="border border-indigo-200 bg-white text-indigo-800 hover:bg-white">
              <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
              Longitudinal development
            </Badge>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-[#1e1b4b] sm:text-4xl">
              See what is changing across conversations.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
              This trajectory compares observable evidence across your organization&apos;s reports. It shows recurring strengths, coaching priorities, and movement over time—never personality or integrity scores.
            </p>
          </div>
          <Button asChild size="lg" className="min-h-12 bg-indigo-600 hover:bg-indigo-700">
            <Link href="/dashboard/development#new-analysis">
              Analyze another conversation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {trajectory.reportCount === 0 ? (
        <Card className="border-dashed border-indigo-200 bg-indigo-50/40 shadow-none">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-indigo-700">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-950">Your trajectory begins with the first report.</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
              After two or more conversations use the same coaching lens, Development Intelligence can show movement in the evidence.
            </p>
            <Button asChild className="mt-5 min-h-11 bg-indigo-600 hover:bg-indigo-700">
              <Link href="/dashboard/development#new-analysis">
                <Sparkles className="mr-2 h-4 w-4" />
                Create the first report
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <section aria-label="Trajectory summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Reports compared", value: trajectory.reportCount, icon: BarChart3, tone: "indigo" },
              { label: "Human approved", value: trajectory.approvedCount, icon: CheckCircle2, tone: "emerald" },
              { label: "Signals improving", value: improving, icon: TrendingUp, tone: "emerald" },
              { label: "Coach next", value: coachingNext, icon: Target, tone: "amber" },
            ].map((item) => (
              <Card key={item.label} className="border-slate-200 shadow-none">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`rounded-xl p-3 ${item.tone === "amber" ? "bg-amber-50 text-amber-700" : item.tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div><p className="text-2xl font-semibold text-slate-950">{item.value}</p><p className="text-sm text-slate-600">{item.label}</p></div>
                </CardContent>
              </Card>
            ))}
          </section>

          <section>
            <div className="mb-5 max-w-3xl">
              <p className="text-sm font-semibold text-indigo-700">Development signals</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">What the evidence is doing over time</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">A direction appears after the same criterion is observed in more than one report. Open any report to inspect the underlying quotes.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {trajectory.metrics.map((metric) => {
                const direction = directionStyles[metric.direction];
                const demonstratedPercent = Math.round((metric.demonstratedCount / metric.observations) * 100);
                return (
                  <Card key={metric.key} className="border-slate-200 shadow-none">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{lensLabels[metric.lens] || formatLevel(metric.lens)}</p>
                          <h3 className="mt-2 font-semibold text-slate-950">{metric.label}</h3>
                        </div>
                        <Badge variant="outline" className={direction.className}>{direction.label}</Badge>
                      </div>
                      <div className="mt-5">
                        <div className="mb-2 flex justify-between text-xs text-slate-500"><span>Demonstrated evidence</span><span>{demonstratedPercent}% across {metric.observations} observations</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${metric.label}: ${demonstratedPercent}% demonstrated evidence`}>
                          <div className="h-full rounded-full bg-indigo-600" style={{ width: `${demonstratedPercent}%` }} />
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Current: {formatLevel(metric.currentLevel)}</span>
                        {metric.previousLevel && <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Previous: {formatLevel(metric.previousLevel)}</span>}
                      </div>
                      <div className="mt-4 rounded-xl bg-indigo-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Recommended next action</p>
                        <p className="mt-1 text-sm leading-6 text-indigo-950">{metric.latestAction}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-5">
              <p className="text-sm font-semibold text-indigo-700">Conversation history</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Reports included in this trajectory</h2>
            </div>
            <div className="space-y-3">
              {trajectory.sessions.map((session) => (
                <Link key={session.id} href={`/dashboard/development/analyses/${session.id}`} className="group flex min-h-20 cursor-pointer flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors duration-200 hover:border-indigo-300 hover:bg-indigo-50/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-indigo-50 p-2.5 text-indigo-700"><Eye className="h-5 w-5" /></div>
                    <div><p className="font-semibold text-slate-950">{session.title}</p><p className="mt-1 text-sm text-slate-500">{lensLabels[session.lens] || formatLevel(session.lens)} · {new Date(session.occurredAt).toLocaleDateString()}</p></div>
                  </div>
                  <div className="flex items-center gap-3 pl-12 sm:pl-0"><Badge variant="outline">{session.evidenceCount} signals</Badge><span className="text-sm font-medium text-indigo-700">{session.demonstratedPercent}% demonstrated</span><ArrowRight className="h-4 w-4 text-slate-400 transition-colors group-hover:text-indigo-700" /></div>
                </Link>
              ))}
            </div>
          </section>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
            This view compares organization-level evidence by coaching lens. Individual development profiles will only appear after a person is explicitly linked with longitudinal consent.
          </div>
        </>
      )}
    </div>
  );
}
