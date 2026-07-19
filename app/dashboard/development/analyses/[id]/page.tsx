import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  Quote,
  ShieldCheck,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HumanReviewPanel } from "@/components/development-intelligence/HumanReviewPanel";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import { getAnalysis } from "@/lib/development-intelligence/store";

export const dynamic = "force-dynamic";

function EvidenceIcon({ level }: { level: string }) {
  if (level === "demonstrated") {
    return <CheckCircle2 className="h-5 w-5 text-emerald-700" />;
  }
  if (level === "emerging") {
    return <Target className="h-5 w-5 text-amber-700" />;
  }
  return <CircleDashed className="h-5 w-5 text-slate-500" />;
}

export default async function DevelopmentAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const identity = await getDevelopmentIdentity();
  if (!identity) notFound();
  const { id } = await params;
  const result = await getAnalysis(identity, id);
  if (!result) notFound();

  const { analysis, evidence, commitments } = result;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/development"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Development Intelligence
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{analysis.lens.replaceAll("_", " ")}</Badge>
              <Badge
                className={
                  analysis.human_review_status === "approved"
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                    : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                }
              >
                {analysis.human_review_status === "approved"
                  ? "Human approved"
                  : "Provisional AI observation"}
              </Badge>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              {analysis.title}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {new Date(analysis.occurred_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            Full transcript not retained; short evidence excerpts are retained
          </div>
        </div>
        <p className="mt-6 max-w-4xl text-base leading-7 text-slate-700">
          {analysis.summary}
        </p>
      </section>

      {analysis.safety_flags.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <h2 className="font-semibold text-amber-950">Additional review required</h2>
              <p className="mt-1 text-sm text-amber-900">
                {analysis.safety_flags
                  .map((flag) => flag.replaceAll("_", " "))
                  .join(" · ")}
              </p>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="evidence">
        <TabsList className="grid h-auto w-full grid-cols-3">
          <TabsTrigger value="evidence" className="min-h-11">
            Evidence ({evidence.length})
          </TabsTrigger>
          <TabsTrigger value="coaching" className="min-h-11">
            Coaching
          </TabsTrigger>
          <TabsTrigger value="commitments" className="min-h-11">
            Commitments ({commitments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evidence" className="mt-5 space-y-4">
          {evidence.map((item, index) => (
            <Card key={`${item.criterionKey}-${index}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <EvidenceIcon level={item.evidenceLevel} />
                  <div>
                    <CardTitle className="text-base">{item.criterionLabel}</CardTitle>
                    <Badge variant="outline" className="mt-2">
                      {item.evidenceLevel.replaceAll("_", " ")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-slate-700">{item.observation}</p>
                <blockquote className="rounded-xl border-l-4 border-cyan-700 bg-cyan-50 px-4 py-3">
                  <div className="flex gap-2">
                    <Quote className="mt-0.5 h-4 w-4 shrink-0 text-cyan-800" />
                    <p className="text-sm italic leading-6 text-cyan-950">
                      “{item.evidenceQuote}”
                    </p>
                  </div>
                  {item.speakerLabel && (
                    <p className="mt-2 text-xs font-medium text-cyan-800">
                      {item.speakerLabel}
                    </p>
                  )}
                </blockquote>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Development action
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {item.developmentalAction}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="coaching" className="mt-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Demonstrated strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysis.strengths.map((strength) => (
                    <li key={strength} className="flex gap-2 text-sm leading-6 text-slate-700">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Growth opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysis.growth_areas.map((area) => (
                    <li key={area} className="flex gap-2 text-sm leading-6 text-slate-700">
                      <Target className="mt-1 h-4 w-4 shrink-0 text-cyan-700" />
                      {area}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          <Card className="mt-5">
            <CardHeader>
              <CardTitle className="text-base">Limitations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm leading-6 text-slate-600">
                {analysis.limitations.map((limitation) => (
                  <li key={limitation}>• {limitation}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commitments" className="mt-5 space-y-3">
          {commitments.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-slate-500">
                No explicit commitments were supported by the transcript.
              </CardContent>
            </Card>
          ) : (
            commitments.map((commitment, index) => (
              <Card key={`${commitment.statement}-${index}`}>
                <CardContent className="p-5">
                  <p className="font-medium text-slate-950">{commitment.statement}</p>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                    <span>Owner: {commitment.ownerLabel || "Not explicitly named"}</span>
                    <span>Due: {commitment.dueDate || "Not explicitly stated"}</span>
                  </div>
                  <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm italic text-slate-600">
                    “{commitment.evidenceQuote}”
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <HumanReviewPanel
        analysisId={analysis.id}
        currentStatus={analysis.human_review_status}
        currentNote={analysis.human_review_note}
      />
    </div>
  );
}
