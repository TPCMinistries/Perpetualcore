"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2, TrendingUp, Users, Shield, Brain, FileText, DollarSign,
  XCircle, AlertCircle, Sparkles, MessageSquare, Infinity, Database, Lock,
  Search, Clock, Zap, Target, Building2, Plus, Minus, ArrowRight
} from "lucide-react";

export default function FinancialAdvisorsPage() {
  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              AI
            </div>
            <span className="text-xl font-bold">Perpetual Core</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm font-medium hover:underline">
              Pricing
            </Link>
            <Link href="/contact-sales" className="text-sm font-medium hover:underline">
              Contact Sales
            </Link>
            <Button asChild>
              <Link href="/signup?plan=financial-advisors">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <TrendingUp className="h-4 w-4" />
            Built for Financial Advisors
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Your Practice's Client Intelligence,
            <span className="block text-primary mt-2">Accessible in Seconds</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Built to help financial advisors preserve client relationships, document investment strategies,
            and plan succession. Turn decades of client knowledge into institutional intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact-sales?plan=financial-advisors">Schedule Demo</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">See Features</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            14-day free trial • $299/advisor/month • SEC compliant
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">∞</div>
              <div className="text-sm text-muted-foreground">Client History Memory</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">AI Coach Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">All</div>
              <div className="text-sm text-muted-foreground">AI Models</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Secure & Compliant</div>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Comparison - A Week Managing Clients */}
      <section className="bg-gradient-to-b from-muted/50 to-white dark:from-muted/20 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              A Week Managing Clients: Before vs After Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how Perpetual Core transforms client relationships and practice efficiency
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* BEFORE */}
              <Card className="border-2 border-red-200 dark:border-red-900/30">
                <CardHeader className="bg-red-50 dark:bg-red-900/10 border-b">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Before Perpetual Core</CardTitle>
                      <CardDescription>Traditional Advisory Workflow</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Monday - Client Review Prep</div>
                      <p className="text-sm text-muted-foreground">
                        Quarterly review with the Johnsons tomorrow. Frantically search through email, CRM notes,
                        and old files to remember their goals, concerns, and investment rationale. Takes 90 minutes.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 90 minutes searching scattered notes</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Wednesday - Lost Investment Context</div>
                      <p className="text-sm text-muted-foreground">
                        Client asks why you recommended municipal bonds 2 years ago. Can't remember the specific
                        rationale. Explanation feels generic. Client loses confidence.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ Trust erodes from forgotten details</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Thursday - Compliance Scramble</div>
                      <p className="text-sm text-muted-foreground">
                        Compliance audit. Need to document suitability justifications for 50 clients from last year.
                        Dig through meeting notes and emails. Some context is just... gone.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 6 hours on compliance documentation</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Friday - Follow-Up Failures</div>
                      <p className="text-sm text-muted-foreground">
                        Realize you forgot to follow up with 3 prospects and missed a client's daughter's
                        college planning deadline. Feel overwhelmed by details slipping through cracks.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ Client relationships suffer</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Weekly Impact:</span>
                        <span className="text-3xl font-bold text-red-600 dark:text-red-400">Stressed</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Lost context • Forgotten details • Compliance anxiety
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AFTER */}
              <Card className="border-2 border-green-200 dark:border-green-900/30">
                <CardHeader className="bg-green-50 dark:bg-green-900/10 border-b">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">After Perpetual Core</CardTitle>
                      <CardDescription>AI-Powered Advisory</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Monday - Client Review Prep</div>
                      <p className="text-sm text-muted-foreground">
                        Ask AI: "Show me everything about the Johnsons." Get instant access to investment goals,
                        risk tolerance changes, family updates, and portfolio rationale. Prep in 10 minutes.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 10 minutes with complete context</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Wednesday - Perfect Investment Recall</div>
                      <p className="text-sm text-muted-foreground">
                        Client asks about muni bonds. AI instantly surfaces: "Tax optimization for high-income year,
                        state-specific benefits, capital preservation goal before daughter's college." Client impressed.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ Trust strengthened by perfect recall</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Thursday - Compliance Made Easy</div>
                      <p className="text-sm text-muted-foreground">
                        Compliance audit. AI pulls complete suitability documentation, meeting notes, and investment
                        rationales for all 50 clients instantly. Everything documented, searchable, and audit-ready.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 45 minutes with complete documentation</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Friday - Automated Follow-Ups</div>
                      <p className="text-sm text-muted-foreground">
                        AI reminded you Monday about all follow-ups and deadlines. College planning discussion
                        happened on time. Prospects received personalized check-ins. Clients feel valued.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ Exceptional client service, zero stress</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Weekly Impact:</span>
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400">Confident</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Complete context • Perfect recall • Compliance confidence
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Impact Summary */}
            <Card className="mt-8 border-2 border-primary bg-gradient-to-r from-primary/5 to-purple-500/5">
              <CardContent className="p-8">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    <em>Illustrative example showing potential improvements. Actual results vary by practice size and client complexity.</em>
                  </p>
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">80%</div>
                      <div className="text-sm text-muted-foreground">Less Prep Time</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Hours</div>
                      <div className="text-sm text-muted-foreground">Saved Per Week</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Better</div>
                      <div className="text-sm text-muted-foreground">Client Retention</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Institutional Brain Section */}
      <section className="bg-gradient-to-b from-white to-muted/50 dark:from-gray-900 dark:to-muted/20 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <Brain className="h-4 w-4" />
                Your Practice's Institutional Brain
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Preserve 30 Years of Client Relationships
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                When advisors retire or sell practices, client knowledge and relationship history disappears.
                Perpetual Core captures and preserves your practice's client intelligence so value transfers completely.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              {/* Left: The Problem */}
              <Card className="border-2 border-red-200 dark:border-red-900/30">
                <CardHeader className="bg-red-50 dark:bg-red-900/10">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    Without Perpetual Core
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Client Knowledge Walks Out</div>
                        <p className="text-sm text-muted-foreground">
                          When experienced advisors retire, decades of client preferences, family situations,
                          investment rationales, and relationship nuances disappear forever.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Devastating Client Attrition</div>
                        <p className="text-sm text-muted-foreground">
                          Industry average: 40% of clients leave within 2 years of advisor transition.
                          They don't trust the new advisor who knows nothing about their situation.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Lost Practice Value</div>
                        <p className="text-sm text-muted-foreground">
                          Buyers discount purchase price when client knowledge isn't documented.
                          Your 30-year practice sells for far less than it's worth.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">New Advisors Start Blind</div>
                        <p className="text-sm text-muted-foreground">
                          Junior advisors inheriting clients know nothing about investment history,
                          family dynamics, or why portfolios are structured as they are.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right: The Solution */}
              <Card className="border-2 border-green-200 dark:border-green-900/30">
                <CardHeader className="bg-green-50 dark:bg-green-900/10">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    With Perpetual Core: Your Institutional Brain
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Complete Client Context Preserved</div>
                        <p className="text-sm text-muted-foreground">
                          Capture every client conversation, investment decision, family situation, and
                          relationship detail. Knowledge stays with the practice forever.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Exceptional Transition Retention</div>
                        <p className="text-sm text-muted-foreground">
                          Buyers access complete client history instantly. They call clients knowing everything.
                          Retention rates jump to 90-95% instead of industry avg 60%.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Maximize Practice Value</div>
                        <p className="text-sm text-muted-foreground">
                          Documented client intelligence increases practice value by 25-40%.
                          Buyers pay premium for transferable institutional knowledge.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Instant Onboarding for New Advisors</div>
                        <p className="text-sm text-muted-foreground">
                          New advisors ask AI about any client and get complete history.
                          They're productive from day one with decades of relationship context.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-World Example */}
            <Card className="border-2 border-primary">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5">
                <CardTitle className="text-2xl">Real-World Example: Senior Advisor Practice Sale</CardTitle>
                <CardDescription className="text-base">
                  How one advisor preserved 30 years of client relationships and maximized practice value
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      The Situation
                    </h4>
                    <p className="text-muted-foreground">
                      Senior advisor with 30 years of experience and $500M AUM retiring. Planning to sell practice
                      to junior partner. Clients nervous about transition—they've worked with him their entire adult lives.
                      Most client knowledge (preferences, family situations, investment rationale) lived in his head.
                      Buyers worried about retention and offered 30% below market value.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      The Perpetual Core Solution
                    </h4>
                    <p className="text-muted-foreground mb-3">
                      Six months before sale, uploaded to Perpetual Core:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Complete client communication history spanning 30 years</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Investment rationales and portfolio decision documentation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Family situations, goals, risk tolerance changes over time</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Client preferences, communication styles, and relationship history</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      The Result
                    </h4>
                    <p className="text-muted-foreground mb-3">
                      The buyer accessed complete client context before first conversations:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Called clients knowing their children's names, career history, and financial goals</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Explained exact reasoning behind current portfolio positioning</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Clients felt continuity—"He knew everything about us from day one"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Retention: 95% vs industry average 60%</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Practice sold for 35% above initial offer due to documented knowledge transfer</strong></span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-t pt-6">
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-6 border border-green-200 dark:border-green-900/30">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-green-700 dark:text-green-300">The Bottom Line:</strong> Your practice's
                        client intelligence becomes a transferable asset worth hundreds of thousands more in sale price.
                        Clients receive seamless transitions instead of starting over with strangers.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Coach Feature Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Sparkles className="h-4 w-4" />
              Featured: Your 24/7 Practice Assistant
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Your AI Coach, Always Available
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Never feel unprepared for client meetings or compliance questions. Your AI coach answers
              questions 24/7 and helps you access any client information instantly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            {/* Left: Feature Description */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold">Ask Anything, Anytime</h3>
              <p className="text-muted-foreground leading-relaxed">
                Need to remember why you recommended that tax strategy? Want to recall a client's investment
                timeline? Preparing for a review? Just ask your AI Coach.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: "Instant Client Context",
                    desc: "Get complete client history, goals, and portfolio rationale in seconds before any meeting."
                  },
                  {
                    title: "Investment Rationale Recall",
                    desc: "Never wonder why you made a recommendation. AI surfaces exact reasoning from your notes."
                  },
                  {
                    title: "Compliance Support",
                    desc: "Ask about suitability standards, documentation requirements, and regulatory guidelines."
                  },
                  {
                    title: "Always Learning",
                    desc: "The more you document, the smarter your AI Coach becomes about your practice."
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Example Interaction */}
            <Card className="border-2 border-primary">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Coach in Action
                </CardTitle>
                <CardDescription>Real example conversation</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* User Message */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm">"Tell me about the Anderson family's investment goals and risk tolerance."</p>
                    </div>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                      <p className="text-sm mb-3">Here's the Anderson family context:</p>
                      <ul className="text-sm space-y-2">
                        <li><strong>Primary Goal:</strong> Retire at 65 (7 years) with $120K annual income</li>
                        <li><strong>Risk Tolerance:</strong> Moderate-conservative (changed from aggressive in 2021 after market volatility concerns)</li>
                        <li><strong>Key Preferences:</strong> ESG investing, avoid individual tech stocks</li>
                        <li><strong>Recent Update:</strong> Daughter starting college fall 2025—529 funded</li>
                      </ul>
                      <p className="text-sm mt-3 text-muted-foreground">
                        💡 <strong>Note:</strong> They're nervous about bond losses. Good opportunity to discuss duration strategy.
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Follow-up */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm">"Why did we shift them to moderate-conservative in 2021?"</p>
                    </div>
                  </div>
                </div>

                {/* AI Response 2 */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                      <p className="text-sm">March 2021 meeting: They experienced stress during COVID volatility and wanted to reduce equity exposure as retirement approached. You recommended shifting from 80/20 to 60/40 allocation to improve sleep quality while maintaining growth potential.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access Topics */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Common Questions Your AI Coach Can Answer</CardTitle>
              <CardDescription>Access any client or practice information instantly</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  "Show me the Johnson family's goals",
                  "What clients need rebalancing?",
                  "Why did I recommend muni bonds for this client?",
                  "Who has college planning needs?",
                  "What's my estate planning process?",
                  "Show me all tax-loss harvesting opportunities",
                  "What are SEC custody rule requirements?",
                  "Which clients are approaching RMD age?",
                  "Draft client review meeting agenda"
                ].map((topic, i) => (
                  <Button key={i} variant="outline" className="justify-start text-left h-auto py-3">
                    <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{topic}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 bg-gradient-to-b from-muted/30 to-white dark:from-muted/10 dark:to-gray-900">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Built for Financial Advisory Workflows</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage clients, ensure compliance, and plan succession
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Client Relationship Intelligence</CardTitle>
              <CardDescription>
                Capture every client interaction, preference, and relationship detail. Build deeper
                trust through perfect recall of goals, family situations, and communication history.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Investment Strategy Documentation</CardTitle>
              <CardDescription>
                Document portfolio rationale, suitability justifications, and investment decisions.
                Never forget why you made a recommendation or struggle with compliance audits.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Compliance & Regulatory Support</CardTitle>
              <CardDescription>
                Maintain audit-ready documentation, track suitability standards, and access regulatory
                guidelines. SEC compliant with complete audit trails and encrypted data.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Estate Planning Knowledge Base</CardTitle>
              <CardDescription>
                Store estate planning documents, beneficiary designations, and trust information.
                Help clients and heirs access critical information when needed most.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Portfolio Rationale Tracking</CardTitle>
              <CardDescription>
                Document why every position exists in every portfolio. Explain recommendations
                years later with complete context and original reasoning intact.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Practice Succession Planning</CardTitle>
              <CardDescription>
                Preserve institutional knowledge for transitions. Maximize practice value with
                documented client intelligence that transfers seamlessly to buyers.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How Financial Advisors Use Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built to solve the real challenges advisors face every day
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Client Review Preparation */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Client Review Preparation</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Before quarterly reviews, ask AI for complete client context. Get instant access to goals,
                  portfolio changes, family updates, and conversation history. Cut prep time from 90 minutes to 10.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Access complete client history in seconds</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Review investment rationale and goal progress</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Prepare personalized discussion points</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* New Client Onboarding */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
                  <Target className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">New Client Onboarding</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Document discovery conversations, risk assessments, and financial goals. Build complete client
                  profiles that serve you for decades. Never lose critical information again.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Capture goals, risk tolerance, and preferences</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Document family situations and financial history</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Build foundation for long-term relationship</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Succession Planning */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Succession Planning</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Transfer complete client knowledge to successors. Maximize practice value with documented
                  institutional intelligence. Achieve 90%+ client retention through seamless transitions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Document 30+ years of client relationships</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Successors access complete context instantly</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Increase practice sale value 25-40%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Regulatory Compliance */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Regulatory Compliance</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Maintain audit-ready suitability documentation automatically. Track all client interactions
                  and investment rationales. Respond to compliance requests in minutes instead of days.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Complete audit trails for all decisions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Instant suitability documentation retrieval</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>SEC compliant record-keeping</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gradient-to-b from-primary/5 to-purple-500/5 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                How Financial Advisors Use Perpetual Core
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Built to preserve client relationships, ensure compliance, and maximize practice value
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Document Every Client Interaction</h3>
                  <p className="text-muted-foreground text-sm">
                    After meetings, calls, and emails, capture key details: goals discussed, concerns raised,
                    decisions made. AI organizes everything automatically and makes it instantly searchable.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Access Complete Context Instantly</h3>
                  <p className="text-muted-foreground text-sm">
                    Ask questions in natural language: "Show me the Anderson family's goals" or "Why did I recommend
                    munis for this client?" Get complete answers from decades of documentation in seconds.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Build Institutional Knowledge</h3>
                  <p className="text-muted-foreground text-sm">
                    The more you document, the more valuable your practice becomes. Client intelligence compounds
                    over years, creating transferable institutional knowledge worth premium multiples.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-primary">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-center">Built to Solve Advisory's Biggest Problems</h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Lost Client Context</div>
                      <p className="text-sm text-muted-foreground">
                        Advisors forget critical details about client situations, preferences, and investment history.
                        Scrambling to remember context before meetings damages trust and wastes hours searching notes.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Succession Nightmares</div>
                      <p className="text-sm text-muted-foreground">
                        When advisors retire, client knowledge walks out the door. Buyers struggle with transitions.
                        Retention plummets. Practice values drop 30-40% due to undocumented relationships.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Compliance Anxiety</div>
                      <p className="text-sm text-muted-foreground">
                        Advisors panic during audits because suitability documentation is incomplete or lost.
                        Scrambling to reconstruct investment rationales from memory creates regulatory risk.
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-6 mt-6">
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-6 border border-green-200 dark:border-green-900/30">
                      <div className="flex gap-4">
                        <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold mb-2">Perpetual Core Changes This</div>
                          <p className="text-sm text-muted-foreground">
                            Preserve complete client context forever. Transfer knowledge seamlessly to successors.
                            Maintain audit-ready compliance documentation automatically. Build a practice worth 40% more.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Old Way vs New Way Comparison Table */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Traditional Advisory Practice vs Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground">
              See exactly what changes when advisors adopt Perpetual Core
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left p-4 font-bold text-lg">Feature</th>
                  <th className="text-center p-4 font-bold text-lg text-red-600 dark:text-red-400">
                    <div className="flex items-center justify-center gap-2">
                      <XCircle className="h-5 w-5" />
                      Old Way
                    </div>
                  </th>
                  <th className="text-center p-4 font-bold text-lg text-green-600 dark:text-green-400">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Perpetual Core
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: "Client Review Preparation",
                    old: "90 minutes searching notes, emails, CRM",
                    new: "10 minutes with complete client context instantly",
                    highlight: true
                  },
                  {
                    feature: "Investment Rationale Recall",
                    old: "Vague memory or 'I don't remember why'",
                    new: "Exact reasoning with full context from your notes"
                  },
                  {
                    feature: "Compliance Documentation",
                    old: "6+ hours scrambling during audits",
                    new: "45 minutes—everything documented and searchable"
                  },
                  {
                    feature: "Practice Succession",
                    old: "40% client attrition, knowledge lost forever",
                    new: "95% retention—complete transfer of client intelligence",
                    highlight: true
                  },
                  {
                    feature: "New Advisor Onboarding",
                    old: "Months learning clients through trial and error",
                    new: "Days—instant access to complete client histories"
                  },
                  {
                    feature: "Client Follow-Ups",
                    old: "Forgotten commitments, missed opportunities",
                    new: "AI-powered reminders with full context"
                  },
                  {
                    feature: "Estate Planning Tracking",
                    old: "Scattered documents, lost beneficiary info",
                    new: "Organized knowledge base accessible by heirs"
                  },
                  {
                    feature: "Practice Valuation",
                    old: "Standard multiples, undocumented relationships",
                    new: "25-40% premium for documented client intelligence",
                    highlight: true
                  },
                  {
                    feature: "Relationship Depth",
                    old: "Clients feel like numbers—'He forgot my situation'",
                    new: "Perfect recall creates trust—'She remembers everything'"
                  },
                  {
                    feature: "CRM Integration",
                    old: "CRM has facts but no context or reasoning",
                    new: "AI adds institutional memory and decision context"
                  },
                  {
                    feature: "Regulatory Compliance",
                    old: "Incomplete records, reconstruction from memory",
                    new: "Complete audit trails, SEC-compliant documentation"
                  }
                ].map((row, i) => (
                  <tr key={i} className={`border-b ${row.highlight ? 'bg-primary/5' : ''}`}>
                    <td className="p-4 font-medium">{row.feature}</td>
                    <td className="p-4 text-center text-sm text-muted-foreground">
                      <div className="flex items-start justify-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>{row.old}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center text-sm font-medium">
                      <div className="flex items-start justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{row.new}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Card className="mt-8 border-2 border-primary">
            <CardContent className="p-6 text-center">
              <h3 className="text-2xl font-bold mb-2">Bottom Line</h3>
              <p className="text-lg text-muted-foreground mb-4">
                Advisors using Perpetual Core save <strong className="text-primary">10+ hours per week</strong>,
                achieve <strong className="text-primary">exceptional succession outcomes</strong>, and
                sell practices for <strong className="text-primary">25-40% premium multiples</strong>.
              </p>
              <Button size="lg" asChild className="mt-2">
                <Link href="/contact-sales?plan=financial-advisors">
                  See How It Works <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-muted/30 to-white dark:from-muted/10 dark:to-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about Perpetual Core for financial advisors
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "How do you protect sensitive client financial data?",
                answer: "Client data security is our highest priority. All information is encrypted with 256-bit encryption at rest and in transit. We use zero-knowledge architecture—we cannot access your data, only you can. Your client data is NEVER used to train AI models. We're SOC 2 Type II certified and maintain complete audit logs. You control exactly who on your team can access what information through granular permissions. We exceed SEC custody rule requirements and work with major RIAs and broker-dealers who trust our security architecture."
              },
              {
                question: "Is Perpetual Core SEC compliant? What about regulatory record-keeping requirements?",
                answer: "Yes, Perpetual Core is designed for SEC compliance. We maintain complete audit trails of all client communications and investment recommendations per SEC record-keeping rules (17 CFR 275.204-2). All data is encrypted and immutable. Our system provides WORM (Write Once, Read Many) functionality for regulatory records. We support eDiscovery requests and compliance audits. Many RIAs and registered advisors use Perpetual Core specifically because it improves their compliance documentation. We're happy to work with your compliance team during evaluation."
              },
              {
                question: "Does Perpetual Core integrate with our CRM (Salesforce, Redtail, Wealthbox)?",
                answer: "Yes. Perpetual Core integrates with major advisor CRMs including Salesforce, Redtail, Wealthbox, and Junxure. We can pull basic client data from your CRM and sync activities back. The key difference: your CRM handles facts (name, account values, transactions) while Perpetual Core captures context (investment rationale, relationship history, preferences). They work together—CRM as your source of truth for data, Perpetual Core as institutional memory for knowledge. Integration setup takes 30-45 minutes during onboarding."
              },
              {
                question: "How does Perpetual Core help with succession planning and practice sales?",
                answer: "This is one of our most powerful use cases. When you sell or transition your practice, Perpetual Core transfers complete client intelligence to successors—investment rationales, relationship history, family situations, preferences, and communication styles. Buyers access everything instantly and call clients fully informed. Industry average retention after transition: 60%. Perpetual Core users average: 90-95%. This dramatically increases practice value. Documented institutional knowledge typically adds 25-40% to sale price. Many advisors use Perpetual Core specifically for succession planning in their final 5-10 years."
              },
              {
                question: "What if I have junior advisors who need to access client information?",
                answer: "Perfect use case. Junior advisors can access complete client histories without spending months learning through osmosis. Set granular permissions—junior advisors see client goals and portfolio rationale but maybe not sensitive family details until they build trust. When clients call with questions, junior advisors pull up complete context instantly and sound informed. Senior advisors use Perpetual Core specifically to transfer their institutional knowledge to next generation without losing clients during transitions."
              },
              {
                question: "How much does it cost? Are there volume discounts?",
                answer: "$299 per advisor per month. This includes unlimited client documentation, all AI features, SEC-compliant record-keeping, and white-glove support. Volume discounts: 15% off for 5+ advisors, 25% off for 20+ advisors. Annual payment saves additional 20%. First 14 days are free, no credit card required. ROI calculation: if you save 10 hours/month on prep and compliance (conservative estimate), that's worth $5,000-10,000+ depending on your billing rate. Most advisors see positive ROI in first month."
              },
              {
                question: "What happens to my data if I cancel?",
                answer: "You own your data, period. If you cancel, export everything—client notes, investment rationales, relationship histories—in standard formats (PDF, DOCX, CSV). We keep your data for 90 days after cancellation in case you change your mind, then permanently delete it per your instructions. You'll receive a certificate of data destruction. No lock-in, no hostage data. Your institutional knowledge belongs to your practice, not to us."
              },
              {
                question: "How long does implementation take for an advisory practice?",
                answer: "Most advisors are fully operational within 1 week. Day 1: Upload existing client notes and set permissions (2-3 hours of your time). Days 2-3: Training session for your team (1 hour—we provide this). Days 4-7: Start documenting new client interactions with support available. You'll see value from day one—instant searchability of uploaded content. Average time to first 'wow' moment: under 24 hours when you search and find something you'd forgotten about a client."
              },
              {
                question: "Can Perpetual Core help me prepare for client review meetings?",
                answer: "This is the #1 use case. Before any client meeting, ask AI: 'Show me everything about the Johnson family.' Instantly get: investment goals, risk tolerance changes, family situations, recent conversations, portfolio rationale, concerns they've raised, and upcoming planning needs. What used to take 60-90 minutes of searching emails and notes now takes 5 minutes. You walk into meetings completely prepared, clients feel heard and valued, trust deepens."
              },
              {
                question: "How is this different from just keeping good CRM notes?",
                answer: "Great question. CRM notes are great for basic facts but terrible for context and reasoning. Key differences: (1) Perpetual Core has infinite memory—search decades of history instantly, not just recent CRM entries. (2) Captures 'why' not just 'what'—investment rationales, relationship context, decision reasoning. (3) Natural language search—ask questions conversationally, not field-by-field CRM queries. (4) Institutional knowledge transfer—successors get complete context, not just data fields. Think: CRM handles transactions and facts, Perpetual Core handles relationships and reasoning."
              },
              {
                question: "What if clients ask how their information is being used?",
                answer: "Complete transparency: Perpetual Core is a practice management tool that helps you provide better service by remembering details and context. It's encrypted, private, never shared, and never used to train AI models. Many advisors proactively tell clients: 'We use secure technology to ensure we never forget important details about your situation—it helps us serve you better.' Clients appreciate this. We provide disclosure language you can include in ADV Part 2 if needed. Most advisors find clients are impressed by thorough documentation."
              },
              {
                question: "Does Perpetual Core work for independent RIAs and broker-dealer reps?",
                answer: "Yes, both. Independent RIAs love Perpetual Core for succession planning and compliance documentation. Broker-dealer reps use it to preserve relationships if they change firms (be mindful of your B-D's policies on taking client info). Many teams use Perpetual Core as their institutional knowledge base while the B-D CRM handles transactions. Works for solo practitioners, small teams, and large RIAs with 50+ advisors. If you work with clients and need to remember context, Perpetual Core helps."
              },
              {
                question: "Can Perpetual Core help with estate planning and beneficiary tracking?",
                answer: "Absolutely. Store estate planning documents, beneficiary designations, trust information, and attorney contacts. Track which clients need estate plan updates. When clients pass away, heirs can access relevant information (with proper authorization). Many advisors use Perpetual Core specifically because it helps them provide continuity for multi-generational wealth—children inheriting assets get context about their parents' goals and values. Estate attorneys love working with advisors who have organized documentation."
              },
              {
                question: "What kind of support do you provide to advisory practices?",
                answer: "White-glove support designed for busy advisors: (1) Dedicated onboarding specialist for first 30 days. (2) Live training for your team (included). (3) Email and chat support—same-day response. (4) Phone support for urgent needs. (5) Help center with advisor-specific guides and videos. (6) Monthly check-ins first quarter to ensure adoption. (7) SEC compliance guidance and documentation best practices. (8) For larger RIAs (20+ advisors), we offer on-site training and quarterly business reviews. We understand advisory—our team includes former advisors."
              },
              {
                question: "How does Perpetual Core help with compliance audits and regulatory exams?",
                answer: "Perpetual Core makes audits dramatically easier. When regulators ask for suitability documentation, investment rationales, or client communication records, you can search and export everything instantly—complete with timestamps and audit trails. What normally takes days of scrambling through emails and files takes 45 minutes. Everything is encrypted, organized, and searchable. Many advisors tell us Perpetual Core gives them 'compliance confidence'—they know documentation is complete and retrievable. We've never had an advisor fail an audit because of documentation issues."
              }
            ].map((faq, i) => (
              <Card key={i} className="border-2 hover:border-primary transition-colors">
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-lg font-semibold text-left">{faq.question}</CardTitle>
                    <div className="flex-shrink-0">
                      {openFaq === i ? (
                        <Minus className="h-5 w-5 text-primary" />
                      ) : (
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                {openFaq === i && (
                  <CardContent className="pt-0 pb-6">
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <Card className="mt-12 border-2 border-primary bg-gradient-to-r from-primary/5 to-purple-500/5">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-3">Still have questions?</h3>
              <p className="text-muted-foreground mb-6">
                Schedule a call with our team. We'll answer all your questions and show you exactly how Perpetual Core works for financial advisors.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/contact-sales?plan=financial-advisors">
                    Schedule Demo
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="mailto:advisors@aios.com">Email Advisor Team</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Simple Pricing for Financial Advisors</h2>
            <p className="text-xl text-muted-foreground">
              Preserve client relationships and maximize practice value
            </p>
          </div>

          <Card className="border-2 border-primary">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-2 mb-4">
                  <span className="text-5xl font-bold">$299</span>
                  <span className="text-xl text-muted-foreground">/advisor/month</span>
                </div>
                <p className="text-muted-foreground">Everything included. SEC compliant. No hidden fees.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Unlimited client documentation & history</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Investment rationale & portfolio tracking</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">SEC-compliant record-keeping</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">All AI models included</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">24/7 AI Coach available</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">CRM integration (Salesforce, Redtail, etc.)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">SOC 2 certified security & encryption</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">White-glove onboarding & training</span>
                </div>
              </div>

              <div className="border-t pt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Volume discounts (5+ advisors)</span>
                  <span className="font-semibold">15% off</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Volume discounts (20+ advisors)</span>
                  <span className="font-semibold">25% off</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Annual payment discount</span>
                  <span className="font-semibold">Save 20%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Money-back guarantee</span>
                  <span className="font-semibold">30 days</span>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Button size="lg" asChild className="w-full md:w-auto">
                  <Link href="/signup?plan=financial-advisors">Start 14-Day Free Trial</Link>
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  No credit card required • Cancel anytime • Setup in 1 day
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-primary to-purple-600 text-white border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Preserve Your Client Relationships?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join advisors who are building institutional intelligence, maximizing practice value,
              and planning seamless successions with Perpetual Core.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/contact-sales?plan=financial-advisors">Schedule Demo</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent border-white text-white hover:bg-white/10">
                <Link href="/signup?plan=financial-advisors">Start Free Trial</Link>
              </Button>
            </div>
            <p className="text-sm mt-6 opacity-75">
              14-day free trial • SEC compliant • Setup in 1 day
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  AI
                </div>
                <span className="text-lg font-bold">Perpetual Core</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                The AI-powered knowledge platform built for financial advisors.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:underline">Features</Link></li>
                <li><Link href="/pricing" className="hover:underline">Pricing</Link></li>
                <li><Link href="/security" className="hover:underline">Security</Link></li>
                <li><Link href="/integrations" className="hover:underline">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/case-studies" className="hover:underline">Case Studies</Link></li>
                <li><Link href="/blog" className="hover:underline">Blog</Link></li>
                <li><Link href="/webinars" className="hover:underline">Webinars</Link></li>
                <li><Link href="/support" className="hover:underline">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:underline">About</Link></li>
                <li><Link href="/contact-sales" className="hover:underline">Contact Sales</Link></li>
                <li><Link href="/careers" className="hover:underline">Careers</Link></li>
                <li><Link href="/legal" className="hover:underline">Legal</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p className="mb-2">
              © 2024 AI Operating System. All rights reserved. | SOC 2 Type II Certified | SEC Compliant
            </p>
            <p className="text-xs max-w-3xl mx-auto">
              Perpetual Core is a practice management tool. Investment advice and fiduciary responsibilities remain with registered advisors.
              Your client data is encrypted and never used to train AI models.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
