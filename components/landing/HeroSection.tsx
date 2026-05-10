"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const modelPills = [
  {
    name: "GPT-4o",
    bg: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
  },
  {
    name: "Claude",
    bg: "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
  },
  {
    name: "Gemini",
    bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
  },
  {
    name: "DeepSeek",
    bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400",
  },
  {
    name: "o1",
    bg: "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400",
  },
  {
    name: "+6 more",
    bg: "bg-muted border-border text-muted-foreground",
  },
];

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[120px] animate-[drift_20s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[120px] animate-[drift_25s_ease-in-out_infinite_reverse]" />
      </div>

      <div className="container relative mx-auto px-4 py-20 sm:py-28 lg:py-32">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/60 backdrop-blur-sm px-4 py-1.5 text-sm text-muted-foreground mb-8 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              The AI Operating System
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6"
          >
            <span className="block bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              The AI Operating System
            </span>
            <span className="block bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
              For How You Actually Work.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Chat. Email. Calendar. CRM. Agents. Advisors. Certifications.
            11 models, 15 AI executives, 10 industry solutions — one platform.
          </motion.p>

          {/* CTA Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-6"
          >
            <Button
              asChild
              size="lg"
              className="rounded-xl bg-gradient-to-r from-primary via-purple-600 to-purple-700 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 border-0 text-base px-8 h-12"
            >
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-xl border-border/50 hover:border-primary/50 hover:bg-accent/50 transition-all duration-300 text-base px-8 h-12"
            >
              <Link href="/demo">
                <Play className="mr-2 h-4 w-4 fill-current" />
                See How It Works
              </Link>
            </Button>
          </motion.div>

          {/* Trust Line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="text-xs sm:text-sm text-muted-foreground/70 mb-12"
          >
            Replaces $200+/mo in separate tools &nbsp;&middot;&nbsp; 14-day
            free trial &nbsp;&middot;&nbsp; Cancel anytime
          </motion.p>

          {/* Model Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex flex-wrap items-center justify-center gap-2.5"
          >
            {modelPills.map((model) => (
              <div
                key={model.name}
                className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-transform duration-200 hover:scale-105 ${model.bg}`}
              >
                {model.name}
                {model.name !== "+6 more" && (
                  <span className="ml-1.5 text-[10px] opacity-60 font-normal">
                    auto-routed
                  </span>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* CSS animation keyframes for the background orbs */}
      <style jsx>{`
        @keyframes drift {
          0%,
          100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(30px, -20px);
          }
          50% {
            transform: translate(-20px, 30px);
          }
          75% {
            transform: translate(20px, 20px);
          }
        }
      `}</style>
    </section>
  );
}
