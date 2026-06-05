import {
  ClipboardCheck,
  Download,
  FileJson,
  FileText,
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
  ready: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
  not_ready: "border-amber-400/40 bg-amber-400/10 text-amber-100",
  not_run: "border-zinc-700 bg-zinc-900 text-zinc-300",
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
  ];

  return (
    <section className="mt-8 rounded-md border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">
              Submission bundle
            </p>
            <span
              className={`rounded-full border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] ${STATUS_CLASS[gate.status]}`}
            >
              {gate.label}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Export the full packet set from one place. The readiness gate is
            enforced when the proposal is marked submitted, but exports stay
            available for review and portal prep.
          </p>
        </div>
        <div className="rounded-md border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-right">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
            Gate score
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">
            {gate.score}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {bundleItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className="group flex min-h-[132px] flex-col justify-between rounded-md border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-emerald-400/50 hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              <span className="flex items-start justify-between gap-3">
                <Icon className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                <Download
                  className="h-4 w-4 text-zinc-600 transition group-hover:text-emerald-300"
                  aria-hidden="true"
                />
              </span>
              <span>
                <span className="block text-sm font-semibold text-zinc-100">
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

      <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <p className="text-sm leading-6 text-zinc-300">{gate.nextAction}</p>
      </div>
    </section>
  );
}
