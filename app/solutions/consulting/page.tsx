"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2, Briefcase, FileText, Target, Brain, TrendingUp, Users, Shield,
  XCircle, AlertCircle, Sparkles, MessageSquare, Infinity, Zap, Database, Lock,
  Search, Lightbulb, PresentationIcon, BarChart3, BookOpen, LineChart, Plus, Minus
} from "lucide-react";

export default function ConsultingPage() {
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
              <Link href="/signup?plan=consulting">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Briefcase className="h-4 w-4" />
            Built for Consulting Firms
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Your Firm's Consulting Expertise,
            <span className="block text-primary mt-2">Accessible in Seconds</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Built to help consulting firms preserve frameworks, methodologies, and client engagement strategies.
            Turn decades of institutional knowledge into competitive advantage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact-sales?plan=consulting">Schedule Demo</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">See Features</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            14-day free trial • $399/consultant/month • Client confidentiality guaranteed
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">∞</div>
              <div className="text-sm text-muted-foreground">Engagement Memory</div>
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
              <div className="text-sm text-muted-foreground">Client Confidential</div>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Comparison - Client Engagement Week */}
      <section className="bg-gradient-to-b from-muted/50 to-white dark:from-muted/20 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              A Week in Client Engagement: Before vs After Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how Perpetual Core transforms consulting workflows and client delivery
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
                      <CardDescription>Traditional Consulting Workflow</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Monday - Project Kickoff</div>
                      <p className="text-sm text-muted-foreground">
                        New client engagement begins. Spend 6 hours searching old engagement files, trying to remember
                        similar projects, hunting for that perfect framework. Can't find half of it.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 6 hours researching past work</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Wednesday - Client Workshop</div>
                      <p className="text-sm text-muted-foreground">
                        Client asks about approach used in similar industry. You vaguely remember a project
                        from 2 years ago but can't recall details. Wing it. Client unconvinced.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ Lost client confidence</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Thursday - Deliverable Creation</div>
                      <p className="text-sm text-muted-foreground">
                        Recreate analysis framework from scratch. Know partner has better version but
                        she's on vacation. Spend hours reinventing the wheel.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 8 hours recreating existing work</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Friday - Proposal Due</div>
                      <p className="text-sm text-muted-foreground">
                        Rush to finish proposal. Forget key client insights from discovery calls. Miss
                        opportunity to reference firm's proven track record in space.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ Weak proposal, lower win rate</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Weekly Total:</span>
                        <span className="text-3xl font-bold text-red-600 dark:text-red-400">60+ hours</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Wasted time • Lost knowledge • Reinventing frameworks
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
                      <CardDescription>AI-Powered Consulting</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Monday - Project Kickoff</div>
                      <p className="text-sm text-muted-foreground">
                        Ask AI: "Show me all digital transformation frameworks for financial services."
                        Get instant access to 15 past engagements, proven methodologies, and best practices.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 30 minutes to full context</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Wednesday - Client Workshop</div>
                      <p className="text-sm text-muted-foreground">
                        Client asks about similar project. AI instantly surfaces relevant case study,
                        outcomes, and lessons learned. Client impressed with depth of firm expertise.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ Client confidence increased</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Thursday - Deliverable Creation</div>
                      <p className="text-sm text-muted-foreground">
                        Access partner's proven framework instantly. Build on best practices from
                        10 previous engagements. Create superior deliverable in half the time.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 3 hours using proven frameworks</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Friday - Winning Proposal</div>
                      <p className="text-sm text-muted-foreground">
                        AI drafts proposal using firm's winning templates, incorporates all client insights,
                        and references relevant experience. Proposal wins. Client delighted.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ Higher win rate, stronger positioning</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Weekly Total:</span>
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400">45 hours</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Efficient delivery • Knowledge shared • Client value maximized
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
                    <em>Illustrative example showing potential improvements. Actual results vary by firm size and engagement type.</em>
                  </p>
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">70%</div>
                      <div className="text-sm text-muted-foreground">Faster Research Time</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">25%</div>
                      <div className="text-sm text-muted-foreground">Higher Win Rate</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Hours</div>
                      <div className="text-sm text-muted-foreground">Saved Per Week</div>
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
                Your Firm's Institutional Brain
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Preserve Decades of Consulting Wisdom
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                When senior partners retire, their frameworks, client strategies, and industry insights walk out the door.
                Perpetual Core captures and preserves your firm's collective expertise so it compounds over time instead of disappearing.
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
                        <div className="font-semibold mb-1">Expertise Walks Out the Door</div>
                        <p className="text-sm text-muted-foreground">
                          When experienced partners retire, their proprietary frameworks, client relationship insights,
                          and hard-won methodologies disappear forever.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Reinventing Frameworks Constantly</div>
                        <p className="text-sm text-muted-foreground">
                          Junior consultants spend weeks recreating analysis tools, research methodologies,
                          and client engagement strategies that partners perfected years ago.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Inconsistent Client Experience</div>
                        <p className="text-sm text-muted-foreground">
                          Every consultant has their own approach. Clients get different quality of insights
                          depending on who's assigned. Best practices stay locked in individual heads.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Slow Junior Development</div>
                        <p className="text-sm text-muted-foreground">
                          New consultants spend years learning through trial and error, missing context
                          from past engagements, and making mistakes partners already solved.
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
                        <div className="font-semibold mb-1">Partner Expertise Preserved Forever</div>
                        <p className="text-sm text-muted-foreground">
                          Capture senior partners' analytical frameworks, client engagement strategies, and industry
                          insights. Their wisdom remains accessible to the entire firm.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Collective Consulting Intelligence</div>
                        <p className="text-sm text-muted-foreground">
                          Every engagement, methodology, and client success becomes part of your firm's
                          growing knowledge base. Everyone benefits from collective experience.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Consistent Excellence Across Clients</div>
                        <p className="text-sm text-muted-foreground">
                          Every consultant can access your firm's best approaches, proven frameworks,
                          and winning methodologies. Clients receive consistently excellent work.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Accelerated Junior Development</div>
                        <p className="text-sm text-muted-foreground">
                          New consultants get immediate access to decades of firm knowledge. They're
                          productive from day one with instant access to proven frameworks.
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
                <CardTitle className="text-2xl">Real-World Example: Senior Partner with 20 Years of M&A Expertise</CardTitle>
                <CardDescription className="text-base">
                  How one firm preserved two decades of mergers & acquisitions consulting wisdom
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
                      A senior partner with 20 years of M&A consulting experience announced retirement. She had designed
                      the firm's signature M&A due diligence framework, built deep relationships across industries, and
                      closed 80+ successful deals. Junior partners relied on her judgment daily. The firm faced losing
                      this irreplaceable institutional knowledge.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      The Perpetual Core Solution
                    </h4>
                    <p className="text-muted-foreground mb-3">
                      Before retirement, the firm uploaded to Perpetual Core:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Her complete M&A due diligence framework with decision trees and risk matrices</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Client engagement playbooks for pre-deal, transaction, and post-merger integration</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Industry-specific analysis methods refined over 20 years across healthcare, tech, and manufacturing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Pitch templates and proposal strategies with proven 65% win rate</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      The Result
                    </h4>
                    <p className="text-muted-foreground mb-3">
                      Now, when any consultant encounters an M&A engagement:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>They ask Perpetual Core: "Show me the framework for tech company due diligence"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>AI instantly provides her complete methodology with risk assessment tools</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Junior partners access her pitch strategies and win rate increased 25%</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Clients feel continuity in service quality even after her retirement</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-t pt-6">
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-6 border border-green-200 dark:border-green-900/30">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-green-700 dark:text-green-300">The Bottom Line:</strong> Your firm's
                        institutional knowledge grows stronger every year instead of disappearing when people retire.
                        Every partner who ever worked at your firm contributes to a growing intelligence that
                        makes everyone better at delivering client value.
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
              Featured: Your 24/7 Consulting Assistant
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Your AI Coach, Always Available
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Never feel stuck on an engagement. Your AI coach answers questions 24/7,
              surfaces relevant frameworks, and helps you deliver exceptional client value.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            {/* Left: Feature Description */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold">Ask Anything, Anytime</h3>
              <p className="text-muted-foreground leading-relaxed">
                Need a framework for digital transformation? Looking for past work in manufacturing?
                Want to see how partners handle tough client situations? Just ask your AI Coach.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: "Instant Answers",
                    desc: "Get immediate access to frameworks, methodologies, and past engagements without searching."
                  },
                  {
                    title: "Consulting Context",
                    desc: "The AI Coach understands consulting workflows and provides relevant, actionable guidance."
                  },
                  {
                    title: "Always Learning",
                    desc: "As your firm adds more engagements and knowledge, your AI Coach gets smarter."
                  },
                  {
                    title: "Client Confidentiality",
                    desc: "All responses maintain strict confidentiality and never expose sensitive client information."
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
                      <p className="text-sm">"I need a framework for digital transformation in retail. What has worked before?"</p>
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
                      <p className="text-sm mb-3">Here are 3 proven digital transformation frameworks from past retail engagements:</p>
                      <ol className="text-sm space-y-2 list-decimal list-inside">
                        <li><strong>Customer Journey Digitization:</strong> Used in 2022 engagement with national retailer</li>
                        <li><strong>Omnichannel Integration:</strong> 80% client satisfaction in 2023 grocery chain project</li>
                        <li><strong>Data-Driven Personalization:</strong> 35% revenue uplift in fashion retail case</li>
                      </ol>
                      <p className="text-sm mt-3 text-muted-foreground">
                        💡 <strong>Tip:</strong> Framework #2 had highest success rate with legacy systems. Want to see the full methodology?
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
                      <p className="text-sm">"Yes, show me the omnichannel framework details."</p>
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
                      <p className="text-sm">Here's the complete framework including assessment phases, implementation roadmap, and change management approach...</p>
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
              <CardDescription>Access your firm's knowledge instantly</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  "Show me frameworks for cost optimization",
                  "What's our approach to change management?",
                  "Find similar healthcare engagements",
                  "How do we handle pricing for strategy work?",
                  "Show me post-merger integration playbooks",
                  "What are best practices for stakeholder management?",
                  "Find all due diligence frameworks",
                  "How do partners structure proposals?",
                  "Show me industry analysis templates"
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
          <h2 className="text-4xl font-bold mb-4">Built for Consulting Excellence</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tools designed to help you deliver exceptional client value
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Client Engagement Intelligence</CardTitle>
              <CardDescription>
                Capture client insights, engagement histories, and relationship context.
                Never lose track of important client details or past work.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Methodology & Framework Library</CardTitle>
              <CardDescription>
                Store analytical frameworks, strategic methodologies, and problem-solving approaches.
                Build on proven tools instead of starting from scratch.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <PresentationIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Proposal & Pitch Templates</CardTitle>
              <CardDescription>
                Access winning proposal structures, pitch decks, and engagement letters.
                Leverage what works to win more business.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Industry Research & Analysis</CardTitle>
              <CardDescription>
                Organize market research, competitive intelligence, and industry trends.
                Instant access to relevant insights during client conversations.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Project Learnings & Best Practices</CardTitle>
              <CardDescription>
                Document what worked, what didn't, and lessons learned from every engagement.
                Turn experience into institutional wisdom.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Consultant Knowledge Sharing</CardTitle>
              <CardDescription>
                Enable seamless collaboration across practice areas and offices.
                Every consultant benefits from the firm's collective intelligence.
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
              How Consulting Firms Use Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built to solve the real challenges consultants face every day
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Client Proposal Development */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Client Proposal Development</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Creating a proposal for digital transformation? Ask AI to find similar past engagements,
                  proven methodologies, and winning proposal structures. Cut proposal time by 60% while
                  improving quality and win rate.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Access winning proposal templates instantly</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Reference relevant case studies and outcomes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Leverage proven pricing and scoping approaches</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Delivery */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Project Delivery</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Mid-engagement and need a specific framework? Search your firm's methodology library
                  for proven approaches. Access partner expertise, past deliverables, and best practices
                  without interrupting anyone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Find frameworks and methodologies in seconds</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Access deliverable templates from past work</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Build on best practices instead of starting fresh</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Industry Analysis */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4">
                  <LineChart className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Industry Analysis</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Client asks about market dynamics in healthcare? AI instantly surfaces all firm research,
                  competitive intelligence, and past analysis in that sector. Appear deeply knowledgeable
                  in every client interaction.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Search all firm research by industry</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Access competitive intelligence databases</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Reference relevant trends and insights</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Knowledge Transfer & Training */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Knowledge Transfer & Training</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  New consultant joining? Give them instant access to firm methodologies, engagement playbooks,
                  and partner expertise. Cut ramp time from 6 months to 2 weeks while maintaining quality standards.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Onboard new consultants in days, not months</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Share partner expertise across entire firm</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Maintain consistent quality standards</span>
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
                How Consulting Firms Use Perpetual Core
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Built to preserve institutional knowledge and accelerate client delivery—
                while maintaining strict client confidentiality.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Upload Firm Knowledge</h3>
                  <p className="text-muted-foreground text-sm">
                    Add frameworks, methodologies, engagement playbooks, and past deliverables.
                    AI indexes everything automatically and makes it instantly searchable during client work.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Search During Engagements</h3>
                  <p className="text-muted-foreground text-sm">
                    During client work, ask questions like "Show me cost optimization frameworks" or
                    "Find similar retail engagements." Get instant, relevant answers from your firm's knowledge.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Wisdom Compounds Over Time</h3>
                  <p className="text-muted-foreground text-sm">
                    As consultants use Perpetual Core, the system learns what works. Every engagement adds to your
                    firm's intelligence, making everyone better at delivering client value.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-primary">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-center">Built to Solve Consulting's Knowledge Crisis</h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Knowledge Walks Out the Door</div>
                      <p className="text-sm text-muted-foreground">
                        When experienced partners leave, decades of frameworks, client insights, and methodologies
                        disappear forever. Firms lose competitive advantage built over years.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Constant Reinvention</div>
                      <p className="text-sm text-muted-foreground">
                        Consultants spend 30-40% of their time recreating frameworks, searching for past work,
                        and rediscovering solutions that colleagues already developed. Massive waste of billable hours.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Inconsistent Client Delivery</div>
                      <p className="text-sm text-muted-foreground">
                        Quality varies wildly depending on who's assigned. Clients don't get the firm's best thinking—
                        they get whatever the assigned consultant knows. Best practices stay siloed.
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
                            Capture partner expertise before they retire. Give every consultant instant access
                            to firm methodologies. Deliver consistently excellent work to every client. Turn knowledge
                            from a depreciating asset into a compounding advantage.
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

      {/* Comparison Table */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Traditional Consulting vs Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground">
              See exactly what changes when consulting firms adopt Perpetual Core
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
                      Traditional Approach
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
                    feature: "Framework Access",
                    old: "Search SharePoint, email partners, hope someone remembers",
                    new: "Ask AI, get instant access to all relevant frameworks",
                    highlight: true
                  },
                  {
                    feature: "Past Engagement Research",
                    old: "6+ hours searching files and asking colleagues",
                    new: "30 minutes with comprehensive search results"
                  },
                  {
                    feature: "Partner Knowledge Transfer",
                    old: "Lost forever when partners leave or retire",
                    new: "Preserved and accessible to entire firm forever"
                  },
                  {
                    feature: "Proposal Development",
                    old: "20+ hours recreating approaches and templates",
                    new: "8 hours leveraging proven winning templates",
                    highlight: true
                  },
                  {
                    feature: "New Consultant Onboarding",
                    old: "6 months to become productive and knowledgeable",
                    new: "2 weeks with instant access to firm methodologies"
                  },
                  {
                    feature: "Client Confidentiality",
                    old: "Inconsistent file management, scattered information",
                    new: "Centralized, encrypted, role-based access controls"
                  },
                  {
                    feature: "Industry Intelligence",
                    old: "Siloed by consultant, hard to find relevant research",
                    new: "Searchable database of all firm research and insights",
                    highlight: true
                  },
                  {
                    feature: "Best Practice Sharing",
                    old: "Occasional lunch-and-learns, informal hallway chats",
                    new: "Instant access to best practices from every engagement"
                  },
                  {
                    feature: "Quality Consistency",
                    old: "Varies by consultant assignment and experience level",
                    new: "Every consultant delivers firm's best thinking"
                  },
                  {
                    feature: "Billable Hour Optimization",
                    old: "30-40% of time wasted on research and recreation",
                    new: "Focus billable hours on high-value client work"
                  },
                  {
                    feature: "Competitive Positioning",
                    old: "Knowledge advantage erodes when people leave",
                    new: "Institutional intelligence compounds over time"
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
                Consulting firms using Perpetual Core save <strong className="text-primary">15+ hours per consultant per week</strong>,
                increase win rates by <strong className="text-primary">25%</strong>, and
                deliver <strong className="text-primary">consistently excellent client value</strong> regardless of who's assigned.
              </p>
              <Button size="lg" asChild className="mt-2">
                <Link href="/contact-sales?plan=consulting">
                  Schedule Demo to See How It Works
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
              Everything you need to know about Perpetual Core for consulting firms
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "How do you protect confidential client information?",
                answer: "Client confidentiality is absolute. All information is encrypted with 256-bit encryption at rest and in transit. We use zero-knowledge architecture—we cannot access your data. You control exactly who can access what through granular role-based permissions. Your client data is NEVER used to train AI models. We're SOC 2 Type II certified with complete audit logs. Many firms use Perpetual Core specifically because it's MORE secure than scattered emails, SharePoint folders, and individual laptops."
              },
              {
                question: "What's the pricing structure for consulting firms?",
                answer: "$399 per consultant per month. This includes unlimited framework storage, all AI models, client engagement tracking, and white-glove support. Volume discounts: 15% off for 10+ consultants, 25% off for 25+ consultants. Enterprise pricing available for firms with 50+ consultants. First 14 days are completely free to trial. Billing is monthly or annual (save 20% with annual). No per-project fees or hidden costs."
              },
              {
                question: "How long does implementation take for a consulting firm?",
                answer: "Most firms are fully operational within 2-3 weeks. Week 1: Setup, upload initial frameworks and methodologies (8-12 hours of partner time). Week 2: Consultant training and pilot engagements (4 hours training, then real-world use). Week 3: Full firm rollout with daily support. You'll see time savings from day one. Every firm gets a dedicated implementation specialist and white-glove onboarding included. We understand consulting workflows and timelines."
              },
              {
                question: "Can Perpetual Core help with business development and proposals?",
                answer: "Absolutely. Store winning proposal templates, pitch decks, and case studies. When pursuing new business, ask AI to surface relevant past work, similar engagements, and proven approaches. Get instant access to industry research and competitive intelligence. Many firms report 25-40% improvement in win rates because proposals leverage the firm's best thinking instead of individual consultant knowledge. AI can even draft proposal sections using your firm's successful templates."
              },
              {
                question: "How does this help when senior partners retire?",
                answer: "This is one of the most valuable benefits. Before retirement, partners upload their frameworks, methodologies, engagement playbooks, and client strategies. When they leave, their intellectual capital stays accessible to the entire firm. Junior partners can ask 'How did Partner X approach cost optimization?' and get immediate access to proven frameworks. Firms preserve decades of wisdom that would otherwise walk out the door. Many firms use Perpetual Core specifically to capture partner knowledge before retirement."
              },
              {
                question: "Does Perpetual Core work for specialized consulting practices?",
                answer: "Yes. Perpetual Core works for strategy, operations, IT, HR, financial advisory, and specialized boutique firms. During onboarding, we customize the system for your practice area and methodologies. You can create practice-specific workspaces (e.g., separate areas for strategy vs. IT consulting) with appropriate access controls. Upload your firm's unique frameworks and IP—Perpetual Core learns your specific approaches and terminology."
              },
              {
                question: "Can consultants access Perpetual Core during client meetings?",
                answer: "Yes. Perpetual Core is designed for real-time access during engagements. On your laptop or phone, quickly search for frameworks, past work, or industry insights during client conversations. Appears seamless to clients—you're just accessing your firm's knowledge. Many consultants keep Perpetual Core open in a second screen during virtual meetings or use mobile app during in-person sessions. Response time is typically under 3 seconds."
              },
              {
                question: "How do you handle multi-office or international consulting firms?",
                answer: "Perfect for distributed firms. All offices access the same knowledge base, creating true global consistency. Set permissions by office, practice area, or seniority level. Support for multiple languages and time zones. Many international firms use Perpetual Core specifically to break down geographic silos—consultants in London can access frameworks developed in New York. Creates unified firm methodology while respecting local context."
              },
              {
                question: "What happens to our data if we cancel?",
                answer: "You own your data, period. If you cancel, you can export everything—frameworks, methodologies, engagement notes, client intelligence—in standard formats (PDF, DOCX, JSON). We keep your data for 90 days after cancellation in case you change your mind, then permanently delete it. You'll receive a certificate of data destruction upon request. No lock-in, no hostage data. Your intellectual property belongs to your firm."
              },
              {
                question: "How is this different from knowledge management systems we've tried before?",
                answer: "Traditional KM systems fail because they require manual tagging, complex folder structures, and discipline to maintain. Perpetual Core is different: (1) Automatic indexing—just upload content, AI organizes it. (2) Natural language search—ask questions like you would a colleague. (3) Context-aware results—AI understands consulting workflows. (4) Used daily during actual client work, not just for onboarding. (5) Works with how consultants actually work, not how IT thinks they should work. Our adoption rates are 90%+ vs. 20-30% for traditional KM."
              },
              {
                question: "Can we control what gets shared across the firm?",
                answer: "Absolutely. Granular permission controls let you decide what's accessible at firm-wide, practice area, office, or individual levels. For example: core frameworks shared firm-wide, sensitive client strategies restricted to engagement teams, partner-level methodologies accessible only to principals. Create private workspaces for confidential projects. Full audit logs track who accessed what and when. You maintain complete control over intellectual property."
              },
              {
                question: "Does this replace our consultants' expertise and judgment?",
                answer: "No—Perpetual Core amplifies consultant expertise, it doesn't replace it. Think of it as giving every consultant instant access to firm knowledge while they apply their own judgment and creativity. Consultants still own client relationships, strategic thinking, and recommendations. Perpetual Core just ensures they have the firm's best frameworks and past work at their fingertips. Clients hire consultants for judgment and insight—Perpetual Core helps deliver that faster and better."
              },
              {
                question: "How does Perpetual Core help with knowledge transfer and training?",
                answer: "New consultants get instant access to decades of firm methodologies. Instead of 6 months of shadowing and training, they're productive in 2 weeks. They can ask 'How do we approach market entry strategy?' and get comprehensive frameworks immediately. Experienced consultants use Perpetual Core to share best practices without creating PowerPoint training decks. Knowledge transfer happens continuously through real engagement work, not periodic training sessions."
              },
              {
                question: "What kind of support do consulting firms receive?",
                answer: "White-glove support designed for professional services: (1) Dedicated implementation specialist for first 60 days. (2) Priority support with 2-hour response time for urgent issues. (3) Phone, email, and secure chat support. (4) Ongoing optimization sessions quarterly. (5) Regular check-ins with your account manager. (6) Best practice sharing with other consulting firms. (7) Custom training for new consultants. For firms with 25+ consultants, we offer on-site training and quarterly business reviews."
              },
              {
                question: "Can we customize Perpetual Core for our firm's specific methodologies?",
                answer: "Yes. During onboarding, we work with your partners to understand your proprietary frameworks and approaches. AI learns your firm's specific terminology, methodologies, and workflow. You can create custom templates, define firm-specific categories, and set up practice area structures that match how your firm operates. Think of Perpetual Core as a platform that adapts to your firm's IP, not a rigid system you must adapt to."
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
                Schedule a call with our team. We'll answer all your questions and show you exactly how Perpetual Core works for consulting firms.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/contact-sales?plan=consulting">
                    Schedule Demo
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="mailto:consulting@aios.com">Email Consulting Team</Link>
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
            <h2 className="text-4xl font-bold mb-4">Transparent Pricing for Consulting Firms</h2>
            <p className="text-xl text-muted-foreground">
              Competitive advantage that pays for itself in saved billable hours
            </p>
          </div>

          <Card className="border-2 border-primary">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-2 mb-4">
                  <span className="text-5xl font-bold">$399</span>
                  <span className="text-xl text-muted-foreground">/consultant/month</span>
                </div>
                <p className="text-muted-foreground">Everything included. No hidden fees.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Unlimited framework & methodology storage</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Client engagement intelligence tracking</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">All AI models included (GPT-4, Claude, Gemini)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">24/7 AI Coach available</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Proposal & pitch template library</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Industry research & competitive intelligence</span>
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
                  <span className="text-muted-foreground">Volume discounts (10+ consultants)</span>
                  <span className="font-semibold">15% off</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Volume discounts (25+ consultants)</span>
                  <span className="font-semibold">25% off</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Annual payment discount</span>
                  <span className="font-semibold">Save 20%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Enterprise pricing (50+ consultants)</span>
                  <span className="font-semibold">Custom</span>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Button size="lg" asChild className="w-full md:w-auto">
                  <Link href="/signup?plan=consulting">Start 14-Day Free Trial</Link>
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  No credit card required • Cancel anytime • Setup in 1 week
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              <strong>ROI Calculator:</strong> Average consultant saves 15 hours/week. At $200/hour billing rate,
              that's $3,000/week in additional billable capacity. Perpetual Core pays for itself 7.5x over.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-primary to-purple-600 text-white border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Preserve Your Firm's Expertise?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join consulting firms that are delivering better client value, accelerating junior consultants,
              and preserving institutional knowledge for competitive advantage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/contact-sales?plan=consulting">Schedule Demo</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent border-white text-white hover:bg-white/10">
                <Link href="/signup?plan=consulting">Start Free Trial</Link>
              </Button>
            </div>
            <p className="text-sm mt-6 opacity-75">
              14-day free trial • Client confidentiality guaranteed • Setup in 1 week
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
                The AI-powered knowledge platform built to help consulting firms preserve institutional expertise.
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
              © 2024 AI Operating System. All rights reserved. | SOC 2 Type II Certified | Client Confidentiality Guaranteed
            </p>
            <p className="text-xs max-w-3xl mx-auto">
              Perpetual Core is a knowledge management platform designed for consulting firms. Professional judgment and client confidentiality
              remain the responsibility of consulting firms. Your client data is encrypted and never used to train AI models.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
