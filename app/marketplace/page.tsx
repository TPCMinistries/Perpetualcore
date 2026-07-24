import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  Layers3,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkipLink } from "@/components/ui/accessibility";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { MarketplaceExplorer } from "@/components/marketplace/MarketplaceExplorer";
import { MARKETPLACE_CATEGORIES, MARKETPLACE_ITEMS } from "@/lib/marketplace/catalog";

export const metadata = {
  title: "Marketplace — Perpetual Core",
  description:
    "Explore Perpetual Core products and capabilities for opportunity, operations, intelligence, people, institutional memory, and media.",
};

const INVENTORY_TYPES = [
  {
    icon: Boxes,
    label: "Products",
    title: "Complete systems for a specific company job.",
    body:
      "Use a production surface, join a gated release, or start an assisted pilot when the job is already clear.",
  },
  {
    icon: Wrench,
    label: "Capabilities",
    title: "Skills, agents, connectors, and workflows.",
    body:
      "Installable building blocks extend the product layer. Community commerce remains gated until inventory, review, and seller claims are verified.",
  },
  {
    icon: Building2,
    label: "Company systems",
    title: "Connected outcomes installed by the studio.",
    body:
      "Combine multiple products and capabilities into an opportunity system, knowledge system, people system, or operating layer.",
  },
] as const;

export default function MarketplacePage() {
  return (
    <div className="public-light min-h-screen bg-background">
      <SkipLink />
      <Navbar />

      <main id="main-content">
        <section className="relative overflow-hidden border-b border-white/10 bg-[#070914] py-20 text-white sm:py-28">
          <div className="signal-grid absolute inset-0 opacity-55" aria-hidden="true" />
          <div
            className="absolute left-1/4 top-0 h-[28rem] w-[28rem] rounded-full bg-[#4b35ff]/25 blur-[120px]"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-[1500px] px-6 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-20">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#6dd7ff]">
                  Perpetual Core Marketplace
                </p>
                <h1 className="mt-6 max-w-5xl text-[50px] font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-[72px] lg:text-[90px]">
                  Start with the job.{" "}
                  <span className="font-display font-normal italic text-gradient">
                    Build toward the system.
                  </span>
                </h1>
              </div>
              <div className="lg:pb-2">
                <p className="max-w-2xl text-lg leading-8 text-white/65">
                  Browse specialized products by the outcome you need. Every
                  listing shows its current availability and delivery model, so
                  a live product does not get confused with a private release,
                  pilot, or installed engagement.
                </p>
                <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/52">
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#26f2a8]" aria-hidden="true" />
                    {MARKETPLACE_ITEMS.length} current capability surfaces
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#6dd7ff]" aria-hidden="true" />
                    Availability labeled explicitly
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-[#f5f7ff] py-16 sm:py-20">
          <div className="container mx-auto px-6 sm:px-8">
            <div className="grid gap-px overflow-hidden rounded-lg border border-[#d9ddff] bg-[#d9ddff] lg:grid-cols-3">
              {INVENTORY_TYPES.map((item) => (
                <div key={item.label} className="bg-white p-6 sm:p-7">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                      {item.label}
                    </p>
                    <item.icon className="h-5 w-5 text-primary/60" aria-hidden="true" />
                  </div>
                  <h2 className="mt-10 text-xl font-semibold tracking-[-0.025em] text-foreground">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#080a13] py-20 text-white sm:py-28">
          <div className="mx-auto max-w-[1500px] px-6 sm:px-8">
            <div className="mb-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:gap-20">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#6dd7ff]">
                  Products and capability surfaces
                </p>
                <h2 className="mt-5 text-4xl font-semibold leading-[1.03] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
                  Find the work you want out of the manual layer.
                </h2>
              </div>
              <p className="max-w-3xl text-lg leading-8 text-white/60">
                Search by product, buyer, or capability. Category filters are
                based on customer jobs rather than internal company structure.
              </p>
            </div>
            <MarketplaceExplorer />
          </div>
        </section>

        <section className="border-b border-border py-20 sm:py-28">
          <div className="container mx-auto px-6 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
              <div>
                <p className="eyebrow text-primary">Five doors into the portfolio</p>
                <h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-foreground sm:text-5xl">
                  Categories are a starting point, not a silo.
                </h2>
              </div>
              <div className="border-y border-border">
                {MARKETPLACE_CATEGORIES.map((category, index) => (
                  <div
                    key={category.id}
                    id={category.id}
                    className="scroll-mt-28 grid grid-cols-[44px_1fr] gap-4 border-b border-border py-6 last:border-b-0 sm:grid-cols-[56px_190px_1fr] sm:items-baseline sm:gap-6"
                  >
                    <span
                      className="font-mono text-[10px] tracking-[0.18em]"
                      style={{ color: category.accent }}
                    >
                      0{index + 1}
                    </span>
                    <h3 className="font-semibold text-foreground">{category.label}</h3>
                    <p className="col-start-2 text-sm leading-6 text-muted-foreground sm:col-start-auto">
                      {category.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f5f7ff] py-20 sm:py-28">
          <div className="container mx-auto px-6 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:gap-20">
              <div>
                <p className="eyebrow text-primary">When one product is not enough</p>
                <h2 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">
                  Bring us the workflow between the products.
                </h2>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
                  The studio maps the handoffs, authority boundaries, source
                  systems, and outcomes—then installs the smallest connected
                  system that can prove value.
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="min-h-12 px-7 text-base">
                    <Link href="/contact-sales">
                      Map my company <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="min-h-12 px-7 text-base">
                    <Link href="/studio">See the studio</Link>
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border border-[#d9ddff] bg-white p-7 shadow-[0_24px_80px_rgba(75,53,255,0.08)] sm:p-8">
                <Layers3 className="h-6 w-6 text-primary" aria-hidden="true" />
                <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                  A company system can combine
                </p>
                <ul className="mt-6 space-y-4 text-sm leading-6 text-muted-foreground">
                  {[
                    "A product surface for the daily job",
                    "Connectors to existing systems of record",
                    "Authorized agents and versioned workflows",
                    "Human review for consequential actions",
                    "Outcome receipts and an operating cadence",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
