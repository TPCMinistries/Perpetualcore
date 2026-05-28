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
import { ArrowRight, Check, Database, Search, Upload, WandSparkles } from "lucide-react";
import {
  VAULT_SEEDED_TARGET,
  type OnboardingState,
} from "@/lib/rfp/onboarding-shared";

interface OnboardingChecklistProps {
  orgId: string;
  state: OnboardingState;
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
}: OnboardingChecklistProps) {
  const steps: Step[] = [
    {
      done: state.org_created,
      title: "Create your org",
      hint: "Done — you're inside it now.",
      href: null,
      cta: "",
    },
    {
      done: state.voice_trained,
      title: "Train your voice fingerprint",
      hint: "Paste 3-10 past proposals so future drafts sound like you.",
      href: `/org/${orgId}/settings/voice`,
      cta: state.voice_trained ? "Re-train" : "Train voice",
    },
    {
      done: state.vault_seeded,
      title: "Seed your vault",
      hint: state.vault_seeded
        ? `Done — ${state.vault_chunk_count} chunks indexed.`
        : `Upload past docs so drafts cite real facts (${state.vault_chunk_count}/${VAULT_SEEDED_TARGET}).`,
      href: `/org/${orgId}/settings/vault`,
      cta: state.vault_seeded ? "Manage vault" : "Add vault docs",
    },
    {
      done: state.first_draft,
      title: "Generate your first draft",
      hint: state.first_draft
        ? `Done — ${state.proposal_count} proposal${state.proposal_count === 1 ? "" : "s"}.`
        : "Pick any opportunity below and click Generate first-pass draft.",
      href: state.first_draft ? `/org/${orgId}/discovery` : null,
      cta: state.first_draft ? "See proposals" : "Pick an opp ↓",
    },
    {
      done: state.first_review,
      title: "Run the reviewer agent",
      hint: state.first_review
        ? "Done."
        : "Open any draft and click Run reviewer for a structured critique.",
      href: null,
      cta: "",
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const setupItems = [
    {
      icon: Search,
      title: "Search across 80k+ opportunities",
      body: "Use keywords, source, deadline, amount, and fit signals to find the right grants and RFPs.",
      href: "#opportunity-feed",
      cta: "Open discovery",
      accent: "text-blue-700",
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
              {completed}/5 setup
            </span>
          </div>
          <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            Your grant and RFP command center is ready to search.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
            Browse the opportunity library now, then add profile details, writing
            samples, and evidence files to make ranking and drafting stronger.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href="#opportunity-feed"
              className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Search opportunities <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href={`/org/${orgId}/settings`}
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Update profile
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

      <ol className="border-t border-zinc-200 bg-white p-3 sm:grid sm:grid-cols-5 sm:gap-2 sm:space-y-0">
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
