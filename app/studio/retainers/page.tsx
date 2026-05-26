/**
 * /studio/retainers
 *
 * Retainers are no longer positioned as cheaper consulting. They are managed
 * operating lanes: recurring workflows where the studio runs the AI capability
 * with the buyer until the pattern is ready to become a product, sprint, or
 * larger Engine install.
 */

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Retainers - Managed AI Operating Lanes | Perpetual Core",
  description:
    "Managed AI operating lanes for recurring work: diligence, capture, knowledge, hiring, and operator support. Products are the front door; retainers are where the studio runs the workflow with you.",
};

const LANES = [
  {
    index: "01",
    name: "Diligence Lane",
    product: "Sentinel",
    price: "From $5K/mo",
    buyer: "Funds, attorneys, investigators, operators",
    body: "We run recurring subject, company, and deal diligence with Sentinel as the product layer and studio judgment around the edges.",
    outcome: "A repeatable diligence desk your team can trust before hires, deals, partnerships, or public exposure.",
    href: "mailto:lorenzo@perpetualcore.com?subject=Diligence%20Lane",
  },
  {
    index: "02",
    name: "Capture Lane",
    product: "RFP Engine + RFP Sentry",
    price: "From $7.5K/mo",
    buyer: "Grant-funded orgs, capture teams, EDs",
    body: "We surface opportunities, score fit, prepare first drafts, and keep the capture motion from dying between deadlines.",
    outcome: "A live opportunity pipeline with fewer missed bids and cleaner go/no-go judgment.",
    href: "mailto:lorenzo@perpetualcore.com?subject=Capture%20Lane",
  },
  {
    index: "03",
    name: "Knowledge Lane",
    product: "Vellum",
    price: "From $10K/mo",
    buyer: "Foundations, health systems, multi-program orgs",
    body: "We turn calls, docs, meeting notes, voice memos, and program history into institutional memory your team can actually query.",
    outcome: "Less repeated context, faster onboarding, and a cleaner path from scattered knowledge to operating system.",
    href: "mailto:lorenzo@perpetualcore.com?subject=Knowledge%20Lane",
  },
  {
    index: "04",
    name: "People Lane",
    product: "Janice",
    price: "From $7.5K/mo",
    buyer: "Workforce orgs, agencies, intern-heavy teams",
    body: "We manage the candidate, intern, staff, or partner lifecycle with intake, documents, onboarding, and follow-through in one lane.",
    outcome: "A cleaner people operation where forms, follow-ups, files, and decisions stop living in separate places.",
    href: "mailto:lorenzo@perpetualcore.com?subject=People%20Lane",
  },
  {
    index: "05",
    name: "Operator Lane",
    product: "Atelier + Sage",
    price: "From $10K/mo",
    buyer: "Founders, COOs, operating partners",
    body: "We sit beside the operator: tuning workflows, cleaning handoffs, building skills, and reviewing where AI should become process.",
    outcome: "A monthly operating rhythm that turns scattered AI use into a managed execution layer.",
    href: "mailto:lorenzo@perpetualcore.com?subject=Operator%20Lane",
  },
];

const STEPS = [
  {
    title: "Pick the lane",
    body: "We identify the recurring workflow already costing time, attention, or missed opportunity.",
  },
  {
    title: "Attach the product",
    body: "We start with the product closest to the work so value appears quickly, not after a long transformation plan.",
  },
  {
    title: "Run it with you",
    body: "The studio operates the workflow, tunes the agents, and documents what repeats.",
  },
  {
    title: "Decide what it becomes",
    body: "Stay on retainer, expand into a sprint, install the Engine, or productize the pattern.",
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

      <section className="relative overflow-hidden border-b border-border text-white engine-gradient">
        <div className="signal-grid absolute inset-0 opacity-60" />
        <div className="relative container mx-auto px-6 sm:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-[1fr_360px] gap-14 lg:gap-20 items-end">
            <div className="max-w-5xl">
              <div className="flex items-center gap-3 mb-10">
                <span aria-hidden className="block h-2 w-2 bg-[#26f2a8] shadow-[0_0_18px_rgba(38,242,168,0.75)]" />
                <p className="eyebrow !text-white/70">Studio retainers · Managed operating lanes</p>
              </div>
              <h1 className="display-hero text-[52px] sm:text-[76px] lg:text-[106px] text-white leading-[0.96] mb-10 max-w-5xl">
                We run the workflow until it becomes{" "}
                <span className="italic text-gradient">a system.</span>
              </h1>
              <p className="text-lg sm:text-xl text-white/72 leading-[1.55] max-w-3xl mb-10">
                Retainers are for recurring work that is already important but not yet ready for a
                full install. We attach a product, operate the lane with you, and turn what repeats
                into the next product, sprint, or Engine install.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Button asChild size="lg" className="h-12 px-7 rounded-[6px] bg-[#26f2a8] text-[#05060b] shadow-none hover:bg-[#7dffd0]">
                  <Link href="/contact-sales">
                    Map the first workflow <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Link href="/products" className="inline-flex items-center py-3 text-sm font-medium text-white border-b border-white/25 hover:border-[#00d4ff] hover:text-[#00d4ff] transition-colors">
                  See product front doors <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <aside className="border border-white/15 bg-white/[0.06] backdrop-blur-xl p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00d4ff] mb-6">
                Best fit
              </p>
              <div className="space-y-5 text-sm text-white/68 leading-[1.65]">
                <p>
                  You have a recurring workflow that is too important for casual AI use, but too
                  narrow for a full organizational install.
                </p>
                <p>
                  You want a managed lane with a real operator in the loop, measurable outputs, and
                  a path to scale if it works.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-[#f5f7ff]">
        <div className="container mx-auto px-6 sm:px-8 py-20 sm:py-24">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="01" label="The offer" />
            <div>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-0.025em] leading-[1.02] text-foreground mb-10 max-w-3xl">
                A retainer is not hours. It is an operating lane.
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
                {STEPS.map((step, index) => (
                  <div key={step.title} className="bg-background p-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-8">
                      0{index + 1}
                    </p>
                    <h3 className="text-lg font-semibold tracking-[-0.01em] text-foreground mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-[1.65]">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="container mx-auto px-6 sm:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="02" label="Lanes" />
            <div>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-0.025em] leading-[1.02] text-foreground mb-10 max-w-3xl">
                Choose the workflow you want operating.
              </h2>
              <div className="border-y border-border">
                {LANES.map((lane) => (
                  <a key={lane.name} href={lane.href} className="group block py-7 border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors">
                    <div className="grid lg:grid-cols-[70px_220px_180px_1fr_150px] gap-4 lg:gap-8 items-baseline">
                      <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">{lane.index}</span>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-2">
                          {lane.product}
                        </p>
                        <h3 className="text-xl font-semibold tracking-[-0.015em] text-foreground group-hover:text-primary transition-colors">
                          {lane.name}
                        </h3>
                      </div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground">
                        {lane.price}
                      </p>
                      <div>
                        <p className="text-sm text-muted-foreground leading-[1.65] mb-3">{lane.body}</p>
                        <p className="text-sm text-foreground leading-[1.55]">{lane.outcome}</p>
                      </div>
                      <span className="inline-flex items-center text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                        Start lane <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-[#eef2ff]">
        <div className="container mx-auto px-6 sm:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="03" label="When to use this" />
            <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
              {[
                ["Too much for self-serve", "The product helps, but the workflow needs ongoing judgment, routing, and follow-through."],
                ["Too narrow for a full install", "The problem is real, but it does not need the whole operating system on day one."],
                ["Ready to prove a pattern", "The lane should teach us whether this becomes a sprint, product, install, or venture thesis."],
              ].map(([title, body]) => (
                <div key={title} className="bg-background p-6 sm:p-7">
                  <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-[1.65]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="container mx-auto px-6 sm:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="04" label="Next step" />
            <div className="max-w-3xl">
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-0.025em] leading-[1.02] text-foreground mb-6">
                Tell us the workflow you want off your team&apos;s back.
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-[1.65] mb-10">
                We will tell you whether it should start as a product, a managed lane, a scoped
                studio sprint, or a larger Engine install.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Button asChild size="lg" className="h-11 px-7 rounded-[6px] bg-primary text-primary-foreground shadow-[0_14px_42px_rgba(75,53,255,0.22)] hover:bg-[#3324d9]">
                  <Link href="/contact-sales">
                    Map the first workflow <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-11 px-7 rounded-[6px] shadow-none">
                  <Link href="/studio/engagements">
                    See studio sprints <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
