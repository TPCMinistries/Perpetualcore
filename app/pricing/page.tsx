"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, Crown, Building2, Sparkles, ArrowRight } from "lucide-react";
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
      "50 AI messages per month",
      "Gemini model only",
      "5 documents",
      "1 GB storage",
      "Email support",
      "Community access",
    ],
    limits: {
      ai_messages: 50,
      documents: 5,
      storage_gb: 1,
      team_members: 1,
    },
  },
  {
    id: "pro",
    name: "Pro",
    description: "For individuals and professionals",
    price: 49,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
    interval: "month",
    icon: Zap,
    popular: true,
    badge: "Most Popular",
    features: [
      "1,000 AI messages per month",
      "All AI models (GPT-4, Claude, Gemini)",
      "$0.05 per message overage",
      "Unlimited documents",
      "10 GB storage",
      "Email & Calendar integration",
      "5 AI workflows",
      "Priority email support",
    ],
    limits: {
      ai_messages: 1000,
      documents: -1,
      storage_gb: 10,
      team_members: 1,
    },
  },
  {
    id: "business",
    name: "Business",
    description: "For teams and growing businesses",
    price: 149,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY,
    interval: "month",
    icon: Crown,
    popular: false,
    badge: null,
    features: [
      "4,000 AI messages per month",
      "All AI models (GPT-4, Claude, Gemini)",
      "$0.04 per message overage",
      "Everything in Pro",
      "50 GB storage",
      "Team collaboration (up to 5 users)",
      "Shared workspaces",
      "Role-based permissions",
      "Admin dashboard",
      "Team analytics",
      "Priority support",
    ],
    limits: {
      ai_messages: 4000,
      documents: -1,
      storage_gb: 50,
      team_members: 5,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations and industries",
    price: 499,
    priceId: null,
    interval: "starting at",
    icon: Building2,
    popular: false,
    badge: "Contact Sales",
    features: [
      "20,000+ AI messages (or custom volume)",
      "$0.03 per message overage (negotiable)",
      "Everything in Business",
      "Unlimited team members",
      "Unlimited storage",
      "Custom AI models & fine-tuning",
      "Dedicated success manager",
      "99.9% SLA",
      "SOC 2, HIPAA compliance",
      "24/7 phone support",
      "Custom contracts",
    ],
    limits: {
      ai_messages: 20000,
      documents: -1,
      storage_gb: -1,
      team_members: -1,
    },
  },
];

const FAQ_ITEMS = [
  {
    question: "How does usage-based overage pricing work?",
    answer: "If you exceed your monthly message limit, you'll only pay for what you use beyond the base amount. Pro: $0.05/message, Business: $0.04/message, Enterprise: $0.03/message (negotiable). Overage charges appear on your next bill. This ensures you never lose access while keeping costs transparent.",
  },
  {
    question: "Can I change plans later?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, MasterCard, American Express) via Stripe. Enterprise plans can also pay via invoice.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! All paid plans come with a 14-day free trial. No credit card required for the Free plan.",
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "Your data remains accessible for 30 days after cancellation. You can export all your data at any time.",
  },
  {
    question: "Can I get a refund?",
    answer: "Yes, we offer a 30-day money-back guarantee for all paid plans. Contact support for a full refund within 30 days.",
  },
  {
    question: "Do you offer discounts for nonprofits or students?",
    answer: "Yes! We offer 50% discounts for verified nonprofits and educational institutions. Contact sales for details.",
  },
  {
    question: "How do industry-specific plans work?",
    answer: "We offer tailored solutions for Law Firms, Healthcare, Real Estate, and more starting at $499/month with custom features and volume pricing. Contact sales to discuss your specific needs.",
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

    // Handle enterprise tiers (Business & Enterprise)
    if (planId === "business" || planId === "enterprise") {
      router.push("/contact-sales?plan=" + planId);
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

            return (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.popular
                    ? "border-primary shadow-lg scale-105"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full">
                      Most Popular
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
                        {billingInterval === "yearly" && (
                          <div className="text-sm text-muted-foreground mt-1">
                            ${yearlyPrice}/year (billed annually)
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <Button
                    className="w-full mb-6"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.id, plan.priceId || null)}
                    disabled={isLoading === plan.id}
                  >
                    {isLoading === plan.id ? (
                      "Loading..."
                    ) : plan.id === "enterprise" ? (
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
