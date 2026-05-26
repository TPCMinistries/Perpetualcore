import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

type SolutionPageProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  fit: string[];
  operatingAreas: { title: string; body: string }[];
  wedge: { title: string; body: string }[];
  outcomes: string[];
};

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div>
      <p className="eyebrow mb-3">§ {index}</p>
      <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">{label}</h2>
    </div>
  );
}

export function AiOsSolutionPage({
  eyebrow,
  title,
  subtitle,
  fit,
  operatingAreas,
  wedge,
  outcomes,
}: SolutionPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden border-b border-border text-white engine-gradient">
        <div className="signal-grid absolute inset-0 opacity-60" />
        <div className="relative container mx-auto px-6 sm:px-8 py-20 sm:py-28">
          <div className="max-w-5xl">
            <div className="flex items-center gap-3 mb-10">
              <span aria-hidden className="block h-2 w-2 bg-[#26f2a8]" />
              <p className="eyebrow !text-white/70">{eyebrow}</p>
            </div>
            <h1 className="display-hero text-[46px] sm:text-[68px] lg:text-[92px] text-white leading-[0.98] mb-8 max-w-5xl">
              {title}
            </h1>
            <p className="text-lg sm:text-xl text-white/72 leading-[1.6] max-w-3xl mb-10">
              {subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Button asChild size="lg" className="h-12 px-7 rounded-[6px] bg-[#26f2a8] text-[#05060b] hover:bg-[#7dffd0]">
                <Link href="/contact-sales">
                  Map my AI operating system <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-7 rounded-[6px] border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link href="/lead-magnet">Get the checklist</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-[#f5f7ff]">
        <div className="container mx-auto px-6 sm:px-8 py-20 sm:py-24">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="01" label="Fit" />
            <div>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-0.025em] leading-[1.02] text-foreground mb-10 max-w-3xl">
                This is for operators with real moving parts.
              </h2>
              <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
                {fit.map((item) => (
                  <div key={item} className="bg-background p-6 flex gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground leading-[1.65]">{item}</p>
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
            <SectionRail index="02" label="Install surface" />
            <div>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-0.025em] leading-[1.02] text-foreground mb-10 max-w-3xl">
                Where the AI operating system goes.
              </h2>
              <div className="border-y border-border">
                {operatingAreas.map((area) => (
                  <div key={area.title} className="grid sm:grid-cols-[220px_1fr] gap-4 sm:gap-12 py-7 border-b border-border last:border-b-0">
                    <h3 className="text-lg font-semibold tracking-[-0.01em] text-foreground">{area.title}</h3>
                    <p className="text-sm text-muted-foreground leading-[1.7]">{area.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-[#fbfcff]">
        <div className="container mx-auto px-6 sm:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="03" label="First wedge" />
            <div>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-0.025em] leading-[1.02] text-foreground mb-10 max-w-3xl">
                Start where value appears fastest.
              </h2>
              <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
                {wedge.map((item) => (
                  <div key={item.title} className="bg-background p-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary mb-4">Wedge</p>
                    <h3 className="text-xl font-semibold tracking-[-0.015em] text-foreground mb-3">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-[1.65]">{item.body}</p>
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
            <SectionRail index="04" label="Outcomes" />
            <div className="max-w-3xl">
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-0.025em] leading-[1.02] text-foreground mb-10">
                What should improve.
              </h2>
              <ul className="grid sm:grid-cols-2 gap-x-10 gap-y-5">
                {outcomes.map((outcome) => (
                  <li key={outcome} className="flex gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground leading-[1.65]">{outcome}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-12">
                <Button asChild size="lg" className="h-11 px-7 rounded-[6px] bg-primary text-primary-foreground hover:bg-[#3324d9]">
                  <Link href="/contact-sales">
                    Map the operating system <ArrowRight className="ml-2 h-4 w-4" />
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
