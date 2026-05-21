/**
 * The Institute (IHA) — arm 04 of Perpetual Core.
 * Stub landing that summarizes IHA's programs and links out to theiha.org.
 * Lives on the perpetualcore.com surface so the fifth arm has a door.
 */

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "The Institute — IHA, the 501(c)(3) parent of Perpetual Core",
  description:
    "The Institute for Human Advancement is the 501(c)(3) parent of Perpetual Core. Workforce development, AI-native founder training, AI literacy programs, and field health programs in East Africa.",
};

const PROGRAMS = [
  {
    index: "01",
    name: "Founders 1,000",
    summary:
      "AI-native founder training across emerging markets. Pilot cohort June 2026. The institute's flagship entrepreneur initiative.",
    meta: "Pilot cohort · 2026",
    href: "https://theiha.org/founders",
  },
  {
    index: "02",
    name: "IHA Academy",
    summary:
      "AI literacy and applied skills for non-technical operators. Healthcare and workforce curricula in production.",
    meta: "Online · cohort-based",
    href: "https://academy.theiha.org",
  },
  {
    index: "03",
    name: "IHA Advance — Kenya",
    summary:
      "East Africa field programs. Kenya delegation launched April 2026. Production deployments under PEPFAR data sovereignty.",
    meta: "Nairobi · field-deployed",
    href: "https://theiha.org/advance",
  },
  {
    index: "04",
    name: "Workforce (via Uplift Communities)",
    summary:
      "Healthcare and community workforce development for low-income New Yorkers. DYCD-aligned. Direct service delivery — delivered through Uplift Communities, the operating arm.",
    meta: "New York · DYCD",
    href: "https://theiha.org/workforce",
  },
];

export default function InstitutePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-24 pb-20 sm:pt-32 sm:pb-24">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-10">
            <span aria-hidden className="block h-1.5 w-1.5 bg-foreground" />
            <p className="eyebrow !text-foreground/70">§ 04 · Institute</p>
          </div>

          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-4">
            The Institute for Human Advancement
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-[60px] font-semibold leading-[1.05] tracking-[-0.025em] text-foreground mb-10 max-w-3xl">
            The 501(c)(3) parent. The reason any of this exists.
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-10 max-w-2xl">
            IHA runs workforce development for low-income New Yorkers, AI-native founder training
            across emerging markets, AI literacy programs, and field health programs in East
            Africa. Perpetual Core funds it — 10–15% of every revenue dollar, audited annually.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button
              size="lg"
              asChild
              className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
            >
              <a href="https://theiha.org" target="_blank" rel="noopener noreferrer">
                Visit theiha.org <ArrowUpRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Link
              href="/engine"
              className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary"
            >
              How the Engine funds it
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="border-t border-border py-20 sm:py-28">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <div>
              <p className="eyebrow mb-3">§ 01</p>
              <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">
                Programs
              </h2>
            </div>
            <div className="max-w-2xl">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground">
                Four programs. One mission. Funded by the studio, the fund, and the products.
              </h3>
            </div>
          </div>

          <div className="border-t border-border">
            {PROGRAMS.map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid grid-cols-[40px_1fr] sm:grid-cols-[80px_220px_1fr_auto] gap-x-6 sm:gap-x-10 gap-y-2 py-7 sm:py-8 border-b border-border hover:bg-surface-hover transition-colors items-baseline"
              >
                <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground pt-0.5">
                  § {p.index}
                </span>
                <h4 className="text-xl sm:text-2xl font-semibold tracking-[-0.015em] text-foreground col-span-1 sm:col-auto group-hover:text-primary transition-colors">
                  {p.name}.
                </h4>
                <p className="text-base text-muted-foreground leading-[1.6] col-span-2 sm:col-auto max-w-xl">
                  {p.summary}
                </p>
                <span className="hidden sm:inline-flex items-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 whitespace-nowrap">
                  {p.meta}
                  <ArrowUpRight className="ml-3 h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Operating arm — Uplift Communities */}
      <section className="border-t border-border py-20 sm:py-28 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div>
              <p className="eyebrow mb-3">§ 02</p>
              <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">
                Operating arm
              </h2>
            </div>
            <div className="max-w-2xl">
              <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-4">
                Uplift Communities
              </p>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground mb-8">
                The on-the-ground arm. Where the programs actually run.
              </h3>
              <div className="space-y-5 text-base text-muted-foreground leading-[1.7]">
                <p>
                  Uplift Communities is the operating arm through which the Institute delivers its
                  direct-service work — the community-college workforce track in New York,
                  case-management infrastructure, the staff and intern teams who hold the field
                  cadence together.
                </p>
                <p>
                  It&apos;s also where Perpetual Core&apos;s methodology gets stress-tested in
                  production before it&apos;s installed for clients. The HIPAA, FERPA, and
                  outcomes-reporting workflows the studio names as constraint credentials were
                  built and run here first. The field work is the proof; Uplift is the field.
                </p>
                <p className="text-foreground font-medium">
                  Operations are how the mission gets real. Uplift is how operations get done.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The structural commitment */}
      <section className="border-t border-border py-20 sm:py-28">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div>
              <p className="eyebrow mb-3">§ 03</p>
              <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">
                Why it works
              </h2>
            </div>
            <div className="max-w-2xl">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground mb-8">
                The mission is not bolted on. The company is built to fund it — and we&apos;re
                publishing the structure for others.
              </h3>
              <div className="space-y-5 text-base text-muted-foreground leading-[1.7]">
                <p>
                  Most companies that say &ldquo;we give back&rdquo; mean a 1% pledge, a foundation
                  arm, or a one-time donation matched at year-end. Perpetual Core is built the
                  other way around: the company exists to fund the Institute.
                </p>
                <p>
                  Every Perpetual Core arm contributes. Engagements at 10%. Sage at 15%. Every
                  other product at 10% default. The studio, the fund, the products, the Engine —
                  they are all upstream of the Institute. Not adjacent. Underneath.
                </p>
                <p className="text-foreground font-medium">
                  This is the structural argument we&apos;re publishing as a standard. VC-backed
                  companies struggle to clear it. JVs are blocked by their LPs. AI-native ventures
                  built this way from day one don&apos;t face either constraint — and we hope
                  more of them are.
                </p>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row items-start gap-5">
                <Button
                  asChild
                  className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
                >
                  <a href="https://theiha.org" target="_blank" rel="noopener noreferrer">
                    Visit theiha.org <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                  </a>
                </Button>
                <Link
                  href="/"
                  className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                >
                  Back to Perpetual Core <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
