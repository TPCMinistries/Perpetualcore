/**
 * /studio/case-studies — two abstracted slot cards.
 * No client names. Sector + constraint + install + outcome.
 * Visual register matches homepage v6.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Case Studies — Perpetual Core",
  description:
    "We don't publish client names. Two abstracted case studies — sector, constraint regime, install, outcome. The constraints are the credential, not the logo wall.",
};

const SLOTS = [
  {
    index: "01",
    sector: "A community-college workforce program in New York.",
    constraint: "FERPA, multi-agency reporting requirements, outcomes-based funding tied to job placement.",
    install: "Eight registries installed across student intake, case management, employer partnerships, and outcomes reporting. Skills built for FERPA-compliant case notes, employer placement tracking with consent-bounded data sharing, and the multi-agency reporting templates the program's funder required quarterly. The case-management workflow that used to live across a CRM, a spreadsheet, and a Google Form now lives in one place.",
    outcome: "Case managers stopped maintaining duplicate records across three systems. Quarterly funder reports compile in hours, not days. The employer-placement registry surfaces students whose certificates align with current open roles. The skills library outlived the engagement; new program coordinators inherit it as the operating model.",
  },
  {
    index: "02",
    sector: "A faith institution with a multi-state network.",
    constraint: "Multi-jurisdictional consent regimes, donor-data sensitivity, offline-first field deployment.",
    install: "Eight registries installed across membership, ministry programs, and donor relations. Skills built for multi-jurisdiction consent capture (different states, different rules), offline-first event check-in for satellite locations, and a knowledge registry that synthesizes leadership voice notes, sermons, and field reports into one queryable archive. The ministry's institutional memory — previously held by three long-tenured staff — became extractable infrastructure.",
    outcome: "The network's central staff stopped fielding 'where is that document' requests throughout the day. Satellite locations register attendance and capture consent in offline mode, syncing on reconnect. The institutional-memory layer lets new ministers ramp into a multi-decade context without three months of one-on-ones.",
  },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div>
      <p className="eyebrow mb-3">§ {index}</p>
      <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">{label}</h2>
    </div>
  );
}

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 bg-foreground" />
            <p className="eyebrow !text-foreground/70">§ 01 · Studio · Case studies</p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            We don&apos;t publish{" "}
            <span className="italic text-foreground/85">client names.</span>
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>
              Mission-driven buyers don&apos;t want their data on our website. We respect that —
              even when it costs us marketing surface.
            </p>
            <p>
              Here are two installs we built, abstracted to the sector and the constraint regime.
              The constraints are the credential — not the logo. If your operation runs under one
              of these, we&apos;ve been there.
            </p>
            <p className="text-base text-muted-foreground/80 italic border-l-2 border-border pl-5">
              Several of the constraint regimes named below were first installed inside{" "}
              <Link href="/institute" className="text-foreground not-italic underline underline-offset-4 hover:text-primary">
                Uplift Communities
              </Link>{" "}
              — the Institute&apos;s operating arm — before they were installed for any client. The
              field work is the methodology; the methodology is then installed elsewhere.
            </p>
          </div>

          <Button size="lg" asChild className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
            <Link href="/contact-sales">Book an intake call <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Three abstracted slots — full-width hairline cards */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          {SLOTS.map((slot, i) => (
            <article
              key={slot.index}
              className={`border-x border-t border-border bg-card p-8 sm:p-12 ${i === SLOTS.length - 1 ? "border-b" : ""}`}
            >
              <div className="grid lg:grid-cols-[200px_1fr] gap-6 lg:gap-12 mb-8">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary mb-2">
                    Slot {slot.index}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Abstracted
                  </p>
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-foreground leading-[1.1]">
                  {slot.sector}
                </h3>
              </div>

              <div className="grid lg:grid-cols-[200px_1fr] gap-6 lg:gap-12 mb-8 border-t border-border pt-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground pt-1">
                  Constraint
                </p>
                <p className="text-base text-foreground font-medium leading-[1.6]">
                  {slot.constraint}
                </p>
              </div>

              <div className="grid lg:grid-cols-[200px_1fr] gap-6 lg:gap-12 mb-8 border-t border-border pt-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground pt-1">
                  Install
                </p>
                <p className="text-base text-muted-foreground leading-[1.7]">{slot.install}</p>
              </div>

              <div className="grid lg:grid-cols-[200px_1fr] gap-6 lg:gap-12 border-t border-border pt-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground pt-1">
                  Outcome
                </p>
                <p className="text-base text-muted-foreground leading-[1.7]">{slot.outcome}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Beyond the abstraction" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Want to see the work behind the abstraction?
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                We walk through specific installs under NDA on intake calls. Scoped studio
                engagements can start around $30,000 when the operating problem is focused.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button size="lg" asChild className="text-sm font-medium h-11 px-7 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                  <Link href="/contact-sales">Book an intake call <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Link href="/studio/engagements" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3">
                  See engagements <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
