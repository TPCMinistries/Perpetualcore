"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Shield, Users, Zap, Building2, Lock, Clock, Calendar } from "lucide-react";
// import { InlineWidget } from "react-calendly";

export default function EnterpriseDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900 px-4 py-2 rounded-full mb-4">
            <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
              Enterprise Solution
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-slate-900 dark:text-slate-100">
            Schedule Your <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Executive Briefing</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Discuss white-glove AI implementation for your enterprise
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Enterprise Features */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                  During This Call
                </h2>
                <ul className="space-y-4">
                  {[
                    {
                      icon: TrendingUp,
                      title: "ROI Analysis",
                      description: "Calculate projected savings for your organization ($1.2M-$2.5M annually for 100+ employees)",
                    },
                    {
                      icon: Shield,
                      title: "Security Review",
                      description: "Discuss SOC 2, SSO, data residency, and compliance requirements",
                    },
                    {
                      icon: Users,
                      title: "Implementation Plan",
                      description: "6-8 week white-glove rollout with dedicated team",
                    },
                    {
                      icon: Zap,
                      title: "Custom Demo",
                      description: "See the platform configured for your specific use cases",
                    },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                  Enterprise Features
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Lock, text: "SOC 2 Type II" },
                    { icon: Shield, text: "SSO Integration" },
                    { icon: Building2, text: "Dedicated Instance" },
                    { icon: Users, text: "Unlimited Users" },
                    { icon: Zap, text: "Custom Integrations" },
                    { icon: CheckCircle2, text: "SLA Guarantee" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <item.icon className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6">
                <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-3">
                  Typical Enterprise Engagement:
                </h3>
                <div className="space-y-3 text-sm text-purple-800 dark:text-purple-200">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Week 1-2: Discovery & Planning</p>
                      <p className="text-xs">Requirements gathering, security review, custom configuration</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Week 3-4: Pilot Program</p>
                      <p className="text-xs">Deploy to 20-50 users, gather feedback, refine workflows</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Week 5-8: Full Rollout</p>
                      <p className="text-xs">Organization-wide deployment, training, optimization</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                  <p className="font-bold text-purple-900 dark:text-purple-100">
                    Investment: Custom pricing based on org size
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                    Typical range: $50,000-$200,000 annually
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar Embed - Add your Calendly link */}
          <div>
            <Card className="sticky top-8">
              <CardContent className="p-8 text-center">
                <Building2 className="h-16 w-16 text-slate-700 dark:text-slate-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                  Schedule Executive Briefing
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  45-minute deep dive with our enterprise team
                </p>
                <a
                  href="https://calendly.com/your-calendly-link-enterprise"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-lg transition-all"
                >
                  Open Calendar
                  <Calendar className="ml-2 h-5 w-5" />
                </a>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-4">
                  Or email us at: enterprise@perpetualcore.com
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trust Section */}
        <Card className="max-w-4xl mx-auto mt-12 bg-slate-900 dark:bg-slate-950 border-slate-800">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-white text-center mb-6">
              Trusted by Enterprise Teams
            </h2>
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-purple-400 mb-2">99.9%</p>
                <p className="text-sm text-slate-300">Uptime SLA</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-blue-400 mb-2">SOC 2</p>
                <p className="text-sm text-slate-300">Type II Certified</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-green-400 mb-2">24/7</p>
                <p className="text-sm text-slate-300">Enterprise Support</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
