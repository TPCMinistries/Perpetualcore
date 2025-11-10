"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, Crown, Building2, Sparkles, ArrowRight, Users, Briefcase, Rocket } from "lucide-react";
import { toast } from "sonner";
import { PublicMobileNav } from "@/components/layout/PublicMobileNav";

const PLANS = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for trying out Perpetual Core",
    price: 0,
    priceId: null,
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
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
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
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY,
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
    priceId: null,
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
    priceId: null,
    interval: "per month",
    icon: Briefcase,
    popular: false,
    badge: null,
    features: [
      "Everything in Team, plus:",
      "Up to 50 team members",
      "SSO & SAML authentication",
      "Custom AI training on your data",
      "Advanced security & compliance",
      "Unlimited storage",
      "99.9% SLA",
      "Priority phone support (2-hour response)",
      "Quarterly business reviews",
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
    priceId: null,
    interval: "per month",
    icon: Building2,
    popular: false,
    badge: null,
    features: [
      "Everything in Business, plus:",
      "Up to 250 team members",
      "White-glove implementation ($7,500)",
      "Custom deployment options",
      "SOC 2, HIPAA compliance",
      "White-label capabilities",
      "99.95% SLA + 24/7 support",
      "Dedicated account team",
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
    priceId: null,
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
    answer: "No surprise bills! Starter includes unlimited GPT-4o Mini + 100 premium model messages (Claude, GPT-4). If you hit the 100 premium limit, you can still use GPT-4o Mini unlimited. Pro includes truly unlimited everything. We built this specifically to avoid surprise bills—you know exactly what you're paying.",
  },
  {
    question: "What's the difference between GPT-4o Mini and premium models?",
    answer: "GPT-4o Mini is fast, cheap, and great for 90% of tasks (writing emails, quick questions, summarization). Premium models (Claude Sonnet, GPT-4, o1) are more powerful for complex reasoning, coding, and analysis. Most users find Mini handles their daily work, and save premium messages for when they really need it.",
  },
  {
    question: "How does team pricing work?",
    answer: "Team plans ($499/mo for up to 10 users = $49.90/user), Business ($1,999/mo for up to 50 users = $39.98/user), Enterprise ($9,999/mo for up to 250 users = $39.99/user). Everyone on the team gets full access to all features. No per-user billing—one flat monthly price.",
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
    answer: "ChatGPT forgets. Perpetual Core never forgets—infinite conversation history, personal knowledge base (RAG on your docs), team collaboration, automation/workflows, and integrations (email, calendar, Slack). We're an AI Operating System, not just chat.",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  async function handleSubscribe(planId: string, priceId: string | null) {
    // Handle free plan
    if (planId === "free") {
      router.push("/signup?plan=free");
      return;
    }

    // Handle team/business/enterprise - direct to consultation/sales
    if (planId === "team" || planId === "business") {
      router.push("/consultation");
      return;
    }

    if (planId === "enterprise" || planId === "custom") {
      router.push("/enterprise-demo");
      return;
    }

    // Handle paid plans without price ID
    if (!priceId) {
      toast.error("This plan is not yet configured. Please contact sales.");
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
          interval: billingInterval,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg">
              AI
            </div>
            <span className="text-lg sm:text-xl font-bold">Perpetual Core</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <Link href="/login" className="text-sm font-medium hover:underline">
                Sign In
              </Link>
            </div>
            <div className="md:hidden">
              <PublicMobileNav />
            </div>
            <Button asChild size="sm" className="h-9 shadow-md active:scale-95 transition-all">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 px-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            Choose the perfect plan for your needs. All plans include a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-2 sm:gap-4 p-1 bg-muted rounded-lg touch-manipulation">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={`px-4 sm:px-6 py-2 rounded-md font-medium transition active:scale-95 ${
                billingInterval === "monthly"
                  ? "bg-white dark:bg-gray-800 shadow"
                  : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("yearly")}
              className={`px-4 sm:px-6 py-2 rounded-md font-medium transition active:scale-95 relative ${
                billingInterval === "yearly"
                  ? "bg-white dark:bg-gray-800 shadow"
                  : "text-muted-foreground"
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full shadow-md">
                Save 20%
              </span>
            </button>
          </div>

          {/* Guarantees */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="font-medium text-foreground">14-day free trial</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="font-medium text-foreground">No credit card required</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="font-medium text-foreground">Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const yearlyPrice = plan.price ? Math.floor(plan.price * 12 * 0.8) : null;
            const displayPrice =
              billingInterval === "yearly" && yearlyPrice
                ? Math.floor(yearlyPrice / 12)
                : plan.price;

            const monthlySavings = plan.price && yearlyPrice ? plan.price - Math.floor(yearlyPrice / 12) : 0;

            return (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.popular
                    ? "border-primary shadow-lg scale-105"
                    : (plan as any).borderColor || "border-border"
                } ${(plan as any).bgColor || ""}`}
              >
                {(plan.popular || plan.badge) && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className={`${plan.popular ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'} text-sm font-medium px-4 py-1 rounded-full shadow-lg`}>
                      {plan.badge || "Most Popular"}
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>

                  <div className="mt-4">
                    {plan.price === null ? (
                      <div className="text-3xl font-bold">Custom</div>
                    ) : plan.price === 0 ? (
                      <div className="text-3xl font-bold">Free</div>
                    ) : (
                      <>
                        <div className="text-4xl font-bold">
                          ${displayPrice}
                          <span className="text-lg text-muted-foreground font-normal">
                            /month
                          </span>
                        </div>
                        {billingInterval === "yearly" && yearlyPrice ? (
                          <div className="text-sm mt-2">
                            <div className="text-muted-foreground">
                              ${yearlyPrice}/year (billed annually)
                            </div>
                            <div className="text-green-600 dark:text-green-400 font-semibold mt-1">
                              Save ${monthlySavings * 12}/year
                            </div>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <Button
                    className={`w-full mb-6 ${
                      plan.popular
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                        : plan.id === "custom"
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                        : ""
                    }`}
                    variant={plan.popular || plan.id === "custom" ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.id, plan.priceId || null)}
                    disabled={isLoading === plan.id}
                  >
                    {isLoading === plan.id ? (
                      "Loading..."
                    ) : plan.id === "enterprise" || plan.id === "custom" ? (
                      "Contact Sales"
                    ) : plan.id === "free" ? (
                      "Get Started Free"
                    ) : (
                      <>
                        Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Compare Plans</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-semibold">Features</th>
                      {PLANS.map((plan) => (
                        <th key={plan.id} className="text-center p-4 font-semibold">
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-4">AI Messages</td>
                      {PLANS.map((plan) => (
                        <td key={plan.id} className="text-center p-4">
                          {plan.limits.ai_messages === -1
                            ? "Unlimited"
                            : plan.limits.ai_messages.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Documents</td>
                      {PLANS.map((plan) => (
                        <td key={plan.id} className="text-center p-4">
                          {plan.limits.documents === -1
                            ? "Unlimited"
                            : plan.limits.documents.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Storage</td>
                      {PLANS.map((plan) => (
                        <td key={plan.id} className="text-center p-4">
                          {plan.limits.storage_gb === -1
                            ? "Unlimited"
                            : `${plan.limits.storage_gb} GB`}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Team Members</td>
                      {PLANS.map((plan) => (
                        <td key={plan.id} className="text-center p-4">
                          {plan.limits.team_members === -1
                            ? "Unlimited"
                            : plan.limits.team_members}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{item.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-primary text-primary-foreground">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-lg mb-6 opacity-90">
                Join thousands of teams already using Perpetual Core to supercharge their productivity.
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/signup">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 AI Operating System. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/cookies" className="hover:underline">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
