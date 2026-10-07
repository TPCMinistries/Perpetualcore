/**
 * /proposal-desk — fixed-price proposal packages for community nonprofits.
 *
 * Venture V001 in Perpetual Engine Ventures (docs/ventures/V001-PROPOSAL-DESK.md
 * in that repo). Delivery runs on RFP Engine; intake posts to /api/contact-sales
 * with product = "proposal-desk". Prices here must match the owner-approved
 * offer record — change both together.
 */

import type { Metadata } from "next";
import { Check, FileCheck2, ScanSearch, PenLine } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { FundingScanForm } from "./FundingScanForm";

export const metadata: Metadata = {
  title: "Proposal Desk — Fixed-price grant and RFP proposals",
  description:
    "Finished, compliance-checked grant and RFP proposal packages for community nonprofits, delivered in five business days for a flat fee. Start with a free Funding Scan.",
  alternates: { canonical: "/proposal-desk" },
};

const STEPS = [
  {
    icon: ScanSearch,
    label: "Free Funding Scan",
    body: "We match your work against open city, state, federal and foundation opportunities, and send the ten best fits with what each one would take. Within two business days.",
  },
  {
    icon: PenLine,
    label: "We write it with you",
    body: "Pick the opportunity worth chasing. After a 30-minute intake call, we draft in your organization's voice from your own documents, then a person edits and fact-checks every claim.",
  },
  {
    icon: FileCheck2,
    label: "You submit",
    body: "You receive a finished package in five business days, with one round of revisions. You review, approve and submit. We never submit on your behalf.",
  },
];

const INCLUDED = [
  "Full narrative draft, written in your voice",
  "Budget justification draft",
  "Compliance matrix mapped to the solicitation",
  "Submission packet checklist",
  "Editable Word files plus a submission bundle",
  "One revision round",
];

const FAQ = [
  {
    q: "Do you take a percentage of the award?",
    a: "No. Commission-based grant writing conflicts with professional ethics codes for grant writers and fundraisers. You pay a flat fee, whether or not you win.",
  },
  {
    q: "Can you guarantee we'll win?",
    a: "No one honestly can. We guarantee on-time delivery of a complete, compliance-checked package. If we miss the delivery date, the second half of the fee isn't due.",
  },
  {
    q: "Is AI writing our proposal?",
    a: "AI does the heavy lifting: finding opportunities, mapping requirements, and drafting from your own past documents. A person edits and fact-checks every package before it reaches you, and nothing is invented about your organization.",
  },
  {
    q: "What do you need from us?",
    a: "The solicitation link, past proposals or reports, your latest 990 and budget, and a 30-minute intake call.",
  },
];

export default function ProposalDeskPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="container mx-auto px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <span aria-hidden className="block h-1.5 w-1.5 bg-primary" />
            <p className="eyebrow !text-foreground/70">Proposal Desk · For community nonprofits</p>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.045em] leading-[0.98] text-foreground mb-8">
            A finished proposal in five business days. One flat fee.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-[1.6] max-w-3xl">
            Small teams lose good funding to deadlines and paperwork. Proposal Desk finds the
            opportunities that fit your work and hands you a complete, compliance-checked
            package, ready for you to submit.
          </p>
        </div>
      </section>

      <section className="border-t border-border py-16 sm:py-20 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <li key={step.label} className="border border-border bg-card p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-6 mb-8">
                    <Icon className="h-5 w-5 text-primary" aria-hidden />
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Step {i + 1}
                    </span>
                  </div>
                  <h2 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                    {step.label}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-[1.65]">{step.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="border-t border-border py-20 sm:py-28">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="border border-primary/50 bg-card p-6 sm:p-8">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                Founding rate · first five organizations
              </span>
              <h2 className="mt-6 text-[11px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
                Proposal Package
              </h2>
              <p className="mt-3 text-4xl sm:text-5xl font-semibold tracking-[-0.025em] text-foreground">
                $1,250
              </p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Then $2,500 · half at order, half on delivery
              </p>
              <ul className="mt-8 space-y-2">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-foreground/45 mt-1 flex-shrink-0" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-border bg-card p-6 sm:p-8">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                For steady pipelines
              </span>
              <h2 className="mt-6 text-[11px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
                Proposal Desk Monthly
              </h2>
              <p className="mt-3 text-4xl sm:text-5xl font-semibold tracking-[-0.025em] text-foreground">
                $1,500<span className="text-xl text-muted-foreground">/mo</span>
              </p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Three-month minimum
              </p>
              <ul className="mt-8 space-y-2">
                {[
                  "One Proposal Package every month",
                  "A fresh matched-opportunity scan every month",
                  "A standing slot, so deadlines never wait in a queue",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-foreground/45 mt-1 flex-shrink-0" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-6 text-sm text-muted-foreground max-w-3xl leading-[1.65]">
            We take two packages a week so every one gets real attention. No percentage of
            awards, ever. Your deposit is fully refundable until work begins; see our{" "}
            <a href="/refund-policy" className="underline underline-offset-4 hover:text-foreground">
              refund and cancellation policy
            </a>
            .
          </p>
        </div>
      </section>

      <section id="scan" className="border-t border-border py-20 sm:py-28 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
            <div className="max-w-xl">
              <p className="eyebrow mb-3">Start here</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Get your free Funding Scan.
              </h2>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Tell us about your organization. Within two business days you&apos;ll get the ten
                open opportunities that best fit your work, with deadlines and what each would
                take to apply. No obligation.
              </p>
            </div>
            <FundingScanForm />
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20 sm:py-28">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[280px_1fr] lg:gap-20">
            <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">Questions</h2>
            <dl className="max-w-3xl divide-y divide-border border-y border-border">
              {FAQ.map((item) => (
                <div key={item.q} className="py-6">
                  <dt className="text-base font-medium text-foreground">{item.q}</dt>
                  <dd className="mt-2 text-sm text-muted-foreground leading-[1.7]">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
