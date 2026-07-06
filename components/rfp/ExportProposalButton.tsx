"use client";

import { FileDown } from "lucide-react";

interface ExportProposalButtonProps {
  proposalId: string;
}

export function ExportProposalButton({ proposalId }: ExportProposalButtonProps) {
  return (
    <div className="flex flex-col gap-2">
      <a
        href={`/api/rfp/proposals/${proposalId}/export/docx`}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      >
        <FileDown className="h-4 w-4" aria-hidden="true" />
        Export DOCX
      </a>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        Draft packet · sections + readiness appendix
      </p>
    </div>
  );
}
