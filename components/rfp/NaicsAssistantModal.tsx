"use client";

/**
 * NaicsAssistantModal v2 — "Help me pick" AI assistant for the NAICS field on
 * /orgs/new. The user describes their organization in plain English; the
 * model identifies distinct programs (workforce training, case management,
 * etc.) and returns NAICS codes grouped by program with 2-3 sentence
 * rationales naming the specific procurement systems each code unlocks.
 *
 * Designed to be the first "wow" moment of onboarding: it has to convince
 * grant-funded orgs on contact that this product knows the federal/state/
 * city procurement landscape. Cards reveal with a staggered animation,
 * loading shows multi-step reasoning labels, and a follow-up input lets
 * the user keep adding programs without leaving the modal.
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, Plus, Check, ArrowRight } from "lucide-react";

type ProcurementSystem =
  | "SAM.gov"
  | "Grants.gov"
  | "NY State Grants Gateway"
  | "NYC PASSPort"
  | "GSA eBuy"
  | "State procurement portals"
  | "City/County RFPs"
  | "Foundation funders";

interface NaicsCode {
  code: string;
  title: string;
  rationale: string;
  procurement: ProcurementSystem[];
  confidence: "high" | "medium" | "low";
}

interface NaicsProgram {
  name: string;
  summary: string;
  codes: NaicsCode[];
}

interface NaicsAssistantModalProps {
  onAdd: (code: string) => void;
  existingCodes: string[];
}

// Synthetic loading steps that play during the API call. The model itself
// returns one chunk, but showing the wait as a sequence of steps signals
// real reasoning rather than a black-box spinner.
const LOADING_STEPS = [
  "Reading your description…",
  "Identifying program areas…",
  "Mapping to NAICS 2022 taxonomy…",
  "Matching to procurement systems…",
] as const;

const CONFIDENCE_STYLES: Record<NaicsCode["confidence"], string> = {
  high: "bg-emerald-50 text-emerald-800 border-emerald-200",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  low: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

const CONFIDENCE_LABEL: Record<NaicsCode["confidence"], string> = {
  high: "Strong match",
  medium: "Reasonable match",
  low: "Adjacent — lower priority",
};

export function NaicsAssistantModal({
  onAdd,
  existingCodes,
}: NaicsAssistantModalProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [followup, setFollowup] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  /** All programs collected across queries — appended, never replaced. */
  const [programs, setPrograms] = useState<NaicsProgram[]>([]);
  /** True after the first successful query, so we switch from primary input → follow-up input. */
  const [hasResults, setHasResults] = useState(false);

  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  // Drive the synthetic loading-step cycle during requests.
  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    const id = window.setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 600);
    return () => window.clearInterval(id);
  }, [loading]);

  // Auto-scroll to the newest program when results land.
  useEffect(() => {
    if (programs.length === 0) return;
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [programs.length]);

  const reset = () => {
    setDescription("");
    setFollowup("");
    setPrograms([]);
    setError(null);
    setHasResults(false);
    setLoading(false);
    setLoadingStep(0);
  };

  const runQuery = async (text: string, isFollowup: boolean) => {
    setLoading(true);
    setError(null);
    setLoadingStep(0);
    try {
      const res = await fetch("/api/orgs/naics-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "invalid_body"
            ? "Please write 10–600 characters."
            : data.error === "unauthorized"
              ? "Please sign in first."
              : "Something went wrong. Try again.",
        );
        return;
      }
      const newPrograms = (data.programs ?? []) as NaicsProgram[];
      // Dedupe codes that were already returned in earlier programs.
      const existingFromPriorQueries = new Set(
        programs.flatMap((p) => p.codes.map((c) => c.code)),
      );
      const cleaned = newPrograms
        .map((p) => ({
          ...p,
          codes: p.codes.filter((c) => !existingFromPriorQueries.has(c.code)),
        }))
        .filter((p) => p.codes.length > 0);

      setPrograms((prev) => [...prev, ...cleaned]);
      setHasResults(true);
      if (isFollowup) setFollowup("");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAll = (program: NaicsProgram) => {
    for (const c of program.codes) {
      if (!existingCodes.includes(c.code)) onAdd(c.code);
    }
  };

  const handleAddEveryRecommendation = () => {
    for (const program of programs) {
      handleAddAll(program);
    }
  };

  const totalCodes = programs.reduce((sum, p) => sum + p.codes.length, 0);
  const selectedCount = programs.reduce(
    (sum, p) => sum + p.codes.filter((c) => existingCodes.includes(c.code)).length,
    0,
  );
  const remainingCount = Math.max(totalCodes - selectedCount, 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto gap-1.5 px-2 py-1 text-xs"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Help me pick
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden border-zinc-200 bg-[#fbfbf7] text-zinc-950 shadow-2xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-700" />
            Find your NAICS codes
          </DialogTitle>
          <DialogDescription className="text-zinc-600">
            Describe what your organization does. We&apos;ll group codes by
            program and show which opportunity systems each one can help match.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-4">
          {!hasResults && (
            <div className="space-y-2">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. We train young adults in NYC for healthcare careers — CNA, EKG, phlebotomy — and provide wraparound case management to keep them in their jobs after placement."
                rows={4}
                maxLength={600}
                disabled={loading}
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {description.length}/600
                </p>
                <Button
                  type="button"
                  onClick={() => runQuery(description, false)}
                  disabled={loading || description.trim().length < 10}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Find my codes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {loading && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-2">
              {LOADING_STEPS.map((step, i) => {
                const status =
                  i < loadingStep
                    ? "done"
                    : i === loadingStep
                      ? "active"
                      : "pending";
                return (
                  <div
                    key={step}
                    className={
                      "flex items-center gap-2 text-sm transition-opacity " +
                      (status === "pending"
                        ? "opacity-40"
                        : status === "done"
                          ? "opacity-70"
                          : "opacity-100")
                    }
                  >
                    {status === "done" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-700" />
                    ) : status === "active" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full border border-zinc-300" />
                    )}
                    <span
                      className={
                        status === "active"
                          ? "text-emerald-900"
                          : "text-zinc-600"
                      }
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2"
            >
              {error}
            </p>
          )}

          {programs.length > 0 && (
            <div className="space-y-5">
              {programs.map((program, pi) => (
                <ProgramCard
                  key={`${program.name}-${pi}`}
                  program={program}
                  programIndex={pi}
                  existingCodes={existingCodes}
                  onAdd={onAdd}
                  onAddAll={handleAddAll}
                />
              ))}
              <div ref={scrollEndRef} />
            </div>
          )}

          {hasResults && !loading && (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-4 space-y-2">
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-zinc-500">
                Need codes for another program?
              </p>
              <Textarea
                value={followup}
                onChange={(e) => setFollowup(e.target.value)}
                placeholder="e.g. We also run a re-entry mentoring program for young adults coming home from incarceration."
                rows={3}
                maxLength={600}
                className="resize-none"
              />
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => runQuery(followup, true)}
                  disabled={followup.trim().length < 10}
                  className="gap-2"
                >
                  Find more codes
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-1 gap-2 border-t border-zinc-200 pt-3 sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-600">
            {hasResults ? (
              <>
                {selectedCount}/{totalCodes} selected across {programs.length}{" "}
              program{programs.length === 1 ? "" : "s"}
              </>
            ) : (
              "Selections are saved to your org form."
            )}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {hasResults && (
              <Button type="button" variant="ghost" size="sm" onClick={reset}>
                Start over
              </Button>
            )}
            {hasResults && remainingCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEveryRecommendation}
                className="border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
              >
                Add all remaining
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant={hasResults ? "default" : "outline"}
              disabled={hasResults && selectedCount === 0}
              onClick={() => setOpen(false)}
              className={hasResults ? "bg-zinc-950 text-white hover:bg-zinc-800" : ""}
            >
              {hasResults ? "Save selected codes" : "Done"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * ProgramCard — one program section with header + per-code rows.
 * Staggered fade-in: each card lands ~120ms after the previous.
 */
function ProgramCard({
  program,
  programIndex,
  existingCodes,
  onAdd,
  onAddAll,
}: {
  program: NaicsProgram;
  programIndex: number;
  existingCodes: string[];
  onAdd: (code: string) => void;
  onAddAll: (program: NaicsProgram) => void;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setVisible(true), programIndex * 120);
    return () => window.clearTimeout(id);
  }, [programIndex]);

  const allAdded = program.codes.every((c) => existingCodes.includes(c.code));

  return (
    <div
      className={
        "rounded-xl border border-zinc-200 bg-white p-4 space-y-3 transition-all duration-500 " +
        (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-700">
            Program
          </p>
          <h3 className="font-semibold text-zinc-950">{program.name}</h3>
          {program.summary && (
            <p className="text-sm text-zinc-600 mt-0.5">
              {program.summary}
            </p>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant={allAdded ? "outline" : "secondary"}
          disabled={allAdded}
          onClick={() => onAddAll(program)}
          className="shrink-0 gap-1"
        >
          {allAdded ? (
            <>
              <Check className="h-3.5 w-3.5" />
              All added
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              Add all
            </>
          )}
        </Button>
      </div>

      <div className="space-y-2">
        {program.codes.map((c, ci) => (
          <CodeCard
            key={c.code}
            code={c}
            delayMs={programIndex * 120 + ci * 60}
            already={existingCodes.includes(c.code)}
            onAdd={() => onAdd(c.code)}
          />
        ))}
      </div>
    </div>
  );
}

function CodeCard({
  code,
  delayMs,
  already,
  onAdd,
}: {
  code: NaicsCode;
  delayMs: number;
  already: boolean;
  onAdd: () => void;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs]);

  return (
    <div
      className={
        "rounded-lg border border-zinc-200 bg-zinc-50 p-3 transition-all duration-500 " +
        (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold text-zinc-950">
              {code.code}
            </span>
            <span className="text-sm text-zinc-700">{code.title}</span>
            <span
              className={
                "rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] " +
                CONFIDENCE_STYLES[code.confidence]
              }
              title={CONFIDENCE_LABEL[code.confidence]}
            >
              {code.confidence}
            </span>
          </div>

          <p className="text-xs leading-relaxed text-zinc-600">
            {code.rationale}
          </p>

          {code.procurement.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {code.procurement.map((p) => (
                <span
                  key={p}
                  className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600"
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          variant={already ? "outline" : "default"}
          disabled={already}
          onClick={onAdd}
          className="shrink-0 gap-1"
        >
          {already ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Added
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              Add
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
