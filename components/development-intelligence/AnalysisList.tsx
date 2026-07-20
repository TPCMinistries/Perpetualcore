import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileSearch, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DevelopmentAnalysisRecord } from "@/lib/development-intelligence/store";

const lensLabels: Record<string, string> = {
  enterprise_meeting: "Enterprise meeting",
  interview_coaching: "Interview coaching",
  interviewer_quality: "Interviewer quality",
  leadership_coaching: "Leadership coaching",
};

export function AnalysisList({
  analyses,
}: {
  analyses: DevelopmentAnalysisRecord[];
}) {
  if (analyses.length === 0) {
    return (
      <Card className="border-dashed border-indigo-200 bg-indigo-50/40 shadow-none">
        <CardContent className="flex flex-col items-center px-6 py-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-indigo-700">
            <FileSearch className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-950">Your first report starts with one conversation.</h3>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
            Upload a meeting or interview recording, or paste a transcript. You’ll receive evidence, coaching actions, and commitments ready for human review.
          </p>
          <Button asChild className="mt-5 min-h-11 bg-indigo-600 hover:bg-indigo-700">
            <Link href="#new-analysis"><Sparkles className="mr-2 h-4 w-4" />Create my first report</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {analyses.map((analysis) => (
        <Link
          key={analysis.id}
          href={`/dashboard/development/analyses/${analysis.id}`}
          className="group block cursor-pointer rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          <Card className="border-slate-200 shadow-none transition-colors duration-200 group-hover:border-indigo-300 group-hover:bg-indigo-50/30">
            <CardContent className="flex items-start gap-4 p-5">
              <div
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  analysis.human_review_status === "approved"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {analysis.human_review_status === "approved" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Clock3 className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-950">{analysis.title}</h3>
                  <Badge variant="outline">
                    {lensLabels[analysis.lens] || analysis.lens}
                  </Badge>
                  <Badge
                    className={
                      analysis.human_review_status === "approved"
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                    }
                  >
                    {analysis.human_review_status === "approved"
                      ? "Human approved"
                      : "Review required"}
                  </Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                  {analysis.summary}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {new Date(analysis.occurred_at).toLocaleString()}
                </p>
              </div>
              <ArrowRight className="mt-2 h-5 w-5 shrink-0 text-slate-400 transition-colors duration-200 group-hover:text-indigo-700" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
