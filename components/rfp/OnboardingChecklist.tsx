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
import { ArrowRight, Check, Search, Upload, WandSparkles } from "lucide-react";
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
      title: "See live matches first",
      body: "Score the current feed against your NAICS profile before asking your team for documents.",
      href: "#opportunity-feed",
      cta: "Go to matches",
      accent: "text-cyan-200",
    },
    {
      icon: WandSparkles,
      title: "Train voice when value is clear",
      body: "Paste prior proposals later so drafts sound like you instead of generic grant copy.",
      href: `/org/${orgId}/settings/voice`,
      cta: state.voice_trained ? "Review voice" : "Train voice",
      accent: "text-emerald-200",
    },
    {
      icon: Upload,
      title: "Add proof for better drafts",
      body: `Vault docs improve citations, outcomes, and past-performance claims (${state.vault_chunk_count}/${VAULT_SEEDED_TARGET}).`,
      href: `/org/${orgId}/settings/vault`,
      cta: state.vault_seeded ? "Manage vault" : "Add docs",
      accent: "text-amber-200",
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(8,47,73,0.72),rgba(6,78,59,0.34)_48%,rgba(9,9,11,0.96))] shadow-[0_24px_80px_-48px_rgba(34,211,238,0.55)]">
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-100">
              First value path
            </span>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-100">
              {completed}/5 setup
            </span>
          </div>
          <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Start with the grant pipeline. Improve the draft engine after you see what is worth pursuing.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-cyan-50/75">
            Voice fingerprint and vault docs matter, but they should not block the
            first “is this useful?” moment. Score current opportunities now, then
            add proof and voice when a real deadline is worth chasing.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href="#opportunity-feed"
              className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-300 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-200"
            >
              See current matches <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href={`/org/${orgId}/settings/voice`}
              className="inline-flex h-10 items-center justify-center rounded-md border border-white/15 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Improve draft quality later
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/18 p-4 lg:border-l lg:border-t-0">
          <div className="grid gap-2">
            {setupItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-xl border border-white/10 bg-zinc-950/42 p-4 transition hover:border-white/20 hover:bg-zinc-950/58"
                >
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                      <Icon className={`h-4 w-4 ${item.accent}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500 group-hover:text-zinc-300">
                          {item.cta}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-zinc-400">{item.body}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <ol className="border-t border-white/10 bg-zinc-950/72 p-3 sm:grid sm:grid-cols-5 sm:gap-2 sm:space-y-0">
        {steps.map((step, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2 rounded-lg border border-zinc-900 bg-black/20 px-3 py-2.5"
          >
            <span
              className={`mt-[2px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${
                step.done
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                  : "border-zinc-700 bg-zinc-900 text-zinc-500"
              }`}
              aria-hidden
            >
              {step.done ? <Check className="h-3 w-3" /> : idx + 1}
            </span>
            <div className="flex-1">
              <div className="text-[12px] font-medium text-zinc-100">
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
