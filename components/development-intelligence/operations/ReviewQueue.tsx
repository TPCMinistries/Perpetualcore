import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  ConfidenceBand,
  ReviewQueueItem,
} from "@/lib/development-intelligence/operations";

const lensLabels: Record<string, string> = {
  enterprise_meeting: "Team meeting",
  interview_coaching: "Interview coaching",
  interviewer_quality: "Interviewer practice",
  leadership_coaching: "Leadership conversation",
};

const statusStyles: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  needs_revision: "border-orange-200 bg-orange-50 text-orange-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-rose-200 bg-rose-50 text-rose-800",
};

const confidenceStyles: Record<ConfidenceBand, string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  moderate: "border-indigo-200 bg-indigo-50 text-indigo-800",
  low: "border-amber-200 bg-amber-50 text-amber-800",
  none: "border-slate-200 bg-slate-50 text-slate-700",
};

function sentenceCase(value: string): string {
  const words = value.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function confidenceLabel(item: ReviewQueueItem): string {
  if (item.averageConfidence === null) return "No evidence yet";
  return `${sentenceCase(item.confidenceBand)} support · ${Math.round(item.averageConfidence * 100)}%`;
}

export function ReviewQueue({ queue }: { queue: ReviewQueueItem[] }) {
  const actionable = queue.filter((item) => item.actionable);
  const completed = queue.filter((item) => !item.actionable);

  if (queue.length === 0) {
    return (
      <Card className="border-dashed border-indigo-200 bg-indigo-50/40 shadow-none">
        <CardContent className="flex flex-col items-center px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-indigo-700">
            <FileSearch className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-950">Nothing is waiting for review.</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
            New reports appear here after analysis. The source must be authorized before it is submitted.
          </p>
          <Button asChild className="mt-5 min-h-11 bg-indigo-600 hover:bg-indigo-700">
            <Link href="/dashboard/development#new-analysis">Create a report</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="actionable-review-heading">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-700">Action required</p>
            <h2 id="actionable-review-heading" className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Review evidence before it is used
            </h2>
          </div>
          <Badge variant="outline" className="w-fit border-amber-200 bg-amber-50 text-amber-800">
            {actionable.length} {actionable.length === 1 ? "report" : "reports"} open
          </Badge>
        </div>

        {actionable.length === 0 ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-950">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
            <div>
              <p className="font-semibold">The review queue is clear.</p>
              <p className="mt-1 leading-6 text-emerald-800">All recent reports have a recorded human decision.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {actionable.map((item) => (
              <ReviewQueueCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {completed.length > 0 && (
        <section aria-labelledby="completed-review-heading">
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-600">Recent decisions</p>
            <h2 id="completed-review-heading" className="mt-1 text-xl font-semibold text-slate-950">
              Completed human reviews
            </h2>
          </div>
          <div className="space-y-3">
            {completed.slice(0, 12).map((item) => (
              <ReviewQueueCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ReviewQueueCard({ item }: { item: ReviewQueueItem }) {
  return (
    <Card className="border-slate-200 shadow-none">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={statusStyles[item.reviewStatus] || statusStyles.pending}>
                {sentenceCase(item.reviewStatus)}
              </Badge>
              <Badge variant="outline" className={confidenceStyles[item.confidenceBand]}>
                {confidenceLabel(item)}
              </Badge>
              {item.safetyFlags.length > 0 && (
                <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-800">
                  <ShieldAlert className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  Guardrail attention
                </Badge>
              )}
            </div>
            <h3 className="mt-3 truncate text-lg font-semibold text-slate-950">{item.title}</h3>
            <p className="mt-1 text-sm text-slate-600">
              {lensLabels[item.lens] || sentenceCase(item.lens)} · {formatDate(item.occurredAt)} · {item.evidenceCount} evidence {item.evidenceCount === 1 ? "item" : "items"}
            </p>
            {item.reviewNote && (
              <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-600">
                Reviewer note: {item.reviewNote}
              </p>
            )}
          </div>
          <Button asChild variant={item.actionable ? "default" : "outline"} className={item.actionable ? "min-h-11 shrink-0 bg-indigo-600 hover:bg-indigo-700" : "min-h-11 shrink-0"}>
            <Link href={`/dashboard/development/analyses/${item.id}`}>
              {item.actionable ? <ClipboardCheck className="mr-2 h-4 w-4" aria-hidden="true" /> : null}
              {item.actionable ? "Inspect and decide" : "Open report"}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        {item.confidenceBand === "low" && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Low model support is a review priority, not proof that an observation is wrong.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
