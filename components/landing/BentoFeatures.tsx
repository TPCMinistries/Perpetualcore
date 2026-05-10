"use client";

import { Brain, Users, Building2, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Pillar {
  icon: typeof Brain;
  gradient: string;
  title: string;
  tagline: string;
  bullets: string[];
  visual: "command" | "executives" | "industry" | "growth";
}

const pillars: Pillar[] = [
  {
    icon: Brain,
    gradient: "from-purple-500 to-pink-600",
    title: "Your AI Command Center",
    tagline: "Chat, email, calendar, docs, tasks, and contacts — all connected with persistent memory and RAG-powered search.",
    bullets: [
      "Persistent memory across every conversation",
      "Gmail + Google Calendar integration built in",
      "RAG search across all your documents and knowledge",
      "WhatsApp, Slack, and n8n automation (24 workflows)",
    ],
    visual: "command",
  },
  {
    icon: Users,
    gradient: "from-blue-500 to-cyan-600",
    title: "Your Team of Executives",
    tagline: "15 AI advisors — CEO, CFO, CTO, CMO, Legal, HR, Sales, and more. 24/7 strategic counsel that never bills by the hour.",
    bullets: [
      "CEO Advisor: strategic planning and vision alignment",
      "CFO Advisor: financial analysis, budgeting, forecasting",
      "Legal Counsel: contracts, compliance, and risk",
      "CMO, Sales, HR, CTO, and 8 more specialized roles",
    ],
    visual: "executives",
  },
  {
    icon: Building2,
    gradient: "from-emerald-500 to-green-600",
    title: "Your Industry, Your Way",
    tagline: "10 industry solutions with custom dashboards, workflows, and onboarding — not a generic chatbot.",
    bullets: [
      "Healthcare, Legal, Finance, Real Estate, Education",
      "Sales, Consulting, Non-Profits, Churches, Agencies",
      "Custom workflows and KPIs per vertical",
      "Industry-specific AI training and use cases",
    ],
    visual: "industry",
  },
  {
    icon: Rocket,
    gradient: "from-orange-500 to-red-600",
    title: "Your Growth Engine",
    tagline: "IHA Academy certifications, a marketplace for agents and workflows, and white-label GHL (OPERATE) built in.",
    bullets: [
      "4-tier AI certification path from IHA Academy",
      "Marketplace: buy and sell agents, workflows, and skills",
      "OPERATE: white-label GoHighLevel CRM for agencies",
      "n8n-powered automation with 24 active workflows",
    ],
    visual: "growth",
  },
];

function CommandVisual() {
  const items = [
    { label: "Gmail", detail: "12 emails triaged", color: "bg-red-500" },
    { label: "Calendar", detail: "3 meetings prepped", color: "bg-blue-500" },
    { label: "Documents", detail: "47 indexed via RAG", color: "bg-emerald-500" },
    { label: "Tasks", detail: "8 auto-extracted", color: "bg-purple-500" },
  ];
  return (
    <div className="mt-6 space-y-2.5">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between rounded-lg bg-muted/40 border border-border/30 px-3 py-2 text-xs"
        >
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", item.color)} />
            <span className="font-semibold text-foreground">{item.label}</span>
          </div>
          <span className="text-muted-foreground">{item.detail}</span>
        </div>
      ))}
    </div>
  );
}

function ExecutivesVisual() {
  const advisors = [
    { role: "CEO", focus: "Strategy & Vision", color: "text-blue-500" },
    { role: "CFO", focus: "Financial Analysis", color: "text-emerald-500" },
    { role: "CTO", focus: "Tech Architecture", color: "text-purple-500" },
    { role: "CMO", focus: "Marketing Strategy", color: "text-pink-500" },
    { role: "Legal", focus: "Compliance & Risk", color: "text-orange-500" },
  ];
  return (
    <div className="mt-6 space-y-2">
      {advisors.map((a) => (
        <div
          key={a.role}
          className="flex items-center justify-between rounded-lg bg-muted/40 border border-border/30 px-3 py-2 text-xs"
        >
          <span className={cn("font-bold", a.color)}>{a.role}</span>
          <span className="text-muted-foreground">{a.focus}</span>
        </div>
      ))}
      <div className="text-center text-[11px] text-muted-foreground/60 pt-1">
        +10 more advisors (HR, Sales, Data, Innovation...)
      </div>
    </div>
  );
}

function IndustryVisual() {
  const industries = [
    "Healthcare", "Legal", "Finance", "Real Estate", "Education",
    "Sales", "Consulting", "Non-Profits", "Churches", "Agencies",
  ];
  return (
    <div className="mt-6 flex flex-wrap gap-1.5">
      {industries.map((ind) => (
        <span
          key={ind}
          className="inline-flex items-center rounded-full border border-border/40 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
        >
          {ind}
        </span>
      ))}
    </div>
  );
}

function GrowthVisual() {
  const items = [
    { label: "Tier 1", detail: "AI Foundations (Free)", color: "bg-emerald-500" },
    { label: "Tier 2", detail: "AI Practitioner ($497)", color: "bg-blue-500" },
    { label: "Tier 3", detail: "AI Specialist ($997)", color: "bg-purple-500" },
    { label: "Tier 4", detail: "AI Workforce Fellow ($2,497)", color: "bg-orange-500" },
  ];
  return (
    <div className="mt-6 space-y-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between rounded-lg bg-muted/40 border border-border/30 px-3 py-2 text-xs"
        >
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", item.color)} />
            <span className="font-semibold text-foreground">{item.label}</span>
          </div>
          <span className="text-muted-foreground">{item.detail}</span>
        </div>
      ))}
    </div>
  );
}

export function BentoFeatures() {
  return (
    <section id="features" className="container mx-auto px-4 py-24 lg:py-32">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter mb-4">
          Everything You Need.{" "}
          <span className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
            One Operating System.
          </span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Chat, email, calendar, CRM, 15 AI executives, certifications,
          marketplace, and automation — integrated, not stitched together.
        </p>
      </motion.div>

      {/* Four Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
        {pillars.map((pillar, index) => {
          const Icon = pillar.icon;
          return (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-6 sm:p-8 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
            >
              {/* Icon */}
              <div
                className={cn(
                  "h-14 w-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300",
                  pillar.gradient
                )}
              >
                <Icon className="h-7 w-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold tracking-tight mb-2">
                {pillar.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {pillar.tagline}
              </p>

              {/* Bullet Points */}
              <ul className="space-y-2">
                {pillar.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    {bullet}
                  </li>
                ))}
              </ul>

              {/* Visual */}
              {pillar.visual === "command" && <CommandVisual />}
              {pillar.visual === "executives" && <ExecutivesVisual />}
              {pillar.visual === "industry" && <IndustryVisual />}
              {pillar.visual === "growth" && <GrowthVisual />}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
