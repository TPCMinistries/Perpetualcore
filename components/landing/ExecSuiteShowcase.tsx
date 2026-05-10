"use client";

import { motion } from "framer-motion";
import { Briefcase, TrendingUp, Sparkles, Check, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const suites = [
  {
    icon: Briefcase,
    gradient: "from-blue-500 to-cyan-600",
    glowColor: "group-hover:shadow-blue-500/20",
    title: "Strategic Leadership",
    roles: "CEO, CFO, Legal & Contracts, Operations Director",
    description:
      "Executive-level strategic guidance across finance, legal, and operations. Get instant C-suite caliber thinking on demand.",
  },
  {
    icon: TrendingUp,
    gradient: "from-purple-500 to-pink-600",
    glowColor: "group-hover:shadow-purple-500/20",
    title: "Revenue & Growth",
    roles: "Sales, Marketing, Social Media, BizDev, Customer Success",
    description:
      "Full go-to-market strategy from pipeline generation to customer retention. Scale revenue without scaling headcount.",
  },
  {
    icon: Sparkles,
    gradient: "from-emerald-500 to-green-600",
    glowColor: "group-hover:shadow-emerald-500/20",
    title: "Product & Innovation",
    roles: "Product Manager, Technical Architecture, Innovation & Trends",
    description:
      "Stay ahead of the curve with AI-powered product strategy, technical roadmaps, and emerging trend analysis.",
  },
];

const benefits = [
  "Instant access to 15 AI executive advisors",
  "Context-aware recommendations from your data",
  "Works 24/7 \u2014 no meetings, no delays",
  "Fraction of the cost of human consultants",
];

export function ExecSuiteShowcase() {
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-5 shadow-lg">
          <Sparkles className="h-4 w-4" />
          <span>NEW: AI Executive Suite</span>
        </div>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-4 bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent">
          Build Your AI Executive Team
        </h2>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          Get instant access to 15 executive-level AI specialists that know your business, remember your strategy, and never take a day off.
        </p>
      </motion.div>

      {/* Suite Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12 sm:mb-16">
        {suites.map((suite, i) => {
          const Icon = suite.icon;
          return (
            <motion.div
              key={suite.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <Card
                className={`h-full backdrop-blur-xl bg-card/80 border border-border/50 hover:border-primary/30 transition-all duration-300 group hover:shadow-2xl ${suite.glowColor}`}
              >
                <CardContent className="p-6 sm:p-8">
                  <div
                    className={`h-12 w-12 rounded-xl bg-gradient-to-br ${suite.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 tracking-tight">{suite.title}</h3>
                  <p className="text-sm font-medium text-primary/80 mb-3">{suite.roles}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {suite.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* CTA Banner */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="max-w-5xl mx-auto"
      >
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 sm:p-10 border border-slate-700/50">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
            {/* Left: Benefits */}
            <div className="flex-1">
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-6">
                Why Teams Love This
              </h3>
              <ul className="space-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <span className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-green-400" strokeWidth={3} />
                    </span>
                    <span className="text-slate-300 text-sm leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Big Number + CTA */}
            <div className="text-center lg:text-right flex-shrink-0">
              <span className="text-7xl sm:text-8xl font-black bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                15
              </span>
              <p className="text-lg font-semibold text-slate-300 mb-6">Executive Advisors</p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-xl px-8 shadow-lg shadow-primary/25 group"
              >
                Explore the Suite
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
