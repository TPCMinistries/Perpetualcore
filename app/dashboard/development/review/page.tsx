import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Quote,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DevelopmentNav } from "@/components/development-intelligence/DevelopmentNav";
import { ReviewQueue } from "@/components/development-intelligence/operations/ReviewQueue";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import {
  getDevelopmentOperations,
  type DevelopmentOperationsSnapshot,
} from "@/lib/development-intelligence/operations";

export const dynamic = "force-dynamic";

const emptySnapshot: DevelopmentOperationsSnapshot = {
  queue: [],
  quality: {
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
  },
};

export default async function DevelopmentReviewPage() {
  const identity = await getDevelopmentIdentity();
  if (!identity) notFound();

  let snapshot = emptySnapshot;
  let databaseReady = true;
  try {
    snapshot = await getDevelopmentOperations(identity);
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
        <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Badge className="border border-indigo-200 bg-white text-indigo-800 hover:bg-white">
              <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Human review workspace
            </Badge>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-[#1e1b4b] sm:text-4xl">
              Inspect the evidence. Record the human decision.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
              Every AI-generated finding stays provisional until an authorized reviewer checks the source evidence, scope, limitations, and prohibited-inference guardrails.
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-white p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">{snapshot.quality.actionableReviewCount} open reviews</p>
            <p className="mt-1">{snapshot.quality.reviewCompletionRate}% of recent reports reviewed</p>
          </div>
        </div>
      </section>

      {!databaseReady && (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          The review queue is temporarily unavailable. No review decision was changed. Please try again shortly.
        </div>
      )}

      <section aria-labelledby="review-guidance-heading" className="grid gap-3 md:grid-cols-3">
        {[
          { title: "1. Inspect the quote", description: "Confirm each observation is supported by the exact excerpt and, for media, its timestamp.", icon: Quote },
          { title: "2. Check the boundary", description: "Remove personality, integrity, emotion, diagnosis, protected-trait, or employment-decision inference.", icon: ShieldCheck },
          { title: "3. Record the decision", description: "Approve, request a documented revision, or reject the report. Never approve by default.", icon: CheckCircle2 },
        ].map((item) => (
          <Card key={item.title} className="border-slate-200 shadow-none">
            <CardContent className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><item.icon className="h-5 w-5" aria-hidden="true" /></div>
              <h2 id={item.title.startsWith("1.") ? "review-guidance-heading" : undefined} className="mt-4 font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {databaseReady && <ReviewQueue queue={snapshot.queue} />}

      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        <Eye className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
        Review status is process evidence, not proof that a report is objectively correct. High-stakes pilots need independent labels, disagreement tracking, and periodic bias and validity review.
      </div>
    </div>
  );
}
