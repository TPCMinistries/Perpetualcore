/**
 * Perpetual Core — Studio homepage, v6
 *
 * Frame: "We build the AI operating systems — and the founders who run them."
 * Five arms presented as architectural diagram. Engine reframed as a structural
 * standard — published spec, not a proprietary moat.
 *
 * Visual signature: Instrument Serif display H1, JetBrains Mono labels, near-black
 * ink on pure white, single violet accent, hairline grids. New in v6:
 *   - Engine architecture SVG (visual signature of the company shape)
 *   - Dramatic black-bg Frontier manifesto (full-bleed display register)
 *   - Scroll-reveal fade-up on sections
 *   - Open Invitation 4-row table with Mission orgs
 */

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { NewsletterCapture } from "@/components/landing/NewsletterCapture";
import { Reveal } from "@/components/landing/Reveal";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

export const metadata = {
  title: "Perpetual Core — Studio, fund, and institute building AI-native operating systems",
  description:
    "We build the AI operating systems — and the founders who run them. A studio installing AI-native systems for mission-driven organizations, a fund investing in the founders building the next wave, and an institute training the operators running them. The Perpetual Engine — published as a structural standard for AI ventures.",
};

const ARMS = [
  {
    index: "01",
    name: "Studio",
    summary: "Engagements that install the Perpetual Engine across your organization.",
    meta: "$75,000 floor",
    href: "/studio",
  },
  {
    index: "02",
    name: "Products",
    summary: "Seven AI-native products in production — from due diligence to portfolio COO.",
    meta: "7 in portfolio",
    href: "/products",
  },
  {
    index: "03",
    name: "Fund",
    summary: "DeepFutures backs AI-native companies. We invest where we install.",
    meta: "Pre-seed · by intro",
    href: "/fund",
  },
  {
    index: "04",
    name: "Institute",
    summary: "IHA — workforce, founder training, AI education, field health programs.",
    meta: "501(c)(3) · theiha.org",
    href: "/institute",
  },
] as const;

const PRODUCTS = [
  { index: "01", name: "Atlas", status: "IN PILOT", statusColor: "pilot" as const, tagline: "AI-native COO for fund-backed portcos.", href: "/products/atlas", external: false },
  { index: "02", name: "Sentinel", status: "LIVE", statusColor: "live" as const, tagline: "Due diligence and intel for the people Kroll won't take calls from.", href: "https://sentinel.perpetualcore.com", external: true },
  { index: "03", name: "Sage", status: "BUILD", statusColor: "invite" as const, tagline: "Personal AI OS with ambient context and your voice.", href: "/products/sage", external: false },
  { index: "04", name: "Vellum", status: "BUILD", statusColor: "invite" as const, tagline: "Institutional knowledge — calls, docs, voice notes, channels.", href: "/products/vellum", external: false },
  { index: "05", name: "RFP Engine", status: "LIVE", statusColor: "live" as const, tagline: "Find the right RFP. Draft it in your voice. Ship it clean.", href: "https://rfp.perpetualcore.com", external: true },
  { index: "06", name: "RFP Sentry", status: "BUILD", statusColor: "invite" as const, tagline: "Bid intelligence + compliance gate. Sister to RFP Engine.", href: "/products/rfp-sentry", external: false },
  { index: "07", name: "Janice", status: "LIVE", statusColor: "live" as const, tagline: "Hiring and onboarding OS for people-heavy orgs.", href: "https://janice.perpetualcore.com", external: true },
] as const;

const PHASES = [
  { step: "Learn", body: "We read your org the way an operator does. Calls, docs, voice notes, the channels where decisions actually happen. Two weeks, no PowerPoint." },
  { step: "Wire", body: "We install the eight registries — entities, people, projects, work items, knowledge, agents, workflows, events — in your Supabase, your storage, your stack." },
  { step: "Automate", body: "Skills get built against your real workflows. The Anthropic SKILL.md format, per-portco JSON. Versioned, auditable, yours." },
  { step: "Scale", body: "Your team operates and extends the system. We document, train, and hand over. You own it." },
];

const ENGINE_STATS = [
  { value: "$7,500", label: "Engagement minimum to IHA" },
  { value: "$25,000+", label: "Engagement maximum to IHA" },
  { value: "10–15%", label: "Of every revenue dollar" },
];

const INSTITUTE_PROGRAMS = [
  { name: "IHA Founders 1,000", body: "AI-native founder training. Pilot cohort June 2026. Emerging markets focus." },
  { name: "IHA Academy", body: "AI literacy and applied skills for non-technical operators." },
  { name: "IHA Advance", body: "Kenya delegation and East Africa field programs." },
  { name: "Workforce", body: "Healthcare and community workforce development for low-income New Yorkers." },
];

const INVITATION_ROWS = [
  {
    tag: "Founders",
    title: "Structure your AI venture on the Engine.",
    body: "If you're building from day one, you can adopt the same shape: registry-first substrate, structural giving floor, operator-owned methodology. We'll show you ours.",
    cta: "Read the spec",
    href: "/engine/spec",
  },
  {
    tag: "Investors",
    title: "Back Engine-aligned ventures.",
    body: "If you fund AI companies, demand this structure of the next ones you back. We're happy to compare notes on what works and what doesn't. The category needs aligned capital.",
    cta: "Talk to DeepFutures",
    href: "/fund",
  },
  {
    tag: "Practitioners",
    title: "Implement your own reference.",
    body: "If you build AI systems for clients, the eight registries and the AI-First Framework are documented. Adopt, fork, extend — the spec is the contribution, not the company.",
    cta: "See the methodology",
    href: "/studio/methodology",
  },
  {
    tag: "Mission orgs",
    title: "Require Engine-alignment in your vendors.",
    body: "Foundation program officers, executive directors, fund OPs — if you're screening AI vendors, the Engine gives you a structural criterion: does the venture you're considering fund its mission, or extract from it?",
    cta: "Use the criterion",
    href: "/engine",
  },
];

function StatusPill({ status, color }: { status: string; color: "live" | "pilot" | "invite" }) {
  const dot = { live: "bg-status-live", pilot: "bg-status-pilot", invite: "bg-status-invite" }[color];
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
      <span className={`block h-1.5 w-1.5 rounded-full ${dot} ${color === "live" ? "animate-pulse-dot" : ""}`} />
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

/**
 * Engine Architecture — visual signature of the company shape.
 * Four arms (numbered nodes) flow down into one wide Engine substrate bar.
 * Mono-styled, hairlines, subtle flow animation on connector lines.
 */
function EngineArchitecture() {
  // X positions for 4 arms across a 700-wide viewport
  const arms = [
    { x: 100, label: "01 · STUDIO" },
    { x: 280, label: "02 · PRODUCTS" },
    { x: 460, label: "03 · FUND" },
    { x: 640, label: "04 · INSTITUTE" },
  ];

  return (
    <figure className="my-4">
      <svg
        viewBox="0 0 740 240"
        className="w-full max-w-3xl mx-auto text-foreground"
        role="img"
        aria-label="Architecture: four arms (Studio, Products, Fund, Institute) flowing into the Engine substrate."
      >
        {/* Labels above each arm */}
        {arms.map((a) => (
          <text
            key={`lbl-${a.label}`}
            x={a.x}
            y={28}
            textAnchor="middle"
            className="fill-current font-mono"
            fontSize="9"
            letterSpacing="1.5"
            style={{ fontFamily: "var(--font-mono), monospace" }}
          >
            {a.label}
          </text>
        ))}

        {/* Arm nodes — small filled squares */}
        {arms.map((a) => (
          <g key={`node-${a.label}`}>
            <rect
              x={a.x - 14}
              y={42}
              width="28"
              height="28"
              className="fill-background stroke-foreground"
              strokeWidth="1.25"
            />
            <rect
              x={a.x - 5}
              y={51}
              width="10"
              height="10"
              className="fill-foreground"
            />
          </g>
        ))}

        {/* Connector lines flowing down to Engine substrate */}
        {arms.map((a) => (
          <line
            key={`line-${a.label}`}
            x1={a.x}
            y1={70}
            x2={a.x}
            y2={170}
            stroke="currentColor"
            strokeWidth="1"
            className="animate-flow text-foreground/60"
          />
        ))}

        {/* Junction dots */}
        {arms.map((a) => (
          <circle
            key={`dot-${a.label}`}
            cx={a.x}
            cy={170}
            r="2"
            className="fill-foreground"
          />
        ))}

        {/* Engine substrate bar — wide, filled */}
        <rect x="40" y="170" width="660" height="40" className="fill-foreground" />

        {/* Engine label inside bar */}
        <text
          x={370}
          y={195}
          textAnchor="middle"
          className="fill-background font-mono"
          fontSize="11"
          letterSpacing="2"
          fontWeight="500"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          § 05 · THE ENGINE · STRUCTURAL STANDARD
        </text>

        {/* Bracketed end marks on the bar */}
        <line x1="40" y1="165" x2="40" y2="215" stroke="currentColor" strokeWidth="1" className="text-foreground/50" />
        <line x1="700" y1="165" x2="700" y2="215" stroke="currentColor" strokeWidth="1" className="text-foreground/50" />

        {/* Caption line below */}
        <text
          x={370}
          y={232}
          textAnchor="middle"
          className="fill-current font-mono opacity-50"
          fontSize="8.5"
          letterSpacing="1.5"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          THE FOUR ARMS REST ON ONE SUBSTRATE — PUBLISHED AS AN OPEN STANDARD
        </text>
      </svg>
    </figure>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <PageViewTracker />
      <Navbar />

      {/* ─── 1. Hero ─────────────────────────────────────────────────── */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 bg-foreground" />
            <p className="eyebrow !text-foreground/70">
              Perpetual Core · An AI-native operating company
            </p>
          </div>

          <h1 className="display-hero text-[44px] sm:text-[60px] lg:text-[92px] text-foreground mb-12 max-w-5xl leading-[1.02]">
            We build the AI operating systems —{" "}
            <span className="italic text-foreground/85">and the founders who run them.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground leading-[1.5] mb-12 max-w-3xl">
            Perpetual Core is a studio, a fund, and an institute — the reference implementation
            of the <span className="text-foreground font-medium">Perpetual Engine</span>: a
            structural standard for AI-native ventures that fund their mission. We built the
            first one. We hope it becomes a category.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4 mb-16">
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
              href="/engine/spec"
              className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary"
            >
              Read the Engine spec
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Live signal block */}
          <div className="border-t border-border pt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="flex items-center gap-2">
              <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-status-live animate-pulse-dot" />
              System operating
            </span>
            <span className="hidden sm:inline text-muted-foreground/40">·</span>
            <span>Since 2024</span>
            <span className="hidden sm:inline text-muted-foreground/40">·</span>
            <span>Reference implementation</span>
            <span className="hidden sm:inline text-muted-foreground/40">·</span>
            <span>Engine spec · v1</span>
            <span className="hidden sm:inline text-muted-foreground/40">·</span>
            <Link href="/engine/spec" className="underline-offset-4 hover:text-foreground transition-colors">
              Open invitation to adopt
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 1.5 TRUST STRIP — what we operate, who we fund, who we're built under ───── */}
      <section className="border-y border-border bg-card/40 py-10 sm:py-12">
        <div className="container mx-auto px-6 sm:px-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-6 text-center">
            One operating company · four arms · audited annually
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 items-center text-center">
            <div className="space-y-1">
              <p className="text-base sm:text-lg font-semibold tracking-[-0.01em] text-foreground">
                Perpetual Core
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Studio · 6 products
              </p>
            </div>
            <a
              href="https://theiha.org"
              target="_blank"
              rel="noopener noreferrer"
              className="space-y-1 hover:opacity-80 transition"
            >
              <p className="text-base sm:text-lg font-semibold tracking-[-0.01em] text-foreground inline-flex items-center justify-center gap-1">
                Institute for Human Advancement
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                501(c)(3) · 10–15% of revenue
              </p>
            </a>
            <a
              href="https://upliftcommunities.com"
              target="_blank"
              rel="noopener noreferrer"
              className="space-y-1 hover:opacity-80 transition"
            >
              <p className="text-base sm:text-lg font-semibold tracking-[-0.01em] text-foreground inline-flex items-center justify-center gap-1">
                Uplift Communities
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Operating arm · workforce + founders
              </p>
            </a>
            <div className="space-y-1">
              <p className="text-base sm:text-lg font-semibold tracking-[-0.01em] text-foreground">
                DeepFutures
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Pre-seed fund · by introduction
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. THE COMPANY — architecture diagram + arms ─────────────── */}
      <Reveal as="section" className="border-y border-border" >
        <div id="company" className="container mx-auto px-6 sm:px-8 py-20 sm:py-24">
          <div className="max-w-4xl mb-14">
            <p className="eyebrow mb-3">§ The structure</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
              One operating company. Four arms. One engine — the standard we built to share.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-[1.6] max-w-2xl">
              The structure is the argument. Every arm contributes to one substrate. The substrate
              funds the mission. The Engine is published as a standard for AI-native ventures —
              we built the reference implementation, and we&apos;re inviting others to build theirs.
            </p>
          </div>

          {/* Architecture SVG — visual signature */}
          <div className="border border-border bg-card p-8 sm:p-12 mb-10">
            <EngineArchitecture />
          </div>

          {/* Arms grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            {ARMS.map((arm) => (
              <Link
                key={arm.name}
                href={arm.href}
                className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col"
              >
                <div className="flex items-center justify-between mb-12">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                    § {arm.index}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                    {arm.meta}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-foreground mb-4 group-hover:text-primary transition-colors">
                  {arm.name}.
                </h3>
                <p className="text-sm text-muted-foreground leading-[1.6] mb-8 flex-1">
                  {arm.summary}
                </p>
                <span className="inline-flex items-center text-xs font-medium text-foreground group-hover:text-primary transition-colors mt-auto">
                  Enter
                  <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>

          {/* Engine substrate bar */}
          <Link
            href="/engine"
            className="group relative block border border-t-0 border-border overflow-hidden text-white hover:opacity-95 transition-opacity"
            style={{ backgroundColor: "hsl(var(--surface-dark))" }}
          >
            <div className="grain" />
            <div className="relative p-6 sm:p-8 grid sm:grid-cols-[80px_1fr_auto] gap-6 sm:gap-10 items-center">
              <div className="flex items-center gap-3">
                <span aria-hidden className="block h-1.5 w-1.5 bg-white" />
                <span className="font-mono text-[10px] tracking-[0.18em] text-white/60">§ 05</span>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold tracking-[-0.015em] text-white mb-1 group-hover:text-white/95">
                  The Engine.
                </h3>
                <p className="text-sm sm:text-base text-white/65 leading-[1.55]">
                  10–15% of every revenue dollar funds the Institute. The substrate every arm
                  sits on top of — and the standard we&apos;re inviting other AI ventures to adopt.
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center font-mono text-[10px] uppercase tracking-[0.18em] text-white/70 whitespace-nowrap">
                How it works
                <ArrowRight className="ml-3 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        </div>
      </Reveal>

      {/* ─── 3. The Studio (arm 01 detail) — three-band framing ──────── */}
      <Reveal as="section" className="container mx-auto px-6 sm:px-8 py-24 sm:py-32">
        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
          <SectionRail index="01" label="Studio" />
          <div className="max-w-2xl">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-10">
              We don&apos;t write decks. We meet you at the band that fits the work.
            </h3>
            <div className="space-y-5 text-base text-muted-foreground leading-[1.7] mb-10">
              <p>
                Three ways in: subscribe to a product, hire a productized retainer, or install the
                full Engine in an engagement. Same studio, same operator-grade methodology — three
                cadences, three commitment levels.
              </p>
              <p>
                Most orgs cross bands over time. Subscriptions become retainers when the work
                scales. Retainers roll into engagements when the org commits to installing the
                substrate. We discuss credit case-by-case when you cross a band.
              </p>
            </div>
          </div>
        </div>

        {/* Three-band mini-spectrum */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
          <div />
          <div className="max-w-4xl border border-border bg-card">
            <Link
              href="/products"
              className="group grid grid-cols-[60px_1fr_auto] sm:grid-cols-[60px_140px_1fr_140px] gap-x-6 sm:gap-x-10 gap-y-2 py-6 px-6 sm:px-8 border-b border-border hover:bg-surface-hover transition-colors items-baseline"
            >
              <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground pt-1">
                01
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary col-span-1 sm:col-auto">
                Products
              </span>
              <p className="text-base text-foreground col-span-3 sm:col-auto">
                <span className="font-semibold">Subscribe to a product.</span>{" "}
                <span className="text-muted-foreground">
                  Self-serve SaaS. Operator drives.
                </span>
              </p>
              <span className="hidden sm:inline-flex items-center justify-end font-mono text-[10px] uppercase tracking-[0.18em] text-foreground whitespace-nowrap">
                $0 → $249/mo
                <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>

            <Link
              href="/studio/retainers"
              className="group grid grid-cols-[60px_1fr_auto] sm:grid-cols-[60px_140px_1fr_140px] gap-x-6 sm:gap-x-10 gap-y-2 py-6 px-6 sm:px-8 border-b border-border hover:bg-surface-hover transition-colors items-baseline"
            >
              <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground pt-1">
                02
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary col-span-1 sm:col-auto">
                Retainers
              </span>
              <p className="text-base text-foreground col-span-3 sm:col-auto">
                <span className="font-semibold">Hire a productized program.</span>{" "}
                <span className="text-muted-foreground">
                  We operate the agent. You receive the output.
                </span>
              </p>
              <span className="hidden sm:inline-flex items-center justify-end font-mono text-[10px] uppercase tracking-[0.18em] text-foreground whitespace-nowrap">
                $5K → $15K/mo
                <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>

            <Link
              href="/studio/engagements"
              className="group grid grid-cols-[60px_1fr_auto] sm:grid-cols-[60px_140px_1fr_140px] gap-x-6 sm:gap-x-10 gap-y-2 py-6 px-6 sm:px-8 hover:bg-surface-hover transition-colors items-baseline"
            >
              <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground pt-1">
                03
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary col-span-1 sm:col-auto">
                Engagements
              </span>
              <p className="text-base text-foreground col-span-3 sm:col-auto">
                <span className="font-semibold">Install the Engine.</span>{" "}
                <span className="text-muted-foreground">
                  90–180 day install. Documented, trained, handed over.
                </span>
              </p>
              <span className="hidden sm:inline-flex items-center justify-end font-mono text-[10px] uppercase tracking-[0.18em] text-foreground whitespace-nowrap">
                $75K → $250K+
                <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </div>
      </Reveal>

      {/* ─── 4. Portfolio (arm 02 detail) ────────────────────────────── */}
      <Reveal as="section" className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-14">
            <SectionRail index="02" label="Portfolio" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Seven products in production.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                The portfolio is the proof. Each is a working installation we shipped in an
                engagement and kept running. Live answers to &ldquo;have you actually shipped
                this kind of system before, and does it still run?&rdquo;
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            {PRODUCTS.map((product, idx) => {
              const className = `group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col ${idx >= 4 ? "sm:border-t" : ""} border-border`;
              const inner = (
                <>
                  <div className="flex items-center justify-between mb-10">
                    <span className="font-mono text-[10px] text-muted-foreground tracking-[0.18em]">
                      {product.index}
                    </span>
                    <StatusPill status={product.status} color={product.statusColor} />
                  </div>
                  <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                    {product.name}
                  </h4>
                  <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-5 flex-1">
                    {product.tagline}
                  </p>
                  <span className="inline-flex items-center text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors mt-auto">
                    Open
                    {product.external ? (
                      <ArrowUpRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    ) : (
                      <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </span>
                </>
              );
              return product.external ? (
                <a key={product.name} href={product.href} target="_blank" rel="noopener noreferrer" className={className}>
                  {inner}
                </a>
              ) : (
                <Link key={product.name} href={product.href} className={className}>
                  {inner}
                </Link>
              );
            })}
            <Link href="/products" className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors border-t border-border sm:border-t flex flex-col justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">More</p>
              <div className="mt-auto">
                <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-2">
                  Full portfolio →
                </p>
                <p className="text-xs text-muted-foreground">Specs, pricing, status per product.</p>
              </div>
            </Link>
          </div>
        </div>
      </Reveal>

      {/* ─── 5. The Fund (arm 03) ────────────────────────────────────── */}
      <Reveal as="section" className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="03" label="Fund" />
            <div className="max-w-2xl">
              <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-4">
                DeepFutures
              </p>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-8">
                We invest where we install.
              </h3>
              <div className="space-y-5 text-base text-muted-foreground leading-[1.7] mb-10">
                <p>
                  DeepFutures backs AI-native companies — pre-seed and seed, by introduction.
                  Operator-owned systems, vertical AI agents, infrastructure for AI ventures built
                  the same way we are.
                </p>
                <p>
                  Portfolio companies get more than capital: an installable reference architecture
                  shipped at production scale, the methodology documented, and the operator network
                  that comes from being in the field, not at the deck.
                </p>
              </div>

              <div className="grid grid-cols-3 border-y border-border mb-10">
                <div className="py-5 pr-5">
                  <p className="text-xl font-semibold tracking-[-0.015em] text-foreground mb-1">Pre-seed / Seed</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Stage</p>
                </div>
                <div className="py-5 px-5 border-l border-border">
                  <p className="text-xl font-semibold tracking-[-0.015em] text-foreground mb-1">$50K–$250K</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Check size</p>
                </div>
                <div className="py-5 pl-5 border-l border-border">
                  <p className="text-xl font-semibold tracking-[-0.015em] text-foreground mb-1">By introduction</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Access</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                  <Link href="/fund">Read the thesis <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
                </Button>
                <a href="mailto:lorenzo@perpetualcore.com?subject=DeepFutures%20inquiry" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
                  Founders apply <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ─── 6. The Institute (arm 04) ───────────────────────────────── */}
      <Reveal as="section" className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="04" label="Institute" />
            <div className="max-w-2xl">
              <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-4">
                The Institute for Human Advancement
              </p>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-8">
                The 501(c)(3) parent. The reason any of this exists.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                IHA runs workforce development for low-income New Yorkers, AI-native founder
                training across emerging markets, AI literacy programs, and field health programs
                in East Africa. Every Perpetual Core arm funds it.
              </p>

              <div className="border-t border-border mb-10">
                {INSTITUTE_PROGRAMS.map((p, i) => (
                  <div key={p.name} className="grid grid-cols-[60px_180px_1fr] sm:grid-cols-[60px_220px_1fr] gap-6 py-5 border-b border-border items-baseline">
                    <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground pt-1">0{i + 1}</span>
                    <h4 className="text-base font-semibold tracking-tight text-foreground">{p.name}</h4>
                    <p className="text-sm text-muted-foreground leading-[1.6] col-span-3 sm:col-auto">{p.body}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                  <Link href="/institute">Institute overview <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
                </Button>
                <a href="https://theiha.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
                  Visit theiha.org <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ─── 7. Framework ────────────────────────────────────────────── */}
      <Reveal as="section" className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-14">
            <SectionRail index="—" label="The Framework" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                Four phases. One framework. Yours at the end.
              </h3>
            </div>
          </div>

          <div className="border-t border-border">
            {PHASES.map((phase, i) => (
              <div key={phase.step} className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_200px_1fr] gap-6 sm:gap-12 py-8 border-b border-border">
                <span className="font-mono text-[11px] text-muted-foreground tracking-[0.18em] pt-1">0{i + 1}</span>
                <h4 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground col-span-1 sm:col-auto">{phase.step}.</h4>
                <p className="text-base text-muted-foreground leading-[1.7] col-span-2 sm:col-auto">{phase.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link href="/studio/methodology" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors">
              Read the full methodology <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </Reveal>

      {/* ─── 8. Engine commitment — dark block with grain ────────────── */}
      <Reveal as="section" className="relative py-24 sm:py-32 text-white overflow-hidden" >
        <div className="absolute inset-0" style={{ backgroundColor: "hsl(var(--surface-dark))" }} />
        <div className="grain" />
        <div className="relative container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div>
              <p className="eyebrow !text-white/40 mb-3">§ 05</p>
              <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-white">The Engine</h2>
            </div>
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-white mb-12">
                A structural standard for AI ventures that fund their mission.
              </h3>

              <div className="grid grid-cols-3 border-y border-white/10 mb-10">
                {ENGINE_STATS.map((stat, i) => (
                  <div key={stat.label} className={`py-6 ${i > 0 ? "border-l border-white/10 pl-6" : "pr-6"}`}>
                    <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-white mb-2">{stat.value}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-5 text-base leading-[1.7] text-white/65 mb-12">
                <p>
                  A high structural bar — not a moat. VC-backed companies struggle to meet it;
                  their cap tables resist double-digit revenue commitments to a 501(c)(3). JVs
                  face the same constraint from their LPs. AI-native ventures structured this
                  way from day one don&apos;t.
                </p>
                <p>
                  Engagements give 10%. Sage gives 15%. Every other product gives 10% by default.
                  Audited annually, line-itemed on every invoice. We&apos;re publishing the math,
                  the methodology, and the registry schemas. The reference implementation is the
                  company you&apos;re reading about.
                </p>
                <p className="text-white font-medium">
                  We are not the only company that should be built this way. We hope we&apos;re
                  the first of many.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-white text-foreground hover:bg-white/90 rounded-[6px]">
                  <Link href="/engine">How the Engine works <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
                </Button>
                <Link href="/engine/spec" className="inline-flex items-center text-sm font-medium text-white/70 hover:text-white transition-colors py-2 border-b border-white/20 hover:border-white">
                  Read the spec <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ─── 9. The Frontier — DRAMATIC full-bleed black manifesto ───── */}
      <Reveal
        as="section"
        className="relative border-t border-border py-32 sm:py-44 overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "hsl(var(--surface-dark))" }}
        />
        <div className="grain" />
        <div className="relative container mx-auto px-6 sm:px-8">
          <div className="max-w-5xl mx-auto">
            <p className="eyebrow !text-white/40 mb-12 inline-flex items-center gap-3">
              <span aria-hidden className="block h-1 w-1 bg-white" />
              The Frontier
            </p>

            <h2 className="display-hero text-[44px] sm:text-[68px] lg:text-[104px] text-white mb-16 leading-[0.98]">
              The next decade of AI is{" "}
              <span className="italic text-white/85">operator-owned.</span>
              <br />
              We&apos;re building for it.
            </h2>

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 max-w-5xl">
              <div className="space-y-5 text-base sm:text-lg text-white/65 leading-[1.7]">
                <p>
                  The platforms are converging — five model labs, three clouds, two app-store
                  dynamics. The operators using them are not. They run organizations with IRB
                  rules, local consent, offline reality, vertical workflows, and constraints
                  the platform companies will never optimize for.
                </p>
                <p>
                  The next decade belongs to AI systems the operators own — installed in their
                  stack, governed by their rules, sovereign to their mission. Vertical agents,
                  not generic chat. Institutional memory, not retrieval-as-a-service.
                  Engagements that hand over the keys, not consultancy that keeps them.
                </p>
              </div>
              <div className="space-y-5 text-base sm:text-lg text-white/65 leading-[1.7]">
                <p className="text-white font-medium">
                  We build for that future. The studio installs it. The portfolio carries it.
                  The fund invests in it. The institute trains the people building it. The
                  engine keeps the mission funded while we do.
                </p>
                <p>
                  We&apos;re not asking to be the only company shaped this way. We&apos;re
                  publishing the Engine as a standard, naming the math, and inviting other
                  AI-native ventures to adopt it. The reference implementation is here. The
                  category is what we&apos;re trying to create.
                </p>
              </div>
            </div>

            {/* Founder signature — on dark */}
            <div className="border-t border-white/15 pt-10 mt-20 flex items-center gap-4">
              <div className="flex-shrink-0">
                <span aria-hidden className="block h-9 w-9 bg-white" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight text-white">
                  Lorenzo Daughtry-Chambers
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50 mt-0.5">
                  Founder · Perpetual Core
                </p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ─── 10. Open Invitation — 4 audiences ───────────────────────── */}
      <Reveal as="section" className="relative border-t border-border py-24 sm:py-32 overflow-hidden">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <p className="eyebrow mb-6 inline-flex items-center gap-2 justify-center">
              <span aria-hidden className="block h-1 w-1 bg-foreground" />
              An open invitation
              <span aria-hidden className="block h-1 w-1 bg-foreground" />
            </p>
            <h2 className="display-hero text-[36px] sm:text-[52px] lg:text-[72px] text-foreground mb-10 leading-[1.05]">
              The Engine is meant to be{" "}
              <span className="italic">adopted.</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-[1.65] max-w-2xl mx-auto">
              We built the first one because we needed it. We&apos;re publishing it as a standard
              because we hope others build theirs. The math, the methodology, the registry
              schemas, the giving substrate — all of it open. Perpetual Core is the reference
              implementation, not the only one.
            </p>
          </div>

          {/* Four audiences */}
          <div className="max-w-5xl mx-auto border-t border-border">
            {INVITATION_ROWS.map((row, i) => (
              <Link
                key={row.tag}
                href={row.href}
                className="group grid grid-cols-[40px_1fr] sm:grid-cols-[80px_180px_1fr_auto] gap-x-6 sm:gap-x-10 gap-y-2 py-8 border-b border-border hover:bg-surface-hover transition-colors items-baseline"
              >
                <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground pt-1">
                  0{i + 1}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary col-span-1 sm:col-auto">
                  {row.tag}
                </span>
                <div className="col-span-2 sm:col-auto">
                  <p className="text-base sm:text-lg font-semibold tracking-[-0.01em] text-foreground mb-2 group-hover:text-primary transition-colors">
                    {row.title}
                  </p>
                  <p className="text-sm text-muted-foreground leading-[1.65]">
                    {row.body}
                  </p>
                </div>
                <span className="hidden sm:inline-flex items-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 whitespace-nowrap pt-1">
                  {row.cta}
                  <ArrowRight className="ml-3 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center mt-14">
            <Button size="lg" asChild className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
              <Link href="/engine/spec">
                Read the Engine spec <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Reveal>

      {/* ─── 11. Multi-path CTA ──────────────────────────────────────── */}
      <Reveal as="section" className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Start here" />
            <div className="max-w-3xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-10">
                Four doors. Pick yours.
              </h3>

              <div className="grid sm:grid-cols-2 gap-px bg-border border border-border">
                <Link href="/studio/engagements" className="group bg-card p-6 sm:p-7 hover:bg-surface-hover transition-colors">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary mb-3">For organizations</p>
                  <p className="text-lg font-semibold tracking-[-0.01em] text-foreground mb-2">Start an engagement →</p>
                  <p className="text-sm text-muted-foreground leading-[1.6]">Install the Perpetual Engine in your stack. $75,000 floor.</p>
                </Link>
                <Link href="/products" className="group bg-card p-6 sm:p-7 hover:bg-surface-hover transition-colors">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary mb-3">For operators</p>
                  <p className="text-lg font-semibold tracking-[-0.01em] text-foreground mb-2">See the portfolio →</p>
                  <p className="text-sm text-muted-foreground leading-[1.6]">Seven products in production. Use them, or have us install them.</p>
                </Link>
                <a href="mailto:lorenzo@perpetualcore.com?subject=DeepFutures%20inquiry" className="group bg-card p-6 sm:p-7 hover:bg-surface-hover transition-colors">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary mb-3">For founders</p>
                  <p className="text-lg font-semibold tracking-[-0.01em] text-foreground mb-2">Talk to the fund →</p>
                  <p className="text-sm text-muted-foreground leading-[1.6]">DeepFutures invests where we install. Pre-seed, by introduction.</p>
                </a>
                <a href="https://theiha.org" target="_blank" rel="noopener noreferrer" className="group bg-card p-6 sm:p-7 hover:bg-surface-hover transition-colors">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary mb-3">For mission partners</p>
                  <p className="text-lg font-semibold tracking-[-0.01em] text-foreground mb-2 inline-flex items-center">
                    Join the Institute <ArrowUpRight className="ml-1 h-4 w-4" />
                  </p>
                  <p className="text-sm text-muted-foreground leading-[1.6]">IHA runs the programs. Workforce, founders, Kenya, academy.</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Newsletter — passive lead capture before footer */}
      <section className="border-t border-border bg-background py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div className="flex items-baseline gap-3 text-muted-foreground">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em]">—</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
                Notes from the operating layer
              </span>
            </div>
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Stay close to the work.
              </h2>
              <p className="text-base text-muted-foreground leading-[1.7] mb-8">
                Occasional dispatches on AI installs, the Engine commitment, and
                what we're shipping. Written by Lorenzo. Read by operators, fund
                partners, and mission leads. Unsubscribe any time.
              </p>
              <NewsletterCapture variant="inline" source="home_inline" />
              <p className="mt-4 text-xs text-muted-foreground">
                No spam. No funnel tricks. Welcome email arrives within a minute.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
