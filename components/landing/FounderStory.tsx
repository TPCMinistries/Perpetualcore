"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ArrowRight, DollarSign } from "lucide-react";

const impactStats = [
  { label: "Your subscription", value: "$49/mo" },
  { label: "Funds IHA mission", value: "$4.90/mo" },
  { label: "Annual impact", value: "$58.80/yr" },
];

export function FounderStory() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-2xl bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-4 shadow-xl">
            <Heart className="h-4 w-4" />
            <span>The Perpetual Engine</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-primary to-purple-600 dark:from-white dark:via-primary dark:to-purple-400 bg-clip-text text-transparent">
            Powered by Purpose
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            10% of every dollar funds workforce development and education
            through the Institute for Human Advancement
          </p>
        </motion.div>

        {/* Money Flow Visual */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {impactStats.map((stat, i) => (
              <div key={stat.label} className="relative">
                <Card className="backdrop-blur-xl bg-card/80 border border-border/50 hover:border-primary/30 transition-all duration-300">
                  <CardContent className="p-5 text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-black tracking-tighter bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                  </CardContent>
                </Card>
                {i < impactStats.length - 1 && (
                  <div className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                    <ArrowRight className="h-5 w-5 text-primary/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Founder Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="backdrop-blur-2xl bg-card/80 border-2 border-border shadow-2xl hover:shadow-3xl transition-all duration-300">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start">
                {/* Photo Placeholder */}
                <div className="flex-shrink-0">
                  <div
                    className="w-48 h-48 rounded-2xl bg-gradient-to-br from-muted to-muted/60 border-2 border-border flex items-center justify-center shadow-xl"
                    role="img"
                    aria-label="Lorenzo Daughtry-Chambers, Founder"
                  >
                    <div className="text-center">
                      <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <span className="text-2xl font-black text-white">
                          LDC
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        Founder Photo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Founder Info */}
                <div className="flex-1 text-center md:text-left">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-2xl bg-gradient-to-r from-primary/15 to-purple-500/15 border border-primary/25 text-primary text-sm font-semibold mb-4 shadow-lg">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Every Subscription Funds Real Impact</span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold mb-1">
                    Lorenzo Daughtry-Chambers
                  </h3>
                  <p className="text-primary font-semibold mb-6 text-lg">
                    Founder &amp; CEO
                  </p>

                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      Perpetual Core was built because Lorenzo needed it.
                      Running multiple organizations simultaneously — from a
                      healthcare workforce program to an AI academy to a
                      nonprofit — he needed an AI operating system that could
                      learn everything, access every model, and help manage
                      institutional knowledge across teams. So he built it.
                    </p>
                    <p>
                      Every feature you use has been battle-tested in a real
                      production environment. This isn&apos;t a demo product —
                      it&apos;s the operating system Lorenzo runs his entire
                      organization on.
                    </p>
                    <p className="flex items-start gap-2">
                      <Heart className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground">
                          The Perpetual Engine:
                        </strong>{" "}
                        10% of every dollar funds workforce development,
                        healthcare education, and community uplift through the{" "}
                        <span className="text-primary font-semibold">
                          Institute for Human Advancement
                        </span>
                        . When you subscribe, you&apos;re not just getting an AI
                        operating system — you&apos;re investing in human
                        potential.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
