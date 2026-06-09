"use client";

import { motion } from "framer-motion";
import { UserPlus, Cable, Rocket } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: UserPlus,
    gradient: "from-primary to-purple-600",
    title: "Sign Up",
    description: "Create your free account in seconds. No credit card required.",
  },
  {
    number: 2,
    icon: Cable,
    gradient: "from-purple-600 to-pink-600",
    title: "Connect",
    description: "Import documents, connect email & calendar. Build your knowledge base.",
  },
  {
    number: 3,
    icon: Rocket,
    gradient: "from-pink-600 to-orange-500",
    title: "Transform",
    description: "Start chatting with AI that knows everything about your work.",
  },
];

export function HowItWorks() {
  return (
    <section className="container mx-auto px-4 py-20 sm:py-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-14 sm:mb-20"
      >
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-4 bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent">
          Get started in minutes
        </h2>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
          Three simple steps to your personal AI operating system
        </p>
      </motion.div>

      {/* Steps */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 relative">
          {/* Connecting Line (desktop only) */}
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-[2px]">
            <div className="w-full h-full border-t-2 border-dashed border-border" />
          </div>

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex flex-col items-center text-center relative z-10"
              >
                {/* Number Circle */}
                <div className="relative mb-6">
                  {/* Glow */}
                  <div
                    className={`absolute -inset-2 bg-gradient-to-r ${step.gradient} rounded-full blur-xl opacity-30`}
                  />
                  <div
                    className={`relative h-20 w-20 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-xl`}
                  >
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  {/* Step Number Badge */}
                  <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-md">
                    <span className="text-xs font-bold">{step.number}</span>
                  </div>
                </div>

                {/* Text */}
                <h3 className="text-xl font-bold tracking-tight mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
