"use client";

import { Shield, ShieldCheck, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const badges = [
  {
    icon: Shield,
    iconColor: "text-green-600 dark:text-green-400",
    iconBg: "from-green-500 to-emerald-600",
    accentGradient: "from-green-500/60 to-emerald-500/60",
    title: "SOC 2 Ready",
    subtitle: "Enterprise compliance",
    description:
      "Built with SOC 2 Type II controls — encryption, access management, and audit logging from day one.",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "from-blue-500 to-indigo-600",
    accentGradient: "from-blue-500/60 to-indigo-500/60",
    title: "Enterprise SSO",
    subtitle: "SAML & OAuth 2.0",
    description:
      "Seamless single sign-on with your existing identity provider. SAML 2.0, OAuth, and SCIM provisioning.",
  },
  {
    icon: Clock,
    iconColor: "text-purple-600 dark:text-purple-400",
    iconBg: "from-purple-500 to-violet-600",
    accentGradient: "from-purple-500/60 to-violet-500/60",
    title: "99.9% Uptime SLA",
    subtitle: "Guaranteed availability",
    description:
      "Mission-critical reliability backed by Vercel and Supabase enterprise infrastructure with global CDN.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function TrustBadges() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
      className="container mx-auto px-4 py-16"
    >
      <div className="max-w-5xl mx-auto">
        {/* Label */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Enterprise-Ready Infrastructure
          </p>
        </div>

        {/* Badges Row */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <motion.div key={badge.title} variants={cardVariants} className="flex-1">
                <Card className="relative overflow-hidden backdrop-blur-xl bg-card/50 border border-border/50 rounded-2xl hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-300 group h-full">
                  {/* Gradient accent line */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${badge.accentGradient}`}
                  />

                  <CardContent className="p-6 text-center">
                    {/* Icon */}
                    <div
                      className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${badge.iconBg} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold mb-1">{badge.title}</h3>

                    {/* Subtitle Pill */}
                    <div className="inline-block px-3 py-0.5 rounded-full bg-muted text-xs font-semibold text-muted-foreground mb-3">
                      {badge.subtitle}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {badge.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
