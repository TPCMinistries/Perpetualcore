/**
 * /products/sage — Sage entry point. Full surface at sage.perpetualcore.com.
 * Visual register matches homepage v6.
 */

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { productSchema } from "@/lib/seo/structured-data";
import { PC_PRODUCTS } from "@/lib/seo/products";

export const metadata = {
  title: "Sage — Perpetual Core",
  description:
    "Personal AI OS with ambient context and a voice clone. Lives wherever you do — Telegram, voice, web. 15% of every subscription funds the Institute for Human Advancement.",
};

const PILLARS = [
  {
    name: "Ambient context",
    body: "Calls, voice memos, calendar, the docs you actually look at — quietly captured and woven into Sage's context. You stop re-explaining yourself. Sage already knows what you decided last Tuesday and which projects matter this week.",
  },
  {
    name: "Voice clone",
    body: "Sage learns to write in your voice. Email drafts, board prep, LinkedIn copy that sounds like you — because it is you, captured across hundreds of voice notes. Edit, don't author. The blank-page tax is the one tax Sage actually eliminates.",
  },
  {
    name: "Personas",
    body: "Switch context: the strategy partner who pushes back, the chief of staff who runs the day, the coach who asks the harder question. One Sage, multiple registers — calibrated to how you actually operate.",
  },
];

const USE_CASES = [
  {
    name: "The chief of staff who never forgets",
    body: "Brief Sage between meetings. Triage your inbox at end of day. Open tomorrow morning and the open loops, decisions, and follow-ups are already organized. The coordination tax shrinks.",
  },
  {
    name: "The coach who asks the harder question",
    body: "When the operator part of you wants to ship, the coach persona steps in. What are you optimizing for? Who is this actually for? The questions you'd ask yourself if you had time.",
  },
  {
    name: "The strategist who reads with you",
    body: "Drop in a deck, a contract, a long memo. Get the synthesis, the gaps, the questions to ask before signing. The pre-read on every document you didn't have time to actually pre-read.",
  },
];

const CHANNELS = [
  { name: "Telegram", body: "Text Sage like you'd text a chief of staff. The conversation persists. Open the thread tomorrow and Sage already knows what you decided yesterday." },
  { name: "Voice", body: "Walk-and-talk. Brief Sage between meetings. Voice memos route into the same context thread as everything else. No transcription tax." },
  { name: "Web", body: "The full surface for deeper sessions — strategy, drafting, planning. Same Sage. The channel changes, the relationship doesn't." },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div>
      <p className="eyebrow mb-3">§ {index}</p>
      <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">{label}</h2>
    </div>
  );
}

export default function SagePage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={productSchema(PC_PRODUCTS.sage)} />
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 bg-status-invite" />
            <p className="eyebrow !text-foreground/70">§ 02 · Products · Sage</p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            Personal AI OS with ambient context{" "}
            <span className="italic text-foreground/85">and your voice.</span>
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>
              For operators who run two or more entities, live in voice memos, and want a
              relational AI partner — not a chatbot you re-explain yourself to every morning.
              Sage learns your voice, holds your context, and switches register between coach,
              chief of staff, and strategist.
            </p>
            <p>Lives wherever you do. Telegram, voice, web.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button size="lg" asChild className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
              <a href="https://sage.perpetualcore.com" target="_blank" rel="noopener noreferrer">
                Meet Sage <ArrowUpRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Link href="/products" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary">
              See the full portfolio <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Three pillars — what makes Sage Sage */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="01" label="The combo" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Three things together. Not one in isolation.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Replika has the relational layer. Personal AI captures notes. Pi has the
                personality. None of them have all three working together with your voice in your
                channels. That&apos;s the moat.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            {PILLARS.map((p, i) => (
              <div key={p.name} className="p-6 sm:p-7 flex flex-col">
                <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">
                  0{i + 1}
                </span>
                <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                  {p.name}
                </h4>
                <p className="text-sm text-muted-foreground leading-[1.65]">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases — coach + CoS + strategist */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="02" label="How operators use it" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Coach. Chief of staff. Strategist. Switch as needed.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Sage runs three primary registers. Most operators end up using all three —
                sometimes within the same morning.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {USE_CASES.map((c, i) => (
                <div key={c.name} className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] gap-x-6 sm:gap-x-10 py-7 border-b border-border">
                  <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground pt-1">
                    0{i + 1}
                  </span>
                  <div>
                    <h4 className="text-lg sm:text-xl font-semibold tracking-[-0.01em] text-foreground mb-3">
                      {c.name}
                    </h4>
                    <p className="text-base text-muted-foreground leading-[1.7]">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Channels */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="03" label="Three surfaces" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                One Sage. Meets you on the channel you already use most.
              </h3>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            {CHANNELS.map((c, i) => (
              <div key={c.name} className="p-6 sm:p-7 flex flex-col">
                <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">
                  0{i + 1}
                </span>
                <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                  {c.name}
                </h4>
                <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-5">
                  Sage on {c.name}.
                </p>
                <p className="text-sm text-muted-foreground leading-[1.65]">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 15% to IHA — distinguishing feature */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="04" label="The 15% line" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-8">
                15% of every Sage subscription funds the{" "}
                <a href="https://theiha.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-primary">
                  Institute for Human Advancement
                </a>
                .
              </h3>
              <div className="space-y-5 text-base text-muted-foreground leading-[1.7]">
                <p>
                  The highest giving rate of any product in the portfolio — three to five times
                  the standard 10% line — because Sage is the personal product. The one you live
                  with day-to-day. The one whose proceeds fund the broader mission most directly.
                </p>
                <p>
                  The Institute is the parent nonprofit behind everything Perpetual Core builds.
                  Subscribing to Sage funds the workforce, education, and human-flourishing
                  programs the studio doesn&apos;t bill clients for.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Outbound CTA */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Front door" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Sage doesn&apos;t live here. Sage lives at sage.perpetualcore.com.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                This page is the front door, not the room. Open Sage on its own surface and start
                the conversation that gets to know you over weeks, not minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button size="lg" asChild className="text-sm font-medium h-11 px-7 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                  <a href="https://sage.perpetualcore.com" target="_blank" rel="noopener noreferrer">
                    Meet Sage <ArrowUpRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Link href="/engine" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3">
                  Read the Engine <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
