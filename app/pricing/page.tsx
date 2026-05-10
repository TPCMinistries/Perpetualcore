"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Check,
  Zap,
  Crown,
  Building2,
  Sparkles,
  ArrowRight,
  Users,
  Briefcase,
  Rocket,
  ChevronDown,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { PublicMobileNav } from "@/components/layout/PublicMobileNav";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { trackClientEvent } from "@/lib/analytics/track-event";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// DATA
// ---------------------------------------------------------------------------

const PLANS = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for trying out Perpetual Core",
    price: 0,
    checkoutEnabled: false,
    interval: "forever",
    icon: Sparkles,
    popular: false,
    badge: null,
    features: [
      "Infinite conversation memory",
      "Personal knowledge base (RAG)",
      "Gemini model (unlimited)",
      "5 documents",
      "1 GB storage",
      "5 basic automations",
      "Community support",
    ],
    limits: {
      ai_messages: -1,
      documents: 5,
      storage_gb: 1,
      team_members: 1,
    },
  },
  {
    id: "starter",
    name: "Starter",
    description: "For individuals and professionals",
    price: 49,
    checkoutEnabled: true,
    interval: "per month",
    icon: Zap,
    popular: true,
    badge: "Most Popular",
    features: [
      "Everything in Free, plus:",
      "GPT-4o Mini (unlimited)",
      "100 premium model messages/mo (Claude, GPT-4)",
      "Unlimited documents & knowledge base",
      "10 GB storage",
      "Email & Calendar integration",
      "Unlimited automations & workflows",
      "Priority email support",
    ],
    limits: {
      ai_messages: -1,
      documents: -1,
      storage_gb: 10,
      team_members: 1,
    },
  },
  {
    id: "pro",
    name: "Pro",
    description: "Power users who need unlimited AI",
    price: 99,
    checkoutEnabled: true,
    interval: "per month",
    icon: Crown,
    popular: false,
    badge: null,
    features: [
      "Everything in Starter, plus:",
      "Unlimited premium models (Claude, GPT-4, o1)",
      "Advanced workflows & automations",
      "50 GB storage",
      "API access",
      "Priority support (4-hour response)",
      "Early access to new features",
    ],
    limits: {
      ai_messages: -1,
      documents: -1,
      storage_gb: 50,
      team_members: 1,
    },
  },
  {
    id: "team",
    name: "Team",
    description: "For small teams (up to 10 people)",
    price: 499,
    checkoutEnabled: false,
    interval: "per month",
    icon: Users,
    popular: false,
    badge: "Best Value",
    features: [
      "Everything in Pro, plus:",
      "Up to 10 team members",
      "Shared team knowledge base",
      "Team automation library",
      "Slack/Teams integration",
      "Role-based access control",
      "Team analytics dashboard",
      "Implementation call included",
      "Dedicated success manager",
    ],
    limits: {
      ai_messages: -1,
      documents: -1,
      storage_gb: 500,
      team_members: 10,
    },
  },
  {
    id: "business",
    name: "Business",
    description: "For growing companies (up to 50 people)",
    price: 1999,
    checkoutEnabled: false,
    interval: "per month",
    icon: Briefcase,
    popular: false,
    badge: null,
    features: [
      "Everything in Team, plus:",
      "Up to 50 team members",
      "SSO & SAML authentication",
      "Custom AI training on your data",
      "Advanced security controls",
      "Unlimited storage",
      "Priority phone support (2-hour response)",
      "Quarterly business reviews",
      "Dedicated success manager",
    ],
    limits: {
      ai_messages: -1,
      documents: -1,
      storage_gb: -1,
      team_members: 50,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations (100-250 people)",
    price: 9999,
    checkoutEnabled: false,
    interval: "per month",
    icon: Building2,
    popular: false,
    badge: null,
    features: [
      "Everything in Business, plus:",
      "Up to 250 team members",
      "White-glove implementation ($7,500)",
      "Custom deployment options",
      "Enterprise security (SOC 2 infrastructure)",
      "White-label capabilities",
      "Dedicated account team",
      "Priority support with escalation path",
      "Custom development available",
    ],
    limits: {
      ai_messages: -1,
      documents: -1,
      storage_gb: -1,
      team_members: 250,
    },
    borderColor: "border-purple-200 dark:border-purple-800",
    bgColor: "bg-purple-50/50 dark:bg-purple-950/20",
  },
  {
    id: "custom",
    name: "Custom",
    description: "For enterprises (250+ people)",
    price: null,
    checkoutEnabled: false,
    interval: "custom",
    icon: Rocket,
    popular: false,
    badge: "Contact Sales",
    features: [
      "Everything in Enterprise, plus:",
      "Unlimited team members",
      "On-premise deployment options",
      "Custom SLAs & guarantees",
      "Dedicated infrastructure",
      "Custom integrations & development",
      "Executive business reviews",
      "Custom contract terms",
      "Volume pricing available",
    ],
    limits: {
      ai_messages: -1,
      documents: -1,
      storage_gb: -1,
      team_members: -1,
    },
    borderColor: "border-amber-200 dark:border-amber-800",
    bgColor: "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20",
  },
];

const FAQ_ITEMS = [
  {
    question: "How does the 'unlimited' AI work? Won't I get a surprise bill?",
    answer: "No surprise bills! Starter includes unlimited GPT-4o Mini + 100 premium model messages (Claude, GPT-4). If you hit the 100 premium limit, you can still use GPT-4o Mini unlimited. Pro includes truly unlimited everything. We built this specifically to avoid surprise bills\u2014you know exactly what you're paying.",
  },
  {
    question: "What's the difference between GPT-4o Mini and premium models?",
    answer: "GPT-4o Mini is fast, cheap, and great for 90% of tasks (writing emails, quick questions, summarization). Premium models (Claude Sonnet, GPT-4, o1) are more powerful for complex reasoning, coding, and analysis. Most users find Mini handles their daily work, and save premium messages for when they really need it.",
  },
  {
    question: "How does team pricing work?",
    answer: "Team plans ($499/mo for up to 10 users = $49.90/user), Business ($1,999/mo for up to 50 users = $39.98/user), Enterprise ($9,999/mo for up to 250 users = $39.99/user). Everyone on the team gets full access to all features. No per-user billing\u2014one flat monthly price.",
  },
  {
    question: "What's included in Enterprise implementation?",
    answer: "Enterprise includes a one-time $7,500 white-glove implementation: custom deployment, SSO setup, team training (virtual or on-site), change management support, 90-day optimization period, and dedicated success manager. We ensure your team actually adopts it.",
  },
  {
    question: "Can I change plans later?",
    answer: "Yes! You can upgrade or downgrade anytime. Upgrades take effect immediately. Downgrades take effect at your next billing cycle. We prorate everything fairly.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "All major credit cards (Visa, MasterCard, Amex) via Stripe. Business and Enterprise plans can pay via invoice (NET 30). Annual plans get 20% off and can pay via wire transfer.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! Starter and Pro get 14-day free trials (no credit card required). Team, Business, and Enterprise get 30-day pilots with dedicated onboarding. Free plan is free forever.",
  },
  {
    question: "What makes this different from ChatGPT?",
    answer: "ChatGPT is a chatbot — you ask, it answers, then it forgets. Perpetual Core is an AI Operating System — it learns your preferences, builds a knowledge graph, routes across 11 models to save you 90%, and deploys 5 proactive agents that work 24/7. Plus team collaboration, automation/workflows, and integrations (email, calendar, Slack). It's not just smarter — it gets smarter every day.",
  },
];

// Subset plans for the self-serve grid vs the enterprise section
const SELF_SERVE_PLANS = PLANS.filter((p) =>
  ["free", "starter", "pro", "team"].includes(p.id)
);
const ENTERPRISE_PLANS = PLANS.filter((p) =>
  ["business", "enterprise", "custom"].includes(p.id)
);

// Feature comparison rows (self-serve plans only)
const COMPARISON_FEATURES: {
  label: string;
  plans: Record<string, string | boolean>;
}[] = [
  {
    label: "AI Messages",
    plans: { free: "Unlimited", starter: "Unlimited", pro: "Unlimited", team: "Unlimited" },
  },
  {
    label: "Premium Model Messages",
    plans: { free: false, starter: "100 / mo", pro: "Unlimited", team: "Unlimited" },
  },
  {
    label: "Documents",
    plans: { free: "5", starter: "Unlimited", pro: "Unlimited", team: "Unlimited" },
  },
  {
    label: "Storage",
    plans: { free: "1 GB", starter: "10 GB", pro: "50 GB", team: "500 GB" },
  },
  {
    label: "Team Members",
    plans: { free: "1", starter: "1", pro: "1", team: "Up to 10" },
  },
  {
    label: "Automations & Workflows",
    plans: { free: "5 basic", starter: "Unlimited", pro: "Advanced", team: "Team library" },
  },
  {
    label: "Email & Calendar Integration",
    plans: { free: false, starter: true, pro: true, team: true },
  },
  {
    label: "API Access",
    plans: { free: false, starter: false, pro: true, team: true },
  },
  {
    label: "Slack / Teams Integration",
    plans: { free: false, starter: false, pro: false, team: true },
  },
  {
    label: "Role-Based Access Control",
    plans: { free: false, starter: false, pro: false, team: true },
  },
  {
    label: "Dedicated Success Manager",
    plans: { free: false, starter: false, pro: false, team: true },
  },
  {
    label: "Support",
    plans: { free: "Community", starter: "Priority email", pro: "4-hour response", team: "Dedicated" },
  },
];

// ---------------------------------------------------------------------------
// ANIMATION VARIANTS
// ---------------------------------------------------------------------------

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] },
};

const stagger = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export default function PricingPage() {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function handleSubscribe(planId: string, checkoutEnabled: boolean) {
    // Track CTA click
    trackClientEvent("cta_click", {
      event_name: `pricing_${planId}_start`,
      metadata: { plan_id: planId, billing_interval: billingInterval },
    });

    // Handle free plan
    if (planId === "free") {
      router.push("/signup?plan=free");
      return;
    }

    // Handle team/business - direct to consultation
    if (planId === "team" || planId === "business") {
      router.push("/consultation");
      return;
    }

    // Handle enterprise/custom - direct to enterprise demo
    if (planId === "enterprise" || planId === "custom") {
      router.push("/enterprise-demo");
      return;
    }

    // Self-serve checkout (starter, pro) -- server resolves price IDs
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

  // Pricing helpers
  function getDisplayPrice(plan: (typeof PLANS)[number]) {
    const yearlyPrice = plan.price ? Math.floor(plan.price * 12 * 0.8) : null;
    const displayPrice =
      billingInterval === "yearly" && yearlyPrice
        ? Math.floor(yearlyPrice / 12)
        : plan.price;
    const monthlySavings =
      plan.price && yearlyPrice ? plan.price - Math.floor(yearlyPrice / 12) : 0;
    return { yearlyPrice, displayPrice, monthlySavings };
  }

  // CTA label helper
  function ctaLabel(planId: string) {
    if (planId === "enterprise" || planId === "custom") return "Contact Sales";
    if (planId === "free") return "Get Started Free";
    return "Start Free Trial";
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <PageViewTracker />

      {/* ----------------------------------------------------------------- */}
      {/* HEADER                                                            */}
      {/* ----------------------------------------------------------------- */}
      <header className="border-b border-border/40 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary via-purple-600 to-violet-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/25 transition-shadow group-hover:shadow-primary/40">
              AI
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight">
              Perpetual Core
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <div className="md:hidden">
              <PublicMobileNav />
            </div>
            <Button
              asChild
              size="sm"
              className="h-9 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-md shadow-primary/20 active:scale-95 transition-all"
            >
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------------------- */}
      {/* HERO                                                              */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        {/* Animated gradient orb */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/20 via-purple-600/10 to-violet-700/5 blur-3xl opacity-60"
        />

        <div className="relative container mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16 text-center">
          <motion.h1
            {...fadeUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter mb-5"
          >
            <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
              11 Models.{" "}
            </span>
            <span className="bg-gradient-to-r from-primary via-purple-600 to-violet-500 bg-clip-text text-transparent">
              One Price.
            </span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed"
          >
            Stop paying for 3 subscriptions. Get all 11 models, 5 agents, and
            workflows in one plan. 14-day free trial.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 }}
            className="inline-flex items-center p-1 rounded-full bg-muted/60 backdrop-blur-sm border border-border/50"
          >
            <button
              onClick={() => setBillingInterval("monthly")}
              className={`relative px-5 sm:px-7 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                billingInterval === "monthly"
                  ? "bg-background shadow-md text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("yearly")}
              className={`relative px-5 sm:px-7 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                billingInterval === "yearly"
                  ? "bg-background shadow-md text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                -20%
              </span>
            </button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground"
          >
            {["14-day free trial", "No credit card required", "Cancel anytime"].map(
              (item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium text-foreground/80">{item}</span>
                </div>
              )
            )}
          </motion.div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* SELF-SERVE PRICING CARDS                                          */}
      {/* ----------------------------------------------------------------- */}
      <section className="container mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {SELF_SERVE_PLANS.map((plan, idx) => {
            const Icon = plan.icon;
            const { yearlyPrice, displayPrice, monthlySavings } = getDisplayPrice(plan);

            return (
              <motion.div
                key={plan.id}
                {...stagger}
                transition={{
                  duration: 0.5,
                  ease: [0.21, 0.47, 0.32, 0.98],
                  delay: idx * 0.08,
                }}
                className={`relative group rounded-2xl p-[1px] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  plan.popular
                    ? "bg-gradient-to-b from-primary via-purple-600 to-violet-700 shadow-lg shadow-primary/20 ring-1 ring-primary/20"
                    : "bg-border/50 hover:bg-border"
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center z-10">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full shadow-lg ${
                        plan.popular
                          ? "bg-primary text-primary-foreground"
                          : "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                      }`}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Card inner */}
                <div className="relative h-full rounded-[calc(1rem-1px)] backdrop-blur-xl bg-card/80 border-0 p-6 sm:p-7 flex flex-col">
                  {/* Icon */}
                  <div className="mb-5 flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 via-purple-600/10 to-violet-500/10 ring-1 ring-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold tracking-tight">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-5">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    {plan.price === null ? (
                      <span className="text-4xl font-bold tracking-tighter">Custom</span>
                    ) : plan.price === 0 ? (
                      <span className="text-4xl font-bold tracking-tighter">Free</span>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold tracking-tighter">
                            ${displayPrice}
                          </span>
                          <span className="text-sm text-muted-foreground">/month</span>
                        </div>
                        {billingInterval === "yearly" && yearlyPrice ? (
                          <div className="mt-1.5 space-y-0.5">
                            <p className="text-xs text-muted-foreground">
                              ${yearlyPrice}/year billed annually
                            </p>
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              Save ${monthlySavings * 12}/year
                            </p>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>

                  {/* CTA */}
                  <Button
                    className={`w-full mb-6 transition-all duration-200 ${
                      plan.popular
                        ? "bg-gradient-to-r from-primary via-purple-600 to-violet-600 hover:from-primary/90 hover:via-purple-600/90 hover:to-violet-600/90 text-white shadow-lg shadow-primary/25"
                        : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.id, plan.checkoutEnabled)}
                    disabled={isLoading === plan.id}
                  >
                    {isLoading === plan.id ? (
                      "Loading..."
                    ) : (
                      <span className="flex items-center gap-2">
                        {ctaLabel(plan.id)}
                        {plan.id !== "free" && <ArrowRight className="h-4 w-4" />}
                      </span>
                    )}
                  </Button>

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground leading-snug">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* ENTERPRISE SECTION                                                */}
      {/* ----------------------------------------------------------------- */}
      <section className="container mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <motion.div
          {...fadeUp}
          className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 sm:p-12 overflow-hidden relative"
        >
          {/* Subtle gradient accent */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -right-32 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          />

          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter text-white mb-2">
              Enterprise-grade plans
            </h2>
            <p className="text-slate-400 mb-10 max-w-xl">
              For organizations that need advanced security, custom deployments,
              and dedicated support at scale.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {ENTERPRISE_PLANS.map((plan, idx) => {
                const Icon = plan.icon;
                const { yearlyPrice, displayPrice, monthlySavings } = getDisplayPrice(plan);

                return (
                  <motion.div
                    key={plan.id}
                    {...stagger}
                    transition={{
                      duration: 0.5,
                      ease: [0.21, 0.47, 0.32, 0.98],
                      delay: idx * 0.1,
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 flex flex-col hover:bg-white/[0.08] transition-colors duration-300"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                        <p className="text-xs text-slate-400">{plan.description}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-5">
                      {plan.price === null ? (
                        <span className="text-3xl font-bold tracking-tighter text-white">
                          Custom
                        </span>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold tracking-tighter text-white">
                              ${displayPrice?.toLocaleString()}
                            </span>
                            <span className="text-sm text-slate-400">/mo</span>
                          </div>
                          {billingInterval === "yearly" && yearlyPrice ? (
                            <p className="text-xs text-emerald-400 mt-1">
                              Save ${(monthlySavings * 12).toLocaleString()}/year
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 mb-6 flex-1">
                      {plan.features.slice(0, 5).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-300 leading-snug">
                            {feature}
                          </span>
                        </li>
                      ))}
                      {plan.features.length > 5 && (
                        <li className="text-xs text-slate-500 pl-6">
                          +{plan.features.length - 5} more features
                        </li>
                      )}
                    </ul>

                    {/* CTA */}
                    <Button
                      variant="outline"
                      className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white"
                      onClick={() => handleSubscribe(plan.id, plan.checkoutEnabled)}
                      disabled={isLoading === plan.id}
                    >
                      {isLoading === plan.id
                        ? "Loading..."
                        : plan.id === "custom"
                        ? "Contact Sales"
                        : "Talk to Sales"}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* FEATURE COMPARISON TABLE                                          */}
      {/* ----------------------------------------------------------------- */}
      <section className="container mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <motion.div {...fadeUp}>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter text-center mb-3">
            Compare plans
          </h2>
          <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto">
            See exactly what each plan includes so you can pick the right one.
          </p>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="rounded-2xl border border-border/50 backdrop-blur-xl bg-card/50 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 sm:p-5 text-sm font-medium text-muted-foreground w-[240px]">
                    Feature
                  </th>
                  {SELF_SERVE_PLANS.map((plan) => (
                    <th
                      key={plan.id}
                      className={`text-center p-4 sm:p-5 text-sm font-semibold ${
                        plan.popular ? "text-primary" : ""
                      }`}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((row, idx) => (
                  <tr
                    key={row.label}
                    className={`border-b border-border/30 ${
                      idx % 2 === 0 ? "" : "bg-muted/10"
                    }`}
                  >
                    <td className="p-4 sm:p-5 text-sm font-medium">{row.label}</td>
                    {SELF_SERVE_PLANS.map((plan) => {
                      const val = row.plans[plan.id];
                      return (
                        <td key={plan.id} className="text-center p-4 sm:p-5 text-sm">
                          {val === true ? (
                            <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : val === false ? (
                            <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* COST COMPARISON — WHY PAY FOR 3?                                  */}
      {/* ----------------------------------------------------------------- */}
      <section className="container mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <motion.div {...fadeUp}>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter text-center mb-3">
            Why pay for 3 subscriptions?
          </h2>
          <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto">
            Most teams pay $60+/month for separate AI tools. Perpetual Core
            gives you everything in one place for less.
          </p>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="max-w-3xl mx-auto rounded-2xl border border-border/50 backdrop-blur-xl bg-card/50 overflow-hidden"
        >
          <div className="p-6 sm:p-8">
            {/* Competitor breakdown */}
            <div className="space-y-4 mb-6">
              {[
                { name: "ChatGPT Plus", price: "$20/mo", detail: "1 model (GPT-4)" },
                { name: "Claude Pro", price: "$20/mo", detail: "1 model (Claude)" },
                { name: "Gemini Advanced", price: "$20/mo", detail: "1 model (Gemini)" },
              ].map((comp) => (
                <div
                  key={comp.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <Minus className="h-4 w-4 text-muted-foreground/40" />
                    <span className="text-muted-foreground">{comp.name}</span>
                  </div>
                  <div className="text-right flex items-baseline gap-2">
                    <span className="font-semibold">{comp.price}</span>
                    <span className="text-xs text-muted-foreground">
                      {comp.detail}
                    </span>
                  </div>
                </div>
              ))}

              <div className="border-t border-border/50 pt-4 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Total for 3 models
                </span>
                <span className="text-lg font-bold">$60/mo</span>
              </div>
            </div>

            {/* Perpetual Core callout */}
            <div className="rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 border border-primary/20 p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <Check className="h-5 w-5 text-emerald-500" />
                  <span className="font-semibold text-foreground">
                    Perpetual Core Starter
                  </span>
                </div>
                <span className="text-xl font-bold text-primary">$49/mo</span>
              </div>
              <p className="text-sm text-muted-foreground ml-[30px]">
                ALL 11 models + 5 AI agents + workflows + knowledge base
              </p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-2 ml-[30px]">
                Save $132/year and get 8 more models
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* FAQ                                                               */}
      {/* ----------------------------------------------------------------- */}
      <section className="container mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <motion.div {...fadeUp}>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter text-center mb-3">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto">
            Everything you need to know about our plans and billing.
          </p>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="max-w-2xl mx-auto divide-y divide-border/50 rounded-2xl border border-border/50 backdrop-blur-xl bg-card/50 overflow-hidden"
        >
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx}>
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left hover:bg-muted/30 transition-colors"
                >
                  <span className="text-sm sm:text-base font-medium leading-snug pr-4">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <p className="px-5 sm:px-6 pb-5 sm:pb-6 text-sm text-muted-foreground leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* BOTTOM CTA                                                        */}
      {/* ----------------------------------------------------------------- */}
      <section className="container mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-purple-600/5 to-violet-700/10 border border-primary/20 p-8 sm:p-14 text-center"
        >
          {/* Background orb */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl"
          />

          <div className="relative">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tighter mb-4">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mb-8">
              Start your 14-day free trial and experience AI that learns you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary via-purple-600 to-violet-600 hover:from-primary/90 hover:via-purple-600/90 hover:to-violet-600/90 text-white shadow-lg shadow-primary/25 h-12 px-8"
                asChild
              >
                <Link
                  href="/signup"
                  onClick={() =>
                    trackClientEvent("cta_click", {
                      event_name: "pricing_bottom_start_trial",
                    })
                  }
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 backdrop-blur-sm"
                asChild
              >
                <Link href="/enterprise-demo">Contact Sales</Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span>No credit card required</span>
              <span className="hidden sm:inline">|</span>
              <span>SOC 2 infrastructure</span>
              <span className="hidden sm:inline">|</span>
              <span>99.9% uptime SLA</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* FOOTER                                                            */}
      {/* ----------------------------------------------------------------- */}
      <footer className="border-t border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-gradient-to-br from-primary via-purple-600 to-violet-700 flex items-center justify-center text-white text-xs font-bold">
                AI
              </div>
              <span className="text-sm font-semibold tracking-tight">
                Perpetual Core
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/cookies" className="hover:text-foreground transition-colors">
                Cookies
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Perpetual Core. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
