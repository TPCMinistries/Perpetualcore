/**
 * /status — honest minimal status page.
 *
 * Previously this page broadcast fabricated 99.97% uptime metrics and
 * "incidents" hardcoded to Jan 2025 — which now render as "1 year ago"
 * and read as a credibility hit. We don't have a real monitoring backend
 * wired to this surface yet, so the right move is to be honest: show
 * what we can verify (the page rendered, so the app is serving), and
 * point operators at a real channel when they need an SLA.
 *
 * When BetterStack / StatusPage / Uptime Robot is wired, replace this
 * file with a server component that renders live status from that source.
 */

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Status — Perpetual Core",
  description:
    "Operational status for Perpetual Core. Engagement-grade SLAs are spelled out in scope; for current status of a live install, contact the engagement team directly.",
};

const ENGAGEMENT_ESSENTIALS = [
  {
    label: "Engagement SLA",
    body: "Every engagement ships with a written SLA — uptime targets, response windows, and escalation paths — scoped to the install's risk profile. Standard SaaS-tier status is not a substitute for an engagement SLA.",
  },
  {
    label: "Live install support",
    body: "Engagement clients have a dedicated Slack channel and an on-call escalation. Incident response time is contractual, not aspirational.",
  },
  {
    label: "Product tier (Starter / Pro)",
    body: "Self-serve product tiers don't carry an SLA. Best-effort support; planned maintenance is announced in-app 24h ahead.",
  },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3 text-muted-foreground">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em]">{index}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.22em]">{label}</span>
    </div>
  );
}

export default function StatusPage() {
  const lastChecked = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
          <SectionRail index="00" label="System status" />
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 border border-border bg-card px-4 py-2 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground">
                All systems operational
              </span>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-[-0.025em] text-foreground">
              Operational.
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-muted-foreground leading-[1.65] max-w-2xl">
              You're seeing this page, which means the application is serving.
              Engagement-grade SLAs are spelled out in scope and tracked in
              private channels — they don't live here.
            </p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Last verified · {lastChecked}
            </p>
          </div>
        </div>
      </section>

      {/* How status actually works */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="01" label="How status works here" />
            <div className="max-w-3xl">
              <ul className="divide-y divide-border border-y border-border">
                {ENGAGEMENT_ESSENTIALS.map((item) => (
                  <li key={item.label} className="grid sm:grid-cols-[200px_1fr] gap-4 sm:gap-10 py-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-sm sm:text-base text-muted-foreground leading-[1.7]">
                      {item.body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Report an issue */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Report an issue" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Seeing something off?
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                Engagement clients: ping your dedicated channel. Product-tier
                users: email <a href="mailto:support@perpetualcore.com" className="text-foreground underline hover:no-underline">support@perpetualcore.com</a> with a screenshot and a few sentences of
                context. We read every message.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                  <Link href="mailto:support@perpetualcore.com">
                    Email support <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="text-sm font-medium h-10 px-5 shadow-none rounded-[6px]">
                  <Link href="/contact-sales?plan=exploring">
                    Talk about SLAs
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
