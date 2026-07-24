import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Boxes,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Compass,
  GraduationCap,
  Layers3,
  Network,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkipLink } from "@/components/ui/accessibility";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { OperatingSystemMap } from "@/components/landing/OperatingSystemMap";
import { MarketplaceExplorer } from "@/components/marketplace/MarketplaceExplorer";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { ContentSlot } from "@/components/slots/ContentSlot";
import { MARKETPLACE_ITEMS } from "@/lib/marketplace/catalog";

export const metadata = {
  title: "Perpetual Core — The intelligence layer for companies",
  description:
    "Perpetual Core connects governed company context, specialized AI systems, and human-approved workflows. Start with one capability. Expand into a company-wide operating system.",
};

const ENTRY_POINTS = [
  {
    label: "Platform",
    title: "Connect the company’s intelligence.",
    body:
      "Sage and the Company Graph coordinate approved context, priorities, evidence, and receipts across the systems where work already lives.",
    cta: "See the operating layer",
    href: "#operating-layer",
    icon: Network,
  },
  {
    label: "Marketplace",
    title: "Start with the job closest to the pain.",
    body:
      "Use a specialized product for opportunity, diligence, knowledge, people, team execution, or media—then connect it to the wider system.",
    cta: "Explore capabilities",
    href: "#marketplace",
    icon: Boxes,
  },
  {
    label: "Studio",
    title: "Install the system around your company.",
    body:
      "When the problem crosses departments or tools, the studio maps the operation, installs the first wedge, trains the team, and expands.",
    cta: "See studio engagements",
    href: "/studio",
    icon: Building2,
  },
] as const;

const BUYER_PATHS = [
  {
    eyebrow: "One urgent job",
    title: "Use a product.",
    body:
      "The buyer already knows the job: find RFPs, run diligence, organize knowledge, coordinate people, or turn recordings into development evidence.",
    cta: "Browse the marketplace",
    href: "/marketplace",
    icon: Sparkles,
  },
  {
    eyebrow: "A connected workflow",
    title: "Install a company system.",
    body:
      "The work crosses tools, teams, or departments. We map the handoffs and install a governed operating lane around live work.",
    cta: "Map the first workflow",
    href: "/contact-sales",
    icon: Workflow,
  },
  {
    eyebrow: "A venture-shaped pattern",
    title: "Build and scale it.",
    body:
      "A repeatable operating pattern can become a product or venture, with the Engine beneath it and DeepFutures as the scale path.",
    cta: "Understand the Engine",
    href: "/engine",
    icon: Layers3,
  },
] as const;

const FLYWHEEL = [
  {
    index: "01",
    title: "Operate",
    body: "Run real programs and companies under real constraints.",
  },
  {
    index: "02",
    title: "Learn",
    body: "Capture bounded evidence about what works, fails, and needs attention.",
  },
  {
    index: "03",
    title: "Productize",
    body: "Turn repeatable operating patterns into products, skills, and company systems.",
  },
  {
    index: "04",
    title: "Install",
    body: "Deploy the proven pattern into another organization with training and governance.",
  },
  {
    index: "05",
    title: "Scale",
    body: "Back venture-shaped patterns and fund human capacity through the wider ecosystem.",
  },
] as const;

const LIVE_COUNT = MARKETPLACE_ITEMS.filter(
  (item) => item.status === "live"
).length;
const PRIVATE_COUNT = MARKETPLACE_ITEMS.filter(
  (item) => item.status === "private" || item.status === "invitation"
).length;

export default function HomePage() {
  return (
    <div className="public-light min-h-screen bg-background">
      <PageViewTracker />
      <SkipLink />
      <Navbar />
      <ContentSlot slotKey="pc-home-banner" />

      <main id="main-content">
        <section className="relative overflow-hidden border-b border-white/10 bg-[#070914] text-white">
          <div className="signal-grid absolute inset-0 opacity-60" aria-hidden="true" />
          <div
            className="absolute left-[-12rem] top-24 h-[34rem] w-[34rem] rounded-full bg-[#4b35ff]/25 blur-[120px]"
            aria-hidden="true"
          />
          <div
            className="absolute right-[-10rem] top-8 h-[30rem] w-[30rem] rounded-full bg-[#00d4ff]/15 blur-[120px]"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-[1500px] px-6 pb-16 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
            <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center xl:gap-20">
              <div className="max-w-4xl">
                <div className="flex items-center gap-3">
                  <span
                    className="h-2 w-2 bg-[#26f2a8] shadow-[0_0_18px_rgba(38,242,168,0.8)]"
                    aria-hidden="true"
                  />
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/62 sm:text-[11px]">
                    Operator-built AI systems company
                  </p>
                </div>

                <h1 className="mt-8 max-w-5xl text-[48px] font-semibold leading-[0.96] tracking-[-0.055em] text-white sm:text-[70px] lg:text-[82px] xl:text-[94px]">
                  Run your company with intelligence{" "}
                  <span className="font-display font-normal italic text-gradient">
                    that compounds.
                  </span>
                </h1>

                <p className="mt-8 max-w-3xl text-lg leading-8 text-white/68 sm:text-xl">
                  Perpetual Core connects governed company context, specialized AI
                  systems, and human-approved workflows across opportunity,
                  operations, people, knowledge, and media. Start with one
                  capability. Expand into a company-wide operating system.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    asChild
                    size="lg"
                    className="min-h-12 rounded-md bg-[#26f2a8] px-7 text-base font-semibold text-[#070914] shadow-[0_0_36px_rgba(38,242,168,0.18)] hover:bg-[#7dffd0]"
                  >
                    <Link href="/marketplace">
                      Explore the marketplace
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="min-h-12 rounded-md border-white/25 bg-white/[0.04] px-7 text-base text-white hover:border-white/45 hover:bg-white/10 hover:text-white"
                  >
                    <Link href="/contact-sales">Map my company</Link>
                  </Button>
                </div>

                <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/52">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#26f2a8]" aria-hidden="true" />
                    Governed by default
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#6dd7ff]" aria-hidden="true" />
                    Human authority retained
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Bot className="h-4 w-4 text-[#b99cff]" aria-hidden="true" />
                    Products that work together
                  </span>
                </div>
              </div>

              <OperatingSystemMap />
            </div>

            <div className="mt-14 grid overflow-hidden rounded-lg border border-white/12 bg-white/[0.04] sm:grid-cols-3">
              <div className="p-5 sm:border-r sm:border-white/12">
                <p className="text-3xl font-semibold tracking-[-0.04em] text-white">
                  {MARKETPLACE_ITEMS.length}
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
                  Capability surfaces
                </p>
              </div>
              <div className="border-t border-white/12 p-5 sm:border-r sm:border-t-0">
                <p className="text-3xl font-semibold tracking-[-0.04em] text-white">
                  {LIVE_COUNT}
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
                  Live surfaces
                </p>
              </div>
              <div className="border-t border-white/12 p-5 sm:border-t-0">
                <p className="text-3xl font-semibold tracking-[-0.04em] text-white">
                  {PRIVATE_COUNT}
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
                  Private or invitation releases
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-[#f5f7ff] py-20 sm:py-28">
          <div className="container mx-auto px-6 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
              <div>
                <p className="eyebrow text-primary">What Perpetual Core is</p>
                <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">
                  One company. Three ways in.
                </h2>
              </div>
              <p className="max-w-3xl text-lg leading-8 text-muted-foreground lg:pt-8">
                Perpetual Core is a governed intelligence platform, a marketplace
                of specialized systems, and a studio that installs them into real
                organizations. The platform connects the context. The marketplace
                solves specific jobs. The studio handles the work between them.
              </p>
            </div>

            <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-[#d9ddff] bg-[#d9ddff] lg:grid-cols-3">
              {ENTRY_POINTS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group cursor-pointer bg-white p-7 transition-colors duration-200 hover:bg-[#fafaff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:p-8"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                      {item.label}
                    </span>
                    <item.icon className="h-5 w-5 text-primary/60" aria-hidden="true" />
                  </div>
                  <h3 className="mt-14 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {item.body}
                  </p>
                  <span className="mt-8 inline-flex items-center text-sm font-semibold text-foreground group-hover:text-primary">
                    {item.cta}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section
          id="operating-layer"
          className="scroll-mt-24 border-b border-border py-20 sm:py-28"
        >
          <div className="container mx-auto px-6 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-20">
              <div>
                <p className="eyebrow text-primary">The operating layer</p>
                <h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">
                  Shared intelligence without one giant data pile.
                </h2>
                <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                  Sage and the Company Graph coordinate priorities, approved
                  context, source health, evidence pointers, and outcome receipts.
                  Each product keeps its own authority boundary and protected data
                  stays where it belongs.
                </p>
                <Link
                  href="/engine"
                  className="mt-8 inline-flex min-h-11 items-center text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  See the architecture beneath it
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[0_24px_80px_rgba(75,53,255,0.08)]">
                {[
                  {
                    icon: Compass,
                    title: "Observe",
                    body: "Collect bounded signals, freshness, approvals, and non-secret evidence pointers.",
                  },
                  {
                    icon: Network,
                    title: "Reconcile",
                    body: "Resolve what changed, what conflicts, and what needs operator attention.",
                  },
                  {
                    icon: Sparkles,
                    title: "Propose",
                    body: "Rank the next best actions and show the evidence behind the recommendation.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Review and execute",
                    body: "Keep publishing, money, protected records, migrations, and consequential actions behind explicit authority.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Verify and learn",
                    body: "Record actual outcomes and limitations rather than calling configured systems successful.",
                  },
                ].map((item, index) => (
                  <div
                    key={item.title}
                    className="grid grid-cols-[42px_1fr] gap-4 border-b border-border p-5 last:border-b-0 sm:grid-cols-[48px_170px_1fr] sm:items-center sm:gap-6 sm:p-6"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/8 text-primary">
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                        0{index + 1}
                      </p>
                      <h3 className="mt-1 font-semibold text-foreground">
                        {item.title}
                      </h3>
                    </div>
                    <p className="col-start-2 text-sm leading-6 text-muted-foreground sm:col-start-auto">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="marketplace"
          className="scroll-mt-24 border-b border-white/10 bg-[#080a13] py-20 text-white sm:py-28"
        >
          <div className="mx-auto max-w-[1500px] px-6 sm:px-8">
            <div className="mb-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:gap-20">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#6dd7ff]">
                  The marketplace
                </p>
                <h2 className="mt-5 text-4xl font-semibold leading-[1.03] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
                  Start with the job. See the larger system.
                </h2>
              </div>
              <div>
                <p className="max-w-3xl text-lg leading-8 text-white/60">
                  These are not disconnected side projects. They are specialized
                  surfaces for recurring company jobs—and designed to connect as
                  the operating system grows.
                </p>
                <Link
                  href="/marketplace"
                  className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-white transition-colors hover:text-[#26f2a8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26f2a8]"
                >
                  Open the full marketplace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            <MarketplaceExplorer />
          </div>
        </section>

        <section className="border-b border-border bg-[#fbfcff] py-20 sm:py-28">
          <div className="container mx-auto px-6 sm:px-8">
            <div className="max-w-4xl">
              <p className="eyebrow text-primary">Choose your starting level</p>
              <h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">
                Buy the smallest thing that can prove the next thing.
              </h2>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {BUYER_PATHS.map((path) => (
                <div
                  key={path.title}
                  className="flex flex-col rounded-lg border border-border bg-white p-7 shadow-[0_14px_50px_rgba(10,12,24,0.045)] sm:p-8"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                      {path.eyebrow}
                    </p>
                    <path.icon className="h-5 w-5 text-primary/60" aria-hidden="true" />
                  </div>
                  <h3 className="mt-14 text-3xl font-semibold tracking-[-0.035em] text-foreground">
                    {path.title}
                  </h3>
                  <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">
                    {path.body}
                  </p>
                  <Link
                    href={path.href}
                    className="mt-8 inline-flex min-h-11 items-center text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {path.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border py-20 sm:py-28">
          <div className="container mx-auto px-6 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <div>
                <p className="eyebrow text-primary">Built in the field</p>
                <h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-foreground sm:text-5xl">
                  The portfolio comes from operating, not brainstorming.
                </h2>
              </div>
              <div>
                <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
                  Perpetual Core’s systems are shaped inside the wider IHA and
                  Uplift ecosystem: workforce programs, education, multi-entity
                  operations, field programs, proposals, media, people
                  coordination, and leadership review. We publish verified
                  constraints and current availability—not invented customer
                  outcomes.
                </p>
                <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
                  {[
                    {
                      icon: Building2,
                      label: "Operations",
                      body: "Real organizations and programs expose the workflow.",
                    },
                    {
                      icon: GraduationCap,
                      label: "Human capacity",
                      body: "IHA and Uplift keep learning and workforce outcomes in view.",
                    },
                    {
                      icon: ShieldCheck,
                      label: "Governance",
                      body: "Consent, provenance, review, and authority shape the product.",
                    },
                  ].map((item) => (
                    <div key={item.label} className="bg-white p-6">
                      <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                      <h3 className="mt-5 font-semibold text-foreground">{item.label}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-white/10 bg-[#070914] py-20 text-white sm:py-28">
          <div className="signal-grid absolute inset-0 opacity-35" aria-hidden="true" />
          <div className="relative container mx-auto px-6 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#6dd7ff]">
                  The company flywheel
                </p>
                <h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:text-5xl">
                  The work compounds into products, ventures, and human capacity.
                </h2>
              </div>
              <div className="divide-y divide-white/12 border-y border-white/12">
                {FLYWHEEL.map((item) => (
                  <div
                    key={item.index}
                    className="grid grid-cols-[48px_110px_1fr] gap-4 py-5 sm:grid-cols-[64px_150px_1fr] sm:gap-6"
                  >
                    <span className="font-mono text-[10px] tracking-[0.18em] text-[#6dd7ff]">
                      {item.index}
                    </span>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="text-sm leading-6 text-white/52">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-white/12 bg-white/12 sm:grid-cols-3">
              <Link
                href="/studio"
                className="group bg-white/[0.045] p-6 transition-colors hover:bg-white/[0.08]"
              >
                <Building2 className="h-5 w-5 text-[#26f2a8]" aria-hidden="true" />
                <h3 className="mt-5 font-semibold text-white">Studio</h3>
                <p className="mt-2 text-sm leading-6 text-white/52">
                  Installs and adapts the system.
                </p>
                <span className="mt-5 inline-flex items-center text-sm text-white">
                  Explore the studio <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Link>
              <Link
                href="/fund"
                className="group bg-white/[0.045] p-6 transition-colors hover:bg-white/[0.08]"
              >
                <CircleDollarSign className="h-5 w-5 text-[#6dd7ff]" aria-hidden="true" />
                <h3 className="mt-5 font-semibold text-white">DeepFutures</h3>
                <p className="mt-2 text-sm leading-6 text-white/52">
                  Scales venture-shaped patterns.
                </p>
                <span className="mt-5 inline-flex items-center text-sm text-white">
                  See the fund <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Link>
              <a
                href="https://theiha.org"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white/[0.045] p-6 transition-colors hover:bg-white/[0.08]"
              >
                <GraduationCap className="h-5 w-5 text-[#b99cff]" aria-hidden="true" />
                <h3 className="mt-5 font-semibold text-white">IHA</h3>
                <p className="mt-2 text-sm leading-6 text-white/52">
                  Expands learning, workforce, and founder capacity.
                </p>
                <span className="mt-5 inline-flex items-center text-sm text-white">
                  Visit the Institute
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </span>
              </a>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="container mx-auto px-6 text-center sm:px-8">
            <p className="eyebrow text-primary">Start with the real company</p>
            <h2 className="mx-auto mt-5 max-w-5xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-foreground sm:text-6xl lg:text-7xl">
              Where does work lose time, context, customers, or follow-through?
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              We will map the first high-leverage workflow and show which product,
              capability, or company system should come first.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-h-12 px-7 text-base">
                <Link href="/contact-sales">
                  Map my company <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-h-12 px-7 text-base">
                <Link href="/marketplace">Explore the marketplace</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
