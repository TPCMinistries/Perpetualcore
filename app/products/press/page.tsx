/**
 * /products/press — Press by Perpetual Core: media production system.
 * By invitation. Visual register matches vellum (app/products/vellum/page.tsx).
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { productSchema, breadcrumbSchema } from "@/lib/seo/structured-data";
import { PC_PRODUCTS } from "@/lib/seo/products";
import { ContentSlot } from "@/components/slots/ContentSlot";
import { getSlotContent } from "@/lib/slots/read";

export const metadata = {
  title: "Press by Perpetual Core — media production system",
  description:
    "The HeyGen, ElevenLabs, Opus Clips, and Descript jobs running as open-source models on hardware we own. $0/month to run. By invitation.",
};

const REPLACES = [
  { tool: "HeyGen", job: "Talking-head + avatar video", now: "SadTalker, on our hardware" },
  { tool: "ElevenLabs", job: "Voice cloning + narration", now: "Kokoro / Qwen3-TTS, 3-second sample" },
  { tool: "Opus Clips", job: "Long video → scored shorts", now: "Whisper + AI clip scoring, in-house" },
  { tool: "Descript", job: "Transcript-driven editing", now: "Click-to-cut, silence removal, auto chapters" },
];

const STEPS = [
  {
    name: "Ingest",
    body: "Long-form video or audio comes in — a keynote, a podcast, a course recording. Whisper transcribes it in roughly 17 seconds per 3 minutes of source.",
  },
  {
    name: "Cut",
    body: "The transcript becomes the editing surface: click sentences to cut, silence and filler removed automatically — 22 seconds of dead air stripped from a 3-minute keynote without a human touching a timeline.",
  },
  {
    name: "Score and frame",
    body: "Candidate clips are AI-scored for shareability, then face-tracked and framed into captioned 9:16 shorts.",
  },
  {
    name: "Voice and distribute",
    body: "Voice-cloned narration batches unattended across long runs — a 63-script course narrated in one pass — and per-brand caption and ad packs go out across up to seven brand voices.",
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

function PhoneDemo({ src, label }: { src: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-[220px] sm:w-[240px] rounded-[28px] border border-border bg-card p-2 shadow-sm">
        <div className="rounded-[20px] overflow-hidden bg-black aspect-[9/16]">
          <video
            src={src}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
            aria-label={label}
          />
        </div>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * "Latest from the build" — section chrome and all disappears while the
 * pc-press-feed slot is empty (the slot read is cached, so the extra call
 * inside ContentSlot dedupes).
 */
async function LatestFromBuildSection() {
  const content = await getSlotContent("pc-press-feed");
  if (!content || (content.type === "moments" && content.items.length === 0)) return null;
  return (
    <section className="border-t border-border py-24 sm:py-32">
      <div className="container mx-auto px-6 sm:px-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
          <SectionRail index="05" label="Latest from the build" />
          <div className="max-w-2xl">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-10">
              Shipped this week.
            </h3>
            <ContentSlot slotKey="pc-press-feed" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CreatorStudioPage() {
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
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 bg-status-invite" />
            <p className="eyebrow !text-foreground/70">§ 02 · Products · Press</p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            We replaced four subscriptions with{" "}
            <span className="italic text-foreground/85">a system.</span>
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>
              Press is the media production system Perpetual Core built and operates for
              its own content — the HeyGen, ElevenLabs, Opus Clips, and Descript jobs running as
              open-source models on hardware we own. It runs long-form video into scored, captioned
              shorts, clones a voice from a 3-second sample, and edits from the transcript instead
              of a timeline.
            </p>
            <p>
              <span className="text-foreground font-medium">$0/month to run.</span> The same
              engineering we apply for clients who want the same system installed under their own
              brand.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button size="lg" asChild className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
              <Link href="/contact-sales?product=press">Request an invitation <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Link href="#how-it-works" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary">
              See how it works <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* What it replaces */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="01" label="What it replaces" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                Four vendor subscriptions collapse into one system.
              </h3>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            {REPLACES.map((r, i) => (
              <div key={r.tool} className={`p-6 sm:p-7 flex flex-col ${i >= 2 ? "sm:border-t lg:border-t-0" : ""} border-border`}>
                <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">
                  0{i + 1}
                </span>
                <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-2">
                  {r.tool}
                </p>
                <p className="text-sm text-muted-foreground leading-[1.5] mb-4">{r.job}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mt-auto pt-4 border-t border-border/60">
                  {r.now}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-16">
            <SectionRail index="02" label="Output" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Two clips, same source, same system.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Face-tracked framing, burned captions, AI-scored clip selection. The caption style
                changes per brand voice — the pipeline underneath does not.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-16">
            <PhoneDemo src="/media/press/demo-punchy.mp4" label="Caption style — punchy" />
            <PhoneDemo src="/media/press/demo-serif.mp4" label="Caption style — serif" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="03" label="How it works" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                Transcript in, distributed content out.
              </h3>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            {STEPS.map((s, i) => (
              <div key={s.name} className={`p-6 sm:p-7 flex flex-col ${i >= 2 ? "sm:border-t lg:border-t-0" : ""} border-border`}>
                <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">
                  0{i + 1}
                </span>
                <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-4">
                  {s.name}.
                </p>
                <p className="text-sm text-muted-foreground leading-[1.65]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Honest engineering */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="04" label="The engineering" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-10">
                Open models. Our hardware. No per-seat rent.
              </h3>
              <div className="space-y-5 text-base text-muted-foreground leading-[1.7]">
                <p>
                  The stack is Apache- and MIT-licensed open models — Whisper, Kokoro, Qwen3-TTS,
                  SadTalker — running on Apple Silicon we own, orchestrated by Claude agents. No
                  HeyGen render queue, no ElevenLabs character limit, no per-seat Descript license.
                </p>
                <p>
                  A performance loop closes the pipeline: real analytics CSVs feed back into clip
                  selection, so the system gets better at picking winners instead of running the
                  same scoring heuristic forever.
                </p>
                <p className="text-foreground font-medium">
                  Nothing here is a demo. It runs our own content pipeline today.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="By invitation" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Press is not self-serve. It is a system we build for operators.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                We install the same pipeline under your brand voice, on your archive, pointed at
                your distribution. Tell us the archive you have and the channels you publish to.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                  <Link href="/contact-sales?product=press">Request an invitation <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
                </Button>
                <Link href="/studio/engagements" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
                  See engagements <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LatestFromBuildSection />

      <Footer />
    </div>
  );
}
