"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const stats = [
  { target: 11, label: "AI Models" },
  { target: 15, label: "Executive Advisors" },
  { target: 10, label: "Industry Solutions" },
  { target: 72, label: "Features" },
];

const industries = [
  { label: "Healthcare" },
  { label: "Legal" },
  { label: "Education" },
  { label: "Finance" },
  { label: "Technology" },
  { label: "Non-Profit" },
  { label: "Real Estate" },
  { label: "Consulting" },
  { label: "Marketing" },
  { label: "Manufacturing" },
  { label: "Government" },
  { label: "Retail" },
];

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const stepTime = duration / target;
    let current = 0;

    const timer = setInterval(() => {
      current += 1;
      setCount(current);
      if (current >= target) {
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span className="text-5xl md:text-6xl font-black bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
      {count}
    </span>
  );
}

export function SocialProofBanner() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="container mx-auto px-4 py-12"
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <AnimatedCounter target={stat.target} />
              <span className="mt-2 text-sm md:text-base font-semibold text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Subtitle */}
        <p className="text-lg md:text-xl font-bold text-foreground mb-3">
          Built for Every Industry
        </p>
        <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
          Custom dashboards, workflows, and onboarding for each industry
        </p>

        {/* Marquee Industry Pills */}
        <div className="overflow-hidden">
          <div className="flex gap-3 animate-[marquee_40s_linear_infinite]">
            {[...industries, ...industries].map((industry, i) => (
              <span
                key={`${industry.label}-${i}`}
                className="px-4 py-2 rounded-full border border-border/50 bg-card/60 backdrop-blur-sm text-sm font-medium text-muted-foreground hover:border-primary/30 transition-colors whitespace-nowrap"
              >
                {industry.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </motion.section>
  );
}
