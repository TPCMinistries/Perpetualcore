import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileCheck2,
  MessageSquareQuote,
  PlayCircle,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnalysisComposer } from "@/components/development-intelligence/AnalysisComposer";
import { AnalysisList } from "@/components/development-intelligence/AnalysisList";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import { listAnalyses } from "@/lib/development-intelligence/store";
import type { DevelopmentAnalysisRecord } from "@/lib/development-intelligence/store";

export const dynamic = "force-dynamic";

const outcomeCards = [
  {
    title: "See what actually happened",
    description: "Every observation links back to a short, exact excerpt—not a vague AI judgment.",
    icon: MessageSquareQuote,
  },
  {
    title: "Know what to coach next",
    description: "Turn evidence into specific developmental actions for people, teams, and leaders.",
    icon: Target,
  },
  {
    title: "Track commitments",
    description: "Surface who committed to what, when it is due, and where the commitment was made.",
    icon: FileCheck2,
  },
];

export default async function DevelopmentIntelligencePage() {
  const identity = await getDevelopmentIdentity();
  let analyses: DevelopmentAnalysisRecord[] = [];
  let databaseReady = true;

  if (identity) {
    try {
      analyses = await listAnalyses(identity, { limit: 12 });
    } catch {
      databaseReady = false;
    }
  }

  const approved = analyses.filter((analysis) => analysis.human_review_status === "approved").length;
  const awaitingReview = analyses.filter((analysis) => analysis.human_review_status === "pending").length;
  const activeLenses = new Set(analyses.map((analysis) => analysis.lens)).size;

  return (
    <div className="space-y-10 pb-12">
      <section className="relative overflow-hidden rounded-[28px] border border-indigo-200 bg-[#f5f3ff] px-6 py-8 sm:px-10 sm:py-12 lg:px-12">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border-[48px] border-indigo-100/80" aria-hidden="true" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <Badge className="border border-indigo-200 bg-white text-indigo-800 hover:bg-white">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Perpetual Core Development Intelligence
            </Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.035em] text-[#1e1b4b] sm:text-5xl lg:text-[56px] lg:leading-[1.06]">
              Understand what happened. Decide what to coach next.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
              Upload an authorized meeting or interview. Get an evidence-linked report showing strengths, growth opportunities, and commitments—with human review built in.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-h-12 bg-indigo-600 px-6 text-base hover:bg-indigo-700">
                <Link href="#new-analysis">
                  Analyze a conversation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-h-12 border-indigo-200 bg-white px-6 text-base text-indigo-950 hover:bg-indigo-50">
                <Link href="#report-preview">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  See what the report includes
                </Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Audio, video, or transcript</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Evidence, not personality scoring</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Human approval required</span>
            </div>
          </div>

          <div id="report-preview" className="relative scroll-mt-28 rounded-2xl border border-indigo-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Example report</p>
                <h2 className="mt-1 font-semibold text-slate-950">Weekly leadership meeting</h2>
              </div>
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Review required</Badge>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Demonstrated</p>
                <p className="mt-2 text-sm font-medium text-emerald-950">Clear ownership</p>
                <p className="mt-1 text-xs leading-5 text-emerald-800">A decision had a named owner and next step.</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Coach next</p>
                <p className="mt-2 text-sm font-medium text-amber-950">Confirm the deadline</p>
                <p className="mt-1 text-xs leading-5 text-amber-800">The owner was clear; the due date was not.</p>
              </div>
            </div>
            <blockquote className="mt-3 rounded-xl border-l-4 border-indigo-500 bg-indigo-50 px-4 py-3 text-sm leading-6 text-indigo-950">
              “I’ll own the revised plan and bring it back to the team.”
            </blockquote>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Observation linked to exact evidence · pending human approval
            </div>
          </div>
        </div>
      </section>

      {!databaseReady && (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Reports are temporarily unavailable. Your source material has not been submitted. Please try again shortly.
        </div>
      )}

      {analyses.length > 0 && (
        <section aria-label="Development Intelligence activity" className="grid gap-3 sm:grid-cols-3">
          <Card className="border-slate-200 shadow-none"><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-indigo-50 p-3 text-indigo-700"><BarChart3 className="h-5 w-5" /></div><div><p className="text-2xl font-semibold text-slate-950">{analyses.length}</p><p className="text-sm text-slate-600">Recent reports</p></div></CardContent></Card>
          <Card className="border-slate-200 shadow-none"><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-amber-50 p-3 text-amber-700"><ScanSearch className="h-5 w-5" /></div><div><p className="text-2xl font-semibold text-slate-950">{awaitingReview}</p><p className="text-sm text-slate-600">Awaiting review</p></div></CardContent></Card>
          <Card className="border-slate-200 shadow-none"><CardContent className="flex items-center gap-4 p-5"><div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><Users className="h-5 w-5" /></div><div><p className="text-2xl font-semibold text-slate-950">{approved}</p><p className="text-sm text-slate-600">Approved · {activeLenses} {activeLenses === 1 ? "lens" : "lenses"}</p></div></CardContent></Card>
        </section>
      )}

      <section>
        <div className="mb-5 max-w-2xl">
          <p className="text-sm font-semibold text-indigo-700">What you get</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">A report people can inspect—not a black-box score.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {outcomeCards.map((item) => (
            <Card key={item.title} className="border-slate-200 shadow-none">
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><item.icon className="h-5 w-5" /></div>
                <h3 className="mt-4 font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="new-analysis" className="scroll-mt-24">
        <AnalysisComposer />
      </section>

      <section id="reports" className="scroll-mt-24">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-700">Your reports</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Review evidence and approve what is usable.</h2>
            <p className="mt-2 text-sm text-slate-600">AI findings stay provisional until a qualified person reviews them.</p>
          </div>
          {analyses.length > 0 && (
            <Button asChild variant="outline" className="min-h-11 w-fit border-indigo-200 text-indigo-800 hover:bg-indigo-50">
              <Link href="/dashboard/development/trajectory">
                <TrendingUp className="mr-2 h-4 w-4" />
                View development trajectory
              </Link>
            </Button>
          )}
        </div>
        <AnalysisList analyses={analyses} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><ShieldCheck className="h-5 w-5" /> Built for responsible development</div>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Evidence for coaching—not surveillance.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Development Intelligence does not produce lie-detection, integrity, diagnosis, emotion, accent, protected-trait, or automatic employment scores. Raw uploads live only in a short-lived private staging vault and are removed after processing.</p>
          </div>
          <Button asChild variant="outline" className="min-h-11"><Link href="#new-analysis">Create a report <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </section>
    </div>
  );
}
