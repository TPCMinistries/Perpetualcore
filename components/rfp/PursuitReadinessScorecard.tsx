import { AlertTriangle, CheckCircle2, CircleDashed, Gauge, ListChecks } from "lucide-react";
import type { PursuitReadiness, ReadinessTone } from "@/lib/rfp/readiness";

interface PursuitReadinessScorecardProps {
  readiness: PursuitReadiness;
  compact?: boolean;
}

const TONE: Record<ReadinessTone, string> = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warn: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-rose-200 bg-rose-50 text-rose-900",
  neutral: "border-zinc-200 bg-zinc-50 text-zinc-800",
};

const BAR: Record<ReadinessTone, string> = {
  ready: "bg-emerald-600",
  warn: "bg-amber-500",
  danger: "bg-rose-600",
  neutral: "bg-zinc-500",
};

function iconFor(readiness: PursuitReadiness) {
  if (readiness.status === "ready" || readiness.status === "submitted") return CheckCircle2;
  if (readiness.status === "blocked") return AlertTriangle;
  if (readiness.status === "in_progress") return ListChecks;
  return CircleDashed;
}

export function PursuitReadinessScorecard({
  readiness,
  compact = false,
}: PursuitReadinessScorecardProps) {
  const Icon = iconFor(readiness);

  if (compact) {
    return (
      <div className={`rounded-md border p-3 ${TONE[readiness.tone]}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span className="text-sm font-semibold">{readiness.label}</span>
          </div>
          <span className="font-mono text-sm font-semibold tabular-nums">
            {readiness.score}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70">
          <div
            className={`h-full rounded-full ${BAR[readiness.tone]}`}
            style={{ width: `${readiness.score}%` }}
          />
        </div>
        <p className="mt-2 text-xs leading-5 opacity-80">{readiness.nextAction}</p>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-zinc-500" />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Pursuit readiness
            </p>
          </div>
          <h2 className="mt-2 text-xl font-semibold text-zinc-950">
            {readiness.label}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            {readiness.status === "ready" || readiness.status === "submitted"
              ? "No deterministic blockers are visible. Run final human review before submission."
              : "This is the operating score for whether the team can submit confidently."}
          </p>
        </div>
        <div className={`min-w-32 rounded-lg border p-4 text-center ${TONE[readiness.tone]}`}>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-75">
            Score
          </p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {readiness.score}
          </p>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full ${BAR[readiness.tone]}`}
          style={{ width: `${readiness.score}%` }}
        />
      </div>

      <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          Next best action
        </p>
        <p className="mt-1 text-sm font-semibold text-zinc-950">
          {readiness.nextAction}
        </p>
      </div>

      {readiness.blockers.length > 0 ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-rose-700">
            Blocked by
          </p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-rose-900">
            {readiness.blockers.map((blocker) => (
              <li key={blocker} className="flex gap-2">
                <AlertTriangle className="mt-1 h-3.5 w-3.5 shrink-0" />
                <span>{blocker}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {readiness.checks.map((check) => (
          <div key={check.key} className="rounded-lg border border-zinc-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
                {check.label}
              </p>
              <span
                className={`h-2 w-2 rounded-full ${
                  check.status === "complete"
                    ? "bg-emerald-500"
                    : check.status === "warning"
                      ? "bg-amber-500"
                      : check.status === "blocked"
                        ? "bg-rose-500"
                        : "bg-zinc-300"
                }`}
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-600">{check.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
