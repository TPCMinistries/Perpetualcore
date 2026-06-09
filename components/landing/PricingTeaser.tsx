"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const competitors = [
  { name: "ChatGPT Plus", price: "$20/mo", models: "AI chat (1 model)" },
  { name: "GoHighLevel", price: "$97/mo", models: "CRM & automation" },
  { name: "Calendly + ClickUp", price: "$24/mo", models: "Calendar + tasks" },
  { name: "Consulting retainer", price: "$500+/hr", models: "Strategic advice" },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Personal AI brain",
    highlight: "Get started with no commitment",
    features: [
      "5 conversations per day",
      "Basic model access",
      "1 GB document storage",
      "Community support",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Starter",
    price: "$49",
    period: "/mo",
    description: "Everything you need to run your business",
    highlight: "Replaces $200+/mo in separate tools",
    features: [
      "All 11 AI models (auto-routed)",
      "Email, calendar, and task integrations",
      "Knowledge base with RAG search",
      "10 GB storage + priority support",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/mo",
    description: "Executive suite + OPERATE + marketplace",
    highlight: "Your complete AI operating system",
    features: [
      "Everything in Starter",
      "15 AI Executive Advisors (C-Suite)",
      "OPERATE: white-label GHL CRM",
      "Marketplace + API access",
    ],
    cta: "Go Pro",
    popular: false,
  },
];

export function PricingTeaser() {
  return (
    <section className="container mx-auto px-4 py-20 sm:py-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 sm:mb-16"
      >
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-4 bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent">
          11 Models. One Price.
        </h2>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
          Stop paying for 3 subscriptions. Get all 11 models for less.
        </p>
      </motion.div>

      {/* Cost Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="max-w-3xl mx-auto mb-14"
      >
        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
              What you&apos;re replacing
            </p>

            {/* Competitor prices */}
            <div className="space-y-3 mb-6">
              {competitors.map((comp) => (
                <div
                  key={comp.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-red-400/10 flex items-center justify-center flex-shrink-0">
                      <X className="h-3 w-3 text-red-400" strokeWidth={3} />
                    </span>
                    <span className="text-muted-foreground">
                      {comp.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-foreground">
                      {comp.price}
                    </span>
                    <span className="text-muted-foreground ml-2 text-xs hidden sm:inline">
                      {comp.models}
                    </span>
                  </div>
                </div>
              ))}
              <div className="border-t border-border/50 pt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">
                  Minimum to cobble this together
                </span>
                <span className="font-bold text-foreground text-base">
                  $200+/mo
                </span>
              </div>
            </div>

            {/* Perpetual Core */}
            <div className="rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 border border-primary/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </span>
                  <span className="font-semibold text-foreground">
                    Perpetual Core
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-primary text-lg">
                    $49/mo
                  </span>
                  <span className="text-muted-foreground ml-2 text-xs hidden sm:inline">
                    All of the above + more
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-primary font-semibold ml-7">
                11 models + 15 AI executives + CRM + certifications + marketplace — all integrated
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            className="relative"
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white text-xs font-semibold shadow-lg shadow-primary/25">
                  <Sparkles className="h-3 w-3" />
                  Best Value
                </div>
              </div>
            )}

            <Card
              className={`h-full backdrop-blur-xl bg-card/80 transition-all duration-300 group hover:shadow-2xl ${
                plan.popular
                  ? "border-2 border-primary/50 shadow-xl shadow-primary/10 hover:border-primary"
                  : "border border-border/50 hover:border-primary/30"
              }`}
            >
              <CardContent className="p-6 sm:p-8 flex flex-col h-full">
                {/* Plan Name */}
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  {plan.name}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl sm:text-5xl font-black tracking-tighter">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">
                    {plan.period}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-2">
                  {plan.description}
                </p>

                {/* Highlight */}
                <p className="text-xs font-medium text-primary mb-6">
                  {plan.highlight}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <span className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check
                          className="h-3 w-3 text-green-600 dark:text-green-400"
                          strokeWidth={3}
                        />
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  className={`w-full rounded-xl group/btn ${
                    plan.popular
                      ? "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/25"
                      : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                >
                  {plan.cta}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Link */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-center"
      >
        <a
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
        >
          View detailed pricing and features
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </a>
      </motion.div>
    </section>
  );
}
