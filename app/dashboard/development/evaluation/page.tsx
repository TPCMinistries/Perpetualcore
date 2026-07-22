import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  ClipboardCheck,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DevelopmentNav } from "@/components/development-intelligence/DevelopmentNav";
import { QualityDashboard } from "@/components/development-intelligence/operations/QualityDashboard";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import {
  getDevelopmentOperations,
  type DevelopmentQualitySnapshot,
} from "@/lib/development-intelligence/operations";

export const dynamic = "force-dynamic";

const emptyQuality: DevelopmentQualitySnapshot = {
  reportCount: 0,
  evidenceCount: 0,
  evidenceCoverageRate: 0,
  evidenceTraceabilityRate: 0,
  averageEvidencePerReport: 0,
  averageConfidence: null,
  reviewCompletionRate: 0,
  reviewedCount: 0,
  guardrailFlaggedReports: 0,
  actionableReviewCount: 0,
  confidenceDistribution: [],
  reviewDistribution: [],
  lensDistribution: [],
};

export default async function DevelopmentEvaluationPage() {
  const identity = await getDevelopmentIdentity();
  if (!identity) notFound();

  let quality = emptyQuality;
  let databaseReady = true;
  try {
    quality = (await getDevelopmentOperations(identity)).quality;
  } catch {
    databaseReady = false;
  }

  return (
    <div className="space-y-8 pb-12">
      <DevelopmentNav />
      <Link
        href="/dashboard/development"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Development Intelligence
      </Link>

      <section className="overflow-hidden rounded-[28px] border border-indigo-200 bg-[#f5f3ff] p-6 sm:p-9">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Badge className="border border-indigo-200 bg-white text-indigo-800 hover:bg-white">
              <FlaskConical className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Pilot quality indicators
            </Badge>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-[#1e1b4b] sm:text-4xl">
              Measure whether the process is inspectable and governed.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
              Track evidence coverage, traceability, model-support distribution, human review completion, and guardrail flags. These operational indicators do not establish model accuracy or validity.
            </p>
          </div>
          <Button asChild size="lg" className="min-h-12 bg-indigo-600 hover:bg-indigo-700">
            <Link href="/dashboard/development/review">
              <ClipboardCheck className="mr-2 h-4 w-4" aria-hidden="true" />
              Open review queue
            </Link>
          </Button>
        </div>
      </section>

      {!databaseReady && (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Quality indicators are temporarily unavailable. No reports or review decisions were changed.
        </div>
      )}

      {databaseReady && <QualityDashboard quality={quality} />}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700"><BarChart3 className="h-5 w-5" aria-hidden="true" /> What this page can establish</div>
            <p className="mt-3 text-sm leading-6 text-slate-600">Whether recent reports contain evidence, quotes are present, review decisions are recorded, confidence values are distributed as expected, and safety flags are reaching human reviewers.</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-700"><ShieldCheck className="h-5 w-5" aria-hidden="true" /> What still requires a formal evaluation</div>
            <p className="mt-3 text-sm leading-6 text-slate-600">Accuracy, inter-rater agreement, subgroup performance, construct validity, and outcome impact require a consented benchmark set with independent expert labels. This dashboard intentionally makes no claim about them.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
