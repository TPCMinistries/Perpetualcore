"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Send, Sparkles, TrendingUp, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  role: "user" | "ai";
  text: string;
  learning?: string;
}

const demoMessages: ChatMessage[] = [
  {
    role: "user",
    text: "Can you summarize the Johnson contract renewal terms?",
  },
  {
    role: "ai",
    text: "Here are the key points from the Johnson contract:\n\n\u2022 Renewal deadline: March 30, 2026\n\u2022 Pricing adjustment clause triggers at 15% volume increase\n\u2022 SLA guarantees require 99.5% uptime\n\u2022 You flagged concerns about the penalty structure on Jan 15",
    learning: "Noticed you prefer bullet-point summaries \u2014 I\u2019ll use this format going forward.",
  },
  {
    role: "user",
    text: "Draft a follow-up email to their team about the renewal timeline.",
  },
  {
    role: "ai",
    text: "Done \u2014 I drafted the email in your direct, data-driven tone. Referenced your Q2 planning notes and proposed a meeting next Tuesday (your usual contract review day). Subject line: \u201CJohnson Renewal \u2014 Action Items Before March 30.\u201D",
    learning: "Based on your pattern of reviewing contracts on Tuesdays, I suggested that meeting day.",
  },
  {
    role: "user",
    text: "Perfect. Also connect this to our Q3 budget planning.",
  },
  {
    role: "ai",
    text: "Connected. I found 3 links between this renewal and your Q3 budget:\n\n\u2022 The volume increase clause could add $45K to Q3 costs\n\u2022 Your hiring plan depends on the Johnson SLA for capacity\n\u2022 CFO mentioned renegotiating vendor terms in last week\u2019s notes\n\nI\u2019ve added these to your knowledge graph under \u201CQ3 Budget Dependencies.\u201D",
    learning: "Knowledge graph updated \u2014 surfaced connections across 3 separate conversations.",
  },
];

const features = [
  {
    icon: Eye,
    gradient: "from-purple-500 to-violet-600",
    title: "Learns Your Style",
    description: "Adapts tone, format, and detail level to match your preferences.",
  },
  {
    icon: TrendingUp,
    gradient: "from-blue-500 to-cyan-600",
    title: "Spots Your Patterns",
    description: "Detects routines, habits, and workflows to work proactively.",
  },
  {
    icon: Sparkles,
    gradient: "from-emerald-500 to-green-600",
    title: "Gets Smarter Daily",
    description: "Builds a knowledge graph that surfaces connections you missed.",
  },
];

export function InteractiveChatDemo() {
  const [visibleMessages, setVisibleMessages] = useState<number>(0);

  useEffect(() => {
    if (visibleMessages >= demoMessages.length) return;
    const delay =
      visibleMessages === 0
        ? 800
        : demoMessages[visibleMessages - 1]?.role === "ai"
        ? 2200
        : 1200;
    const timer = setTimeout(() => {
      setVisibleMessages((prev) => prev + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [visibleMessages]);

  return (
    <section className="container mx-auto px-4 py-20 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 sm:mb-16"
      >
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-4 bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent">
          Watch It Learn
        </h2>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          See how Perpetual Core adapts to your style, spots your patterns, and
          gets smarter with every conversation
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="max-w-3xl mx-auto"
      >
        {/* Outer Glow */}
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 rounded-[3rem] blur-3xl" />

          {/* Chat Container */}
          <div className="relative backdrop-blur-xl bg-card/90 border border-border/50 rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-2xl">
            {/* Header Bar */}
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-border/50 bg-card/60">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Perpetual Core</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">
                    Learning Active
                  </span>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="p-4 sm:p-6 space-y-4 min-h-[380px] sm:min-h-[440px]">
              {demoMessages.slice(0, visibleMessages).map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <div
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "ai" && (
                      <div className="flex-shrink-0 mr-2 mt-1">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-border/50 flex items-center justify-center">
                          <Brain className="h-3.5 w-3.5 text-primary" />
                        </div>
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-primary to-purple-600 text-white"
                          : "backdrop-blur-sm bg-muted/60 border border-border/40 text-foreground"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>

                  {/* Learning Insight */}
                  {msg.learning && msg.role === "ai" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.4, delay: 0.6 }}
                      className="ml-9 mt-2"
                    >
                      <div className="inline-flex items-start gap-2 rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-2 text-xs text-purple-600 dark:text-purple-400">
                        <Sparkles className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                        <span>{msg.learning}</span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator */}
              {visibleMessages < demoMessages.length &&
                visibleMessages > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex ${
                      demoMessages[visibleMessages]?.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {demoMessages[visibleMessages]?.role === "ai" && (
                      <div className="flex-shrink-0 mr-2 mt-1">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-border/50 flex items-center justify-center">
                          <Brain className="h-3.5 w-3.5 text-primary" />
                        </div>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        demoMessages[visibleMessages]?.role === "user"
                          ? "bg-gradient-to-br from-primary to-purple-600"
                          : "backdrop-blur-sm bg-muted/60 border border-border/40"
                      }`}
                    >
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-current opacity-40 animate-bounce [animation-delay:0ms]" />
                        <span className="h-2 w-2 rounded-full bg-current opacity-40 animate-bounce [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-current opacity-40 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </motion.div>
                )}
            </div>

            {/* Input Bar */}
            <div className="px-4 sm:px-6 py-4 border-t border-border/50 bg-card/60">
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 border border-border/50 px-4 py-2.5">
                <span className="flex-1 text-sm text-muted-foreground">
                  Ask anything about your business...
                </span>
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg"
                >
                  <Send className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Feature Callouts */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto mt-10 sm:mt-14"
      >
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.title}
              className="backdrop-blur-xl bg-card/80 border border-border/50 hover:border-primary/30 transition-all duration-300 group"
            >
              <CardContent className="p-5 text-center">
                <div
                  className={`h-11 w-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-bold mb-1">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>
    </section>
  );
}
