"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Calendar, Users, TrendingUp, Clock, ArrowRight, Sparkles, Target, Zap } from "lucide-react";
import ConsultationBookingForm from "@/components/forms/ConsultationBookingForm";
// import { InlineWidget } from "react-calendly";

export default function ConsultationPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 px-4 py-2 rounded-full mb-6 border border-purple-200 dark:border-purple-800">
              <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                Guided Implementation
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 text-slate-900 dark:text-white">
              Transform Your Team with
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Expert AI Implementation
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              White-glove service for mid-market teams ready to gain a competitive edge through AI
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Left Column - 3/5 width */}
          <div className="lg:col-span-3 space-y-12">
            {/* What's Included */}
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
                What's Included in Your Strategy Session
              </h2>
              <div className="grid gap-6">
                {[
                  {
                    icon: Target,
                    title: "AI Readiness Assessment",
                    description: "Evaluate your current workflows, team capabilities, and identify the highest-impact automation opportunities specific to your business.",
                  },
                  {
                    icon: TrendingUp,
                    title: "Custom 90-Day Roadmap",
                    description: "Get a phased implementation plan with clear milestones, resource requirements, and expected ROI at each stage.",
                  },
                  {
                    icon: Users,
                    title: "Team Adoption Strategy",
                    description: "Proven change management frameworks to ensure your team embraces AI rather than resists it.",
                  },
                  {
                    icon: Zap,
                    title: "Quick Win Identification",
                    description: "Walk away with 2-3 immediate automation opportunities you can implement within the first week.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
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

            {/* Ideal For */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                This is Perfect For You If...
              </h2>
              <div className="space-y-4">
                {[
                  "You have a team of 10-50 people and want everyone working smarter",
                  "You're currently spending $500+/month on disconnected productivity tools",
                  "You know AI is important but don't know where to start",
                  "Your team is resistant to change and needs proper onboarding",
                  "You want measurable ROI, not just buzzwords and hype",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Tiers */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-12">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                Choose Your Team Plan
              </h2>

              {/* Team Tier */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-2xl p-8 border border-purple-200 dark:border-purple-800 mb-6">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Team Plan (Up to 10 Users)
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Perfect for small teams ready to transform their productivity
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Unlimited premium AI models (GPT-4, Claude, o1)",
                      "Shared team knowledge base",
                      "Implementation call included",
                      "Slack/Teams integration",
                      "API access",
                      "50 GB storage",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-purple-200 dark:border-purple-700 pt-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">$499</span>
                    <span className="text-slate-600 dark:text-slate-400">/month</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    For up to 10 team members
                  </p>
                  <div className="bg-white/60 dark:bg-slate-900/60 rounded-lg p-4">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      ROI Example:
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Save 15 hours/employee/month × 10 people = 150 hours saved (~$7,500/mo value)
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Tier */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-8 border-2 border-slate-300 dark:border-slate-700">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Business Plan (Up to 50 Users)
                    </h3>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                      BEST VALUE
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    For growing companies that need scale and compliance
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Everything in Team, plus:",
                      "Up to 50 team members",
                      "SSO & SAML authentication",
                      "Custom AI training on your data",
                      "99.9% SLA",
                      "Priority support",
                      "Advanced analytics",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">$1,999</span>
                    <span className="text-slate-600 dark:text-slate-400">/month</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    For up to 50 team members (only $40/user/month)
                  </p>
                  <div className="bg-white/60 dark:bg-slate-900/60 rounded-lg p-4">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      ROI Example:
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Save 15 hours/employee/month × 50 people = 750 hours saved (~$37,500/mo value)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form - Right Column - 2/5 width */}
          <div className="lg:col-span-2">
            <div className="sticky top-8 space-y-6">
              {/* Booking Form Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 mb-4">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                    Request Your Strategy Session
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    45-minute deep dive into your team's AI opportunities
                  </p>
                </div>

                <div className="space-y-3 mb-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  {[
                    "Free, no-obligation consultation",
                    "Custom implementation roadmap",
                    "ROI calculator and timeline",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>

                <ConsultationBookingForm />
              </div>

              {/* Trust Indicators */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">
                  Why Teams Choose Us:
                </h4>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">4.9</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Average Rating</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">From 50+ implementations</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">85%</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Team Adoption Rate</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Within first 30 days</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">60</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Days to ROI</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Average payback period</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alternative Contact */}
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Prefer email?
                </p>
                <a
                  href="mailto:consulting@perpetualcore.com"
                  className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  consulting@perpetualcore.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
