/**
 * /products/sage — Sage entry-point page on the studio site.
 *
 * Per COPY_PRODUCTS.md Card 3 + Session 3 brief Step 3.
 *
 * Sage's full surface lives at sage.perpetualcore.com (subdomain
 * reserved; may not resolve yet — the standalone Sage SaaS is on a
 * separate roadmap per memory note `sage-saas-direction.md`). This
 * page is the entry point on the studio site, not the product itself.
 *
 * Hard rules:
 *   - "Sage — the coach and chief of staff who never forgets you."
 *   - 15% of every Sage subscription funds the Institute for Human
 *     Advancement (highest of any product, surfaced on this page).
 *   - "Lives wherever you do. Telegram, voice, web." channel framing.
 *   - CTA: Meet Sage → sage.perpetualcore.com (external).
 */

import Link from "next/link";
import { ArrowRight, MessageCircle, Mic, Globe, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Sage — Perpetual Core",
  description:
    "The coach and chief of staff who never forgets you. Lives wherever you do — Telegram, voice, web. 15% of every subscription funds the Institute for Human Advancement.",
};

export default function SagePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-4 pt-24 pb-24 sm:pt-32 sm:pb-32">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-6">
            Relationship, not tool.
          </p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-8">
            Sage — the coach and chief of staff{" "}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              who never forgets you
            </span>
            .
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-6">
            For operators who run two or more entities, live in voice memos, and want a relational AI partner — not a chatbot you re-explain yourself to every morning.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            Lives wherever you do. Telegram, voice, web.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <a href="https://sage.perpetualcore.com" target="_blank" rel="noopener noreferrer">
                Meet Sage <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/products">See the full portfolio</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Channels — meets you where you are */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-3xl mb-12">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            Three surfaces. One Sage.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            Meets you on the channel you already use most.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-border/60">
            <CardContent className="p-7">
              <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Telegram</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Text Sage like you&apos;d text a chief of staff. The conversation persists. Open the thread tomorrow and Sage already knows what you decided yesterday.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-7">
              <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Voice</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Walk-and-talk. Brief Sage between meetings. Voice memos route into the same memory thread as everything else. No transcription tax.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-7">
              <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Web</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                The full surface for deeper sessions — strategy, drafting, planning. Same memory. Same Sage. The channel changes, the relationship doesn&apos;t.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* The 15% IHA call-out — distinguishing feature */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-3xl">
          <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            The 15% line.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            15% of every Sage subscription funds the{" "}
            <a
              href="https://theiha.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline underline-offset-4"
            >
              Institute for Human Advancement
            </a>
            .
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            That&apos;s the highest giving rate of any product in the studio — three to five times the standard ten-percent line — because Sage is the personal product, the one you live with day-to-day, and the one whose proceeds fund the broader mission most directly.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            The Institute for Human Advancement is the parent nonprofit behind everything Perpetual Core builds. Subscribing to Sage funds the workforce, education, and human-flourishing programs the studio doesn&apos;t bill clients for.
          </p>
        </div>
      </section>

      {/* Closing — outbound */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            The product is the relationship.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Sage doesn&apos;t live here. Sage lives at sage.perpetualcore.com.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            This page is the front door, not the room. Open Sage on its own surface and start the conversation that gets to know you over weeks, not minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <a href="https://sage.perpetualcore.com" target="_blank" rel="noopener noreferrer">
                Meet Sage <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/engine">Read the Engine</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
