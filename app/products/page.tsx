/**
 * /products — portfolio overview (arm 02 of the company).
 * Seven products with status pills, mono indices, hairline grid.
 * Visual register matches homepage v5.
 *
 * Order: Atlas → Sentinel → Sage → Vellum → RFP Engine → RFP Sentry → Janice.
 */

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { DecisionTree } from "@/components/products/DecisionTree";

export const metadata = {
  title: "Products — Perpetual Core",
  description:
    "Seven AI-native products. Each one shipped in an engagement. Each one still running. The portfolio is the proof; the engagement is the work.",
};

type Product = {
  index: string;
  name: string;
  status: string;
  statusColor: "live" | "pilot" | "invite";
  headline: string;
  body: string;
  pricing?: string;
  cta: { label: string; href: string; external?: boolean };
};

const PRODUCTS: Product[] = [
  {
    index: "01",
    name: "Atlas",
    status: "IN PILOT",
    statusColor: "pilot",
    headline: "AI-native COO for fund-backed portfolio companies.",
    body:
      "For PE Operating Partners and fund Ops leads installing an AI operating system across a portco in 6 to 10 weeks, before the next quarterly board meeting. In pilot with select funds — by introduction only.",
    cta: { label: "Visit Atlas", href: "https://atlas.perpetualcore.com", external: true },
  },
  {
    index: "02",
    name: "Sentinel",
    status: "LIVE",
    statusColor: "live",
    headline: "Due diligence and intel for the people Kroll won't take calls from.",
    body:
      "For attorneys, investigators, journalists, and operators running pre-deal or pre-hire diligence on subjects the legacy CRAs decline to touch. Production-grade. The first product we shipped from an engagement and kept running.",
    cta: { label: "Run a vet", href: "https://sentinel.perpetualcore.com", external: true },
  },
  {
    index: "03",
    name: "Sage",
    status: "BUILD",
    statusColor: "invite",
    headline: "Personal AI OS with ambient context and your voice.",
    body:
      "For operators who run two or more entities, live in voice memos, and want a relational AI partner — coach, chief of staff, strategist — not a chatbot you re-explain yourself to every morning. Lives wherever you do. Telegram, voice, web. 15% of every Sage subscription funds the Institute for Human Advancement.",
    cta: { label: "Meet Sage", href: "https://sage.perpetualcore.com", external: true },
  },
  {
    index: "04",
    name: "Vellum",
    status: "BUILD",
    statusColor: "invite",
    headline: "Institutional knowledge for organizations.",
    body:
      "For executive directors, founders, and program directors whose calls, docs, voice notes, and Slack channels need to be one queryable archive — not seventeen disconnected sources. 30% mission-driven discount on Operator and Team for verified 501(c)(3)s.",
    pricing: "Free / $49 Operator / $249 Team / Institution Contact",
    cta: { label: "See Vellum", href: "/products/vellum" },
  },
  {
    index: "05",
    name: "RFP Engine",
    status: "LIVE",
    statusColor: "live",
    headline: "Find the right RFP. Draft it in your voice. Ship it clean.",
    body:
      "For grant writers, capture managers, and EDs responding to federal, state, and foundation RFPs at capture-grade quality. Discovery every 6 hours. Drafting in your voice, not generic AI prose.",
    cta: { label: "Visit RFP Engine", href: "https://rfp.perpetualcore.com", external: true },
  },
  {
    index: "06",
    name: "RFP Sentry",
    status: "BUILD",
    statusColor: "invite",
    headline: "Bid intelligence and compliance gate.",
    body:
      "For capture teams who'd rather lose a deal at the bid/no-bid step than after writing the proposal. Sister product to RFP Engine. Score RFPs for fit before you write. Compliance flags surface before submission, not after a debrief.",
    cta: { label: "Join the early list", href: "/products/rfp-sentry" },
  },
  {
    index: "07",
    name: "Janice",
    status: "LIVE",
    statusColor: "live",
    headline: "Hiring and onboarding OS for people-heavy orgs.",
    body:
      "For nonprofits, agencies, and ecosystem operators running candidates, interns, staff, and partners through one shared lifecycle — templated intake, e-signature, per-person vaults, multi-tenant by default. Built internal-first for Uplift's intern pipeline and IHA's program staff; productized for external sale. Self-serve from $79/month with a 60-day pilot.",
    cta: { label: "Visit Janice", href: "https://janice.perpetualcore.com", external: true },
  },
];

function StatusPill({ status, color }: { status: string; color: "live" | "pilot" | "invite" }) {
  const dot = {
    live: "bg-status-live",
    pilot: "bg-status-pilot",
    invite: "bg-status-invite",
  }[color];
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
      <span
        className={`block h-1.5 w-1.5 rounded-full ${dot} ${color === "live" ? "animate-pulse-dot" : ""}`}
      />
      {status}
    </span>
  );
}

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div>
      <p className="eyebrow mb-3">§ {index}</p>
      <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">{label}</h2>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 bg-foreground" />
            <p className="eyebrow !text-foreground/70">§ 02 · Portfolio</p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[76px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            Seven products. Each one{" "}
            <span className="italic text-foreground/85">shipped in an engagement.</span> Each one
            still running.
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>
              Every product on this site is a working installation we built for a client and kept
              operating. The portfolio is the proof; the engagement is the work.
            </p>
            <p>
              We don&apos;t sell features. We install operating systems, and the products are what
              falls out — public demonstrations of capability that other organizations can also
              use. If a product on this list looks like the thing you&apos;d want installed in your
              org, the engagement is how that happens.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button
              size="lg"
              asChild
              className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
            >
              <Link href="/studio/engagements">
                Start an engagement <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Link
              href="/studio/methodology"
              className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary"
            >
              Read the methodology <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Decision tree — which product do I need? */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Pick the right one" />
            <div className="max-w-3xl">
              <h3 className="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-foreground mb-3">
                Not sure which one you need?
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-[1.7] mb-8">
                Two questions, one honest recommendation. You can still browse the
                full portfolio below.
              </p>
              <DecisionTree />
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio grid */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="—" label="In production" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                Seven products in the portfolio.
              </h3>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            {PRODUCTS.map((p, idx) => {
              const className = `group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col border-border ${
                idx >= 2 ? "sm:border-t" : ""
              } ${idx >= 3 ? "lg:border-t-0 xl:border-t-0" : ""} ${idx >= 4 ? "xl:border-t" : ""}`;
              const inner = (
                <>
                  <div className="flex items-center justify-between mb-10">
                    <span className="font-mono text-[10px] text-muted-foreground tracking-[0.18em]">
                      {p.index}
                    </span>
                    <StatusPill status={p.status} color={p.statusColor} />
                  </div>
                  <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                    {p.name}
                  </h4>
                  <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-4">
                    {p.headline}
                  </p>
                  <p className="text-sm text-muted-foreground leading-[1.6] mb-6 flex-1">
                    {p.body}
                  </p>
                  {p.pricing && (
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground pt-3 mt-auto border-t border-border/60 mb-4">
                      {p.pricing}
                    </p>
                  )}
                  <span className="inline-flex items-center text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors mt-auto">
                    {p.cta.label}
                    {p.cta.external ? (
                      <ArrowUpRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    ) : (
                      <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </span>
                </>
              );
              return p.cta.external ? (
                <a key={p.name} href={p.cta.href} target="_blank" rel="noopener noreferrer" className={className}>
                  {inner}
                </a>
              ) : (
                <Link key={p.name} href={p.cta.href} className={className}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="The work" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                If you want one of these installed in your org, the engagement is how that happens.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                Engagements start at $75,000. We take a limited number per quarter.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button
                  size="lg"
                  asChild
                  className="text-sm font-medium h-11 px-7 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
                >
                  <Link href="/studio/engagements">
                    Start an engagement <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Link
                  href="/contact-sales"
                  className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3"
                >
                  Book an intake call <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
