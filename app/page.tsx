import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  ChevronRight,
  Circle,
  Cpu,
  FileSearch,
  GraduationCap,
  HeartPulse,
  Layers3,
  Radio,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkipLink } from "@/components/ui/accessibility";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { ContentSlot } from "@/components/slots/ContentSlot";
import { OperatingNetwork } from "@/components/landing/v4/OperatingNetwork";

export const metadata = {
  title: "Perpetual Core — AI systems that run real companies",
  description:
    "Perpetual Core builds and operates specialized intelligence systems across opportunity, research, people, education, care, and media—connected through Sage.",
};

const CORE_SYSTEMS = [
  {
    name: "Sage",
    category: "Operating intelligence",
    status: "Private live system",
    headline: "Persistent context for operators carrying more than one company.",
    href: "https://sage.perpetualcore.com",
    accent: "#8b7cff",
    icon: BrainCircuit,
    span: "lg:col-span-7",
  },
  {
    name: "RFP Engine",
    category: "Opportunity intelligence",
    status: "Live",
    headline: "Find, qualify, and develop the right grants and contracts.",
    href: "https://rfp.perpetualcore.com",
    accent: "#4ea7ff",
    icon: FileSearch,
    span: "lg:col-span-5",
  },
  {
    name: "Sentinel",
    category: "Diligence intelligence",
    status: "Live",
    headline: "Evidence-backed research for consequential people and company decisions.",
    href: "https://sentinel.perpetualcore.com",
    accent: "#54e6b1",
    icon: SearchCheck,
    span: "lg:col-span-6",
  },
  {
    name: "Janice",
    category: "People operations",
    status: "Live",
    headline: "Hiring, agreements, onboarding, and the people lifecycle in one system.",
    href: "https://janice.perpetualcore.com",
    accent: "#ffb85c",
    icon: UsersRound,
    span: "lg:col-span-6",
  },
] as const;

const PRIVATE_SYSTEMS = [
  {
    name: "Press",
    status: "By invitation",
    body: "A governed media production system for transcription, editing, clips, voice, and distribution.",
    href: "/products/press",
  },
  {
    name: "Scribe",
    status: "Private release",
    body: "A voice-led publishing studio for turning recorded thinking into refined work.",
    href: "https://scribe.perpetualcore.com",
  },
  {
    name: "Atlas",
    status: "In pilot",
    body: "An AI-native COO system for funds, operating partners, and portfolio companies.",
    href: "/products/atlas",
  },
  {
    name: "Atelier",
    status: "In pilot",
    body: "An agent-augmented workspace for repeatable projects, flows, and team execution.",
    href: "https://atelier.perpetualcore.com",
  },
] as const;

const OPERATED_SYSTEMS = [
  {
    name: "IHA AI Academy",
    status: "Live learning platform",
    body: "Applied AI education with a course-scoped Sage learning experience.",
    href: "https://academy.humanadvancementinstitute.org",
    icon: GraduationCap,
  },
  {
    name: "IHA Care",
    status: "Live demonstration",
    body: "A synthetic-data care operations environment built for governed buyer evaluation.",
    href: "https://care.theiha.org",
    icon: HeartPulse,
  },
  {
    name: "Uplift Workforce",
    status: "Live program platform",
    body: "A production workforce system supporting real healthcare training operations.",
    href: "https://workforce.upliftcommunities.com",
    icon: UsersRound,
  },
] as const;

const ENGAGEMENTS = [
  {
    number: "01",
    title: "Deploy a system",
    body: "Use a specialized product for an urgent operating job.",
    href: "/marketplace",
    cta: "Explore systems",
  },
  {
    number: "02",
    title: "Install intelligence",
    body: "Connect approved context, people, and workflows across the company.",
    href: "/contact-sales",
    cta: "Design the operating layer",
  },
  {
    number: "03",
    title: "Build a venture",
    body: "Turn a repeatable intelligence system into a company with us.",
    href: "/fund",
    cta: "Build with Perpetual Core",
  },
] as const;

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050507]/82 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7cff]"
          aria-label="Perpetual Core home"
        >
          <span className="relative flex h-5 w-5 items-center justify-center" aria-hidden="true">
            <span className="absolute inset-0 rotate-45 border border-[#8b7cff]" />
            <span className="h-1.5 w-1.5 bg-[#54e6b1]" />
          </span>
          <span className="text-[14px] font-semibold tracking-[-0.01em] text-white">
            PERPETUAL CORE
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
          {[
            ["Systems", "/marketplace"],
            ["Intelligence layer", "/#intelligence-layer"],
            ["Studio", "/studio"],
            ["Company", "/about"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="inline-flex min-h-11 items-center text-sm text-white/58 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7cff]"
            >
              {label}
            </Link>
          ))}
        </nav>

        <Button
          asChild
          size="sm"
          className="min-h-10 rounded-none border border-white/18 bg-white px-4 text-xs font-semibold uppercase tracking-[0.08em] text-black hover:bg-[#54e6b1]"
        >
          <Link href="/contact-sales">
            <span className="sm:hidden">Enter</span>
            <span className="hidden sm:inline">Enter the network</span>
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </header>
  );
}

function StatusMark({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/54">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#54e6b1] opacity-35 motion-reduce:animate-none" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#54e6b1]" />
      </span>
      {label}
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="pc-v4 min-h-screen bg-[#050507] text-white">
      <PageViewTracker />
      <SkipLink />
      <SiteHeader />
      <ContentSlot slotKey="pc-home-banner" />

      <main id="main-content">
        <section className="relative isolate overflow-hidden border-b border-white/10">
          <div className="pc-v4-grid absolute inset-0 opacity-45" aria-hidden="true" />
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_75%_42%,rgba(109,91,255,0.16),transparent_34%),radial-gradient(circle_at_20%_0%,rgba(84,230,177,0.07),transparent_28%),linear-gradient(180deg,transparent_65%,#050507_100%)]"
            aria-hidden="true"
          />

          <div className="relative mx-auto grid max-w-[1440px] gap-14 px-5 pb-12 pt-16 sm:px-8 sm:pb-16 sm:pt-24 lg:min-h-[790px] lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-8 lg:pb-20 lg:pt-20">
            <div className="max-w-[680px]">
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#54e6b1]">
                <Radio className="h-3.5 w-3.5" aria-hidden="true" />
                Perpetual Core / AI operating network
              </div>

              <h1 className="mt-8 text-[52px] font-semibold leading-[0.91] tracking-[-0.065em] text-white sm:text-[72px] lg:text-[86px]">
                AI systems that
                <span className="block text-white/42">run real companies.</span>
              </h1>

              <p className="mt-8 max-w-[630px] text-[17px] leading-8 text-white/64 sm:text-[20px]">
                Perpetual Core builds and operates specialized intelligence
                systems across opportunity, research, people, education, care,
                and media—connected through Sage.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="min-h-12 rounded-none bg-white px-6 text-sm font-semibold uppercase tracking-[0.06em] text-black hover:bg-[#54e6b1]"
                >
                  <Link href="/marketplace">
                    Explore live systems <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="min-h-12 rounded-none border-white/18 bg-transparent px-6 text-sm font-semibold text-white hover:bg-white/8 hover:text-white"
                >
                  <Link href="/#intelligence-layer">See how Sage connects them</Link>
                </Button>
              </div>

              <div className="mt-9 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/42">
                <ShieldCheck className="h-4 w-4 text-[#8b7cff]" aria-hidden="true" />
                Persistent intelligence. Explicit authority.
              </div>
            </div>

            <OperatingNetwork />
          </div>

          <div className="relative border-t border-white/10">
            <div className="mx-auto flex max-w-[1440px] gap-0 overflow-x-auto px-5 sm:px-8">
              {["Sage", "RFP Engine", "Sentinel", "Janice", "Press", "Scribe"].map(
                (product, index) => (
                  <div
                    key={product}
                    className="flex min-w-[170px] flex-1 items-center gap-3 border-l border-white/10 px-5 py-5 last:border-r"
                  >
                    <span className="font-mono text-[9px] text-white/24">
                      0{index + 1}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-[0.08em] text-white/68">
                      {product}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#08080b] py-20 sm:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#54e6b1]">
                  Verified core systems
                </p>
                <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-6xl">
                  The network is already operating.
                </h2>
              </div>
              <p className="max-w-2xl text-base leading-8 text-white/54 lg:justify-self-end">
                Not a collection of concept demos. Distinct systems are deployed
                for real operating jobs, with availability stated plainly.
              </p>
            </div>

            <div className="mt-12 grid gap-px overflow-hidden border border-white/10 bg-white/10 lg:grid-cols-12">
              {CORE_SYSTEMS.map((system) => (
                <a
                  key={system.name}
                  href={system.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative min-h-[330px] overflow-hidden bg-[#0b0b0f] p-7 transition-colors duration-300 hover:bg-[#101017] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7cff] sm:p-9 ${system.span}`}
                >
                  <div
                    className="absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-0 blur-[90px] transition-opacity duration-500 group-hover:opacity-20"
                    style={{ backgroundColor: system.accent }}
                    aria-hidden="true"
                  />
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <span
                        className="flex h-11 w-11 items-center justify-center border"
                        style={{ borderColor: `${system.accent}66`, color: system.accent }}
                      >
                        <system.icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <StatusMark label={system.status} />
                    </div>
                    <div className="mt-auto pt-20">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/36">
                        {system.category}
                      </p>
                      <div className="mt-4 flex items-end justify-between gap-6">
                        <div>
                          <h3 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                            {system.name}
                          </h3>
                          <p className="mt-3 max-w-xl text-sm leading-6 text-white/52">
                            {system.headline}
                          </p>
                        </div>
                        <ArrowUpRight className="h-5 w-5 shrink-0 text-white/34 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white" />
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="intelligence-layer" className="scroll-mt-20 border-b border-white/10 py-20 sm:py-28">
          <div className="mx-auto grid max-w-[1440px] gap-14 px-5 sm:px-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-center">
            <div>
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8b7cff]">
                <Cpu className="h-4 w-4" aria-hidden="true" />
                One intelligence layer
              </div>
              <h2 className="mt-6 text-4xl font-semibold leading-[1] tracking-[-0.05em] sm:text-6xl">
                Sage holds the thread.
              </h2>
              <p className="mt-6 max-w-xl text-[17px] leading-8 text-white/56">
                Sage coordinates approved priorities, evidence pointers, source
                health, and outcome receipts across the network. It does not
                collapse every company or protected record into one unrestricted
                database.
              </p>
              <Link
                href="/engine"
                className="mt-8 inline-flex min-h-11 items-center border-b border-white/24 text-sm font-semibold text-white transition hover:border-[#54e6b1] hover:text-[#54e6b1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7cff]"
              >
                Inspect the architecture <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <div className="relative border border-white/12 bg-[#09090d] p-6 sm:p-9">
              <div className="pc-v4-grid absolute inset-0 opacity-20" aria-hidden="true" />
              <div className="relative grid gap-px bg-white/10 sm:grid-cols-3">
                {[
                  ["01", "Observe", "Authorized sources emit bounded signals."],
                  ["02", "Reason", "Systems use context with provenance intact."],
                  ["03", "Act", "Consequential actions wait for human authority."],
                ].map(([number, title, body]) => (
                  <div key={number} className="bg-[#0d0d12] p-6">
                    <span className="font-mono text-[9px] text-[#54e6b1]">{number}</span>
                    <h3 className="mt-10 text-xl font-semibold text-white">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/46">{body}</p>
                  </div>
                ))}
              </div>
              <div className="relative mt-px flex items-start gap-4 bg-[#111019] p-6">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8b7cff]" aria-hidden="true" />
                <p className="text-sm leading-6 text-white/58">
                  Publishing, money, protected records, migrations, and provider
                  actions remain behind explicit approval.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#08080b] py-20 sm:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ffb85c]">
                  Private releases and pilots
                </p>
                <h2 className="mt-5 text-4xl font-semibold leading-[1] tracking-[-0.05em]">
                  The next systems are already taking shape.
                </h2>
              </div>
              <div className="border-t border-white/12">
                {PRIVATE_SYSTEMS.map((system) => (
                  <Link
                    key={system.name}
                    href={system.href}
                    className="group grid gap-4 border-b border-white/12 py-6 transition-colors hover:bg-white/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7cff] sm:grid-cols-[0.5fr_0.7fr_1.6fr_auto] sm:items-center sm:px-4"
                  >
                    <span className="text-xl font-semibold tracking-[-0.03em] text-white">
                      {system.name}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-[#ffb85c]">
                      {system.status}
                    </span>
                    <span className="text-sm leading-6 text-white/46">{system.body}</span>
                    <ChevronRight className="h-4 w-4 text-white/28 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 py-20 sm:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
            <div className="max-w-3xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#4ea7ff]">
                Built on the Engine
              </p>
              <h2 className="mt-5 text-4xl font-semibold leading-[1] tracking-[-0.05em] sm:text-5xl">
                The architecture is operating beyond the marketplace.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/52">
                These are portfolio and program platforms—not extra Core SKUs.
                They prove the Engine across education, care, and workforce operations.
              </p>
            </div>

            <div className="mt-12 grid gap-px border border-white/10 bg-white/10 lg:grid-cols-3">
              {OPERATED_SYSTEMS.map((system) => (
                <a
                  key={system.name}
                  href={system.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-[#09090d] p-7 transition hover:bg-[#0f0f15] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7cff] sm:p-9"
                >
                  <div className="flex items-center justify-between">
                    <system.icon className="h-5 w-5 text-[#4ea7ff]" aria-hidden="true" />
                    <ArrowUpRight className="h-4 w-4 text-white/26 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white" />
                  </div>
                  <p className="mt-16 font-mono text-[9px] uppercase tracking-[0.14em] text-[#4ea7ff]">
                    {system.status}
                  </p>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.035em]">{system.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/46">{system.body}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#08080b] py-20 sm:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
            <div className="flex items-end justify-between gap-8">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#54e6b1]">
                  Work with Perpetual Core
                </p>
                <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                  Three ways into the network.
                </h2>
              </div>
              <Layers3 className="hidden h-9 w-9 text-white/18 sm:block" aria-hidden="true" />
            </div>

            <div className="mt-12 grid gap-px border border-white/10 bg-white/10 lg:grid-cols-3">
              {ENGAGEMENTS.map((item) => (
                <Link
                  key={item.number}
                  href={item.href}
                  className="group flex min-h-[310px] flex-col bg-[#0a0a0e] p-7 transition hover:bg-[#111119] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7cff] sm:p-9"
                >
                  <span className="font-mono text-[9px] text-white/26">{item.number}</span>
                  <Workflow className="mt-12 h-5 w-5 text-[#8b7cff]" aria-hidden="true" />
                  <h3 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/46">{item.body}</p>
                  <span className="mt-auto inline-flex items-center pt-10 text-sm font-semibold text-white">
                    {item.cta}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-24 sm:py-36">
          <div className="pc-v4-grid absolute inset-0 opacity-25" aria-hidden="true" />
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(109,91,255,0.28),transparent_40%)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-[1100px] px-5 text-center sm:px-8">
            <Sparkles className="mx-auto h-6 w-6 text-[#54e6b1]" aria-hidden="true" />
            <h2 className="mt-7 text-5xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-7xl">
              Build the company
              <span className="block text-white/38">that can keep learning.</span>
            </h2>
            <p className="mx-auto mt-7 max-w-2xl text-[17px] leading-8 text-white/52">
              Deploy one system, install a connected operating layer, or build
              the next intelligence company with us.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-9 min-h-12 rounded-none bg-white px-7 text-sm font-semibold uppercase tracking-[0.06em] text-black hover:bg-[#54e6b1]"
            >
              <Link href="/contact-sales">
                Enter the network <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#050507]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-10 text-xs text-white/36 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Circle className="h-3 w-3 fill-[#54e6b1] text-[#54e6b1]" aria-hidden="true" />
            <span>© 2026 Perpetual Core · AI systems company</span>
          </div>
          <div className="flex flex-wrap gap-6">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/about" className="hover:text-white">Company</Link>
            <a href="https://theiha.org" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              Supporting human advancement
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
