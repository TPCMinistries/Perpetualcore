/**
 * /about — founder, ecosystem, operating principles.
 * Visual register matches homepage v5.
 */

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  aboutPageSchema,
  personSchema,
  breadcrumbSchema,
} from "@/lib/seo/structured-data";

export const metadata = {
  title: "About — Perpetual Core",
  description:
    "A studio, fund, and institute built to fund a mission, not the other way around. Lorenzo Daughtry-Chambers and the Institute for Human Advancement.",
};

const ECOSYSTEM = [
  {
    name: "Institute for Human Advancement",
    meta: "501(c)(3) parent · theiha.org",
    body: "Workforce development for low-income New Yorkers, healthcare-pathway training, AI-native founder programs across emerging markets, field health programs in East Africa. The mission the rest of the company funds. 10–15% of every revenue dollar across Perpetual Core flows here.",
    href: "https://theiha.org",
    external: true,
  },
  {
    name: "Uplift Communities",
    meta: "IHA operating arm",
    body: "The operating arm of the Institute. The community-college workforce track, the case-management infrastructure, the staff and intern teams — Uplift is where the on-the-ground work happens, and where Perpetual Core's methodology gets stress-tested in production before any of it goes to a client.",
    href: "https://upliftcommunities.com",
    external: true,
  },
  {
    name: "DeepFutures",
    meta: "Investment fund",
    body: "Mission-aligned founders building toward acquisition. We invest where the operating system we install becomes a strategic asset on the cap table.",
    href: "/fund",
    external: false,
  },
  {
    name: "Field research — Kenya",
    meta: "IHA Advance · East Africa",
    body: "Production AI deployments under PEPFAR rules, IRB review, and offline-first connectivity, built across parish networks in East Africa. The constraints we name in our positioning aren't theoretical — they're what our team works under every quarter.",
    href: "https://theiha.org/advance",
    external: true,
  },
];

const PRINCIPLES = [
  {
    title: "We take a limited number of engagements per quarter.",
    body: "Product pilots start small, managed lanes run $5,000–$35,000/month, and studio installs start around $30,000. Capacity is the bottleneck, not lead flow.",
  },
  {
    title: "We don't write decks.",
    body: "We install systems. If you want a transformation strategy document, we have several good referrals. None of them are us.",
  },
  {
    title: "We don't name our clients.",
    body: "Mission-driven buyers don't want their data on our website, and we respect that — even when it costs us marketing surface. Case studies are abstracted to sector and constraint regime.",
  },
  {
    title: "We don't lock you in.",
    body: "Every engagement ends with documentation, training, and handover. The system is yours after we leave. Retainer is optional, monthly, cancellable.",
  },
  {
    title: "The Engine commitment is structural.",
    body: "10–15% of every revenue dollar funds the Institute for Human Advancement. Audited annually. Line-itemed on every invoice. This is why we built the company.",
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

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={[
          aboutPageSchema(),
          personSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ]}
      />
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 bg-foreground" />
            <p className="eyebrow !text-foreground/70">About · Perpetual Core</p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[76px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            A company built to fund a{" "}
            <span className="italic text-foreground/85">mission</span> — not the other way around.
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            Perpetual Core is the for-profit infrastructure inside the{" "}
            <a
              href="https://theiha.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline underline-offset-4"
            >
              Institute for Human Advancement
            </a>{" "}
            ecosystem. Lorenzo Daughtry-Chambers founded it in 2024 to install AI operating systems
            for the mid-market mission-driven organizations the joint ventures don&apos;t serve —
            and to back the founders building the next wave of AI-native ventures.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button
              size="lg"
              asChild
              className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
            >
              <Link href="/studio/engagements">
                See engagements <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Link
              href="/engine"
              className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary"
            >
              How the Engine works <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="01" label="Founder" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                Lorenzo Daughtry-Chambers.
              </h3>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_280px_1fr] gap-10 lg:gap-16 items-start">
            <div className="hidden lg:block" />
            <div className="relative aspect-square w-full max-w-[280px] overflow-hidden border border-border bg-card">
              <Image
                src="/images/lorenzo-headshot.jpg"
                alt="Lorenzo Daughtry-Chambers, founder of Perpetual Core"
                fill
                sizes="(max-width: 1024px) 100vw, 280px"
                className="object-cover"
                priority
              />
            </div>

            <div className="max-w-2xl space-y-5 text-base sm:text-lg text-muted-foreground leading-[1.7]">
              <p className="text-foreground font-medium text-lg sm:text-xl">
                I built Perpetual Core because I needed it.
              </p>
              <p>
                I run multiple organizations at once — the Institute for Human Advancement
                (501(c)(3) parent), Uplift Communities (operating arm), DeepFutures (investment
                fund), and a portfolio of programs that includes a community-college healthcare
                workforce track in New York, a parish-network field deployment in East Africa, and
                a faith-institution platform serving multi-state networks.
              </p>
              <p>
                None of those programs run on PowerPoint. They run on production systems — under
                HIPAA in the workforce program, under PEPFAR data-sovereignty rules and IRB review
                in East Africa, under offline-first connectivity assumptions in places where the
                cellular fallback you&apos;re imagining doesn&apos;t exist. I needed an operating
                system that could hold all of it without dropping the thread.
              </p>
              <p>So I built one. Then I started installing it for other people.</p>
              <p>
                That&apos;s the whole story. A studio falls out of an operator&apos;s tool, not out
                of a strategy deck.
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground pt-2">
                — Lorenzo
              </p>

              <div className="pt-6">
                <Link
                  href="mailto:lorenzo@perpetualcore.com"
                  className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  Talk to Lorenzo <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="02" label="The Ecosystem" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Perpetual Core sits inside four things — and is one of them.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                The ecosystem is the moat. Field research, an operating arm, an institute, and a
                fund — each feeding the studio&apos;s methodology and proving the systems before
                we install them anywhere else.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {ECOSYSTEM.map((arm, i) => {
                const className = "group grid grid-cols-[40px_1fr] sm:grid-cols-[80px_240px_1fr_auto] gap-x-6 sm:gap-x-10 gap-y-2 py-7 border-b border-border hover:bg-surface-hover transition-colors items-baseline";
                const inner = (
                  <>
                    <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground pt-1">
                      0{i + 1}
                    </span>
                    <h4 className="text-lg sm:text-xl font-semibold tracking-[-0.015em] text-foreground col-span-1 sm:col-auto group-hover:text-primary transition-colors">
                      {arm.name}.
                    </h4>
                    <p className="text-sm text-muted-foreground leading-[1.6] col-span-2 sm:col-auto max-w-xl">
                      {arm.body}
                    </p>
                    <span className="hidden sm:inline-flex items-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 whitespace-nowrap">
                      {arm.meta}
                      {arm.external ? (
                        <ArrowUpRight className="ml-3 h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      ) : (
                        <ArrowRight className="ml-3 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      )}
                    </span>
                  </>
                );
                return arm.external ? (
                  <a key={arm.name} href={arm.href} target="_blank" rel="noopener noreferrer" className={className}>
                    {inner}
                  </a>
                ) : (
                  <Link key={arm.name} href={arm.href} className={className}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Operating principles */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="03" label="How we operate" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                Five things to know before you hire us.
              </h3>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {PRINCIPLES.map((p, i) => (
                <div
                  key={p.title}
                  className="grid grid-cols-[40px_1fr] sm:grid-cols-[80px_1fr] gap-x-6 sm:gap-x-10 py-7 border-b border-border"
                >
                  <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground pt-1">
                    0{i + 1}
                  </span>
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold tracking-tight text-foreground mb-2">
                      {p.title}
                    </h4>
                    <p className="text-sm sm:text-base text-muted-foreground leading-[1.7]">
                      {p.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Start" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                We&apos;re a small studio. We pick engagements carefully.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                If you&apos;re an executive director, a foundation program officer, a fund
                Operating Partner, a regional health system COO, or a mission-aligned founder — and
                the joint ventures haven&apos;t called you back — we should talk.
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
                <a
                  href="mailto:lorenzo@perpetualcore.com"
                  className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3"
                >
                  Email the founder <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
