"use client";

/**
 * OnboardingChecklist — first-run sticky card on /org/[orgId]/discovery.
 *
 * v1 design choice: no manual dismiss. The card auto-hides only when all 5
 * steps are complete (parent renders it conditionally on
 * `state.all_complete === false`). This keeps the wiring small and the
 * incentive aligned — finish your setup and the card goes away.
 *
 * Each step links to the surface that completes it. Checkmark + green tint
 * for done; numbered grey chip for not-yet.
 */

import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Database,
  FileDown,
  ListChecks,
  Search,
  Upload,
  WandSparkles,
} from "lucide-react";
import {
  VAULT_SEEDED_TARGET,
  type OnboardingState,
} from "@/lib/rfp/onboarding-shared";

interface OnboardingChecklistProps {
  orgId: string;
  state: OnboardingState;
  opportunityInventoryCount: number;
}

interface Step {
  done: boolean;
  title: string;
  hint: string;
  href: string | null;
  cta: string;
}

export function OnboardingChecklist({
  orgId,
  state,
  opportunityInventoryCount,
}: OnboardingChecklistProps) {
  const inventoryLabel = opportunityInventoryCount.toLocaleString("en-US");
  const steps: Step[] = [
    {
      done: state.first_match_selected,
      title: "Select a match",
      hint: state.first_match_selected
        ? `Done — ${state.match_count} saved pursuit${state.match_count === 1 ? "" : "s"}.`
        : "Save a strong opportunity as Watch or Pursue.",
      href: "#opportunity-feed",
      cta: "Browse",
    },
    {
      done: state.first_draft,
      title: "Create workroom",
      hint: state.first_draft
        ? `Done — ${state.proposal_count} proposal${state.proposal_count === 1 ? "" : "s"}.`
        : "Start the pursuit workflow from a match.",
      href: state.first_draft ? `/org/${orgId}/proposals` : "#opportunity-feed",
      cta: state.first_draft ? "Open" : "Start",
    },
    {
      done: state.first_review,
      title: "Reviewer pass",
      hint: state.first_review
        ? "Done."
        : "Run the reviewer agent on your first draft.",
      href: state.first_draft ? `/org/${orgId}/proposals` : null,
      cta: state.first_draft ? "Open draft" : "",
    },
    {
      done: state.first_capture_readiness,
      title: "Readiness matrix",
      hint: state.first_capture_readiness
        ? "Done — capture checks exist."
        : "Generate bid/no-bid, compliance matrix, and packet checklist.",
      href: state.first_draft ? `/org/${orgId}/proposals` : null,
      cta: state.first_draft ? "Run checks" : "",
    },
    {
      done: state.first_workroom,
      title: "Task queue",
      hint: state.first_workroom
        ? `Done — ${state.submission_task_count} workroom task${state.submission_task_count === 1 ? "" : "s"}.`
        : "Create the submission workroom task queue.",
      href: state.first_draft ? `/org/${orgId}/proposals` : null,
      cta: state.first_draft ? "Sync tasks" : "",
    },
    {
      done: state.first_export_ready,
      title: "Export-ready packet",
      hint: state.first_export_ready
        ? "Done — packet is ready to export."
        : "Clear VERIFY markers and export the DOCX packet.",
      href: state.first_draft ? `/org/${orgId}/proposals` : null,
      cta: state.first_draft ? "Export" : "",
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const setupItems = [
    {
      icon: Search,
      title: `Search ${inventoryLabel} indexed opportunities`,
      body: "Use keywords, source, deadline, amount, and fit signals while the source library keeps expanding.",
      href: "#opportunity-feed",
      cta: "Open discovery",
      accent: "text-blue-700",
    },
    {
      icon: ClipboardCheck,
      title: "Run a complete first proposal",
      body: "The proof loop is match, draft, reviewer, readiness matrix, workroom, then export.",
      href: `/org/${orgId}/proposals`,
      cta: state.first_draft ? "Open proposals" : "Start first run",
      accent: "text-sky-700",
    },
    {
      icon: Database,
      title: "Tune your matching profile",
      body: "NAICS codes, geography, and capacity details make the ranking sharper, but search works broadly.",
      href: `/org/${orgId}/settings`,
      cta: "Edit profile",
      accent: "text-emerald-700",
    },
    {
      icon: WandSparkles,
      title: "Improve proposal voice",
      body: "Past writing samples help generated drafts sound like your organization.",
      href: `/org/${orgId}/settings/voice`,
      cta: state.voice_trained ? "Review voice" : "Train voice",
      accent: "text-violet-700",
    },
    {
      icon: Upload,
      title: "Add evidence when ready",
      body: `Vault docs improve citations, outcomes, and past-performance claims (${state.vault_chunk_count}/${VAULT_SEEDED_TARGET}).`,
      href: `/org/${orgId}/settings/vault`,
      cta: state.vault_seeded ? "Manage vault" : "Add docs",
      accent: "text-amber-700",
    },
    {
      icon: ListChecks,
      title: "Work the submission queue",
      body: "Reviewer findings and packet requirements become tasks your team can close before submission.",
      href: `/org/${orgId}/pursuits`,
      cta: "Open pursuits",
      accent: "text-rose-700",
    },
    {
      icon: FileDown,
      title: "Export the packet",
      body: "DOCX export includes proposal sections and a readiness appendix for human QA.",
      href: `/org/${orgId}/proposals`,
      cta: "Export DOCX",
      accent: "text-cyan-700",
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              Discovery setup
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-800">
              {completed}/{steps.length} launch
            </span>
          </div>
          <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            Run your first proposal from match to export.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
            The core engine is proven when one opportunity becomes a draft,
            reviewer pass, readiness matrix, workroom queue, and exportable
            packet. Voice and vault improve quality, but they do not block the
            first run.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href="#opportunity-feed"
              className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Start first run <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href={`/org/${orgId}/proposals`}
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Open proposals
            </Link>
          </div>
        </div>

        <div className="border-t border-zinc-200 bg-zinc-50 p-4 lg:border-l lg:border-t-0">
          <div className="grid gap-2 md:grid-cols-2">
            {setupItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm"
                >
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50">
                      <Icon className={`h-4 w-4 ${item.accent}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-zinc-950">{item.title}</p>
                        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500 group-hover:text-zinc-900">
                          {item.cta}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-zinc-600">{item.body}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <ol className="border-t border-zinc-200 bg-white p-3 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0 lg:grid-cols-6">
        {steps.map((step, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5"
          >
            <span
              className={`mt-[2px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${
                step.done
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-zinc-300 bg-white text-zinc-500"
              }`}
              aria-hidden
            >
              {step.done ? <Check className="h-3 w-3" /> : idx + 1}
            </span>
            <div className="flex-1">
              <div className="text-[12px] font-medium text-zinc-900">
                {step.title}
              </div>
              <div className="mt-0.5 text-[12px] text-zinc-500">{step.hint}</div>
            </div>
            {step.href && step.cta ? (
              <Link
                href={step.href}
                className="hidden"
              >
                {step.cta}
              </Link>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
