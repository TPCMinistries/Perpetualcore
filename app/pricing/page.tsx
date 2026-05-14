"use client";

/**
 * /pricing — unified pricing page across the 3-band spectrum.
 *
 * Bands:
 *   1. Products ($0 / $49 / $99) — Stripe checkout preserved
 *   2. Retainers ($5K–$15K/mo productized) — link to /studio/retainers
 *   3. Engagements ($75K / $150K / $250K+) — link to /studio/engagements
 *
 * Stripe checkout flow + billing-interval toggle preserved from prior version.
 * Visual register matches homepage v6.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { trackClientEvent } from "@/lib/analytics/track-event";

const PLATFORM_PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "For trying out Perpetual Core",
    checkoutEnabled: false,
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
    price: 49,
    description: "For individuals and professionals",
    checkoutEnabled: true,
    popular: true,
    features: [
      "Everything in Free, plus:",
      "GPT-4o Mini (unlimited)",
      "100 premium model messages/mo",
      "Unlimited documents and knowledge base",
      "10 GB storage",
      "Email and Calendar integration",
      "Priority email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 99,
    description: "Power users who need unlimited AI",
    checkoutEnabled: true,
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

const RETAINER_PROGRAMS = [
  { name: "Sentinel on Retainer", price: "$5,000", body: "Unlimited DD vets, 48h SLA." },
  { name: "Capture Pipeline", price: "$7,500", body: "Managed RFP discovery + drafting." },
  { name: "Operator Concierge", price: "$10,000", body: "10 hrs/mo AI ops review + QBR." },
  { name: "Skills Subscription", price: "$5,000", body: "One production skill per month." },
  { name: "Vellum Institutional", price: "$15,000+", body: "Managed Vellum + SSO + on-prem." },
];

const ENGAGEMENT_BANDS = [
  { name: "Foundations", price: "$75,000", duration: "90 days", body: "Single department, eight-registry install." },
  { name: "Operations", price: "$150,000", duration: "120–150 days", body: "Three to five departments. 15–30 production skills.", featured: true },
  { name: "Institutional", price: "$250,000+", duration: "180 days", body: "Whole-org install + 90 days post-handover." },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div>
      <p className="eyebrow mb-3">§ {index}</p>
      <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">{label}</h2>
    </div>
  );
}

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
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 bg-foreground" />
            <p className="eyebrow !text-foreground/70">Pricing · Three bands · $0 → $250K+</p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            Three bands. Pick the one{" "}
            <span className="italic text-foreground/85">that fits the work.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            Products subscribe. Retainers operate. Engagements install. Every band crosses the
            same Engine, the same methodology, the same 10–15% giving floor.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button size="lg" asChild className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
              <Link href="#products">See products <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Link href="#engagements" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary">
              Skip to engagements <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* BAND 01 — Products */}
      <section id="products" className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="01" label="Products · Self-serve" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Subscribe to a product. Free / $49 / $99.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                The Platform — AI OS for individuals and small teams. The on-ramp before
                retainers and engagements. 14-day trials, no credit card required.
              </p>

              {/* Billing toggle */}
              <div className="inline-flex items-center gap-2 p-1 mt-8 border border-border bg-card rounded-[6px]">
                <button
                  type="button"
                  onClick={() => setBillingInterval("monthly")}
                  className={`px-5 py-2 rounded-[4px] text-sm font-medium transition ${
                    billingInterval === "monthly" ? "bg-foreground text-background" : "text-muted-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingInterval("yearly")}
                  className={`px-5 py-2 rounded-[4px] text-sm font-medium transition relative ${
                    billingInterval === "yearly" ? "bg-foreground text-background" : "text-muted-foreground"
                  }`}
                >
                  Yearly
                  <span className="ml-2 font-mono text-[10px] text-primary uppercase tracking-[0.18em]">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            {PLATFORM_PLANS.map((plan, i) => {
              const yearlyPrice = plan.price ? Math.floor(plan.price * 12 * 0.8) : null;
              const displayPrice =
                billingInterval === "yearly" && yearlyPrice ? Math.floor(yearlyPrice / 12) : plan.price;
              return (
                <div key={plan.id} className="p-6 sm:p-7 flex flex-col">
                  <div className="flex items-center justify-between mb-10">
                    <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                      0{i + 1}
                    </span>
                    {plan.popular && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                        Most common
                      </span>
                    )}
                  </div>
                  <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                    {plan.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

                  <div className="mb-6">
                    {plan.price === 0 ? (
                      <div className="text-3xl font-semibold tracking-[-0.025em] text-foreground">Free</div>
                    ) : (
                      <div>
                        <span className="text-3xl font-semibold tracking-[-0.025em] text-foreground">
                          ${displayPrice}
                        </span>
                        <span className="text-sm font-mono text-muted-foreground ml-2">/month</span>
                        {billingInterval === "yearly" && yearlyPrice && (
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-2">
                            ${yearlyPrice}/yr billed annually
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    className={`w-full mb-6 text-sm font-medium h-10 shadow-none rounded-[6px] ${
                      plan.popular
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "bg-background text-foreground border border-foreground/20 hover:bg-surface-hover"
                    }`}
                    onClick={() => handleSubscribe(plan.id, plan.checkoutEnabled)}
                    disabled={isLoading === plan.id}
                  >
                    {isLoading === plan.id ? "Loading…" : plan.id === "free" ? "Get started free" : "Start free trial"}
                    {isLoading !== plan.id && plan.id !== "free" && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>

                  <ul className="space-y-2 text-sm text-muted-foreground leading-[1.6]">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-foreground/40 flex-shrink-0 mt-1" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BAND 02 — Retainers */}
      <section id="retainers" className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="02" label="Retainers · Productized" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Hire a productized program. $5K–$15K/month.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Five named programs. We operate the agents; you receive the output. Cancellable
                monthly. Fees credit toward a full engagement when work scales.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {RETAINER_PROGRAMS.map((p, i) => (
                <Link
                  key={p.name}
                  href="/studio/retainers"
                  className="group grid grid-cols-[60px_1fr_auto] gap-x-6 py-6 border-b border-border hover:bg-surface-hover transition-colors items-baseline"
                >
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground pt-1">
                    0{i + 1}
                  </span>
                  <div>
                    <h4 className="text-base font-semibold tracking-tight text-foreground mb-1 group-hover:text-primary transition-colors">
                      {p.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">{p.body}</p>
                  </div>
                  <span className="font-mono text-base font-semibold text-foreground whitespace-nowrap">
                    {p.price}
                    <span className="font-mono text-[10px] text-muted-foreground ml-1">/mo</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-10 grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <Link
              href="/studio/retainers"
              className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              See full Retainers detail <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* BAND 03 — Engagements */}
      <section id="engagements" className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="03" label="Engagements · The install" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Install the Engine. $75K–$250K+.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                90 to 180 day install. Three bands depending on the surface area. Each ends the
                same way: documented, trained, handed over. You own the system.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            {ENGAGEMENT_BANDS.map((band, i) => (
              <div key={band.name} className="p-6 sm:p-7 flex flex-col">
                <div className="flex items-center justify-between mb-10">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                    0{i + 1}
                  </span>
                  {band.featured && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                      Most common
                    </span>
                  )}
                </div>
                <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                  {band.name}
                </h4>
                <p className="text-3xl sm:text-4xl font-semibold tracking-[-0.025em] text-foreground mb-3">
                  {band.price}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-6">
                  {band.duration}
                </p>
                <p className="text-sm text-muted-foreground leading-[1.65] flex-1 mb-6">
                  {band.body}
                </p>
                <Link
                  href="/studio/engagements"
                  className="inline-flex items-center text-xs font-medium text-foreground hover:text-primary transition-colors mt-auto"
                >
                  See engagements <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>

          {/* Retainer attached to engagements */}
          <div className="border border-t-0 border-border bg-card p-6 sm:p-7 grid sm:grid-cols-[200px_1fr_auto] gap-6 sm:gap-10 items-baseline">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                Optional · all bands
              </p>
              <p className="text-xl font-semibold tracking-[-0.015em] text-foreground">
                Post-engagement retainer
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-[1.65]">
              <span className="text-foreground font-medium">$5,000–$15,000/month</span>, scoped to
              engagement. For operators who&apos;d rather we stay in the loop. Cancellable any month.
            </p>
            <Link
              href="/studio/engagements"
              className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.18em] text-foreground hover:text-primary transition-colors whitespace-nowrap"
            >
              Book intake
              <ArrowRight className="ml-2 h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Engine commitment */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="The Engine commitment" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Every band gives. 10–15% of revenue funds the Institute.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                Engagements give 10% ($7,500 to $25,000+ per client). Sage SaaS gives 15%.
                Everything else gives 10% by default. Audited annually. Line-itemed on every
                invoice. The mission is the substrate.
              </p>
              <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                <Link href="/engine">Read the Engine commitment <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
