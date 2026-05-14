/**
 * /studio/retainers — the productized middle band.
 *
 * Sits between Products (self-serve SaaS) and Engagements (high-touch install).
 * Productized programs at $5K–$15K/mo: ongoing AI capability for orgs that
 * want operator-grade systems without an engagement commitment.
 *
 * Visual register matches homepage v6.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Retainers — Perpetual Core",
  description:
    "Productized AI programs on monthly retainer — $5K–$15K/mo. Sentinel on retainer, capture pipelines, operator concierge, skills subscriptions. Operator-grade AI capability without a $75K engagement commitment.",
};

const PROGRAMS = [
  {
    index: "01",
    name: "Sentinel on Retainer",
    price: "$5,000",
    cadence: "/month",
    sla: "Unlimited vets · 48-hour SLA",
    body: "Production Sentinel run for one organization on a monthly subscription. Unlimited DD vets per month. We operate the agent; you receive the dossiers. For legal teams, investigators, journalists, and operators who need ongoing DD capability — not a one-off vet.",
    audience: "Legal · Investigations · Journalism",
    cta: "Start a retainer",
    href: "mailto:retainers@perpetualcore.com?subject=Sentinel%20retainer",
  },
  {
    index: "02",
    name: "Capture Pipeline",
    price: "$7,500",
    cadence: "/month",
    sla: "Discovery every 6h · Weekly digest",
    body: "Managed RFP discovery and drafting. RFP Engine + RFP Sentry run as a service. We surface scored opportunities, deliver draft responses on request, and brief you weekly. For capture teams, EDs, and grant-funded orgs who need pipeline volume without staffing for it.",
    audience: "Capture teams · Grant orgs · EDs",
    cta: "Talk to capture",
    href: "mailto:retainers@perpetualcore.com?subject=Capture%20pipeline%20retainer",
  },
  {
    index: "03",
    name: "Operator Concierge",
    price: "$10,000",
    cadence: "/month",
    sla: "10 hours · Quarterly business review",
    body: "Productized AI operations review. Ten hours of operator-grade time per month — agent tuning, workflow optimization, skill audits, vendor consolidation. Quarterly business review with your executive team. For orgs who installed AI piecemeal and need ongoing operator oversight.",
    audience: "Founders · COOs · Operating partners",
    cta: "Start a concierge",
    href: "mailto:retainers@perpetualcore.com?subject=Operator%20concierge%20retainer",
  },
  {
    index: "04",
    name: "Skills Subscription",
    price: "$5,000",
    cadence: "/month",
    sla: "One production skill per month",
    body: "We build one production skill per month against your real workflows — SKILL.md format, per-org JSON config, versioned and auditable. The library compounds; you keep them all. For orgs that want gradual automation without an engagement, and a compounding skills asset that grows month over month.",
    audience: "Mid-market orgs · Steady-cadence buyers",
    cta: "Subscribe to skills",
    href: "mailto:retainers@perpetualcore.com?subject=Skills%20subscription",
  },
  {
    index: "05",
    name: "Vellum Institutional",
    price: "$15,000+",
    cadence: "/month",
    sla: "SSO · custom retention · on-prem option",
    body: "Managed Vellum deployment for institutions whose data can't leave their infrastructure or whose compliance team needs every retention parameter on the table. White-glove install, ongoing tune, dedicated retention engineering. Includes the underlying institutional-memory product.",
    audience: "Health systems · Foundations · Universities",
    cta: "Contact for Institutional",
    href: "mailto:retainers@perpetualcore.com?subject=Vellum%20Institutional",
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

export default function StudioRetainersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 bg-foreground" />
            <p className="eyebrow !text-foreground/70">§ 01 · Studio · Retainers</p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            Productized AI capability —{" "}
            <span className="italic text-foreground/85">on a monthly retainer.</span>
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>
              The band between subscribing to a product and installing the full Engine. Five
              productized programs your team uses ongoing, at $5,000–$15,000/month. We operate the
              agents. Your team gets the output. No engagement commitment required.
            </p>
            <p>
              Retainers run continuously, cancellable monthly, and roll into a full engagement when
              the org is ready. Many start here.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button
              size="lg"
              asChild
              className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
            >
              <Link href="#programs">
                See the programs <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Link
              href="/studio/engagements"
              className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary"
            >
              See engagements <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Where retainers sit in the spectrum */}
      <section className="border-t border-border py-20 sm:py-24 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-10">
            <SectionRail index="01" label="The spectrum" />
            <div className="max-w-2xl">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground mb-6">
                Three bands. Pick the one that fits.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Retainers are the middle band. Below them: self-serve products. Above them: full
                engagements. The studio meets you at the cadence you need — and you can move
                between bands as the work grows.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            <Link
              href="/products"
              className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col"
            >
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">
                BAND · 01
              </p>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                Products
              </h4>
              <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-2">
                Self-serve
              </p>
              <p className="text-sm text-muted-foreground leading-[1.6] mb-6 flex-1">
                Subscribe to a product. Platform, Vellum, Sage, RFP Engine. $0 to $249/mo. The
                operator drives.
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground mt-auto">
                $0 → $249/mo
              </p>
            </Link>

            <div className="block p-6 sm:p-7 bg-foreground text-background flex flex-col">
              <p className="font-mono text-[10px] tracking-[0.18em] text-background/60 mb-10">
                BAND · 02 · YOU ARE HERE
              </p>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-background mb-3">
                Retainers
              </h4>
              <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-background mb-2">
                Productized
              </p>
              <p className="text-sm text-background/75 leading-[1.6] mb-6 flex-1">
                Hire a managed program. We operate. You receive output on a monthly cadence.
                Cancellable any month.
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-background mt-auto">
                $5K → $15K/mo
              </p>
            </div>

            <Link
              href="/studio/engagements"
              className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col"
            >
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">
                BAND · 03
              </p>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                Engagements
              </h4>
              <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-2">
                The install
              </p>
              <p className="text-sm text-muted-foreground leading-[1.6] mb-6 flex-1">
                Install the Engine across your org. 90 to 180 days. Documented, trained, handed
                over. You own the system after.
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground mt-auto">
                $75K → $250K+
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="02" label="Five programs" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Each one runs every month. None require a $75K commitment.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Start with one. Move between them. Roll into an engagement when the work justifies
                it. Or stay on retainer indefinitely — many do.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-4xl border-t border-border">
              {PROGRAMS.map((p) => (
                <a
                  key={p.name}
                  href={p.href}
                  className="group block py-8 border-b border-border hover:bg-surface-hover transition-colors"
                >
                  <div className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr_180px] gap-x-6 sm:gap-x-10 gap-y-2">
                    <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground pt-1">
                      {p.index}
                    </span>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary mb-2">
                        {p.audience}
                      </p>
                      <h4 className="text-xl sm:text-2xl font-semibold tracking-[-0.015em] text-foreground mb-3 group-hover:text-primary transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-base text-muted-foreground leading-[1.65] mb-3 max-w-2xl">
                        {p.body}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                        {p.sla}
                      </p>
                    </div>
                    <div className="text-left sm:text-right col-span-2 sm:col-auto mt-2 sm:mt-0">
                      <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground">
                        {p.price}
                        <span className="text-sm font-mono text-muted-foreground ml-1">
                          {p.cadence}
                        </span>
                      </p>
                      <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.18em] text-foreground group-hover:text-primary transition-colors mt-3">
                        {p.cta}
                        <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How retainers work */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="03" label="How retainers work" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-10">
                Productized means productized.
              </h3>
              <div className="space-y-5 text-base text-muted-foreground leading-[1.7]">
                <p>
                  Each retainer has a fixed scope and a fixed monthly fee. You know what arrives,
                  when, and at what cost. No SOW renegotiation. No hourly drift. No surprise
                  invoices.
                </p>
                <p>
                  We operate the AI capability. You receive the output. The agents, the skills, the
                  pipelines all run on Perpetual Core&apos;s infrastructure — the same eight-registry
                  Engine the studio installs in full engagements. You don&apos;t inherit the
                  substrate (that&apos;s the engagement); you inherit the output it produces.
                </p>
                <p>
                  Cancellable any month, 30 days&apos; notice. Move up to an engagement at any
                  point and the retainer fees from the prior six months credit toward the
                  engagement. We don&apos;t double-bill.
                </p>
                <p className="text-foreground font-medium">
                  Retainers are the studio at production cadence. Engagements are the studio at
                  installation cadence. Same team. Same Engine. Different surface.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Start a retainer" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Tell us what you want operating in 30 days.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                Most retainers start within two weeks of the conversation. Pick a program above, or
                describe what you want running and we&apos;ll match it.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button
                  size="lg"
                  asChild
                  className="text-sm font-medium h-11 px-7 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
                >
                  <a href="mailto:retainers@perpetualcore.com">
                    Start a retainer <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Link
                  href="/studio/engagements"
                  className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3"
                >
                  Or see full engagements <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
