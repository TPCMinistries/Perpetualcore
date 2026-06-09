import type {
  BidNoBidArtifact,
  ComplianceMatrixArtifact,
  PacketChecklistArtifact,
  RequirementStatus,
} from "@/lib/rfp/compliance/types";

interface CaptureCommandCenterProps {
  proposalId: string;
  bidNoBid: BidNoBidArtifact | null;
  complianceMatrix: ComplianceMatrixArtifact | null;
  packetChecklist: PacketChecklistArtifact | null;
}

const STATUS_CLASS: Record<RequirementStatus, string> = {
  met: "border-emerald-200 bg-emerald-50 text-emerald-700",
  partial: "border-amber-200 bg-amber-50 text-amber-700",
  missing: "border-rose-200 bg-rose-50 text-rose-700",
  needs_review: "border-cyan-200 bg-cyan-50 text-cyan-700",
};

const RECOMMENDATION_CLASS = {
  pursue: "border-emerald-200 bg-emerald-50 text-emerald-700",
  maybe: "border-amber-200 bg-amber-50 text-amber-700",
  pass: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

function formatDate(iso: string | null): string {
  if (!iso) return "No due date stored";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Invalid due date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CaptureCommandCenter({
  proposalId,
  bidNoBid,
  complianceMatrix,
  packetChecklist,
}: CaptureCommandCenterProps) {
  if (!bidNoBid && !complianceMatrix && !packetChecklist) {
    return (
      <section className="mt-8 rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-700">
          Capture command center
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          Run capture readiness to generate a bid/no-bid recommendation,
          compliance matrix, and packet checklist for this proposal.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-700">
            Capture command center
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Bid decision, compliance coverage, and submission packet readiness.
          </p>
        </div>
        {bidNoBid ? (
          <div
            className={`rounded-md border px-4 py-2 text-center font-mono ${RECOMMENDATION_CLASS[bidNoBid.recommendation]}`}
          >
            <div className="text-[9px] uppercase tracking-[0.22em] opacity-80">
              {bidNoBid.recommendation}
            </div>
            <div className="mt-0.5 text-2xl font-semibold tabular-nums">
              {bidNoBid.score}
            </div>
          </div>
        ) : null}
      </div>

      {bidNoBid ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-700">
              Drivers
            </h3>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-zinc-700">
              {bidNoBid.drivers.slice(0, 5).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-700">
              Risks
            </h3>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-zinc-700">
              {bidNoBid.risks.length > 0 ? (
                bidNoBid.risks.slice(0, 5).map((item, idx) => <li key={idx}>{item}</li>)
              ) : (
                <li>No major deterministic risks detected.</li>
              )}
            </ul>
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-700">
              Next actions
            </h3>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-zinc-700">
              {bidNoBid.next_actions.slice(0, 5).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {complianceMatrix ? (
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600">
              Compliance matrix
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                {complianceMatrix.missing_count} missing ·{" "}
                {complianceMatrix.needs_review_count} needs review
              </span>
              <a
                href={`/api/rfp/proposals/${proposalId}/export/compliance-csv`}
                className="rounded-md border border-zinc-300 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700"
              >
                Export CSV
              </a>
            </div>
          </div>
          {complianceMatrix.submission_summary ? (
            <div className="mt-3 grid gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-[12px] leading-relaxed text-zinc-600 md:grid-cols-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                  Portal
                </p>
                <p className="mt-1 text-zinc-900">
                  {complianceMatrix.submission_summary.submission_portal ?? "Not extracted"}
                </p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                  Timezone
                </p>
                <p className="mt-1 text-zinc-900">
                  {complianceMatrix.submission_summary.deadline_timezone ?? "Confirm manually"}
                </p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                  Forms
                </p>
                <p className="mt-1 text-zinc-900">
                  {complianceMatrix.submission_summary.forms.length} extracted
                </p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                  Critical
                </p>
                <p className="mt-1 text-zinc-900">
                  {complianceMatrix.critical_count ?? 0} requirements
                </p>
              </div>
            </div>
          ) : null}
          <div className="mt-3 overflow-x-auto rounded-md border border-zinc-200">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead className="border-b border-zinc-200 bg-zinc-50 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Req</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Requirement</th>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {complianceMatrix.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-3 font-mono text-[10px] text-zinc-500">
                      {item.id}
                    </td>
                    <td className="px-3 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                      {item.category}
                    </td>
                    <td className="px-3 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                      {item.source.replace(/_/g, " ")}
                    </td>
                    <td className="px-3 py-3 text-zinc-900">
                      <div>{item.requirement}</div>
                      <div className="mt-1 text-[12px] text-zinc-500">{item.evidence}</div>
                    </td>
                    <td className="px-3 py-3 font-mono text-[10px] text-zinc-600">
                      {item.owner_label ?? item.owner_section}
                      {item.priority ? (
                        <span className="mt-1 block text-[9px] uppercase tracking-[0.14em] text-zinc-500">
                          {item.priority}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] ${STATUS_CLASS[item.response_status]}`}
                      >
                        {statusLabel(item.response_status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {packetChecklist ? (
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600">
              Submission packet
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Due {formatDate(packetChecklist.due_date)}
              </span>
              <a
                href={`/api/rfp/proposals/${proposalId}/export/packet-csv`}
                className="rounded-md border border-zinc-300 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700"
              >
                Export CSV
              </a>
            </div>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {packetChecklist.items.map((item) => (
              <li
                key={item.id}
                className="rounded-md border border-zinc-200 bg-zinc-50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-medium text-zinc-900">{item.label}</p>
                  <span
                    className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] ${STATUS_CLASS[item.status]}`}
                  >
                    {statusLabel(item.status)}
                  </span>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">{item.notes}</p>
              </li>
            ))}
          </ul>
          {packetChecklist.submission_url ? (
            <a
              href={packetChecklist.submission_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-sm text-emerald-600 underline-offset-4 hover:underline"
            >
              Open source posting
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
