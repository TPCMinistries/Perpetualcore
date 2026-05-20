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

  return (
    <section className="rounded-lg border border-emerald-500/20 bg-zinc-950 p-5 shadow-[0_0_0_1px_rgba(16,185,129,0.04)]">
      <div className="flex items-baseline justify-between gap-4">
        <h2
          className="text-lg italic text-zinc-100"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Get to first proposal
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">
          {completed}/5 complete
        </span>
      </div>
      <p className="mt-1 text-[13px] text-zinc-400">
        Five steps to a voice-trained, vault-grounded, reviewer-checked draft.
      </p>

      <ol className="mt-4 space-y-2.5">
        {steps.map((step, idx) => (
          <li
            key={idx}
            className="flex items-start gap-3 rounded-md border border-zinc-900 bg-zinc-950 px-3 py-2.5 transition hover:border-zinc-800"
          >
            <span
              className={`mt-[2px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${
                step.done
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                  : "border-zinc-700 bg-zinc-900 text-zinc-500"
              }`}
              aria-hidden
            >
              {step.done ? "✓" : idx + 1}
            </span>
            <div className="flex-1">
              <div
                className={`text-[13px] font-medium ${
                  step.done ? "text-zinc-300 line-through decoration-zinc-700" : "text-zinc-100"
                }`}
              >
                {step.title}
              </div>
              <div className="mt-0.5 text-[12px] text-zinc-500">{step.hint}</div>
            </div>
            {step.href && step.cta ? (
              <Link
                href={step.href}
                className={`shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
                  step.done
                    ? "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
                }`}
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
