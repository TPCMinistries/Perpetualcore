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
      done: state.profile_complete,
      title: "Confirm profile",
      hint: state.profile_complete
        ? "Done — mission and capacity profile saved."
        : "Add mission, geography, funding focus, and capacity details.",
      href: `/org/${orgId}/settings`,
      cta: state.profile_complete ? "Review" : "Finish",
    },
    {
      done: state.voice_trained,
      title: "Train voice",
      hint: state.voice_trained
        ? "Done — drafts can inherit your writing style."
        : "Paste past writing or describe your voice.",
      href: `/org/${orgId}/settings/voice`,
      cta: state.voice_trained ? "Review" : "Train",
    },
    {
      done: state.vault_seeded,
      title: "Seed vault",
      hint: state.vault_seeded
        ? `Done — ${state.vault_chunk_count} evidence chunks.`
        : `Add evidence docs or quick-seed capacity (${state.vault_chunk_count}/${VAULT_SEEDED_TARGET}).`,
      href: `/org/${orgId}/settings/vault`,
      cta: state.vault_seeded ? "Manage" : "Seed",
    },
    {
      done: state.first_match_selected,
      title: "Pick a match",
      hint: state.first_match_selected
        ? `Done — ${state.match_count} saved pursuit${state.match_count === 1 ? "" : "s"}.`
        : "Choose a high-fit opportunity from Discovery.",
      href: "#opportunity-feed",
      cta: "Browse",
    },
    {
      done: state.first_draft,
      title: "Create draft",
      hint: state.first_draft
        ? `Done — ${state.proposal_count} proposal${state.proposal_count === 1 ? "" : "s"}.`
        : "Start the first qualified draft from a match.",
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
      done: state.first_export_ready,
      title: "Review + export",
      hint: state.first_export_ready
        ? "Done — packet is ready to export."
        : state.first_capture_readiness || state.first_workroom
          ? "Clear reviewer findings, task gaps, and VERIFY markers."
          : "Run reviewer and readiness checks before exporting.",
      href: state.first_draft ? `/org/${orgId}/proposals` : null,
      cta: state.first_draft ? "Review" : "",
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const setupItems = [
    {
      icon: Search,
      title: `Score against ${inventoryLabel} indexed opportunities`,
      body: "The first profile creates immediate matches; filters help narrow the qualified shortlist.",
      href: "#opportunity-feed",
      cta: "Open discovery",
      accent: "text-blue-700",
    },
    {
      icon: ClipboardCheck,
      title: "Run a complete first proposal",
      body: "The proof loop is profile, voice, vault, match, draft, reviewer, readiness, then export.",
      href: `/org/${orgId}/proposals`,
      cta: state.first_draft ? "Open proposals" : "Start first run",
      accent: "text-sky-700",
    },
    {
      icon: Database,
      title: "Finish the five-field profile",
      body: "Mission, geography, funding focus, and capacity details sharpen matching before the first draft.",
      href: `/org/${orgId}/settings`,
      cta: "Edit profile",
      accent: "text-emerald-700",
    },
    {
      icon: WandSparkles,
      title: "Train proposal voice",
      body: "Past writing samples help generated drafts sound like your organization.",
      href: `/org/${orgId}/settings/voice`,
      cta: state.voice_trained ? "Review voice" : "Train voice",
      accent: "text-violet-700",
    },
    {
      icon: Upload,
      title: "Seed evidence vault",
      body: `Evidence improves citations, outcomes, and past-performance claims (${state.vault_chunk_count}/${VAULT_SEEDED_TARGET}).`,
      href: `/org/${orgId}/settings/vault`,
      cta: state.vault_seeded ? "Manage vault" : "Add docs",
      accent: "text-amber-700",
    },
    {
      icon: ListChecks,
      title: "Work reviewer findings",
      body: "Reviewer findings and packet requirements become tasks your team can close before submission.",
      href: `/org/${orgId}/pursuits`,
      cta: "Open pursuits",
      accent: "text-rose-700",
    },
    {
      icon: FileDown,
      title: "Export first packet",
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
              {completed}/{steps.length} ready
            </span>
          </div>
          <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            Get to the first qualified draft without extra setup.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
            Start with five profile fields, then add voice and vault evidence
            as accelerators. The first run turns one match into a draft,
            reviewer pass, readiness matrix, workroom queue, and exportable
            packet.
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
                  className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50">
                      <Icon className={`h-4 w-4 ${item.accent}`} />
                    </div>
                    <p className="pt-0.5 text-sm font-semibold leading-snug text-zinc-900">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-zinc-600">{item.body}</p>
                  <span className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400 transition-colors group-hover:text-emerald-700">
                    {item.cta}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
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
            className="flex min-h-[112px] flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5"
          >
            <div className="flex items-start gap-2">
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
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium text-zinc-900">
                  {step.title}
                </div>
                <div className="mt-0.5 text-[12px] leading-4 text-zinc-500">
                  {step.hint}
                </div>
              </div>
            </div>
            {step.href && step.cta ? (
              <Link
                href={step.href}
                className="mt-auto inline-flex h-8 items-center justify-center rounded-md border border-zinc-300 bg-white px-2 text-[11px] font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-100"
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
