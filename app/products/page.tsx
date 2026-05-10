/**
 * /products — portfolio overview.
 *
 * Per COPY_PRODUCTS.md /products page intro + the 7-card grid + UI
 * audit §5 sharpening levers (mono-violet card family, no per-card
 * gradient variation).
 *
 * Card grid order per BRAND_ARCHITECTURE §5.6:
 *   Atlas → Sentinel → Sage → Vellum → RFP Engine → RFP Sentry → Platform.
 *
 * Atlas card: NO pricing (deliberate scarcity per §5.2).
 * Vellum + Platform cards: SHOW pricing on card (per §5.2 + §8 lock).
 *
 * Sharpening levers from UI audit §5: font-semibold, gradient text on
 * H1 only, mono-violet icon family, max-w-3xl prose columns.
 *
 * Detail product pages (/products/atlas, /products/sentinel, etc.) are
 * Session 3 scope — they 404 until built. /products/platform is built
 * in Session 2 Step 6.
 */

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ShieldCheck,
  Heart,
  BookOpenText,
  FileText,
  ScanSearch,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Products — Perpetual Core",
  description:
    "Seven products. Each one shipped in an engagement. Each one still running. The portfolio is the proof; the engagement is the work.",
};

type Product = {
  name: string;
  headline: string;
  line1: string;
  line2: string;
  cta: { label: string; href: string };
  pricing?: string;
  icon: LucideIcon;
};

// Order locked per BRAND_ARCHITECTURE §5.6:
// Atlas → Sentinel → Sage → Vellum → RFP Engine → RFP Sentry → Platform.
const PRODUCTS: Product[] = [
  {
    name: "Atlas",
    headline: "Atlas — AI-native COO for fund-backed portfolio companies.",
    line1:
      "For PE Operating Partners and fund Ops leads installing an AI operating system across a portco in 6 to 10 weeks, before the next quarterly board meeting.",
    line2: "In pilot with select funds — by introduction only.",
    cta: { label: "Request introduction", href: "/products/atlas" },
    icon: Building2,
    // No pricing per §5.2 — deliberate scarcity framing.
  },
  {
    name: "Sentinel",
    headline: "Sentinel — due diligence and intel for the people Kroll won't take calls from.",
    line1:
      "For attorneys, investigators, journalists, and operators running pre-deal or pre-hire diligence on subjects the legacy CRAs decline to touch.",
    line2:
      "Live at sentinel.perpetualcore.com. Production-grade. The first product we shipped from an engagement and kept running.",
    cta: { label: "Run a vet", href: "https://sentinel.perpetualcore.com" },
    icon: ShieldCheck,
  },
  {
    name: "Sage",
    headline: "Sage — the coach and chief of staff who never forgets you.",
    line1:
      "For operators who run two or more entities, live in voice memos, and want a relational AI partner — not a chatbot you re-explain yourself to every morning.",
    line2:
      "Lives wherever you do. Telegram, voice, web. 15% of every Sage subscription funds the Institute for Human Advancement.",
    cta: { label: "Meet Sage", href: "https://sage.perpetualcore.com" },
    icon: Heart,
  },
  {
    name: "Vellum",
    headline: "Vellum by Perpetual Core — institutional memory for organizations.",
    line1:
      "For executive directors, founders, and program directors whose calls, docs, voice notes, and Slack channels need to be one queryable mind — not seventeen disconnected sources.",
    line2:
      "30% mission-driven discount on Operator and Team for verified 501(c)(3)s.",
    pricing: "Free / $49 Operator / $249 Team / Institution Contact us",
    cta: { label: "See Vellum", href: "/products/vellum" },
    icon: BookOpenText,
  },
  {
    name: "RFP Engine",
    headline: "RFP Engine — find the right RFP. Draft it in your voice. Ship it clean.",
    line1:
      "For grant writers, capture managers, and EDs responding to federal, state, and foundation RFPs at capture-grade quality.",
    line2:
      "Live at perpetualcore.com/rfp. Discovery every 6 hours. Drafting in your voice, not generic AI prose.",
    cta: { label: "See RFP Engine", href: "/products/rfp-engine" },
    icon: FileText,
  },
  {
    name: "RFP Sentry",
    headline: "RFP Sentry — bid intelligence and compliance gate.",
    line1:
      "For capture teams who'd rather lose a deal at the bid/no-bid step than after writing the proposal. Sister product to RFP Engine.",
    line2:
      "In build. Score RFPs for fit before you write. Compliance flags surface before submission, not after a debrief.",
    cta: { label: "Join the early list", href: "/products/rfp-sentry" },
    icon: ScanSearch,
  },
  {
    name: "Platform",
    headline: "Platform — the AI OS for individuals and small teams.",
    line1:
      "For solo operators and 5-to-50-person teams who need 11-model routing, persistent memory, and AI executive advisors in one workspace.",
    line2:
      "The catch-all for buyers under the engagement floor — the on-ramp, not the destination.",
    pricing: "Free / $49 Starter / $99 Pro",
    cta: { label: "Try the Platform", href: "/products/platform" },
    icon: Layers,
  },
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-4 pt-24 pb-20 sm:pt-32">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-6">
            The portfolio.
          </p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-8">
            Seven products. Each one{" "}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              shipped in an engagement
            </span>
            . Each one still running.
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-6">
            Every product on this site is a working installation we built for a client and kept operating. The portfolio is the proof; the engagement is the work.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            We don&apos;t sell features. We install operating systems, and the products are what falls out — public demonstrations of capability that other organizations can also use. If a product on this list looks like the thing you&apos;d want installed in your org, the engagement is how that happens. The product is how you can see it run before you commit.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/studio/engagements">
                Start an engagement <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/studio/methodology">Read the methodology</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 7-card portfolio grid — mono-violet family per UI audit §5 */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((product) => {
            const Icon = product.icon;
            const isExternal = product.cta.href.startsWith("http");
            return (
              <Card
                key={product.name}
                className="border-border/60 hover:border-primary/40 transition-colors flex flex-col"
              >
                <CardContent className="p-7 flex flex-col h-full">
                  {/* Mono-violet icon family — no per-card gradient variation */}
                  <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold leading-snug mb-3">
                    {product.headline}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {product.line1}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {product.line2}
                  </p>
                  {product.pricing && (
                    <p className="text-sm font-medium text-foreground mb-6 pt-3 border-t border-border/40">
                      {product.pricing}
                    </p>
                  )}
                  <div className="mt-auto">
                    <Button variant="outline" size="sm" asChild>
                      {isExternal ? (
                        <a href={product.cta.href} target="_blank" rel="noopener noreferrer">
                          {product.cta.label} <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <Link href={product.cta.href}>
                          {product.cta.label} <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Link>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            The studio is the work.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            If you want one of these installed in your org, the engagement is how that happens.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            Engagements start at $75,000. We take a limited number per quarter.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/studio/engagements">
                Start an engagement <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/contact-sales">Book an intake call</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
