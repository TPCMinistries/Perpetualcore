/**
 * /studio — studio overview (arm 01 of the company).
 *
 * Visual register: matches homepage v5. Display serif for hero H1 (one
 * editorial moment), Inter semibold for sub-heads, JetBrains Mono for
 * labels and indices, §-numbered section rails, hairline grids.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Studio — Perpetual Core",
  description:
    "An AI-first studio for organizations the joint ventures won't serve. We install operating systems for mission-driven organizations. Engagements start at $75,000.",
};

const BUYERS = [
  {
    title: "Mission-driven CEOs and EDs.",
    body: "Running $5M–$50M organizations. Already past the consultant-deck stage. Want a system, not a recommendation.",
  },
  {
    title: "Foundation program officers.",
    body: "Sourcing AI implementation partners for grantee portfolios. Need vendors who can clear the mission-alignment, equity, and sustainability screen most AI shops don't pass.",
  },
  {
    title: "PE Operating Partners.",
    body: "Running portcos that need an AI-native COO before the next quarter's board meeting. Atlas is for you — by introduction only.",
  },
  {
    title: "COOs of regional health systems.",
    body: "Working under HIPAA, state-level data sovereignty, and budget envelopes the JV tier ignores.",
  },
  {
    title: "Mission-aligned founders building toward acquisition.",
    body: "Install the operating system before the diligence team shows up.",
  },
];

const PHASES = [
  {
    step: "Learn",
    body:
      "Two weeks. We sit in your meetings, watch your handoffs, find the operational gaps your team has stopped seeing because they live with them.",
  },
  {
    step: "Wire",
    body:
      "Three to four weeks. We install the eight registries in your stack — Supabase, storage, auth. The substrate is in place.",
  },
  {
    step: "Automate",
    body:
      "Six to ten weeks. Skills built against your real workflows — Anthropic SKILL.md format, per-portco JSON, versioned and auditable.",
  },
  {
    step: "Scale",
    body:
      "Two to four weeks. Your team operates and extends the system. We document, train, hand over. You own it.",
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

export default function StudioOverviewPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 bg-foreground" />
            <p className="eyebrow !text-foreground/70">§ 01 · Studio</p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[76px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            Three ways to put the Engine{" "}
            <span className="italic text-foreground/85">to work in your org.</span>
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>
              Subscribe to a product. Hire a productized retainer. Install the full Engine in an
              engagement. Same studio, three cadences — meeting you at the band that fits the work
              you&apos;re trying to get done.
            </p>
            <p>
              Across all three: the same operator-grade methodology, the same Engine substrate, the
              same 10–15% giving floor that funds the Institute.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button
              size="lg"
              asChild
              className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
            >
              <Link href="#spectrum">
                See the three bands <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Link
              href="/studio/engagements"
              className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary"
            >
              Start an engagement <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Three-band spectrum */}
      <section id="spectrum" className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="—" label="The spectrum" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Products · Retainers · Engagements.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                The spectrum is deliberate. Most orgs start narrow and grow into the full Engine.
                Some never need the full install. Some go straight to it. The studio meets the
                work where it is. Move between bands as the work scales — we discuss credit
                case-by-case when you do.
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
              <p className="text-lg font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-3">
                Subscribe to a product. The operator drives.
              </p>
              <p className="text-sm text-muted-foreground leading-[1.65] mb-6 flex-1">
                Self-serve SaaS. Platform, Vellum, Sage, RFP Engine. Sign up, start using.
                $0–$249/mo. For individuals and small teams.
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground mt-auto">
                $0 → $249/mo
              </p>
            </Link>

            <Link
              href="/studio/retainers"
              className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col"
            >
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">
                BAND · 02
              </p>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                Retainers
              </h4>
              <p className="text-lg font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-3">
                Hire a productized program. We operate.
              </p>
              <p className="text-sm text-muted-foreground leading-[1.65] mb-6 flex-1">
                Five named programs at $5K–$15K/month. Sentinel on retainer, capture pipeline,
                operator concierge, skills subscription, Vellum Institutional. Cancellable monthly.
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground mt-auto">
                $5K → $15K/mo
              </p>
            </Link>

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
              <p className="text-lg font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-3">
                Install the Engine. You own the system.
              </p>
              <p className="text-sm text-muted-foreground leading-[1.65] mb-6 flex-1">
                90 to 180 day install across your departments. Three bands: Foundations ($75K),
                Operations ($150K), Institutional ($250K+). Documented, trained, handed over.
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground mt-auto">
                $75K → $250K+
              </p>
            </Link>
          </div>

          <div className="mt-10 max-w-3xl">
            <p className="text-sm text-muted-foreground leading-[1.7] italic">
              Most orgs cross bands over time. A product subscription becomes a retainer when the
              work scales. A retainer rolls into an engagement when the org commits to installing
              the substrate. We discuss credit toward engagement scope case-by-case when you make
              that move.
            </p>
          </div>
        </div>
      </section>

      {/* Who we serve — table layout */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="01" label="Who comes to us" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Operators who carry weight.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                We work with a narrow band of buyers, intentionally.
              </p>
            </div>
          </div>

          <div className="border-t border-border max-w-5xl">
            {BUYERS.map((b, i) => (
              <div
                key={b.title}
                className="grid grid-cols-[40px_1fr] sm:grid-cols-[80px_320px_1fr] gap-x-6 sm:gap-x-12 gap-y-2 py-7 border-b border-border items-baseline"
              >
                <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground pt-1">
                  0{i + 1}
                </span>
                <h4 className="text-lg sm:text-xl font-semibold tracking-[-0.01em] text-foreground col-span-1 sm:col-auto">
                  {b.title}
                </h4>
                <p className="text-base text-muted-foreground leading-[1.65] col-span-2 sm:col-auto">
                  {b.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/studio/engagements"
              className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              See engagements <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Framework */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="02" label="The Framework" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Learn → Wire → Automate → Scale.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                A four-phase engagement that audits your operations, installs the Perpetual Engine
                across your departments, and hands you a system your team owns.
              </p>
            </div>
          </div>

          <div className="border-t border-border max-w-5xl">
            {PHASES.map((p, i) => (
              <div
                key={p.step}
                className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_200px_1fr] gap-6 sm:gap-12 py-8 border-b border-border"
              >
                <span className="font-mono text-[11px] text-muted-foreground tracking-[0.18em] pt-1">
                  0{i + 1}
                </span>
                <h4 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground col-span-1 sm:col-auto">
                  {p.step}.
                </h4>
                <p className="text-base text-muted-foreground leading-[1.7] col-span-2 sm:col-auto">
                  {p.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-start gap-5">
            <Button
              asChild
              className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
            >
              <Link href="/studio/methodology">
                Read the methodology <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Link
              href="/studio/process"
              className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
            >
              See the engagement arc <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Start" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                We take a limited number of engagements per quarter.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                Engagements start at $75,000. Retainer $5,000–$15,000/month, scoped to engagement.
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
                  href="/about"
                  className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3"
                >
                  Talk to the founder <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
