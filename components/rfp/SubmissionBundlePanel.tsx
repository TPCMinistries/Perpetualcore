import {
  ClipboardCheck,
  Download,
  FileJson,
  FileText,
  History,
  ShieldCheck,
  Table,
} from "lucide-react";
import type {
  ComplianceMatrixArtifact,
  PacketChecklistArtifact,
} from "@/lib/rfp/compliance/types";
import type { ReviewerResult } from "@/lib/rfp/review/rubric";
import {
  buildSubmitReadinessGate,
  type SubmitGateStatus,
} from "@/lib/rfp/submission/readiness-gate";
import type { SubmissionTaskRow } from "@/lib/rfp/submission/tasks";

interface SubmissionBundlePanelProps {
  proposalId: string;
  complianceMatrix: ComplianceMatrixArtifact | null;
  packetChecklist: PacketChecklistArtifact | null;
  reviewerResult: ReviewerResult | null;
  verifyMarkerCount: number;
  sectionCount: number;
  tasks: SubmissionTaskRow[];
}

const STATUS_CLASS: Record<SubmitGateStatus, string> = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  not_ready: "border-amber-200 bg-amber-50 text-amber-700",
  not_run: "border-zinc-300 bg-zinc-100 text-zinc-700",
};

export function SubmissionBundlePanel({
  proposalId,
  complianceMatrix,
  packetChecklist,
  reviewerResult,
  verifyMarkerCount,
  sectionCount,
  tasks,
}: SubmissionBundlePanelProps) {
  const gate = buildSubmitReadinessGate({
    sectionCount,
    verifyMarkerCount,
    complianceMatrix,
    packetChecklist,
    reviewerResult,
    tasks,
  });
  const bundleItems = [
    {
      label: "Proposal DOCX",
      detail: "Narrative sections with readiness appendix.",
      href: `/api/rfp/proposals/${proposalId}/export/docx`,
      icon: FileText,
    },
    {
      label: "Compliance CSV",
      detail: "Requirement matrix with owners and source excerpts.",
      href: `/api/rfp/proposals/${proposalId}/export/compliance-csv`,
      icon: ShieldCheck,
    },
    {
      label: "Packet CSV",
      detail: "Forms, attachments, portal path, and submission metadata.",
      href: `/api/rfp/proposals/${proposalId}/export/packet-csv`,
      icon: Table,
    },
    {
      label: "Manifest CSV",
      detail: "Closeout checklist for the exact submission packet.",
      href: `/api/rfp/proposals/${proposalId}/export/manifest-csv`,
      icon: ClipboardCheck,
    },
    {
      label: "Readiness JSON",
      detail: "Machine-readable gate state for automations and audit.",
      href: `/api/rfp/proposals/${proposalId}/submit-readiness`,
      icon: FileJson,
    },
    {
      label: "Audit CSV",
      detail: "Agent, model, token, cost, and edit trail metadata.",
      href: `/api/rfp/proposals/${proposalId}/export/audit-trail-csv`,
      icon: History,
    },
  ];

  return (
    <section
      className="mt-8 rounded-md border border-zinc-200 bg-white p-5 shadow-sm"
      data-testid="rfp-submission-bundle-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-700">
              Submission bundle
            </p>
            <span
              className={`rounded-full border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] ${STATUS_CLASS[gate.status]}`}
            >
              {gate.label}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Export the full packet set from one place. The readiness gate is
            enforced when the proposal is marked submitted, but exports stay
            available for review and portal prep.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <a
            href={`/api/rfp/proposals/${proposalId}/export/bundle-zip`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-emerald-600 bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download ZIP
          </a>
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-right">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
              Gate score
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
              {gate.score}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {bundleItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className="group flex min-h-[132px] flex-col justify-between rounded-md border border-zinc-200 bg-zinc-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <span className="flex items-start justify-between gap-3">
                <Icon className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                <Download
                  className="h-4 w-4 text-zinc-400 transition group-hover:text-emerald-600"
                  aria-hidden="true"
                />
              </span>
              <span>
                <span className="block text-sm font-semibold text-zinc-900">
                  {item.label}
                </span>
                <span className="mt-1 block text-[12px] leading-5 text-zinc-500">
                  {item.detail}
                </span>
              </span>
            </a>
          );
        })}
      </div>

      <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
        <p className="text-sm leading-6 text-zinc-700">{gate.nextAction}</p>
      </div>
    </section>
  );
}
