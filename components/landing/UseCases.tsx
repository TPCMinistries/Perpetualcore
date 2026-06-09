"use client";

import { motion } from "framer-motion";
import { Zap, Briefcase, Sparkles, Bot, FileText, Users, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const useCases = [
  {
    icon: Zap,
    gradient: "from-orange-500 to-red-600",
    hoverGlow: "from-orange-500/20 to-red-500/20",
    title: "Entrepreneurs & Founders",
    description:
      "Replace an entire back office with AI. Strategy, legal, finance, marketing \u2014 all in one place with persistent memory of your business context.",
  },
  {
    icon: Briefcase,
    gradient: "from-blue-500 to-indigo-600",
    hoverGlow: "from-blue-500/20 to-indigo-500/20",
    title: "Working Professionals",
    description:
      "Stop context-switching between AI tools. One platform that remembers every project, every client, every conversation \u2014 forever.",
  },
  {
    icon: Sparkles,
    gradient: "from-pink-500 to-rose-600",
    hoverGlow: "from-pink-500/20 to-rose-500/20",
    title: "Creators & Writers",
    description:
      "Build a creative partner that knows your voice, your style, and your audience. Draft, refine, and publish faster than ever.",
  },
  {
    icon: Bot,
    gradient: "from-cyan-500 to-blue-600",
    hoverGlow: "from-cyan-500/20 to-blue-500/20",
    title: "Developers & Technical",
    description:
      "Multi-model access with intelligent routing. Code review with Claude, architecture with GPT-4, documentation with Gemini \u2014 all in one chat.",
  },
  {
    icon: FileText,
    gradient: "from-purple-500 to-pink-600",
    hoverGlow: "from-purple-500/20 to-pink-500/20",
    title: "Researchers & Analysts",
    description:
      "Upload papers, reports, and datasets. Ask questions across your entire knowledge base with RAG-powered vector search.",
  },
  {
    icon: Users,
    gradient: "from-emerald-500 to-teal-600",
    hoverGlow: "from-emerald-500/20 to-teal-500/20",
    title: "Teams & Organizations",
    description:
      "Shared AI workspaces with role-based access. Your team\u2019s institutional knowledge, searchable and actionable by everyone.",
  },
];

export function UseCases() {
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
          <Users className="h-4 w-4" />
          <span>Built For Everyone</span>
        </div>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-4 bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent">
          Your AI Brain, Your Way
        </h2>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          No matter your role, Perpetual Core adapts to how you think and work
        </p>
      </motion.div>

      {/* Use Case Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
        {useCases.map((useCase, i) => {
          const Icon = useCase.icon;
          return (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative group"
            >
              {/* Hover Glow */}
              <div
                className={`absolute -inset-1 bg-gradient-to-r ${useCase.hoverGlow} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              <Card className="relative h-full backdrop-blur-xl bg-card/80 border border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6 sm:p-7">
                  <div
                    className={`h-12 w-12 rounded-xl bg-gradient-to-br ${useCase.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 tracking-tight">{useCase.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {useCase.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-center"
      >
        <Button
          size="lg"
          className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-xl px-8 shadow-lg shadow-primary/25 group"
        >
          Get Started Free
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </motion.div>
    </section>
  );
}
