"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Zap, Lock, Users, ArrowRight } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-slate-900 dark:text-slate-100">
            Start Your <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Free Trial</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Get full access to Perpetual Core for 14 days. No credit card required.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Free Trial Card */}
          <Card className="border-2 border-purple-200 dark:border-purple-800">
            <CardContent className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Free Trial
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Perfect for trying out the platform
                </p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-slate-900 dark:text-slate-100">$0</span>
                  <span className="text-slate-600 dark:text-slate-400">/14 days</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                  Then $99/month or $79/month billed annually
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  "Access to all AI models (GPT-4, Claude, Gemini)",
                  "500 AI requests per month",
                  "Document upload & RAG search (10 docs)",
                  "Custom prompts & workflows",
                  "Email support",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => window.location.href = "/auth/signup?plan=trial"}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-xs text-center text-slate-500 dark:text-slate-500 mt-4">
                No credit card required • Cancel anytime
              </p>
            </CardContent>
          </Card>

          {/* Pro Plan Card */}
          <Card className="border-2 border-blue-500 dark:border-blue-600 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 rounded-full text-sm font-bold">
              MOST POPULAR
            </div>
            <CardContent className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Pro Plan
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  For serious AI power users
                </p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-slate-900 dark:text-slate-100">$199</span>
                  <span className="text-slate-600 dark:text-slate-400">/month</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-semibold">
                  Save $480/year with annual billing ($159/mo)
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited AI requests",
                  "Unlimited document uploads & RAG",
                  "Advanced workflows & automations",
                  "Team collaboration (up to 5 users)",
                  "Priority support",
                  "API access",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => window.location.href = "/auth/signup?plan=pro"}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Get Started with Pro
                <Zap className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-xs text-center text-slate-500 dark:text-slate-500 mt-4">
                14-day free trial • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enterprise CTA */}
        <Card className="max-w-4xl mx-auto mt-12 bg-slate-900 dark:bg-slate-950 border-slate-800">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">
              Need Enterprise?
            </h2>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              Custom deployment, SSO, dedicated support, unlimited users, and white-glove implementation.
            </p>
            <Button
              onClick={() => window.location.href = "/enterprise-demo"}
              size="lg"
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
            >
              Contact Sales
            </Button>
          </CardContent>
        </Card>

        {/* Trust Badges */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <Lock className="h-8 w-8 text-slate-600 dark:text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">SOC 2 Compliant</p>
            </div>
            <div>
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">99.9% Uptime</p>
            </div>
            <div>
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">1000+ Companies</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
