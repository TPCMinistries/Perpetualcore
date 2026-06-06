"use client";

/**
 * Phase 05-05 — Quick Import bar (persistent input + live 4-step progress).
 *
 * Sits at the top of the Discovery feed pane (above FilterPills, below the
 * header / OrgSwitcher). Always visible. User pastes any opportunity URL —
 * HTML page, PDF link, DOCX link — and the bar drives a fetch + extract +
 * score pipeline via:
 *
 *   POST /api/rfp/quick-import   → 202 { jobId }
 *   GET  /api/rfp/quick-import/{jobId}/status   (polled every 1.5s)
 *
 * Visual contract (rhymes with the marketing site's "Live Capture Feed"
 * tile in app/(rfp-marketing)/rfp/page.tsx):
 *   - mono uppercase, tracking-[0.22em], text-[10px-11px]
 *   - emerald-300 accent for active + completed checks
 *   - zinc-500 idle, zinc-400 ghost separators
 *   - dark surface: bg-zinc-950, border emerald-300/30 on focus
 *
 * Four states:
 *   1. Idle           — input + Import button
 *   2. In-progress    — 4-step strip (Fetching · Parsing · Scoring · Done)
 *   3. Success        — "Imported." (+ "Needs review" caveat when applicable)
 *   4. Error          — error message + Try again link
 *
 * Terminal states auto-dismiss back to idle after 4s (success) / 8s (error).
 *
 * Contract for the parallel 05-04 Feed UI:
 *   - Default export: NONE. Named export ONLY: `QuickImportBar`.
 *   - Props: `{ orgId: string; onImported?: (oppId: string) => void }`.
 *   - When the import succeeds, `onImported` is called with the new opp's id
 *     so the parent feed can refetch / auto-select.
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type ImportStep = "fetching" | "parsing" | "scoring" | "done" | "error";

interface ImportJob {
  jobId: string;
  userId: string;
  orgId: string;
  url: string;
  step: ImportStep;
  status: "in_progress" | "success" | "failure";
  error?: string;
  opp_id?: string;
  needs_review?: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuickImportBarProps {
  orgId: string;
  /** Called once on success with the upserted opportunity's id. */
  onImported?: (oppId: string) => void;
}

// ── Step display config ──────────────────────────────────────────────────────

interface StepSpec {
  key: "fetching" | "parsing" | "scoring" | "done";
  label: string;
}

const STEPS: readonly StepSpec[] = [
  { key: "fetching", label: "Fetching" },
  { key: "parsing", label: "Parsing" },
  { key: "scoring", label: "Scoring" },
  { key: "done", label: "Done" },
] as const;

const STEP_ORDER: Record<StepSpec["key"], number> = {
  fetching: 0,
  parsing: 1,
  scoring: 2,
  done: 3,
};

const POLL_INTERVAL_MS = 1500;
const SUCCESS_AUTO_DISMISS_MS = 4000;
const ERROR_AUTO_DISMISS_MS = 8000;

// ── Component ────────────────────────────────────────────────────────────────

export function QuickImportBar({ orgId, onImported }: QuickImportBarProps) {
  type Phase =
    | { kind: "idle" }
    | { kind: "submitting" }
    | { kind: "polling"; jobId: string; job: ImportJob }
    | {
        kind: "success";
        oppId: string;
        needsReview: boolean;
      }
    | { kind: "error"; message: string };

  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [url, setUrl] = useState("");
  const pollHandle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissHandle = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timers on unmount so the component doesn't fire setState after
  // it's gone.
  useEffect(() => {
    return () => {
      if (pollHandle.current) clearTimeout(pollHandle.current);
      if (dismissHandle.current) clearTimeout(dismissHandle.current);
    };
  }, []);

  const clearTimers = useCallback(() => {
    if (pollHandle.current) {
      clearTimeout(pollHandle.current);
      pollHandle.current = null;
    }
    if (dismissHandle.current) {
      clearTimeout(dismissHandle.current);
      dismissHandle.current = null;
    }
  }, []);

  const resetToIdle = useCallback(() => {
    clearTimers();
    setUrl("");
    setPhase({ kind: "idle" });
  }, [clearTimers]);

  // Poll status until terminal. Stable closure on the latest jobId.
  const pollOnce = useCallback(
    async (jobId: string): Promise<void> => {
      try {
        const resp = await fetch(`/api/rfp/quick-import/${jobId}/status`, {
          method: "GET",
          credentials: "include",
        });
        if (resp.status === 404) {
          setPhase({
            kind: "error",
            message: "Import expired before completing. Please try again.",
          });
          return;
        }
        if (resp.status === 403) {
          setPhase({
            kind: "error",
            message: "This import belongs to a different account.",
          });
          return;
        }
        if (!resp.ok) {
          setPhase({
            kind: "error",
            message: `Status check failed (HTTP ${resp.status}).`,
          });
          return;
        }
        const job = (await resp.json()) as ImportJob;
        if (job.status === "success" && job.step === "done") {
          setPhase({
            kind: "success",
            oppId: job.opp_id ?? "",
            needsReview: job.needs_review === true,
          });
          if (job.opp_id && onImported) {
            try {
              onImported(job.opp_id);
            } catch {
              // Parent error shouldn't crash the import UI.
            }
          }
          return;
        }
        if (job.status === "failure" || job.step === "error") {
          setPhase({
            kind: "error",
            message: job.error ?? "Import failed for an unknown reason.",
          });
          return;
        }
        // Still in progress — render and re-arm the poll.
        setPhase({ kind: "polling", jobId, job });
        pollHandle.current = setTimeout(() => {
          void pollOnce(jobId);
        }, POLL_INTERVAL_MS);
      } catch (e) {
        setPhase({
          kind: "error",
          message:
            e instanceof Error
              ? `Network error: ${e.message}`
              : "Network error during status check.",
        });
      }
    },
    [onImported]
  );

  // Auto-dismiss success / error back to idle after the documented timeouts.
  useEffect(() => {
    if (phase.kind === "success") {
      dismissHandle.current = setTimeout(resetToIdle, SUCCESS_AUTO_DISMISS_MS);
    } else if (phase.kind === "error") {
      dismissHandle.current = setTimeout(resetToIdle, ERROR_AUTO_DISMISS_MS);
    }
    return () => {
      if (dismissHandle.current) {
        clearTimeout(dismissHandle.current);
        dismissHandle.current = null;
      }
    };
  }, [phase.kind, resetToIdle]);

  const submit = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      setPhase({
        kind: "error",
        message: "URL must start with http:// or https://",
      });
      return;
    }
    setPhase({ kind: "submitting" });
    try {
      const resp = await fetch("/api/rfp/quick-import", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, orgId }),
      });
      if (resp.status === 429) {
        // Pull retry-after if present for a humane message.
        const ra = resp.headers.get("retry-after");
        setPhase({
          kind: "error",
          message: ra
            ? `Too many imports. Try again in ${ra}s.`
            : "Too many imports. Try again in a moment.",
        });
        return;
      }
      if (resp.status === 401) {
        setPhase({
          kind: "error",
          message: "Session expired. Please sign in again.",
        });
        return;
      }
      if (resp.status === 404) {
        setPhase({
          kind: "error",
          message: "Org not found. You may have lost access.",
        });
        return;
      }
      if (!resp.ok) {
        const body = (await resp.json().catch(() => null)) as
          | { error?: string }
          | null;
        setPhase({
          kind: "error",
          message:
            body?.error ?? `Could not import (HTTP ${resp.status}).`,
        });
        return;
      }
      const { jobId } = (await resp.json()) as { jobId: string };
      // Seed a placeholder polling phase so the UI immediately switches to
      // the step strip while we wait for the first GET.
      setPhase({
        kind: "polling",
        jobId,
        job: {
          jobId,
          userId: "",
          orgId,
          url: trimmed,
          step: "fetching",
          status: "in_progress",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
      // Kick off polling on the next tick — short delay gives the
      // background runner time to do its first writeJob.
      pollHandle.current = setTimeout(() => {
        void pollOnce(jobId);
      }, 500);
    } catch (e) {
      setPhase({
        kind: "error",
        message:
          e instanceof Error
            ? `Network error: ${e.message}`
            : "Network error. Please try again.",
      });
    }
  }, [orgId, pollOnce, url]);

  // ── Rendering helpers ──────────────────────────────────────────────────────

  const renderStepStrip = (job: ImportJob | null) => {
    const currentIndex =
      job && job.step in STEP_ORDER
        ? STEP_ORDER[job.step as StepSpec["key"]]
        : 0;
    return (
      <div
        className="flex w-full flex-wrap items-center gap-2 sm:gap-3"
        role="status"
        aria-live="polite"
      >
        {STEPS.map((step, idx) => {
          const completed = idx < currentIndex || job?.step === "done";
          const active = idx === currentIndex && job?.step !== "done";
          const upcoming = idx > currentIndex && job?.step !== "done";
          return (
            <div key={step.key} className="flex items-center gap-2 sm:gap-3">
              <span
                aria-hidden="true"
                className={[
                  "inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border text-[10px] leading-none",
                  completed
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : active
                    ? "border-emerald-300 bg-white text-emerald-700"
                    : "border-zinc-300 bg-white text-zinc-400",
                ].join(" ")}
              >
                {completed ? "✓" : active ? "●" : "○"}
              </span>
              <span
                className={[
                  "font-mono text-[10px] uppercase tracking-[0.22em]",
                  completed
                    ? "text-emerald-700"
                    : active
                    ? "text-zinc-950"
                    : upcoming
                    ? "text-zinc-400"
                    : "text-zinc-500",
                ].join(" ")}
              >
                {step.label}
              </span>
              {idx < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={[
                    "hidden h-px w-6 sm:block",
                    completed ? "bg-emerald-300" : "bg-zinc-200",
                  ].join(" ")}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  const renderIdle = () => {
    const disabled = phase.kind === "submitting";
    return (
      <form
        className="flex w-full flex-col gap-3 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label htmlFor="quick-import-url" className="sr-only">
          Paste opportunity URL
        </label>
        <input
          id="quick-import-url"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="Paste opportunity URL…"
          className="w-full flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[13px] text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors duration-150 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 motion-reduce:transition-none"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || url.trim().length === 0}
          className="w-full rounded-lg border border-emerald-700 bg-emerald-700 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white transition-colors duration-150 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none sm:w-auto"
        >
          {disabled ? "Submitting…" : "Import"}
        </button>
      </form>
    );
  };

  const renderSuccess = (oppId: string, needsReview: boolean) => {
    void oppId; // surfaced to parent via onImported; not rendered inline
    return (
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span
            aria-hidden="true"
            className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-[10px] leading-none text-emerald-700"
          >
            {"✓"}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-700">
            Imported
          </span>
          {needsReview ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
              Needs review
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={resetToIdle}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:text-zinc-950"
        >
          Import another
        </button>
      </div>
    );
  };

  const renderError = (message: string) => (
    <div
      className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      role="alert"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-[10px] leading-none text-rose-700"
        >
          {"×"}
        </span>
        <span className="truncate font-mono text-[11px] uppercase tracking-[0.18em] text-rose-700">
          Could not import. {message}
        </span>
      </div>
      <button
        type="button"
        onClick={resetToIdle}
        className="shrink-0 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-700 transition-colors hover:text-zinc-950"
      >
        Try again
      </button>
    </div>
  );

  // ── Wrapper ────────────────────────────────────────────────────────────────

  const body =
    phase.kind === "idle" || phase.kind === "submitting"
      ? renderIdle()
      : phase.kind === "polling"
      ? renderStepStrip(phase.job)
      : phase.kind === "success"
      ? renderSuccess(phase.oppId, phase.needsReview)
      : renderError(phase.message);

  return (
    <div
      data-testid="quick-import-bar"
      className="relative w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3"
    >
      {body}
    </div>
  );
}
