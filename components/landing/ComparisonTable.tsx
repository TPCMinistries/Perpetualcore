"use client";

import { motion } from "framer-motion";
import { User, MessageSquare, Calendar, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStage {
  period: string;
  icon: typeof User;
  iconGradient: string;
  title: string;
  description: string;
  capabilities: string[];
}

const stages: TimelineStage[] = [
  {
    period: "Day 1",
    icon: User,
    iconGradient: "from-blue-500 to-cyan-600",
    title: "Knows Your Basics",
    description: "From your first conversation, Perpetual Core starts building your profile.",
    capabilities: [
      "Your name, role, and organization",
      "Your initial goals and priorities",
      "Preferred language and tone",
      "Key projects you're working on",
    ],
  },
  {
    period: "Week 1",
    icon: MessageSquare,
    iconGradient: "from-purple-500 to-violet-600",
    title: "Learns Your Style",
    description: "After a week of conversations, it adapts to how you think and communicate.",
    capabilities: [
      "Communication style (direct vs. detailed)",
      "Preferred summary formats (bullets, narrative, tables)",
      "Which AI models you prefer for which tasks",
      "Your work patterns and peak hours",
    ],
  },
  {
    period: "Month 1",
    icon: Calendar,
    iconGradient: "from-emerald-500 to-green-600",
    title: "Works Proactively",
    description: "By month one, agents start acting on your behalf without being asked.",
    capabilities: [
      "Proactively preps meetings with relevant context",
      "Drafts emails in your voice and tone",
      "Flags important items before you ask",
      "Automates repetitive workflows you do weekly",
    ],
  },
  {
    period: "Month 3",
    icon: Brain,
    iconGradient: "from-orange-500 to-red-600",
    title: "Runs Your Operation",
    description: "Your AI Executive Suite, industry dashboard, and knowledge graph work together as a complete operating system.",
    capabilities: [
      "15 AI executives advising on strategy, finance, legal, and more",
      "Industry-specific dashboard with custom KPIs and workflows",
      "Knowledge graph surfaces connections across all your data",
      "Marketplace agents and IHA certifications accelerate your team",
    ],
  },
];

export function ComparisonTable() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="container mx-auto px-4 py-20"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-primary to-purple-600 dark:from-white dark:via-primary dark:to-purple-400 bg-clip-text text-transparent">
            What Changes When AI Learns You
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From day one to month three, watch your AI evolve from assistant to
            indispensable operating system
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 via-purple-500/40 to-transparent hidden sm:block" />

          <div className="space-y-12 sm:space-y-16">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={stage.period}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={cn(
                    "relative grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-start"
                  )}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 hidden sm:flex">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg ring-4 ring-background",
                        stage.iconGradient
                      )}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  {/* Content - alternating sides on desktop */}
                  <div
                    className={cn(
                      "sm:pl-16 md:pl-0",
                      isEven ? "md:pr-16 md:text-right" : "md:col-start-2 md:pl-16"
                    )}
                  >
                    {/* Period badge */}
                    <div
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary mb-3"
                      )}
                    >
                      <div
                        className={cn(
                          "h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-md sm:hidden",
                          stage.iconGradient
                        )}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      {stage.period}
                    </div>

                    <h3 className="text-2xl font-bold tracking-tight mb-2">
                      {stage.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {stage.description}
                    </p>

                    {/* Capabilities */}
                    <ul
                      className={cn(
                        "space-y-2",
                        isEven ? "md:ml-auto" : ""
                      )}
                    >
                      {stage.capabilities.map((cap) => (
                        <li
                          key={cap}
                          className={cn(
                            "flex items-start gap-2 text-sm text-muted-foreground",
                            isEven ? "md:flex-row-reverse md:text-right" : ""
                          )}
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                          {cap}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
