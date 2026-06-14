/**
 * /docs — public docs index. Removes the 404 the audit flagged for /docs.
 * For now this is a hub that points to per-product docs and a "request docs"
 * email. When per-product docs are written, replace each Link with the real
 * doc route.
 *
 * Visual register matches homepage v6.
 */

import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Docs — Perpetual Core",
  description:
    "Documentation for Perpetual Core products and engagements. Per-product docs at the respective subdomains; engagement docs are private and shared per client.",
};

const PRODUCT_DOCS = [
  {
    name: "Atlas",
    body: "Operating manual for AI-native COO installs. Currently private; shared with pilot funds under NDA.",
    href: "/products/atlas",
    external: false,
  },
  {
    name: "Sentinel",
    body: "Due-diligence and intel toolkit docs. Live at the product surface.",
    href: "https://sentinel.perpetualcore.com",
    external: true,
  },
  {
    name: "Sage",
    body: "Personal AI OS — voice clone setup, Telegram/web bindings, ambient capture.",
    href: "https://sage.perpetualcore.com",
    external: true,
  },
  {
    name: "Vellum",
    body: "Institutional memory — source ingestion, query patterns, retention policies.",
    href: "/products/vellum",
    external: false,
  },
  {
    name: "RFP Engine",
    body: "Bid intelligence + capability statement workflow.",
    href: "https://rfp.perpetualcore.com",
    external: true,
  },
  {
    name: "RFP Sentry",
    body: "Compliance gate + protest-class flagging. Build status.",
    href: "/products/rfp-sentry",
    external: false,
  },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3 text-muted-foreground">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em]">{index}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.22em]">{label}</span>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
          <SectionRail index="00" label="Docs" />
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-[-0.025em] text-foreground">
              Read the manual.
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-muted-foreground leading-[1.65] max-w-2xl">
              Each product ships with its own docs at its own surface.
              Engagement runbooks are private and shared per client. Public
              docs index below.
            </p>
          </div>
        </div>
      </section>

      {/* Product docs grid */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="01" label="Product docs" />
            <div className="grid sm:grid-cols-2 gap-px bg-border border border-border">
              {PRODUCT_DOCS.map((doc) => {
                const inner = (
                  <>
                    <BookOpen className="h-5 w-5 text-foreground mb-4" />
                    <p className="text-base font-semibold tracking-[-0.01em] text-foreground mb-2 inline-flex items-center">
                      {doc.name}
                      {doc.external && <ArrowUpRight className="ml-1 h-4 w-4" />}
                    </p>
                    <p className="text-sm text-muted-foreground leading-[1.6]">
                      {doc.body}
                    </p>
                  </>
                );
                return doc.external ? (
                  <a
                    key={doc.name}
                    href={doc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-card p-6 sm:p-7 hover:bg-surface-hover transition-colors"
                  >
                    {inner}
                  </a>
                ) : (
                  <Link
                    key={doc.name}
                    href={doc.href}
                    className="group bg-card p-6 sm:p-7 hover:bg-surface-hover transition-colors"
                  >
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Engagement docs */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="02" label="Engagement docs" />
            <div className="max-w-3xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Private by design.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                Every engagement ships with a written runbook scoped to the
                install: operational map, AI opportunity ranking, outcome-eval
                scope, and a co-signed contract framework. Engagement runbooks
                are not public — they're shared with the client and stored in
                a private vault for the duration of the contract and beyond.
              </p>
              <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                <Link href="/studio/methodology">
                  Read the methodology <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
