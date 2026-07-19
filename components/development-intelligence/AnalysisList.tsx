import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <FileSearch className="h-6 w-6 text-slate-500" />
          </div>
          <h3 className="font-semibold text-slate-900">No evidence reports yet</h3>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            Start with an authorized enterprise meeting, practice interview, or
            leadership conversation.
          </p>
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
          className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2"
        >
          <Card className="transition-colors group-hover:border-cyan-300">
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
              <ArrowRight className="mt-2 h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-cyan-700" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
