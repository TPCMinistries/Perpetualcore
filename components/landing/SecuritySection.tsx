"use client";

import { motion } from "framer-motion";
import { Shield, Database, Users, Lock, Check, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const securityFeatures = [
  {
    icon: Shield,
    color: "text-green-500",
    gradient: "from-green-500 to-emerald-600",
    title: "100% Private & Secure",
    description:
      "Your data is encrypted at rest and in transit. Row-level security ensures complete workspace isolation between tenants.",
  },
  {
    icon: Lock,
    color: "text-blue-500",
    gradient: "from-blue-500 to-indigo-600",
    title: "Never Used for Training",
    description:
      "Your conversations, documents, and data are never used to train AI models. Your intellectual property stays yours.",
  },
  {
    icon: Database,
    color: "text-purple-500",
    gradient: "from-purple-500 to-violet-600",
    title: "Your Personal AI Brain",
    description:
      "Private vector database per workspace. Your knowledge base is isolated, searchable, and exclusively yours.",
  },
  {
    icon: Users,
    color: "text-orange-500",
    gradient: "from-orange-500 to-amber-600",
    title: "You Control Sharing",
    description:
      "Granular permissions and role-based access. Share exactly what you want, keep private what you don\u2019t.",
  },
];

const complianceBadges = [
  { label: "Row-Level Security", icon: Shield },
  { label: "Encrypted at Rest & Transit", icon: Lock },
  { label: "Never Used for Training", icon: Shield },
  { label: "Hosted on Vercel & Supabase", icon: Database },
];

export function SecuritySection() {
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
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm font-semibold mb-5 shadow-lg">
          <Shield className="h-4 w-4" />
          <span>Enterprise-Grade Security</span>
        </div>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-4 bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent">
          Your Data Stays Yours
        </h2>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          Built from the ground up with privacy-first architecture. No compromises.
        </p>
      </motion.div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto mb-12 sm:mb-16">
        {/* Left: Security Features */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {securityFeatures.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex gap-4 group"
              >
                <div
                  className={`h-11 w-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold mb-1 tracking-tight">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Right: Trusted Security Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="h-full backdrop-blur-xl bg-card/80 border border-border/50 hover:border-green-500/30 transition-all duration-300">
            <CardContent className="p-6 sm:p-8">
              <h3 className="text-2xl font-bold tracking-tight mb-2">Trusted Security</h3>
              <p className="text-sm text-muted-foreground mb-8">
                Built on enterprise-grade infrastructure with industry-standard security practices.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {complianceBadges.map((badge) => {
                  const BadgeIcon = badge.icon;
                  return (
                    <div
                      key={badge.label}
                      className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50 hover:border-green-500/20 transition-colors duration-300"
                    >
                      <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <BadgeIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm font-medium leading-tight">{badge.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom CTA Banner */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="max-w-5xl mx-auto"
      >
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 sm:p-10 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
            Your AI. Your Data. Your Control.
          </h3>
          <p className="text-green-100 mb-6 max-w-xl mx-auto">
            Start building your secure AI brain today. No credit card required.
          </p>
          <Button
            size="lg"
            className="bg-white text-green-700 hover:bg-green-50 rounded-xl px-8 shadow-lg font-semibold group"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
