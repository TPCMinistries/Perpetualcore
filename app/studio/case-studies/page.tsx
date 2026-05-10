/**
 * /studio/case-studies — three abstracted slot cards.
 *
 * Per COPY_STUDIO.md Page 5 + BRIEF_RECONCILED §B5: no published client
 * names. Each card shows SECTOR + CONSTRAINT label only. Body uses the
 * placeholder copy "Case study available under NDA. Ask in your intake
 * call." until Lorenzo writes the abstracted versions.
 *
 * DO NOT fabricate metrics. DO NOT name real clients. The slots are
 * deliberately abstracted to the regulatory regime / sector — that is
 * the credential, not a logo wall.
 *
 * Sections:
 *   1. Hero (text-only — explains why we don't publish names)
 *   2. Three abstracted slot cards
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
  },
  {
    sector: "A community-college workforce program in New York.",
    constraint:
      "Under FERPA, multi-agency reporting requirements, and outcomes-based funding tied to job placement.",
  },
  {
    sector: "A faith institution with a multi-state network.",
    constraint:
      "Under multi-jurisdictional consent regimes, donor-data sensitivity, and offline-first field deployment.",
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
                <div className="mb-6">
                  <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">
                    Slot {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-2">
                    Sector
                  </p>
                  <p className="text-base leading-relaxed mb-5">{slot.sector}</p>
                  <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-2">
                    Constraint
                  </p>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {slot.constraint}
                  </p>
                </div>
                <div className="mt-auto pt-6 border-t border-border/40">
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    Case study available under NDA. Ask in your intake call.
                  </p>
                </div>
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
