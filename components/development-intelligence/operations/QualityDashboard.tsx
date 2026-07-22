import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  FileCheck2,
  Gauge,
  Quote,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type {
  DevelopmentQualitySnapshot,
  QualityDistributionItem,
} from "@/lib/development-intelligence/operations";

export function QualityDashboard({ quality }: { quality: DevelopmentQualitySnapshot }) {
  if (quality.reportCount === 0) {
    return (
      <Card className="border-dashed border-indigo-200 bg-indigo-50/40 shadow-none">
        <CardContent className="flex flex-col items-center px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-indigo-700">
            <BarChart3 className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-950">Quality indicators begin with the first report.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            This page measures process coverage, review completion, and evidence support. It does not claim model accuracy.
          </p>
        </CardContent>
      </Card>
    );
  }

  const averageConfidence = quality.averageConfidence === null
    ? "Not available"
    : `${Math.round(quality.averageConfidence * 100)}%`;

  return (
    <div className="space-y-8">
      <section aria-label="Quality summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Evidence coverage"
          value={`${quality.evidenceCoverageRate}%`}
          detail={`${quality.reportCount} reports sampled`}
          icon={FileCheck2}
          tone="indigo"
        />
        <MetricCard
          label="Evidence traceability"
          value={`${quality.evidenceTraceabilityRate}%`}
          detail={`${quality.evidenceCount} evidence items`}
          icon={Quote}
          tone="emerald"
        />
        <MetricCard
          label="Human review complete"
          value={`${quality.reviewCompletionRate}%`}
          detail={`${quality.reviewedCount} reviewed`}
          icon={CheckCircle2}
          tone="emerald"
        />
        <MetricCard
          label="Mean model support"
          value={averageConfidence}
          detail="Confidence, not accuracy"
          icon={Gauge}
          tone="amber"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <DistributionCard
          title="Human review decisions"
          description="A healthy pilot reviews every report before operational use."
          items={quality.reviewDistribution}
          emptyLabel="No review decisions"
        />
        <DistributionCard
          title="Model support distribution"
          description="Confidence is the model's support for an evidence item—not correctness."
          items={quality.confidenceDistribution}
          emptyLabel="No evidence confidence data"
        />
        <DistributionCard
          title="Use-case coverage"
          description="Shows which coaching lenses are represented in this sample."
          items={quality.lensDistribution}
          emptyLabel="No coaching lenses"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200 shadow-none">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700">
                <BarChart3 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-950">Sample health</h2>
                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div><dt className="text-slate-500">Reports</dt><dd className="mt-1 text-xl font-semibold text-slate-950">{quality.reportCount}</dd></div>
                  <div><dt className="text-slate-500">Evidence per report</dt><dd className="mt-1 text-xl font-semibold text-slate-950">{quality.averageEvidencePerReport}</dd></div>
                  <div><dt className="text-slate-500">Open reviews</dt><dd className="mt-1 text-xl font-semibold text-slate-950">{quality.actionableReviewCount}</dd></div>
                  <div><dt className="text-slate-500">Guardrail flagged</dt><dd className="mt-1 text-xl font-semibold text-slate-950">{quality.guardrailFlaggedReports}</dd></div>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={quality.guardrailFlaggedReports > 0 ? "border-amber-200 bg-amber-50/60 shadow-none" : "border-emerald-200 bg-emerald-50/60 shadow-none"}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className={quality.guardrailFlaggedReports > 0 ? "rounded-xl bg-white p-3 text-amber-700" : "rounded-xl bg-white p-3 text-emerald-700"}>
                {quality.guardrailFlaggedReports > 0 ? <AlertTriangle className="h-5 w-5" aria-hidden="true" /> : <ShieldCheck className="h-5 w-5" aria-hidden="true" />}
              </div>
              <div>
                <h2 className="font-semibold text-slate-950">Guardrail review status</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {quality.guardrailFlaggedReports > 0
                    ? `${quality.guardrailFlaggedReports} report${quality.guardrailFlaggedReports === 1 ? " has" : "s have"} safety flags that require human inspection.`
                    : "No persisted report in this sample contains a safety flag. Human review is still required."}
                </p>
                <p className="mt-3 text-xs leading-5 text-slate-600">
                  A clear flag count is not proof of fairness, validity, or accuracy. Pilot evaluation still needs a qualified, independently labeled benchmark set.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof BarChart3;
  tone: "indigo" | "emerald" | "amber";
}) {
  const toneClass = tone === "emerald"
    ? "bg-emerald-50 text-emerald-700"
    : tone === "amber"
      ? "bg-amber-50 text-amber-700"
      : "bg-indigo-50 text-indigo-700";

  return (
    <Card className="border-slate-200 shadow-none">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`rounded-xl p-3 ${toneClass}`}><Icon className="h-5 w-5" aria-hidden="true" /></div>
        <div>
          <p className="text-2xl font-semibold text-slate-950">{value}</p>
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DistributionCard({
  title,
  description,
  items,
  emptyLabel,
}: {
  title: string;
  description: string;
  items: QualityDistributionItem[];
  emptyLabel: string;
}) {
  return (
    <Card className="border-slate-200 shadow-none">
      <CardContent className="p-6">
        <h2 className="font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 min-h-12 text-sm leading-6 text-slate-600">{description}</p>
        {items.length === 0 ? (
          <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">{emptyLabel}</p>
        ) : (
          <dl className="mt-5 space-y-4">
            {items.map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <dt className="font-medium text-slate-700">{item.label}</dt>
                  <dd className="shrink-0 text-slate-600">{item.count} · {item.percent}%</dd>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${item.label}: ${item.count}, ${item.percent}%`}>
                  <div className="h-full rounded-full bg-indigo-600" style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
