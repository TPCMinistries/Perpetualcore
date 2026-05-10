"use client";

/**
 * /pricing — unified pricing page.
 *
 * Per BRIEF_RECONCILED A2 + BRAND_ARCHITECTURE §7: leads with engagements
 * ($75K floor / Retainer / License & Embedded "Contact us"), then platform
 * tiers (Free / $49 Starter / $99 Pro). Footer line credits 10% to IHA.
 *
 * Exact pricing strings preserved verbatim:
 *   - "Engagements start at $75,000"
 *   - "$5,000–$15,000/month, scoped to engagement"
 *   - License & Embedded = "Contact us" only
 *
 * Revenue-share is intentionally OFF-SITE per A2.
 *
 * Self-serve Stripe checkout for Starter/Pro is preserved from the
 * previous pricing page so existing payment flow keeps working.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Sparkles, Zap, Crown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { trackClientEvent } from "@/lib/analytics/track-event";

const PLATFORM_PLANS = [
  {
    id: "free",
    name: "Free",
    description: "For trying out Perpetual Core",
    price: 0,
    checkoutEnabled: false,
    icon: Sparkles,
    popular: false,
    features: [
      "Infinite conversation memory",
      "Personal knowledge base (RAG)",
      "Gemini model (unlimited)",
      "5 documents",
      "1 GB storage",
      "Community support",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    description: "For individuals and professionals",
    price: 49,
    checkoutEnabled: true,
    icon: Zap,
    popular: true,
    features: [
      "Everything in Free, plus:",
      "GPT-4o Mini (unlimited)",
      "100 premium model messages/mo (Claude, GPT-4)",
      "Unlimited documents and knowledge base",
      "10 GB storage",
      "Email and Calendar integration",
      "Priority email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Power users who need unlimited AI",
    price: 99,
    checkoutEnabled: true,
    icon: Crown,
    popular: false,
    features: [
      "Everything in Starter, plus:",
      "Unlimited premium models (Claude, GPT-4, o1)",
      "Advanced workflows and automations",
      "50 GB storage",
      "API access",
      "Priority support (4-hour response)",
    ],
  },
];

const ENGAGEMENT_BANDS = [
  {
    name: "Transformation Engagement",
    eyebrow: "From $75,000",
    duration: "90–180 days",
    body: "Audit your operations, install the Perpetual Engine across your departments, train your team to operate it, hand over the system. Single department to whole-org, depending on band.",
    cta: { label: "Book an intake call", href: "/contact-sales" },
    primaryString: "Engagements start at $75,000",
    featured: true,
  },
  {
    name: "Ongoing Retainer",
    eyebrow: "$5,000–$15,000/month",
    duration: "Optional, all bands",
    body: "$5,000–$15,000/month, scoped to engagement. For the operators who'd rather we stay in the loop on what comes next. Cancellable any month.",
    cta: { label: "See engagements", href: "/studio/engagements" },
    primaryString: null,
    featured: false,
  },
  {
    name: "License & Embedded",
    eyebrow: "Contact us",
    duration: "Institutional",
    body: "License the Perpetual Engine for your organization, or have us embed white-labeled into your platform. Pricing is engagement-shaped, not list-priced.",
    cta: { label: "Contact us", href: "/contact-sales" },
    primaryString: null,
    featured: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  async function handleSubscribe(planId: string, checkoutEnabled: boolean) {
    trackClientEvent("cta_click", {
      event_name: `pricing_${planId}_start`,
      metadata: { plan_id: planId, billing_interval: billingInterval },
    });

    if (planId === "free") {
      router.push("/signup?plan=free");
      return;
    }

    if (!checkoutEnabled) {
      router.push("/contact-sales?plan=" + planId);
      return;
    }

    setIsLoading(planId);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          interval: billingInterval === "yearly" ? "annual" : "monthly",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PageViewTracker />
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-4 pt-24 pb-16 sm:pt-32">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-6">Pricing.</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-8">
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Engagements start at $75,000.
            </span>{" "}
            Platform starts free.
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We sell three things: engagements (the studio), a platform (the SaaS), and a license / embedded option for institutions. Revenue-share arrangements live off-site.
          </p>
        </div>
      </section>

      {/* Engagements section — first, per A2 */}
      <section className="container mx-auto px-4 py-20 border-t border-border/40">
        <div className="max-w-3xl mb-12">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">The studio.</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Engagements.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A 90 to 180 day engagement that audits your operations, installs the Perpetual Engine across your departments, and hands you a system your team owns.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {ENGAGEMENT_BANDS.map((band) => (
            <Card
              key={band.name}
              className={`flex flex-col ${band.featured ? "border-primary/60" : "border-border/60"}`}
            >
              <CardContent className="p-7 flex flex-col h-full">
                <div className="mb-5">
                  <h3 className="text-lg font-semibold mb-1">{band.name}</h3>
                  <p className="text-sm text-muted-foreground">{band.duration}</p>
                </div>
                <div className="mb-6">
                  <div className="text-3xl font-semibold tracking-tight">{band.eyebrow}</div>
                </div>
                <p className="text-base text-muted-foreground leading-relaxed mb-7">{band.body}</p>
                <div className="mt-auto">
                  <Button asChild variant={band.featured ? "default" : "outline"} className="w-full">
                    <Link href={band.cta.href}>
                      {band.cta.label} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/studio/engagements"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            See all three engagement bands ($75K / $150K / $250K+){" "}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Platform section — second, per A2 */}
      <section className="container mx-auto px-4 py-20 border-t border-border/40">
        <div className="max-w-3xl mb-12">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">The platform.</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            For solo operators and small teams under the engagement floor.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            The Platform is the on-ramp, not the destination. Free / $49 Starter / $99 Pro. 14-day trials. No credit card required.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-2 p-1 mt-8 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => setBillingInterval("monthly")}
              className={`px-5 py-2 rounded-md text-sm font-medium transition ${
                billingInterval === "monthly"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval("yearly")}
              className={`px-5 py-2 rounded-md text-sm font-medium transition relative ${
                billingInterval === "yearly"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Yearly
              <span className="ml-2 text-xs text-primary font-semibold">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl">
          {PLATFORM_PLANS.map((plan) => {
            const Icon = plan.icon;
            const yearlyPrice = plan.price ? Math.floor(plan.price * 12 * 0.8) : null;
            const displayPrice =
              billingInterval === "yearly" && yearlyPrice
                ? Math.floor(yearlyPrice / 12)
                : plan.price;

            return (
              <Card
                key={plan.id}
                className={`flex flex-col ${plan.popular ? "border-primary/60" : "border-border/60"}`}
              >
                <CardContent className="p-7 flex flex-col h-full">
                  <div className="mb-5">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                      <Icon className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="mb-6">
                    {plan.price === 0 ? (
                      <div className="text-3xl font-semibold tracking-tight">Free</div>
                    ) : (
                      <div>
                        <span className="text-3xl font-semibold tracking-tight">
                          ${displayPrice}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">/month</span>
                        {billingInterval === "yearly" && yearlyPrice ? (
                          <p className="text-xs text-muted-foreground mt-1">
                            ${yearlyPrice}/year (billed annually)
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full mb-6"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.id, plan.checkoutEnabled)}
                    disabled={isLoading === plan.id}
                  >
                    {isLoading === plan.id ? (
                      "Loading..."
                    ) : plan.id === "free" ? (
                      "Get started free"
                    ) : (
                      <>
                        Start free trial <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <ul className="space-y-2.5 text-sm text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Engine commitment footer line per BRIEF_RECONCILED A2 */}
      <section className="container mx-auto px-4 py-20 border-t border-border/40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            The Perpetual Engine.
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight mb-4">
            Every engagement funds the Institute for Human Advancement. 10% of revenue.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            $7,500 to $25,000+ per client flows from every engagement to our 501(c)(3) parent. Audited annually. Line-itemed on every invoice. Sage SaaS gives 15%; everything else gives 10%.
          </p>
          <Button variant="outline" asChild>
            <Link href="/engine">
              Read the Engine commitment <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Pick the right surface for the work you actually need.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            If you need a system installed, see engagements. If you&apos;re a solo operator or small team, start free. If you want a license or an embedded build, contact us.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/studio/engagements">
                Start an engagement <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/contact-sales">Contact sales</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
