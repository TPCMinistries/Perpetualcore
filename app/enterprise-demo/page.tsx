"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Shield, Users, Zap, Building2, Lock, Clock, Calendar, TrendingUp, ArrowRight, Sparkles, Award, BarChart3 } from "lucide-react";
// import { InlineWidget } from "react-calendly";

export default function EnterpriseDemoPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900">
        <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.2))]" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
              <Building2 className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">
                Enterprise Solution
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 text-white">
              Transform Your Enterprise
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                At Scale
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              White-glove AI transformation for organizations ready to lead their industry
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-400" />
                <span>SOC 2 Type II Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-green-400" />
                <span>Enterprise SSO</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-400" />
                <span>99.9% Uptime SLA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Left Column - 3/5 width */}
          <div className="lg:col-span-3 space-y-12">
            {/* Your Executive Briefing */}
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
                Your Executive Briefing Includes
              </h2>
              <div className="grid gap-6">
                {[
                  {
                    icon: BarChart3,
                    title: "Enterprise ROI Analysis",
                    description: "Quantify potential savings across your organization. Typical enterprises save $800K-$2.5M annually through AI-powered workflow automation and productivity gains.",
                  },
                  {
                    icon: Shield,
                    title: "Security & Compliance Review",
                    description: "Comprehensive discussion of SOC 2, SSO integration, data residency requirements, audit logs, and compliance with your industry regulations.",
                  },
                  {
                    icon: Users,
                    title: "Enterprise Deployment Strategy",
                    description: "6-12 week phased rollout plan with dedicated implementation team, change management, executive reporting, and success metrics.",
                  },
                  {
                    icon: Zap,
                    title: "Custom Platform Demo",
                    description: "See Perpetual Core configured specifically for your use cases, department workflows, and integration requirements.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                        <item.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enterprise Features */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                Enterprise-Grade Infrastructure
              </h2>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: Lock, text: "SOC 2 Type II Certified" },
                  { icon: Shield, text: "SAML/SSO Integration" },
                  { icon: Building2, text: "Dedicated Cloud Instance" },
                  { icon: Users, text: "Unlimited Users" },
                  { icon: Zap, text: "Custom API & Integrations" },
                  { icon: CheckCircle2, text: "99.9% Uptime SLA" },
                  { icon: Clock, text: "24/7 Priority Support" },
                  { icon: TrendingUp, text: "Advanced Analytics" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <item.icon className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Implementation Timeline */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-12">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
                Typical Enterprise Engagement
              </h2>
              <div className="space-y-6">
                {[
                  {
                    phase: "Weeks 1-3: Discovery & Architecture",
                    description: "Requirements gathering, security review, technical architecture, and infrastructure setup",
                  },
                  {
                    phase: "Weeks 4-6: Pilot Deployment",
                    description: "Deploy to 50-100 power users, gather feedback, refine workflows, and validate ROI metrics",
                  },
                  {
                    phase: "Weeks 7-12: Enterprise Rollout",
                    description: "Organization-wide deployment, department-specific training, integration setup, and optimization",
                  },
                  {
                    phase: "Ongoing: Success Management",
                    description: "Dedicated CSM, quarterly business reviews, feature requests, and continuous optimization",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {i + 1}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                        {item.phase}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-2xl p-8 border border-purple-200 dark:border-purple-800">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  Investment Structure
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-bold text-slate-900 dark:text-white">Custom Pricing</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      Based on organization size, deployment complexity, and support requirements
                    </p>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-900/60 rounded-lg p-4">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Typical Enterprise Engagement:
                    </p>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <li>• $50,000-$150,000 implementation (one-time)</li>
                      <li>• $2,000-$10,000/month platform + support (based on seats)</li>
                      <li>• Annual contracts with volume discounts available</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                      Average Enterprise ROI
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      $800K-$2.5M annual savings for 100-500 employee organizations
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-4">
                    Limited availability - accepting 2 new enterprise clients per quarter
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking CTA - Right Column - 2/5 width */}
          <div className="lg:col-span-2">
            <div className="sticky top-8 space-y-6">
              {/* Main CTA Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 text-white shadow-2xl border border-slate-700">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 mb-4">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    Schedule Executive Briefing
                  </h3>
                  <p className="text-slate-300 text-sm">
                    60-minute strategic session with our enterprise team
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {[
                    "C-suite and VP-level discussion",
                    "Custom ROI analysis for your org",
                    "Security & compliance deep-dive",
                    "Reference calls available",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <span className="text-slate-200">{item}</span>
                    </div>
                  ))}
                </div>

                <a
                  href="https://cal.com/perpetualcore/enterprise"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-6 py-4 text-lg font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-lg hover:shadow-xl group"
                >
                  <span className="flex items-center justify-center gap-2">
                    Book Executive Briefing
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </a>

                <p className="text-xs text-slate-400 text-center mt-4">
                  Typically scheduled within 48 hours
                </p>
              </div>

              {/* Enterprise Stats */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">
                  Enterprise Metrics:
                </h4>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">$2.1M</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Avg Annual Savings</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">For 250+ employee orgs</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">92%</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">User Adoption</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Within first 60 days</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">6</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Months to Full ROI</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Typical payback period</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alternative Contact */}
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Prefer to speak first?
                </p>
                <a
                  href="mailto:enterprise@perpetualcore.com"
                  className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  enterprise@perpetualcore.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="bg-slate-900 dark:bg-slate-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Trusted by Enterprise Teams
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <p className="text-5xl font-bold text-purple-400 mb-2">99.9%</p>
              <p className="text-sm text-slate-300">Uptime SLA with Enterprise Support</p>
            </div>
            <div className="p-6">
              <p className="text-5xl font-bold text-blue-400 mb-2">SOC 2</p>
              <p className="text-sm text-slate-300">Type II Certified with Annual Audits</p>
            </div>
            <div className="p-6">
              <p className="text-5xl font-bold text-green-400 mb-2">24/7</p>
              <p className="text-sm text-slate-300">Dedicated Enterprise Support</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
