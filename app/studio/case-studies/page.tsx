/**
 * /studio/case-studies — three abstracted slot cards.
 *
 * Per COPY_STUDIO.md Page 5 + BRIEF_RECONCILED §B5: no published client
 * names. Each card shows SECTOR + CONSTRAINT + INSTALL + OUTCOME.
 * All client/partner specifics are abstracted to sector and constraint
 * regime. No fabricated quantitative metrics — qualitative outcomes only.
 *
 * DO NOT fabricate metrics. DO NOT name real clients. The slots are
 * deliberately abstracted to the regulatory regime / sector — that is
 * the credential, not a logo wall.
 *
 * Sections:
 *   1. Hero (text-only — explains why we don't publish names)
 *   2. Three abstracted slot cards (SECTOR / CONSTRAINT / INSTALL / OUTCOME)
 *   3. Final CTA
 *
 * Sharpening levers from UI audit §5: gradient text on H1 only,
 * mono-violet, max-w-3xl prose columns.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Case Studies — Perpetual Core",
  description:
    "We don't publish client names. Mission-driven buyers don't want their data on our website. Three abstracted case studies — sector and constraint regime, no logos.",
};

const SLOTS = [
  {
    sector: "A UN-aligned humanitarian agency operating across East Africa.",
    constraint:
      "Under PEPFAR data-sovereignty rules, IRB review, and zero-cellular-fallback assumptions.",
    install:
      "Eight registries scoped to field-officer intake, beneficiary case management, and IRB-compliant consent workflows. Skills built for offline-first data capture syncing on cellular reconnect, PII redaction at the edge, and PEPFAR-compliant export pipelines. Three departments — clinical, M&E, and field ops — running on the same registry layer by week 12.",
    outcome:
      "Field officers stopped re-entering patient data across four legacy systems. M&E reports that previously took two weeks now compile from the registry on demand. The system survived a one-week regional connectivity outage during a public-health emergency without data loss — the offline-first install was the install.",
  },
  {
    sector: "A community-college workforce program in New York.",
    constraint:
      "Under FERPA, multi-agency reporting requirements, and outcomes-based funding tied to job placement.",
    install:
      "Eight registries installed across student intake, case management, employer partnerships, and outcomes reporting. Skills built for FERPA-compliant case notes, employer placement tracking with consent-bounded data sharing, and the multi-agency reporting templates the program's funder required quarterly. The case-management workflow that used to live across a CRM, a spreadsheet, and a Google Form now lives in one place.",
    outcome:
      "Case managers stopped maintaining duplicate records across three systems. Quarterly funder reports compile in hours, not days. The employer-placement registry surfaces students whose certificates align with current open roles — a workflow the program previously ran by hand at term end. The skills library outlived the engagement; new program coordinators inherit it as the operating model.",
  },
  {
    sector: "A faith institution with a multi-state network.",
    constraint:
      "Under multi-jurisdictional consent regimes, donor-data sensitivity, and offline-first field deployment.",
    install:
      "Eight registries installed across membership, ministry programs, and donor relations. Skills built for multi-jurisdiction consent capture (different states, different rules), offline-first event check-in for satellite locations, and a knowledge registry that synthesizes leadership voice notes, sermons, and field reports into one queryable archive. The ministry's institutional memory — previously held by three long-tenured staff — became extractable infrastructure.",
    outcome:
      "The network's central staff stopped fielding 'where is that document' requests throughout the day. Satellite locations register attendance and capture consent in offline mode, syncing on reconnect. The institutional-memory layer (the same Knowledge registry Vellum operates on — see /products/vellum) lets new ministers ramp into a multi-decade context without three months of one-on-ones.",
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* 1. Hero */}
      <section className="container mx-auto px-4 pt-24 pb-20 sm:pt-32">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-6">
            Case studies.
          </p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-8">
            We don&apos;t publish{" "}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              client names
            </span>
            .
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-6">
            Mission-driven buyers don&apos;t want their data on our website.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Here&apos;s what we built, abstracted to the sector and the constraint regime. The constraints are the credential — not the logo. If your operation runs under one of these, we&apos;ve been there.
          </p>
        </div>
      </section>

      {/* 2. Three abstracted slot cards */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl">
          {SLOTS.map((slot, i) => (
            <Card
              key={slot.sector}
              className="border-border/60 hover:border-primary/40 transition-colors flex flex-col"
            >
              <CardContent className="p-7 flex flex-col h-full">
                <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-6">
                  Slot {String(i + 1).padStart(2, "0")}
                </p>
                <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-2">
                  Sector
                </p>
                <p className="text-base leading-relaxed mb-5">{slot.sector}</p>
                <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-2">
                  Constraint
                </p>
                <p className="text-base leading-relaxed mb-5 text-muted-foreground">
                  {slot.constraint}
                </p>
                <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-2">
                  Install
                </p>
                <p className="text-base leading-relaxed mb-5">{slot.install}</p>
                <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-2">
                  Outcome
                </p>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {slot.outcome}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. Final CTA */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Want to see the work behind the abstraction?
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            We walk through specific installs under NDA on intake calls. Engagements start at $75,000.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/contact-sales">
                Book an intake call <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/studio/engagements">See engagements</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
