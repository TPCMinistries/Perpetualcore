import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileCheck2,
  MessageSquareQuote,
  Quote,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HumanReviewPanel } from "@/components/development-intelligence/HumanReviewPanel";
import { ReportActions } from "@/components/development-intelligence/ReportActions";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import { getAnalysis } from "@/lib/development-intelligence/store";

export const dynamic = "force-dynamic";

const lensLabels: Record<string, string> = {
  enterprise_meeting: "Team meeting",
  interview_coaching: "Interview coaching",
  interviewer_quality: "Interviewer practice",
  leadership_coaching: "Leadership conversation",
};

function EvidenceIcon({ level }: { level: string }) {
  if (level === "demonstrated") return <CheckCircle2 className="h-5 w-5 text-emerald-700" />;
  if (level === "emerging") return <Target className="h-5 w-5 text-amber-700" />;
  return <CircleDashed className="h-5 w-5 text-slate-500" />;
}

function levelStyle(level: string) {
  if (level === "demonstrated") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (level === "emerging") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default async function DevelopmentAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const identity = await getDevelopmentIdentity();
  if (!identity) notFound();
  const { id } = await params;
  const result = await getAnalysis(identity, id);
  if (!result) notFound();

  const { analysis, evidence, commitments } = result;
  const demonstrated = evidence.filter((item) => item.evidenceLevel === "demonstrated").length;
  const emerging = evidence.filter((item) => item.evidenceLevel === "emerging").length;
  const demonstratedPercent = evidence.length ? Math.round((demonstrated / evidence.length) * 100) : 0;
  const reviewApproved = analysis.human_review_status === "approved";

  return (
    <div className="space-y-7 pb-12 print:space-y-4">
      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <Link href="/dashboard/development" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">
          <ArrowLeft className="h-4 w-4" /> Development Intelligence
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/dashboard/development/trajectory"><TrendingUp className="mr-2 h-4 w-4" />View trajectory</Link>
          </Button>
          <ReportActions />
        </div>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-indigo-200 bg-[#f5f3ff] p-6 sm:p-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border border-indigo-200 bg-white text-indigo-800 hover:bg-white">Evidence report</Badge>
              <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-800">{lensLabels[analysis.lens] || analysis.lens.replaceAll("_", " ")}</Badge>
              <Badge className={reviewApproved ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-amber-100 text-amber-800 hover:bg-amber-100"}>{reviewApproved ? "Human approved" : "Review required"}</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#1e1b4b] sm:text-4xl">{analysis.title}</h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{new Date(analysis.occurred_at).toLocaleDateString(undefined, { dateStyle: "long" })}</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{new Date(analysis.occurred_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
            </div>
          </div>
          <div className="flex max-w-md items-start gap-3 rounded-xl border border-emerald-200 bg-white/80 px-4 py-3 text-sm leading-6 text-emerald-950">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            The report retains short evidence excerpts, not the full recording or transcript.
          </div>
        </div>

        <div className="mt-8 border-t border-indigo-200 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Executive readout</p>
          <p className="mt-3 max-w-4xl text-lg leading-8 text-indigo-950">{analysis.summary}</p>
        </div>
      </section>

      <section aria-label="Report summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Evidence signals", value: evidence.length, detail: `${demonstratedPercent}% demonstrated`, icon: MessageSquareQuote, tone: "indigo" },
          { label: "Demonstrated", value: demonstrated, detail: "Observed strengths", icon: CheckCircle2, tone: "emerald" },
          { label: "Coach next", value: emerging, detail: "Emerging evidence", icon: Target, tone: "amber" },
          { label: "Commitments", value: commitments.length, detail: "Explicitly supported", icon: FileCheck2, tone: "indigo" },
        ].map((item) => (
          <Card key={item.label} className="border-slate-200 shadow-none">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-xl p-3 ${item.tone === "emerald" ? "bg-emerald-50 text-emerald-700" : item.tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"}`}><item.icon className="h-5 w-5" /></div>
              <div><p className="text-2xl font-semibold text-slate-950">{item.value}</p><p className="text-sm font-medium text-slate-700">{item.label}</p><p className="text-xs text-slate-500">{item.detail}</p></div>
            </CardContent>
          </Card>
        ))}
      </section>

      {analysis.safety_flags.length > 0 && (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><h2 className="font-semibold text-amber-950">Additional review required</h2><p className="mt-1 text-sm text-amber-900">{analysis.safety_flags.map((flag) => flag.replaceAll("_", " ")).join(" · ")}</p></div></div>
        </div>
      )}

      <Tabs defaultValue="coaching" className="print:hidden">
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl bg-slate-100 p-1">
          <TabsTrigger value="coaching" className="min-h-11">Coaching plan</TabsTrigger>
          <TabsTrigger value="evidence" className="min-h-11">Evidence ({evidence.length})</TabsTrigger>
          <TabsTrigger value="commitments" className="min-h-11">Commitments ({commitments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="coaching" className="mt-5 space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="border-emerald-200 bg-emerald-50/40 shadow-none"><CardContent className="p-6"><div className="flex items-center gap-2 font-semibold text-emerald-950"><CheckCircle2 className="h-5 w-5 text-emerald-700" />What was demonstrated</div><ul className="mt-4 space-y-3">{analysis.strengths.map((strength) => <li key={strength} className="flex gap-2 text-sm leading-6 text-emerald-950"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />{strength}</li>)}</ul></CardContent></Card>
            <Card className="border-amber-200 bg-amber-50/40 shadow-none"><CardContent className="p-6"><div className="flex items-center gap-2 font-semibold text-amber-950"><Target className="h-5 w-5 text-amber-700" />What to coach next</div><ul className="mt-4 space-y-3">{analysis.growth_areas.map((area) => <li key={area} className="flex gap-2 text-sm leading-6 text-amber-950"><ArrowRight className="mt-1 h-4 w-4 shrink-0 text-amber-700" />{area}</li>)}</ul></CardContent></Card>
          </div>
          <Card className="border-indigo-200 bg-indigo-50/40 shadow-none"><CardContent className="p-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">Recommended coaching actions</p><div className="mt-4 grid gap-3 md:grid-cols-2">{evidence.filter((item) => item.evidenceLevel !== "not_observed").map((item, index) => <div key={`${item.criterionKey}-${index}`} className="rounded-xl border border-indigo-100 bg-white p-4"><p className="text-sm font-semibold text-indigo-950">{item.criterionLabel}</p><p className="mt-2 text-sm leading-6 text-slate-700">{item.developmentalAction}</p></div>)}</div></CardContent></Card>
          {analysis.limitations.length > 0 && <Card className="border-slate-200 shadow-none"><CardContent className="p-6"><p className="text-sm font-semibold text-slate-950">What this report cannot establish</p><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">{analysis.limitations.map((limitation) => <li key={limitation} className="flex gap-2"><CircleDashed className="mt-1 h-4 w-4 shrink-0" />{limitation}</li>)}</ul></CardContent></Card>}
        </TabsContent>

        <TabsContent value="evidence" className="mt-5 space-y-4">
          {evidence.map((item, index) => (
            <Card key={`${item.criterionKey}-${index}`} className="border-slate-200 shadow-none"><CardContent className="p-6"><div className="flex flex-col gap-5 md:flex-row md:items-start"><div className="flex flex-1 items-start gap-3"><EvidenceIcon level={item.evidenceLevel} /><div><h3 className="font-semibold text-slate-950">{item.criterionLabel}</h3><Badge variant="outline" className={`mt-2 ${levelStyle(item.evidenceLevel)}`}>{item.evidenceLevel.replaceAll("_", " ")}</Badge><p className="mt-4 text-sm leading-6 text-slate-700">{item.observation}</p></div></div><blockquote className="md:w-[42%] rounded-xl border-l-4 border-indigo-500 bg-indigo-50 px-4 py-3"><div className="flex gap-2"><Quote className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" /><p className="text-sm italic leading-6 text-indigo-950">“{item.evidenceQuote}”</p></div>{item.speakerLabel && <p className="mt-2 text-xs font-medium text-indigo-700">{item.speakerLabel}</p>}</blockquote></div><div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Development action</p><p className="mt-1 text-sm leading-6 text-slate-700">{item.developmentalAction}</p></div></CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="commitments" className="mt-5 space-y-3">
          {commitments.length === 0 ? <Card className="border-dashed shadow-none"><CardContent className="py-12 text-center"><FileCheck2 className="mx-auto h-7 w-7 text-slate-400" /><p className="mt-3 text-sm font-medium text-slate-700">No explicit commitments were supported by the source.</p></CardContent></Card> : commitments.map((commitment, index) => <Card key={`${commitment.statement}-${index}`} className="border-slate-200 shadow-none"><CardContent className="p-6"><div className="flex items-start gap-3"><div className="rounded-full bg-indigo-50 p-2 text-indigo-700"><FileCheck2 className="h-4 w-4" /></div><div className="flex-1"><p className="font-semibold text-slate-950">{commitment.statement}</p><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500"><span>Owner: {commitment.ownerLabel || "Not explicitly named"}</span><span>Due: {commitment.dueDate || "Not explicitly stated"}</span></div><p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm italic leading-6 text-slate-600">“{commitment.evidenceQuote}”</p></div></div></CardContent></Card>)}
        </TabsContent>
      </Tabs>

      <div className="hidden print:block">
        <h2 className="text-xl font-semibold">Evidence and coaching actions</h2>
        <div className="mt-4 space-y-4">{evidence.map((item, index) => <div key={`${item.criterionKey}-print-${index}`} className="border-b border-slate-200 pb-4"><p className="font-semibold">{item.criterionLabel} · {item.evidenceLevel.replaceAll("_", " ")}</p><p className="mt-1 text-sm">{item.observation}</p><p className="mt-2 text-sm italic">“{item.evidenceQuote}”</p><p className="mt-2 text-sm"><strong>Next action:</strong> {item.developmentalAction}</p></div>)}</div>
      </div>

      <HumanReviewPanel analysisId={analysis.id} currentStatus={analysis.human_review_status} currentNote={analysis.human_review_note} />
    </div>
  );
}
