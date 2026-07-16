/**
 * /products/press — Press by Perpetual Core: invitation-only media system.
 */

import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileVideo2,
  Scissors,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { productSchema, breadcrumbSchema } from "@/lib/seo/structured-data";
import { PC_PRODUCTS } from "@/lib/seo/products";

export const metadata = {
  title: "Press by Perpetual Core — owned media production system",
  description:
    "Turn long-form recordings into scored, captioned short-form media with an owned pipeline built around your archive, brand voice, and approval process.",
};

const CTA_HREF = "/contact-sales?product=press&plan=product-subscription";

const PROOF = [
  { value: "2 GB", label: "maximum source upload" },
  { value: "Private", label: "source and render storage" },
  { value: "3", label: "vertical, square, and widescreen exports" },
  { value: "1", label: "required human approval gate" },
];

const CONSOLIDATES = [
  { tool: "Clip discovery", job: "Find and rank short-form moments", now: "In-house scoring with review" },
  { tool: "Transcript review", job: "Correct copy and jump to source time", now: "One synchronized workspace" },
  { tool: "Caption exports", job: "Render vertical, square, and widescreen variants", now: "One approved output queue" },
  { tool: "Production tracking", job: "Track rights, status, approvals, and delivery", now: "One auditable project record" },
];

const RUN_STAGES = [
  {
    icon: FileVideo2,
    name: "Source",
    detail: "A consented long-form video or audio recording enters once.",
    result: "Private source archive",
  },
  {
    icon: Scissors,
    name: "Transcript",
    detail: "Whisper transcribes it and the transcript becomes the edit surface.",
    result: "Timestamped edit surface",
  },
  {
    icon: Sparkles,
    name: "Select",
    detail: "Candidate moments are scored, then an operator adjusts timing and approves the cut.",
    result: "Human-reviewed selection",
  },
  {
    icon: Waypoints,
    name: "Output",
    detail: "Approved clips produce captioned vertical, square, and widescreen variants.",
    result: "Three output ratios",
  },
];

const FIT = [
  {
    title: "You already record",
    body: "Keynotes, podcasts, courses, briefings, interviews, or founder updates are accumulating in an archive.",
  },
  {
    title: "Production repeats",
    body: "Your team keeps transcribing, finding moments, reframing, captioning, and packaging the same way.",
  },
  {
    title: "You want to own the workflow",
    body: "The goal is a documented system under your brand—not another seat-based editing subscription.",
  },
];

const INSTALL_STEPS = [
  {
    name: "Map",
    body: "We inspect the archive, brand rules, approval points, target channels, and the work your team repeats.",
  },
  {
    name: "Prove",
    body: "One representative recording runs through the pipeline so quality, speed, and human review are visible before expansion.",
  },
  {
    name: "Install",
    body: "The approved workflow is configured, documented, and handed to the operators who will own it.",
  },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div>
      <p className="eyebrow mb-3">§ {index}</p>
      <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">{label}</h2>
    </div>
  );
}

function PhoneDemo({
  src,
  poster,
  label,
  description,
}: {
  src: string;
  poster: string;
  label: string;
  description: string;
}) {
  return (
    <figure className="mx-auto w-full max-w-[280px]">
      <div className="rounded-[30px] border border-border bg-card p-2 shadow-sm">
        <div className="aspect-[9/16] overflow-hidden rounded-[22px] bg-black">
          <video
            src={src}
            poster={poster}
            controls
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
            aria-label={label}
          />
        </div>
      </div>
      <figcaption className="mt-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground">{label}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </figcaption>
    </figure>
  );
}

export default function PressPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={[
          productSchema(PC_PRODUCTS.press),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
            { name: "Press", path: "/products/press" },
          ]),
        ]}
      />

      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[100] rounded-sm bg-foreground px-4 py-3 text-sm text-background focus:not-sr-only"
      >
        Skip to Press
      </a>
      <Navbar />

      <main id="main-content">
        {/* Hero */}
        <section className="container mx-auto px-6 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24">
          <div className="mb-10 flex flex-wrap items-center gap-3">
            <span aria-hidden className="block h-1.5 w-1.5 bg-status-invite" />
            <p className="eyebrow !text-foreground/70">Product 09 · Press</p>
            <span className="border border-border bg-surface-hover px-2 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              By invitation
            </span>
          </div>

          <div className="grid items-end gap-14 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
            <div className="max-w-5xl">
              <h1 className="display-hero max-w-5xl text-[42px] leading-[1.02] text-foreground sm:text-[60px] lg:text-[76px]">
                Turn the archive into a media system you own.
              </h1>
              <p className="mt-9 max-w-3xl text-lg leading-[1.65] text-muted-foreground sm:text-xl">
                Press turns long-form recordings into scored, captioned short-form media—using
                your archive, your brand rules, and an approval process your operators control.
              </p>
              <p className="mt-5 max-w-3xl text-base leading-[1.7] text-muted-foreground">
                <span className="font-medium text-foreground">No recurring model or editing-seat subscription after installation.</span>{" "}
                Hardware, implementation, maintenance, and any third-party distribution costs are scoped separately.
              </p>
              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
                <Button size="lg" asChild className="h-11 rounded-[6px] bg-foreground px-7 text-sm font-medium text-background shadow-none hover:bg-foreground/90">
                  <Link href={CTA_HREF}>Scope a Press system <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Link href="#system-view" className="inline-flex min-h-11 items-center border-b border-foreground/20 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary">
                  See a real run <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <aside className="border border-foreground/15 bg-foreground p-6 text-background sm:p-7" aria-label="Press system summary">
              <div className="flex items-center justify-between gap-4 border-b border-background/20 pb-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-background/60">Owned pipeline</p>
                <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-background/70">
                  <span aria-hidden className="h-1.5 w-1.5 bg-emerald-400" /> Human approved
                </span>
              </div>
              <ol className="mt-6 space-y-5">
                {["One source recording", "Transcript-led edit", "Scored short-form moments", "Brand-ready output pack"].map((item, index) => (
                  <li key={item} className="flex items-center gap-4">
                    <span className="font-mono text-[10px] text-background/45">0{index + 1}</span>
                    <span className="text-sm text-background/90">{item}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-7 border-t border-background/20 pt-5 text-xs leading-5 text-background/55">
                The authenticated Press console supports direct upload, transcript review, clip approval,
                secure export, and a human-controlled publishing record.
              </p>
            </aside>
          </div>
        </section>

        {/* Proof strip */}
        <section className="border-y border-border" aria-label="Observed Press production metrics">
          <div className="container mx-auto grid grid-cols-2 px-6 sm:px-8 lg:grid-cols-4">
            {PROOF.map((proof, index) => (
              <div key={proof.label} className={`py-7 sm:py-9 ${index % 2 === 0 ? "pr-5" : "border-l border-border pl-5"} ${index > 1 ? "border-t lg:border-t-0" : ""} lg:border-l lg:border-t-0 lg:px-7 lg:first:border-l-0 lg:first:pl-0`}>
                <p className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">{proof.value}</p>
                <p className="mt-2 max-w-[180px] text-xs leading-5 text-muted-foreground">{proof.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow consolidation */}
        <section className="border-b border-border bg-surface-hover/40 py-20 sm:py-28">
          <div className="container mx-auto px-6 sm:px-8">
            <div className="mb-12 grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-20">
              <SectionRail index="01" label="What it consolidates" />
              <h3 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground sm:text-4xl lg:text-5xl">
                Four recurring production jobs move into one owned workflow.
              </h3>
            </div>
            <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {CONSOLIDATES.map((item, index) => (
                <article key={item.tool} className="flex min-h-[230px] flex-col bg-card p-6 sm:p-7">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">0{index + 1}</span>
                  <h4 className="mt-9 text-base font-semibold tracking-[-0.01em] text-foreground">{item.tool}</h4>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.job}</p>
                  <p className="mt-auto border-t border-border/60 pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">{item.now}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* System view */}
        <section id="system-view" className="scroll-mt-24 border-b border-border py-20 sm:py-28">
          <div className="container mx-auto px-6 sm:px-8">
            <div className="mb-12 grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-20">
              <SectionRail index="02" label="System view" />
              <div className="max-w-3xl">
                <h3 className="text-3xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground sm:text-4xl lg:text-5xl">One source. A visible production chain.</h3>
                <p className="mt-6 max-w-2xl text-base leading-[1.7] text-muted-foreground">
                  These are observed steps from the working pipeline—not a mock dashboard standing in for a product that does not exist.
                </p>
              </div>
            </div>
            <ol className="grid gap-px border border-border bg-border lg:grid-cols-4">
              {RUN_STAGES.map((stage, index) => {
                const Icon = stage.icon;
                return (
                  <li key={stage.name} className="relative bg-foreground p-6 text-background sm:p-7">
                    <div className="flex items-center justify-between">
                      <Icon className="h-5 w-5 text-background/75" aria-hidden />
                      <span className="font-mono text-[10px] text-background/35">0{index + 1}</span>
                    </div>
                    <h4 className="mt-10 text-lg font-semibold">{stage.name}</h4>
                    <p className="mt-3 min-h-[72px] text-sm leading-6 text-background/60">{stage.detail}</p>
                    <p className="mt-6 border-t border-background/20 pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-background/85">{stage.result}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Output */}
        <section className="border-b border-border bg-surface-hover/40 py-20 sm:py-28">
          <div className="container mx-auto px-6 sm:px-8">
            <div className="mb-14 grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-20">
              <SectionRail index="03" label="Output proof" />
              <div className="max-w-3xl">
                <h3 className="text-3xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground sm:text-4xl lg:text-5xl">Two treatments from the same source.</h3>
                <p className="mt-6 max-w-2xl text-base leading-[1.7] text-muted-foreground">
                  The framing and burned captions change with the brand preset; the production chain underneath stays consistent.
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  These published samples demonstrate framing and captions and contain no audio track. A consented voice example will be added before Press is presented as a complete public demo.
                </p>
              </div>
            </div>
            <div className="grid items-start gap-12 sm:grid-cols-2 sm:gap-10 lg:mx-auto lg:max-w-3xl">
              <PhoneDemo
                src="/media/press/demo-punchy.mp4"
                poster="/media/press/demo-punchy-poster.jpg"
                label="Punchy caption preset · 00:38"
                description="High-contrast captions and vertical framing for a faster editorial register."
              />
              <PhoneDemo
                src="/media/press/demo-serif.mp4"
                poster="/media/press/demo-serif-poster.jpg"
                label="Serif caption preset · 00:30"
                description="A quieter typography treatment from the same source and the same underlying pipeline."
              />
            </div>
          </div>
        </section>

        {/* Fit */}
        <section className="border-b border-border py-20 sm:py-28">
          <div className="container mx-auto px-6 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-20">
              <SectionRail index="04" label="Good fit" />
              <div>
                <h3 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground sm:text-4xl lg:text-5xl">Built for archive-rich operators, not one-off edits.</h3>
                <div className="mt-12 grid gap-px border border-border bg-border md:grid-cols-3">
                  {FIT.map((item) => (
                    <article key={item.title} className="bg-card p-6 sm:p-7">
                      <Check className="h-4 w-4 text-primary" aria-hidden />
                      <h4 className="mt-7 text-base font-semibold text-foreground">{item.title}</h4>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
                    </article>
                  ))}
                </div>
                <p className="mt-6 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Press is not a fit for anonymous voice cloning, fully unattended publishing, or a single video that simply needs an editor. Consent, retention, and human approval rules are defined before installation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Installation */}
        <section id="how-it-works" className="scroll-mt-24 border-b border-border bg-surface-hover/40 py-20 sm:py-28">
          <div className="container mx-auto px-6 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-20">
              <SectionRail index="05" label="How it starts" />
              <div>
                <h3 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground sm:text-4xl lg:text-5xl">Map one recording before installing the whole system.</h3>
                <ol className="mt-12 border-y border-border">
                  {INSTALL_STEPS.map((step, index) => (
                    <li key={step.name} className="grid gap-4 border-b border-border py-7 last:border-b-0 sm:grid-cols-[56px_140px_1fr] sm:items-start">
                      <span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span>
                      <h4 className="text-base font-semibold text-foreground">{step.name}</h4>
                      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{step.body}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="bg-foreground py-20 text-background sm:py-28">
          <div className="container mx-auto px-6 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-20">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/50">§ 06</p>
                <h2 className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-background">By invitation</h2>
              </div>
              <div className="max-w-3xl">
                <h3 className="text-3xl font-semibold leading-[1.08] tracking-[-0.025em] sm:text-4xl lg:text-5xl">Bring one recording. We’ll map the first run.</h3>
                <p className="mt-6 max-w-2xl text-base leading-[1.7] text-background/65">
                  Tell us what you record, where the archive lives, which channels matter, and where production slows down. We’ll reply with what should be automated, what should stay human, and the right first proof.
                </p>
                <div className="mt-10 flex flex-col items-start gap-5 sm:flex-row">
                  <Button asChild className="h-11 rounded-[6px] bg-background px-6 text-sm font-medium text-foreground shadow-none hover:bg-background/90">
                    <Link href={CTA_HREF}>Scope my media system <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
                  </Button>
                  <Link href="/studio/engagements" className="inline-flex min-h-11 items-center text-sm font-medium text-background/75 transition-colors hover:text-background">
                    See installation engagements <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
