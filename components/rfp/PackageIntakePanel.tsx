"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Link2, Loader2, RefreshCw, TextCursorInput } from "lucide-react";

type IntakeMode = "upload" | "url" | "paste";

type RubricSkippedReason = "no_opportunity_linked" | "budget_exceeded" | "extraction_failed";

interface RubricCriterion {
  id: string;
  section_ref: string;
  criterion_text: string;
  max_points: number | null;
  weight: number | null;
  is_inferred: boolean;
}

interface PackageSummary {
  id: string;
  title: string;
  source_type: IntakeMode;
  source_url: string | null;
  file_name: string | null;
  extracted_chars: number;
  extracted_json: {
    quality_score?: number;
    required_documents?: string[];
    requirements?: unknown[];
    risks?: string[];
    deadline_timezone?: string | null;
    submission_method?: string | null;
    submission_portal?: string | null;
    forms?: string[];
    question_deadlines?: string[];
  };
  created_at: string;
}

interface ImportResult {
  packageId: string;
  rubricCriteria: RubricCriterion[] | null;
  rubricSkippedReason: RubricSkippedReason | null;
}

interface PackageIntakePanelProps {
  proposalId: string;
  initialPackages: PackageSummary[];
  canEdit: boolean;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function PackageIntakePanel({
  proposalId,
  initialPackages,
  canEdit,
}: PackageIntakePanelProps) {
  const router = useRouter();
  const [mode, setMode] = useState<IntakeMode>("upload");
  const [title, setTitle] = useState("Solicitation package");
  const [sourceUrl, setSourceUrl] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [packages, setPackages] = useState(initialPackages);
  const [solicitationMode, setSolicitationMode] = useState(true);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(opts?: { forceReExtract?: boolean; existingPackageId?: string }) {
    if (!canEdit || isPending) return;
    setError(null);
    setStatus(null);
    startTransition(async () => {
      const form = new FormData();
      form.set("mode", mode);
      form.set("title", title);
      form.set("source_url", sourceUrl);
      form.set("body", body);
      if (file) form.set("file", file);
      if (solicitationMode) form.set("solicitation_mode", "true");
      if (opts?.forceReExtract) form.set("force_re_extract", "true");

      const res = await fetch(`/api/rfp/proposals/${proposalId}/package`, {
        method: "POST",
        body: form,
      });
      const payload = (await res.json().catch(() => null)) as
        | {
            package_id?: string;
            extraction?: PackageSummary["extracted_json"];
            error?: string;
            detail?: string;
            extracted_chars?: number;
            rubric_criteria?: RubricCriterion[];
            rubric_skipped_reason?: RubricSkippedReason;
          }
        | null;
      if (!res.ok || !payload?.package_id || !payload.extraction) {
        setError(payload?.detail ?? payload?.error ?? `HTTP ${res.status}`);
        return;
      }

      setImportResult({
        packageId: payload.package_id,
        rubricCriteria: payload.rubric_criteria ?? null,
        rubricSkippedReason: payload.rubric_skipped_reason ?? null,
      });

      if (!opts?.forceReExtract) {
        setPackages((current) => [
          {
            id: payload.package_id!,
            title,
            source_type: mode,
            source_url: sourceUrl || null,
            file_name: file?.name ?? null,
            extracted_chars: payload.extracted_chars ?? 0,
            extracted_json: payload.extraction!,
            created_at: new Date().toISOString(),
          },
          ...current,
        ]);
        setBody("");
        setFile(null);
      }
      setStatus("Package rules extracted. Refreshing readiness checks...");

      const complianceRes = await fetch(`/api/rfp/proposals/${proposalId}/compliance`, {
        method: "POST",
      });
      if (!complianceRes.ok) {
        const compliancePayload = (await complianceRes.json().catch(() => null)) as
          | { error?: string; detail?: string }
          | null;
        setError(
          compliancePayload?.detail ??
            compliancePayload?.error ??
            "Package imported, but readiness refresh failed.",
        );
        router.refresh();
        return;
      }

      const tasksRes = await fetch(`/api/rfp/proposals/${proposalId}/submission-tasks`, {
        method: "POST",
      });
      if (!tasksRes.ok) {
        const tasksPayload = (await tasksRes.json().catch(() => null)) as
          | { error?: string; detail?: string }
          | null;
        setError(
          tasksPayload?.detail ??
            tasksPayload?.error ??
            "Readiness refreshed, but task sync failed.",
        );
        router.refresh();
        return;
      }

      setStatus("Package rules, readiness checks, and workroom tasks are up to date.");
      router.refresh();
    });
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Package intake
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-950">
            Import the actual RFP/grant package
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Extracts rules, attachments, page limits, scoring, dates, and
            submission instructions into the workroom.
          </p>
        </div>
        <div className="flex rounded-md border border-zinc-200 bg-zinc-50 p-1">
          {(["upload", "url", "paste"] as const).map((nextMode) => (
            <button
              key={nextMode}
              type="button"
              onClick={() => setMode(nextMode)}
              className={`inline-flex h-8 items-center gap-1.5 rounded px-3 text-xs font-medium capitalize transition ${
                mode === nextMode
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-600 hover:bg-white"
              }`}
            >
              {nextMode === "upload" ? <FileUp className="h-3.5 w-3.5" /> : null}
              {nextMode === "url" ? <Link2 className="h-3.5 w-3.5" /> : null}
              {nextMode === "paste" ? <TextCursorInput className="h-3.5 w-3.5" /> : null}
              {nextMode}
            </button>
          ))}
        </div>
      </div>

      {canEdit ? (
        <div className="mt-5 grid gap-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-500"
            placeholder="Package title"
          />
          {mode === "upload" ? (
            <input
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3 text-sm text-zinc-700"
            />
          ) : null}
          {mode === "url" ? (
            <input
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-500"
              placeholder="https://..."
            />
          ) : null}
          {mode === "paste" ? (
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-32 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-zinc-500"
              placeholder="Paste solicitation text, instructions, addenda, or portal requirements..."
            />
          ) : null}
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={solicitationMode}
              onChange={(e) => setSolicitationMode(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-950"
            />
            <span className="text-sm text-zinc-700">
              This is the solicitation — extract evaluation rubric
            </span>
          </label>
          <button
            type="button"
            onClick={() => submit()}
            disabled={isPending}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            {isPending ? "Extracting package" : "Extract package rules"}
          </button>
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          {status ? <p className="text-sm text-emerald-700">{status}</p> : null}
          {importResult ? (
            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
              {importResult.rubricCriteria && importResult.rubricCriteria.length > 0 ? (
                <p className="text-emerald-700">
                  {importResult.rubricCriteria.length} evaluation{" "}
                  {importResult.rubricCriteria.length === 1 ? "criterion" : "criteria"} extracted
                  {" — "}
                  <span className="text-zinc-500">view them in the proposal workspace</span>
                </p>
              ) : importResult.rubricSkippedReason ? (
                <p className="text-zinc-500">
                  {importResult.rubricSkippedReason === "no_opportunity_linked"
                    ? "No linked opportunity — rubric extraction skipped"
                    : importResult.rubricSkippedReason === "budget_exceeded"
                      ? "AI budget reached — rubric extraction skipped"
                      : "Rubric extraction failed — re-upload with 'extract rubric' to retry"}
                </p>
              ) : null}
              {solicitationMode ? (
                <button
                  type="button"
                  onClick={() => submit({ forceReExtract: true })}
                  disabled={isPending}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3" />
                  Re-extract rubric
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {packages.length > 0 ? (
        <div className="mt-5 divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200">
          {packages.slice(0, 5).map((pkg) => {
            const extraction = pkg.extracted_json;
            return (
              <div key={pkg.id} className="bg-zinc-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-950">{pkg.title}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      {pkg.source_type} · {formatDate(pkg.created_at)} · {pkg.extracted_chars.toLocaleString()} chars
                    </p>
                  </div>
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                    {extraction.quality_score ?? 0}% depth
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-zinc-600">
                  {(extraction.requirements?.length ?? 0)} requirements ·{" "}
                  {(extraction.required_documents?.length ?? 0)} docs ·{" "}
                  {(extraction.forms?.length ?? 0)} forms ·{" "}
                  {(extraction.risks?.length ?? 0)} risks
                </p>
                <div className="mt-3 grid gap-2 text-xs leading-5 text-zinc-600 md:grid-cols-3">
                  <div className="rounded-md border border-zinc-200 bg-white p-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400">
                      Submission
                    </p>
                    <p className="mt-1 font-medium text-zinc-800">
                      {extraction.submission_portal ??
                        extraction.submission_method ??
                        "Not extracted"}
                    </p>
                  </div>
                  <div className="rounded-md border border-zinc-200 bg-white p-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400">
                      Timezone
                    </p>
                    <p className="mt-1 font-medium text-zinc-800">
                      {extraction.deadline_timezone ?? "Confirm manually"}
                    </p>
                  </div>
                  <div className="rounded-md border border-zinc-200 bg-white p-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400">
                      Q&A
                    </p>
                    <p className="mt-1 font-medium text-zinc-800">
                      {(extraction.question_deadlines?.length ?? 0) > 0
                        ? `${extraction.question_deadlines?.length} deadline${extraction.question_deadlines?.length === 1 ? "" : "s"}`
                        : "No Q&A deadline found"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500">
          No package imported yet. Add the solicitation PDF, DOCX, source URL, or
          portal instructions to make this workroom package-aware.
        </p>
      )}
    </section>
  );
}
