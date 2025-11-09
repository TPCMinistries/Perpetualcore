"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Calendar, Users, TrendingUp, Clock } from "lucide-react";
// import { InlineWidget } from "react-calendly";

export default function ConsultationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-slate-900 dark:text-slate-100">
            Book Your <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Strategy Call</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Let's create a custom AI implementation plan for your team
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* What to Expect */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                  What to Expect
                </h2>
                <ul className="space-y-4">
                  {[
                    {
                      icon: Calendar,
                      title: "30-Minute Call",
                      description: "No pressure, no sales pitch - just honest advice",
                    },
                    {
                      icon: TrendingUp,
                      title: "Custom Roadmap",
                      description: "We'll map out your 90-day AI implementation plan",
                    },
                    {
                      icon: Users,
                      title: "Team Assessment",
                      description: "Identify quick wins and high-impact use cases",
                    },
                    {
                      icon: Clock,
                      title: "ROI Estimate",
                      description: "Calculate exact time and cost savings for your team",
                    },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
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
                  Who This Is For
                </h2>
                <ul className="space-y-3">
                  {[
                    "Teams of 10-50 people looking to implement AI",
                    "Companies spending $500-2,000/month on productivity tools",
                    "Businesses wanting guided implementation support",
                    "Leaders who need help getting their team onboard with AI",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <h3 className="font-bold text-green-900 dark:text-green-100 mb-2">
                  Consulting Package Includes:
                </h3>
                <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
                  <li>• Custom setup & configuration ($2,500 value)</li>
                  <li>• Team training & onboarding</li>
                  <li>• 90 days implementation support</li>
                  <li>• Weekly check-ins & optimization</li>
                  <li>• Perpetual Core Pro plan included</li>
                </ul>
                <p className="mt-4 font-bold text-green-900 dark:text-green-100">
                  Investment: $2,500 setup + $299/month
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Typical ROI: 4-6 weeks through time savings
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Calendar Embed - Add your Calendly link */}
          <div>
            <Card className="sticky top-8">
              <CardContent className="p-8 text-center">
                <Calendar className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                  Schedule Your Call
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Choose a time that works best for you
                </p>
                <a
                  href="https://calendly.com/your-calendly-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg transition-all"
                >
                  Open Calendar
                  <Calendar className="ml-2 h-5 w-5" />
                </a>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-4">
                  Or email us at: info@perpetualcore.com
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
