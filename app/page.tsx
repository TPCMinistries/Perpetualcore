/**
 * Perpetual Core homepage
 *
 * Direction: practical AI operating-system implementation first. The venture
 * studio and Perpetual Engine are the deeper credibility layer, not the first
 * thing a buyer has to decode.
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
  title: "Perpetual Core - AI operating systems for complex companies",
  description:
    "Perpetual Core installs AI operating systems across sales, operations, knowledge, customer communication, and executive visibility for growing companies and mission-driven institutions.",
};

const ARMS = [
  {
    index: "01",
    name: "Studio",
    summary: "Maps the company, installs the first operating layer, trains the team, and expands across the business.",
    meta: "Implementation",
    href: "/studio",
  },
  {
    index: "02",
    name: "Products",
    summary: "Specific tools for diligence, proposals, knowledge, hiring, sales support, and team operations.",
    meta: "Specific jobs",
    href: "/products",
  },
  {
    index: "03",
    name: "Fund",
    summary: "DeepFutures backs venture-shaped patterns that emerge from repeatable operating-system work.",
    meta: "Scale path",
    href: "/fund",
  },
  {
    index: "04",
    name: "Institute",
    summary: "IHA trains the founders, operators, and workforce communities who should own this AI shift.",
    meta: "Mission layer",
    href: "/institute",
  },
] as const;

const PRODUCTS = [
  { index: "01", name: "Atlas", status: "IN PILOT", statusColor: "pilot" as const, tagline: "AI-native COO for fund-backed portcos.", href: "/products/atlas", external: false },
  { index: "02", name: "Sentinel", status: "LIVE", statusColor: "live" as const, tagline: "Due diligence and intel for the people Kroll won't take calls from.", href: "https://sentinel.perpetualcore.com", external: true },
  { index: "03", name: "Sage", status: "LIVE", statusColor: "live" as const, tagline: "Personal AI OS with ambient context and your voice.", href: "/products/sage", external: false },
  { index: "04", name: "Atelier", status: "LIVE", statusColor: "live" as const, tagline: "Agent-augmented workspace for teams and clients.", href: "https://atelier.perpetualcore.com", external: true },
  { index: "05", name: "Vellum", status: "BUILD", statusColor: "invite" as const, tagline: "Institutional memory across calls, docs, voice notes, and channels.", href: "/products/vellum", external: false },
  { index: "06", name: "RFP Engine", status: "LIVE", statusColor: "live" as const, tagline: "Find the right RFP. Draft it in your voice. Ship it clean.", href: "https://rfp.perpetualcore.com", external: true },
  { index: "07", name: "RFP Sentry", status: "BUILD", statusColor: "invite" as const, tagline: "Bid intelligence and compliance gate.", href: "/products/rfp-sentry", external: false },
  { index: "08", name: "Janice", status: "LIVE", statusColor: "live" as const, tagline: "Hiring and onboarding OS for people-heavy organizations.", href: "https://janice.perpetualcore.com", external: true },
] as const;

const PHASES = [
  { step: "Map", body: "Understand sales, operations, knowledge, projects, customers, data, and the handoffs where work gets stuck." },
  { step: "Install", body: "Build the first AI operating layer against live work, not a demo disconnected from the business." },
  { step: "Train", body: "Put the system into team rituals: intake, follow-up, proposals, reporting, service, and decision review." },
  { step: "Expand", body: "Move from the first high-leverage workflow into the full company operating system." },
];

const ENGINE_STATS = [
  { value: "Sales", label: "Follow-up, proposals, pipeline, and reactivation" },
  { value: "Ops", label: "Projects, handoffs, delivery, service, and exceptions" },
  { value: "Intel", label: "Knowledge, reporting, dashboards, and decisions" },
];

const INSTITUTE_PROGRAMS = [
  { name: "IHA Founders 1,000", body: "AI-native founder training with emerging markets focus." },
  { name: "IHA Academy", body: "AI literacy and applied skills for non-technical operators." },
  { name: "IHA Advance", body: "Kenya delegation and East Africa field programs." },
  { name: "Workforce", body: "Healthcare and community workforce development for low-income New Yorkers." },
];

const FIELD_NOTES = [
  {
    index: "001",
    date: "2026-05-22",
    title: "How to start before a full company-wide install.",
    summary: "Use one workflow as the wedge, then expand into the operating system when the proof is there.",
    href: "/studio/retainers",
  },
  {
    index: "002",
    date: "2026-05-20",
    title: "What an AI install actually costs.",
    summary: "Vendor subscriptions, engineering time, integration debt, and outcome evaluation.",
    href: "/blog/what-an-ai-install-actually-costs",
  },
  {
    index: "003",
    date: "2026-05-20",
    title: "Outcome-eval, the line item every AI install skips.",
    summary: "Without it, you have a demo that ran once, not an operating system.",
    href: "/blog/outcome-eval-the-line-item-every-ai-install-skips",
  },
] as const;

const INVITATION_ROWS = [
  {
    tag: "Organizations",
    title: "Install AI across the company you already run.",
    body: "For businesses ready to modernize sales, operations, knowledge, customer communication, and reporting.",
    cta: "Map the system",
    href: "/contact-sales",
  },
  {
    tag: "Operators",
    title: "Use a product when the job is already clear.",
    body: "Start with RFPs, diligence, knowledge, hiring, team operations, or a focused AI assistant.",
    cta: "View products",
    href: "/products",
  },
  {
    tag: "Founders",
    title: "Build an Engine-aligned venture.",
    body: "Structure the company from day one with operating rigor and mission funding built into the model.",
    cta: "Read spec",
    href: "/engine/spec",
  },
  {
    tag: "Mission partners",
    title: "Train the people who should own this next layer.",
    body: "Partner with IHA across founders, workforce, AI literacy, and field programs.",
    cta: "Visit IHA",
    href: "/institute",
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

function EngineArchitecture() {
  const arms = [
    { x: 100, label: "01 · STUDIO" },
    { x: 280, label: "02 · PRODUCTS" },
    { x: 460, label: "03 · FUND" },
    { x: 640, label: "04 · INSTITUTE" },
  ];

  return (
    <figure>
      <svg
        viewBox="0 0 740 240"
        className="w-full text-foreground"
        role="img"
        aria-label="Four arms flowing into the Perpetual Engine substrate."
      >
        {arms.map((a) => (
          <text
            key={`label-${a.label}`}
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
        {arms.map((a) => (
          <g key={`node-${a.label}`}>
            <rect x={a.x - 14} y={42} width="28" height="28" className="fill-background stroke-foreground" strokeWidth="1.25" />
            <rect x={a.x - 5} y={51} width="10" height="10" className="fill-foreground" />
            <line x1={a.x} y1={70} x2={a.x} y2={170} stroke="currentColor" strokeWidth="1" className="animate-flow text-foreground/55" />
            <circle cx={a.x} cy={170} r="2" className="fill-foreground" />
          </g>
        ))}
        <rect x="40" y="170" width="660" height="40" className="fill-foreground" />
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
        <line x1="40" y1="165" x2="40" y2="215" stroke="currentColor" strokeWidth="1" className="text-foreground/45" />
        <line x1="700" y1="165" x2="700" y2="215" stroke="currentColor" strokeWidth="1" className="text-foreground/45" />
        <text
          x={370}
          y={232}
          textAnchor="middle"
          className="fill-current font-mono opacity-50"
          fontSize="8.5"
          letterSpacing="1.5"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          ONE SUBSTRATE FOR THE STUDIO, PRODUCTS, FUND, AND INSTITUTE
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

      <section className="relative overflow-hidden border-b border-border text-white engine-gradient">
        <div className="signal-grid absolute inset-0 opacity-70" />
        <div className="absolute left-1/2 top-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#4b35ff]/25 blur-3xl" />
        <div className="absolute right-[-140px] top-32 h-[360px] w-[360px] rounded-full bg-[#00d4ff]/20 blur-3xl" />
        <div className="relative container mx-auto px-6 sm:px-8 min-h-[calc(100vh-73px)] py-16 sm:py-24 flex flex-col justify-between gap-16">
          <div className="grid lg:grid-cols-[1fr_340px] gap-14 lg:gap-20 items-start">
            <div className="max-w-5xl">
              <div className="flex items-center gap-3 mb-10">
                <span aria-hidden className="block h-2 w-2 bg-[#26f2a8] shadow-[0_0_18px_rgba(38,242,168,0.75)]" />
                <p className="eyebrow !text-white/70">Perpetual Core · Engine reference studio</p>
              </div>
              <h1 className="display-hero text-[52px] sm:text-[76px] lg:text-[112px] text-white leading-[0.95] mb-10 max-w-5xl">
                Install an AI operating system{" "}
                <span className="italic text-gradient">inside your company.</span>
              </h1>
              <p className="text-lg sm:text-xl text-white/72 leading-[1.55] max-w-3xl mb-10">
                Perpetual Core helps growing companies turn sales, operations, knowledge,
                customer communication, and leadership reporting into AI-enabled systems. We start
                where the fastest measurable win lives, then expand across the business.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Button
                  size="lg"
                  asChild
                  className="h-12 px-7 rounded-[6px] bg-[#26f2a8] text-[#05060b] shadow-[0_0_32px_rgba(38,242,168,0.22)] hover:bg-[#7dffd0]"
                >
                  <Link href="/contact-sales">
                    Map my AI operating system <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Link
                  href="/studio"
                  className="inline-flex items-center py-3 text-sm font-medium text-white border-b border-white/25 hover:border-[#00d4ff] hover:text-[#00d4ff] transition-colors"
                >
                  See studio services <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <aside className="border border-white/15 bg-white/[0.06] backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
              <div className="p-6 border-b border-white/15">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00d4ff] mb-4">
                  What we install
                </p>
                <p className="text-2xl font-semibold tracking-[-0.02em] text-white mb-3">
                  Whole-company AI infrastructure.
                </p>
                <p className="text-sm text-white/62 leading-[1.65]">
                  Not random tools. A practical operating layer across the places where revenue,
                  customers, projects, people, and decisions already move.
                </p>
              </div>
              <div className="divide-y divide-white/12">
                {[
                  ["For larger companies", "System install"],
                  ["For smaller companies", "Practical AI ops"],
                  ["First wedge", "Fastest measurable win"],
                  ["Scale path", "Department → company"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 px-6 py-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</span>
                    <span className="text-sm font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 border border-white/15 bg-white/[0.055] backdrop-blur-md divide-y sm:divide-y-0 sm:divide-x divide-white/12">
            {ARMS.map((arm) => (
              <Link key={arm.name} href={arm.href} className="group p-5 sm:p-6 hover:bg-white/[0.08] transition-colors">
                <div className="flex items-center justify-between gap-4 mb-10">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-[#00d4ff]">§ {arm.index}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">{arm.meta}</span>
                </div>
                <h2 className="text-2xl font-semibold tracking-[-0.02em] text-white mb-3 group-hover:text-[#26f2a8] transition-colors">
                  {arm.name}
                </h2>
                <p className="text-sm text-white/58 leading-[1.6]">{arm.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Reveal as="section" className="border-b border-border bg-[#f5f7ff]">
        <div className="container mx-auto px-6 sm:px-8 py-20 sm:py-24">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 items-start">
            <SectionRail index="01" label="Who this is for" />
            <div>
              <div className="max-w-3xl mb-10">
                <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-0.025em] leading-[1.02] text-foreground mb-6">
                  Built for companies with real moving parts.
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground leading-[1.65]">
                  Regional companies, project-based businesses, family-owned operators, professional services firms,
                  nonprofits, and institutions all share the same problem: knowledge, customers, projects, and decisions
                  move through too many disconnected places.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-px bg-[#d9ddff] border border-[#d9ddff] shadow-[0_24px_80px_rgba(75,53,255,0.08)]">
                {[
                  ["Complex regional companies", "For businesses coordinating customers, vendors, salespeople, project managers, inventory, delivery, service, and leadership reporting."],
                  ["Owner-led smaller companies", "For founders and operators who need to sell more, respond faster, organize knowledge, and stop losing work in the cracks."],
                  ["Project-based teams", "For companies where every win creates handoffs: proposal, scope, vendor coordination, client updates, delivery, and follow-up."],
                  ["Mission institutions", "For teams that need AI capability with real governance, human context, and durable operating discipline."],
                ].map(([title, body]) => (
                  <div key={title} className="bg-background p-6 sm:p-7">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary mb-4">
                      Fit
                    </p>
                    <h3 className="text-xl font-semibold tracking-[-0.015em] text-foreground mb-3">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-[1.65]">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="border-b border-border">
        <div className="container mx-auto px-6 sm:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="02" label="Where AI goes" />
            <div>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-0.025em] leading-[1.02] text-foreground mb-10 max-w-3xl">
                We install AI where the business actually runs.
              </h2>
              <div className="border-y border-border">
                {[
                  ["Sales", "Pipeline & follow-up", "Lead response, account notes, proposals, quote drafts, reactivation, handoff to operations, and sales coaching.", "/contact-sales", "#4b35ff"],
                  ["Operations", "Projects & delivery", "Project coordination, service issues, vendor handoffs, delivery exceptions, internal requests, and team accountability.", "/contact-sales", "#00a8ff"],
                  ["Knowledge", "Company memory", "Product/vendor knowledge, policies, call notes, SOPs, customer context, onboarding, and searchable institutional memory.", "/products/vellum", "#12b981"],
                  ["Leadership", "Visibility & decisions", "Dashboards, operating reviews, decision logs, risk signals, bottlenecks, and what needs executive attention.", "/studio", "#26f2a8"],
                ].map(([stage, type, body, href, color]) => (
                  <Link
                    key={stage}
                    href={href}
                    className="group grid sm:grid-cols-[10px_110px_170px_1fr_auto] gap-3 sm:gap-8 py-6 border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors"
                  >
                    <span className="hidden sm:block h-full min-h-12 w-1.5" style={{ backgroundColor: color }} aria-hidden />
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{stage}</span>
                    <span className="text-lg font-semibold tracking-[-0.01em] text-foreground group-hover:text-primary transition-colors">{type}</span>
                    <span className="text-sm text-muted-foreground leading-[1.65]">{body}</span>
                    <ArrowRight className="hidden sm:block h-4 w-4 text-muted-foreground mt-1 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </Link>
                ))}
              </div>
              <div className="grid sm:grid-cols-4 border border-border border-t-0 bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
                {PHASES.map((phase, index) => (
                  <div key={phase.step} className="p-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-4">
                      0{index + 1}
                    </p>
                    <h3 className="text-base font-semibold text-foreground mb-2">{phase.step}</h3>
                    <p className="text-xs text-muted-foreground leading-[1.6]">{phase.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="border-b border-border bg-[#fbfcff]">
        <div className="container mx-auto px-6 sm:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="03" label="How it starts" />
            <div>
              <div className="max-w-3xl mb-12">
                <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-0.025em] leading-[1.02] text-foreground mb-6">
                  Start focused. Keep the full system in view.
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground leading-[1.65]">
                  A company-wide AI operating system is the destination. The smartest first move is
                  usually the highest-leverage workflow: the place where speed, quality, revenue, or
                  visibility improves fast enough for the team to believe.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-px bg-border border border-border shadow-[0_18px_60px_rgba(10,12,24,0.06)]">
                {PRODUCTS.map((product) => {
                  const inner = (
                    <>
                      <div className="flex items-start justify-between gap-4 mb-10">
                        <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">§ {product.index}</span>
                        <StatusPill status={product.status} color={product.statusColor} />
                      </div>
                      <h3 className="text-2xl font-semibold tracking-[-0.02em] text-foreground mb-3 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-[1.6]">{product.tagline}</p>
                    </>
                  );

                  return product.external ? (
                    <a key={product.name} href={product.href} target="_blank" rel="noopener noreferrer" className="group bg-background p-6 hover:bg-[#f3f5ff] transition-colors">
                      {inner}
                    </a>
                  ) : (
                    <Link key={product.name} href={product.href} className="group bg-background p-6 hover:bg-[#f3f5ff] transition-colors">
                      {inner}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="relative overflow-hidden border-b border-border text-white engine-gradient">
        <div className="signal-grid absolute inset-0 opacity-50" />
        <div className="grain" />
        <div className="relative container mx-auto px-6 sm:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45 mb-3">§ 04</p>
              <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-white">The deeper layer</h2>
            </div>
            <div>
              <h2 className="display-hero text-[40px] sm:text-[58px] lg:text-[82px] leading-[1] text-white mb-10 max-w-4xl">
                The Perpetual Engine is the structure behind the work.
              </h2>
              <p className="text-base sm:text-lg text-white/65 leading-[1.7] max-w-3xl mb-12">
                The homepage sells the practical business outcome first: install AI into the company.
                Underneath that, the Engine gives the work a repeatable architecture for systems,
                products, ventures, and mission capacity.
              </p>
              <div className="grid sm:grid-cols-3 border border-white/15 divide-y sm:divide-y-0 sm:divide-x divide-white/15 mb-12">
                {ENGINE_STATS.map((stat) => (
                  <div key={stat.value} className="p-6">
                    <p className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-white mb-3">{stat.value}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45 leading-[1.5]">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/15 border border-white/15">
                {INSTITUTE_PROGRAMS.map((program) => (
                  <div key={program.name} className="bg-[#0d0d12] p-5">
                    <h3 className="text-sm font-semibold text-white mb-2">{program.name}</h3>
                    <p className="text-xs text-white/55 leading-[1.6]">{program.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="border-b border-border">
        <div className="container mx-auto px-6 sm:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="05" label="Field notes" />
            <div>
              <div className="grid lg:grid-cols-[1fr_360px] gap-12">
                <div>
                  <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-0.025em] leading-[1.02] text-foreground mb-8">
                    Publish the math. Publish the method.
                  </h2>
                  <div className="border-y border-border">
                    {FIELD_NOTES.map((note) => (
                      <Link key={note.index} href={note.href} className="group block py-6 border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors">
                        <div className="flex items-baseline gap-4 mb-3">
                          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{note.index}</span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{note.date}</span>
                        </div>
                        <h3 className="text-lg font-semibold tracking-[-0.01em] text-foreground mb-2 group-hover:text-primary transition-colors">{note.title}</h3>
                        <p className="text-sm text-muted-foreground leading-[1.6]">{note.summary}</p>
                      </Link>
                    ))}
                  </div>
                </div>
                <aside className="border border-border bg-card p-6 self-start">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary mb-5">
                    Open invitation
                  </p>
                  <div className="space-y-5">
                    {INVITATION_ROWS.map((row) => (
                      <Link key={row.tag} href={row.href} className="group block border-b border-border pb-5 last:border-b-0 last:pb-0">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">{row.tag}</p>
                        <h3 className="text-sm font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">{row.title}</h3>
                        <p className="text-xs text-muted-foreground leading-[1.55] mb-2">{row.body}</p>
                        <span className="inline-flex items-center text-xs font-medium text-foreground">
                          {row.cta} <ArrowRight className="ml-1.5 h-3 w-3" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="border-b border-border bg-[#eef2ff]">
        <div className="container mx-auto px-6 sm:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="06" label="Start" />
            <div className="max-w-3xl">
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-0.025em] leading-[1.02] text-foreground mb-6">
                Map the operating system.
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-[1.65] mb-10">
                The first conversation is not “what package do you want?” It is “where does the
                company lose time, customers, knowledge, visibility, or follow-through?” From there,
                we identify the first wedge and the larger system it should grow into.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Button asChild size="lg" className="h-11 px-7 rounded-[6px] bg-primary text-primary-foreground shadow-[0_14px_42px_rgba(75,53,255,0.22)] hover:bg-[#3324d9]">
                  <Link href="/contact-sales">
                    Map my AI operating system <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-11 px-7 rounded-[6px] shadow-none">
                  <Link href="/studio">
                    See studio services <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <section className="bg-background py-16 sm:py-20">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div className="flex items-baseline gap-3 text-muted-foreground">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em]">—</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
                Notes from the operating layer
              </span>
            </div>
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-5">
                Stay close to the work.
              </h2>
              <p className="text-base text-muted-foreground leading-[1.7] mb-8">
                Occasional dispatches on AI installs, the Engine commitment, and what we are shipping.
              </p>
              <NewsletterCapture variant="inline" source="home_inline" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
