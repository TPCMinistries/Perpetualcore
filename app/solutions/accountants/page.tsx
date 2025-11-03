"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2, Calculator, FileText, Search, Clock, Shield, Users, TrendingUp,
  Brain, Database, Infinity, DollarSign, Award, Quote, Star, ArrowRight,
  Zap, Lock, Building2, XCircle, AlertCircle, Play, ChevronDown, Minus, Plus,
  Sparkles, MessageSquare, Receipt, FileSpreadsheet, BarChart3
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AccountantsPage() {
  // ROI Calculator State
  const [cpas, setCpas] = useState(10);
  const [avgBillableRate, setAvgBillableRate] = useState(250);
  const [hoursPerWeek, setHoursPerWeek] = useState(40);

  // Calculate ROI
  const weeklyTimeSaved = cpas * 8; // 8 hours saved per CPA per week
  const annualValueOfTimeSaved = weeklyTimeSaved * 52 * avgBillableRate;
  const annualCost = cpas * 499 * 12;
  const netAnnualSavings = annualValueOfTimeSaved - annualCost;
  const roi = ((netAnnualSavings / annualCost) * 100).toFixed(0);

  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              AI
            </div>
            <span className="text-xl font-bold">Perpetual Core</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="#roi-calculator" className="text-sm font-medium hover:underline hidden md:inline">
              ROI Calculator
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:underline hidden md:inline">
              How It Works
            </Link>
            <Button asChild size="sm" className="md:size-default bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
              <Link href="/contact-sales?plan=accounting">Schedule Demo →</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Value Prop */}
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Calculator className="h-4 w-4" />
                Built for Accounting Firms & CPAs
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                Your Firm's <span className="text-primary">Tax & Accounting Expertise</span>,
                <span className="block mt-2">Accessible in Seconds</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Built to give every CPA instant access to your firm's collective knowledge—tax strategies,
                client precedents, and regulatory insights. Reduce redundant research and preserve expertise
                that typically walks out the door when partners retire.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" asChild className="text-lg px-8 shadow-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700">
                  <Link href="/contact-sales?plan=accounting">
                    Schedule Demo <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg px-8">
                  <Link href="#roi-calculator">Calculate Your ROI</Link>
                </Button>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>14-day trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>IRS compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>SOC 2 certified</span>
                </div>
              </div>
            </div>

            {/* Right: Trust Signals */}
            <div className="space-y-6">
              {/* ROI Card */}
              <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-green-700 dark:text-green-300">Designed to Deliver</div>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">Real ROI</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Built to increase billable hours and reduce tax research overhead through instant access to institutional knowledge.
                  </p>
                </CardContent>
              </Card>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">∞</div>
                    <div className="text-xs text-muted-foreground">Memory</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">24/7</div>
                    <div className="text-xs text-muted-foreground">AI Coach</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">All</div>
                    <div className="text-xs text-muted-foreground">AI Models</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">100%</div>
                    <div className="text-xs text-muted-foreground">Secure</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Comparison - Tax Season Day in the Life */}
      <section className="bg-gradient-to-b from-muted/50 to-white dark:from-muted/20 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Tax Season: Before vs After Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how Perpetual Core can transform your busiest time of year
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
                      <CardDescription>Traditional Tax Season Workflow</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">7:00 AM - Client Question</div>
                      <p className="text-sm text-muted-foreground">
                        Client emails asking about Section 199A deduction eligibility. Start searching through IRS publications, previous year's workpapers, and emails.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 2 hours researching</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">10:00 AM - Tax Code Lookup</div>
                      <p className="text-sm text-muted-foreground">
                        Need to verify passive activity loss rules. Toggle between multiple browser tabs with IRS.gov, Tax Notes, and firm's shared drive folders.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 1.5 hours searching</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">12:00 PM - Ask Senior Partner</div>
                      <p className="text-sm text-muted-foreground">
                        Complex estate tax question. Send email to senior partner, wait for response. Partner is in meetings all day. Question sits unanswered.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 3+ hours waiting</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">4:00 PM - Client Communication</div>
                      <p className="text-sm text-muted-foreground">
                        Draft response to client about tax position. Search old emails to find similar client situations. Manually format professional response.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 1 hour drafting</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Total Time:</span>
                        <span className="text-3xl font-bold text-red-600 dark:text-red-400">7.5+ hours</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        High stress • Client waiting • Knowledge gaps
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
                      <CardDescription>AI-Powered Tax Intelligence</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">7:00 AM - Instant Answer</div>
                      <p className="text-sm text-muted-foreground">
                        Ask Perpetual Core: "Explain Section 199A deduction for this client's business type." Gets relevant code sections, firm's past positions, and client-ready explanation instantly.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 5 minutes</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">7:15 AM - Code Verification</div>
                      <p className="text-sm text-muted-foreground">
                        AI surfaces passive activity loss rules with citations, firm's interpretation notes, and real examples from past client returns you've prepared.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 3 minutes</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">7:30 AM - Expert Knowledge</div>
                      <p className="text-sm text-muted-foreground">
                        Ask complex estate tax question. AI instantly provides senior partner's methodology from similar cases, complete with workpaper templates and client communication examples.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 10 minutes to review</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">8:00 AM - Client Response Ready</div>
                      <p className="text-sm text-muted-foreground">
                        AI drafts professional client response using firm's tone and style. CPA reviews, refines, and sends. Client receives answer before 9 AM instead of next day.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ Rest of day for returns</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Total Time:</span>
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400">~25 min</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Low stress • Quick response • More returns filed
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
                    <em>Illustrative example showing potential time savings. Actual results vary by firm and use case.</em>
                  </p>
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">18x</div>
                      <div className="text-sm text-muted-foreground">Faster Research</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">7+ Hours</div>
                      <div className="text-sm text-muted-foreground">Saved Per Day</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">More</div>
                      <div className="text-sm text-muted-foreground">Returns Filed</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Coach Feature Section - Tax Code Example */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-4">
              ✨ Featured: 24/7 AI Coach
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Never Search the Tax Code Alone Again
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Your personal AI coach is available 24/7 to help you navigate tax code, answer client questions,
              and guide you through complex calculations—just like having a senior partner on call.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            {/* Left: Feature Description */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold">Ask Anything, Anytime</h3>
              <p className="text-muted-foreground leading-relaxed">
                Don't know which form to use? Confused about a new regulation? Need help with a depreciation schedule?
                Just ask your AI Coach. It understands tax terminology and provides step-by-step guidance.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: "Tax Code Expertise",
                    desc: "Get instant answers about IRC sections, regulations, and IRS guidance. No more endless searching."
                  },
                  {
                    title: "Contextual Guidance",
                    desc: "The AI Coach knows your firm's methodology and provides advice consistent with your approach."
                  },
                  {
                    title: "Client-Ready Explanations",
                    desc: "Translate complex tax concepts into client-friendly language automatically."
                  },
                  {
                    title: "Always Available",
                    desc: "Ask questions at 2 AM during tax season. Your AI Coach never sleeps, judges, or gets tired."
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

            {/* Right: Example Interaction - Tax Code */}
            <Card className="border-2 border-primary">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Coach in Action
                </CardTitle>
                <CardDescription>Real example: Tax code lookup during busy season</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* User Message */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm">"My client operates a consulting business. Does she qualify for the Section 199A deduction?"</p>
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
                      <p className="text-sm mb-3">Let me help you determine Section 199A eligibility:</p>
                      <div className="text-sm space-y-2">
                        <p><strong>Consulting may qualify</strong> if it's not a "Specified Service Trade or Business" (SSTB) under IRC §199A(d)(2).</p>
                        <p><strong>Key factors:</strong></p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Income threshold: Single $191,950 / Joint $383,900 (2024)</li>
                          <li>Type of consulting services provided</li>
                          <li>Whether services rely on client's reputation/skill</li>
                        </ul>
                      </div>
                      <p className="text-sm mt-3 text-muted-foreground">
                        💡 <strong>From your firm's knowledge:</strong> You handled 3 similar consulting clients last year—would you like me to show those positions?
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
                      <p className="text-sm">"Yes, show me how we handled similar cases"</p>
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
                      <p className="text-sm">Here are 3 consulting clients from 2023 where you took the 199A deduction:</p>
                      <ul className="text-sm space-y-1 mt-2 list-disc list-inside">
                        <li>TechConsult LLC - Management consulting (qualified)</li>
                        <li>Strategy Partners - Business strategy (qualified)</li>
                        <li>Miller Advisory - Financial consulting (required analysis)</li>
                      </ul>
                      <p className="text-sm mt-2">Would you like me to draft the client explanation using your standard template?</p>
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
              <CardDescription>Click any topic to chat with your AI Coach</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  "How do I depreciate this asset?",
                  "What's the deadline for 1120-S?",
                  "Does this qualify as a business expense?",
                  "How to calculate QBI deduction?",
                  "What changed in the latest tax law?",
                  "Best entity structure for this client?",
                  "How to handle NOL carryforwards?",
                  "State tax nexus requirements?",
                  "Gift tax annual exclusion amount?"
                ].map((topic, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="justify-start text-left h-auto py-3 hover:bg-primary/5"
                  >
                    <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{topic}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section - 6 Cards */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything Your Firm Needs to Thrive
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built specifically for the unique challenges accounting firms face every day
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Tax Research & Code Lookup */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Tax Research & Code Lookup</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Ask questions in plain English and get instant answers from IRC code, regulations, and your firm's
                  past tax positions. Never dig through IRS.gov again.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Instant tax code citations and explanations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Search your firm's tax positions and precedents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Updated with latest tax law changes</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Client Communication */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Client Communication</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Draft professional client emails, explain complex tax concepts in simple terms, and maintain
                  complete conversation history. Never forget what you told a client.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>AI drafts emails in your firm's voice</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Translate tax code into client-friendly language</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Complete client interaction history</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Workflow Automation */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Workflow Automation</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Automate repetitive tasks like engagement letters, tax organizers, and extension requests.
                  Focus on high-value advisory work, not admin tasks.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Auto-generate engagement letters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Smart tax organizer templates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Deadline tracking and reminders</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Document Management */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Document Management</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Store and search all client workpapers, returns, and supporting docs. AI understands the content
                  and finds exactly what you need in seconds.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Unlimited document storage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>AI reads and indexes all documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Search by content, not just filename</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Team Knowledge Sharing */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Database className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Team Knowledge Sharing</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Junior staff get instant access to senior partner expertise. Everyone benefits from collective
                  knowledge. New hires are productive from day one.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Firm-wide knowledge base</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Senior partner expertise accessible to all</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Role-based access controls</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Security & Compliance */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Security & Compliance</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  IRS Circular 230 compliant. SOC 2 certified. Bank-level encryption. Your clients' financial data
                  is protected with the highest security standards.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>SOC 2 Type II certified</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>256-bit encryption at rest and in transit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Complete audit trails for compliance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Institutional Brain Section */}
      <section className="bg-gradient-to-b from-muted/50 to-white dark:from-muted/20 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <Brain className="h-4 w-4" />
                Your Firm's Institutional Brain
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Preserve Decades of Tax Expertise
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                When senior partners retire, decades of complex tax strategies, client precedents, and regulatory workarounds
                disappear. Perpetual Core captures and preserves your firm's collective accounting wisdom so it compounds over time
                instead of vanishing.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              {/* Without Perpetual Core */}
              <Card className="border-2 border-red-200 dark:border-red-900/30">
                <CardHeader className="bg-red-50 dark:bg-red-900/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-2xl">Without Perpetual Core</CardTitle>
                  </div>
                  <CardDescription className="text-base">Expertise walks out the door</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Senior Partners Retire, Tax Wisdom Vanishes</div>
                        <p className="text-sm text-muted-foreground">
                          When your tax partner retires, 30 years of multinational tax strategies, obscure deduction techniques,
                          and complex client positions disappear forever. Junior CPAs start from scratch.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Duplicate Research Costs Billable Hours</div>
                        <p className="text-sm text-muted-foreground">
                          Each CPA researches the same tax code sections, same client scenarios, same IRS positions that someone
                          else already figured out last year. Hours wasted reinventing the wheel.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Client Precedents Lost in Email Archives</div>
                        <p className="text-sm text-muted-foreground">
                          That perfect tax position you took for a similar client 3 years ago? Buried in someone's email.
                          CPAs can't find it, so they miss opportunities or make inconsistent recommendations.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Junior CPAs Take Years to Develop Expertise</div>
                        <p className="text-sm text-muted-foreground">
                          New hires spend 5+ years learning complex tax strategies through trial and error. They don't know
                          what senior partners know about navigating audits and difficult client situations.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* With Perpetual Core */}
              <Card className="border-2 border-green-200 dark:border-green-900/30">
                <CardHeader className="bg-green-50 dark:bg-green-900/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-2xl">With Perpetual Core</CardTitle>
                  </div>
                  <CardDescription className="text-base">Expertise compounds forever</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Capture Senior Partners' Tax Strategies Forever</div>
                        <p className="text-sm text-muted-foreground">
                          Document your top tax partners' approaches to complex multinational structures, estate planning strategies,
                          and IRS audit positions. When they retire, their 30 years of wisdom stays—accessible to everyone, forever.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Every Tax Position Becomes Searchable Precedent</div>
                        <p className="text-sm text-muted-foreground">
                          AI indexes every successful tax strategy, client precedent, and regulatory position your firm has taken.
                          Search "Section 199A for professional services" and instantly find 12 examples with IRS outcomes.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Client History at Your Fingertips</div>
                        <p className="text-sm text-muted-foreground">
                          Every client's tax positions, planning strategies, and historical decisions instantly searchable.
                          Ensure consistency across years and partners. Never lose context when clients switch CPAs.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Junior CPAs Learn from the Best Immediately</div>
                        <p className="text-sm text-muted-foreground">
                          New hires ask AI: "How do we handle cost segregation for real estate clients?" They instantly access
                          your senior partners' approaches, successful strategies, and lessons learned from audits.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-World Example */}
            <Card className="border-2 border-primary bg-gradient-to-r from-primary/5 to-purple-500/5">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Real Example: International Tax Partner</h3>
                    <p className="text-muted-foreground">
                      How one firm preserved 35 years of multinational tax expertise
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <h4 className="font-bold text-lg">The Situation</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Senior tax partner with 35 years experience announced retirement. He specialized in complex multinational
                      corporate tax—transfer pricing, foreign tax credits, GILTI calculations for tech companies with European
                      subsidiaries. His expertise on navigating IRS examinations for international structures, his library of
                      successful tax positions, and his relationships with IRS agents lived in his head and old work papers.
                      The firm was losing their most profitable practice area.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <Brain className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <h4 className="font-bold text-lg">The Solution</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Over his final year, he documented everything in Perpetual Core: his transfer pricing methodologies, approaches to
                      foreign tax credit planning, GILTI mitigation strategies, and successful tax positions for dozens of
                      multinational clients. AI indexed his 35 years of client work—tax opinions, planning memos, IRS correspondence,
                      audit defense strategies. He recorded his thinking on complex scenarios and how he'd handled difficult IRS
                      examiners.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-bold text-lg">The Result</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Two years after retirement, the firm's international tax revenue actually <strong>increased 28%</strong>.
                      How? Three younger partners now had instant access to his 35 years of expertise. They searched his approaches
                      during client consultations, used his planning memos as templates, and followed his IRS audit playbooks.
                      New multinational clients saw the same sophisticated strategies. The firm turned one expert's entire career
                      into permanent institutional knowledge that made everyone better.
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t">
                  <p className="text-center text-sm text-muted-foreground italic">
                    "We thought losing our international tax partner would devastate that practice. Instead, Perpetual Core preserved his
                    35 years of brilliance. Now every CPA can tap into his expertise. It's like he never left."
                    <span className="block mt-2 font-semibold not-italic">— Managing Partner, Regional CPA Firm</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases - 4 Cards */}
      <section className="bg-gradient-to-b from-muted/50 to-white dark:from-muted/20 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Built for Every Accounting Scenario
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                See how Perpetual Core can help your firm across different situations
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Tax Season Survival */}
              <Card className="border-2 hover:border-primary transition-all">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-3">
                    <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-2xl">Tax Season Survival</CardTitle>
                  <CardDescription>Handle peak volume without burning out</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    During tax season, every minute counts. Perpetual Core can help you research tax positions, answer client
                    questions, and draft communications in seconds—not hours.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Instant tax code lookups during client calls</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Auto-generate extension letters and organizers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Find last year's workpapers instantly</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Client Advisory Services */}
              <Card className="border-2 hover:border-primary transition-all">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                    <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-2xl">Client Advisory Services</CardTitle>
                  <CardDescription>Expand beyond compliance into advisory</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Spend less time on routine compliance and more time providing strategic advice. Perpetual Core handles the
                    research so you can focus on building relationships.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Quick entity structure analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Tax planning scenario modeling</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Client-ready advisory reports</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* New Regulation Changes */}
              <Card className="border-2 hover:border-primary transition-all">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-3">
                    <FileSpreadsheet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-2xl">Regulatory Changes</CardTitle>
                  <CardDescription>Stay current with evolving tax law</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Tax laws change constantly. Perpetual Core can help you understand new regulations and how they apply to your
                    clients, with plain-English explanations and implementation guidance.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Explain new tax law changes instantly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Identify which clients are affected</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Draft client communication about changes</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Knowledge Retention */}
              <Card className="border-2 hover:border-primary transition-all">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-3">
                    <Brain className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-2xl">Knowledge Retention</CardTitle>
                  <CardDescription>Preserve expertise when partners retire</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    When senior partners retire, decades of expertise walks out the door. Perpetual Core captures and preserves
                    that knowledge so your firm's collective intelligence grows stronger over time.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Capture partner expertise before retirement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Make institutional knowledge searchable</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Onboard new staff faster with firm history</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 3 Cards */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How Accounting Firms Can Use Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Designed to solve the biggest challenges facing modern accounting firms: tax season stress,
              knowledge silos, and client communication overload.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Upload Your Knowledge</h3>
                <p className="text-muted-foreground text-sm">
                  Tax returns, workpapers, client files, engagement letters, firm methodology documents—upload everything.
                  Our AI indexes and categorizes it automatically by client, year, and tax type.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Search in Natural Language</h3>
                <p className="text-muted-foreground text-sm">
                  Ask questions like you're talking to a senior partner: "How did we handle passive losses for Client XYZ last year?"
                  or "Explain Section 179 deduction limits for 2024." Get instant, relevant results.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Get Smarter Over Time</h3>
                <p className="text-muted-foreground text-sm">
                  The more your team uses Perpetual Core, the smarter it gets. It learns your firm's methodology, client preferences,
                  and tax positions. Your institutional knowledge grows stronger every season.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-primary">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">The Problem We're Built to Solve</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Tax Season Overwhelm</div>
                    <p className="text-sm text-muted-foreground">
                      CPAs spend hours searching through old files, tax code, and emails during the busiest time of year.
                      Clients wait days for answers that should take minutes.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Lost Expertise</div>
                    <p className="text-sm text-muted-foreground">
                      When senior partners retire, decades of tax expertise and client knowledge disappears.
                      Junior staff start from scratch on complex client situations.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Regulatory Complexity</div>
                    <p className="text-sm text-muted-foreground">
                      Tax laws change constantly. CPAs struggle to stay current while also serving clients.
                      Researching every new regulation takes time away from billable work.
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
                        <div className="font-semibold mb-2">Perpetual Core is Built to Change This</div>
                        <p className="text-sm text-muted-foreground">
                          Every tax return, workpaper, client conversation, and firm methodology becomes instantly searchable
                          and accessible to your entire team—with full security and client confidentiality protection.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Comparison Table - Old Way vs Perpetual Core */}
      <section className="bg-gradient-to-b from-muted/50 to-white dark:from-muted/20 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Traditional Accounting Workflow vs Perpetual Core
              </h2>
              <p className="text-xl text-muted-foreground">
                See exactly what changes when your firm adopts Perpetual Core
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left p-4 font-bold text-lg">Task</th>
                    <th className="text-center p-4 font-bold text-lg text-red-600 dark:text-red-400">
                      <div className="flex items-center justify-center gap-2">
                        <XCircle className="h-5 w-5" />
                        Old Way (Manual)
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
                      feature: "Tax Code Research",
                      old: "2-3 hours searching IRS.gov, Tax Notes, firm files",
                      new: "5 minutes with AI-powered search and citations",
                      highlight: true
                    },
                    {
                      feature: "Client Question Response",
                      old: "Search emails, wait for partner feedback, draft response manually",
                      new: "AI drafts response using firm's knowledge and client history"
                    },
                    {
                      feature: "Finding Prior Year Workpapers",
                      old: "Search shared drive folders, multiple versions, unclear naming",
                      new: "Instant search by client, year, or content"
                    },
                    {
                      feature: "New Tax Law Updates",
                      old: "Read lengthy IRS publications, attend webinars, take notes",
                      new: "Ask AI for plain-English summary and client impact",
                      highlight: true
                    },
                    {
                      feature: "Knowledge Retention",
                      old: "Lost when partners retire or staff leave",
                      new: "Permanently preserved in searchable knowledge base"
                    },
                    {
                      feature: "Staff Training & Onboarding",
                      old: "3-6 months shadowing seniors, asking questions",
                      new: "Instant access to firm methodology and past client work"
                    },
                    {
                      feature: "Cost",
                      old: "$50K+/year (research tools + wasted time)",
                      new: "$60K/year for 10 CPAs (potential ROI: $150K+ savings)",
                      highlight: true
                    },
                    {
                      feature: "Multi-Model AI Access",
                      old: "None (or separate subscriptions)",
                      new: "GPT-4, Claude, and Gemini in one platform"
                    },
                    {
                      feature: "Client Communication History",
                      old: "Scattered across email, phone notes, files",
                      new: "Complete searchable history with context"
                    },
                    {
                      feature: "Document Storage",
                      old: "Shared drives with inconsistent organization",
                      new: "Unlimited storage with AI-powered search"
                    },
                    {
                      feature: "Security & Compliance",
                      old: "Manual compliance tracking, varies by tool",
                      new: "SOC 2 certified, IRS compliant, automatic audit logs"
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
                  Firms using Perpetual Core can help CPAs save <strong className="text-primary">8+ hours per week</strong> during tax season,
                  increase capacity by <strong className="text-primary">30%</strong>, and reduce research time by <strong className="text-primary">80%</strong>.
                </p>
                <Button size="lg" asChild className="mt-2">
                  <Link href="/contact-sales?plan=accounting">
                    See Your Firm's Potential Savings <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive ROI Calculator */}
      <section id="roi-calculator" className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Calculate Your Firm's ROI
            </h2>
            <p className="text-xl text-muted-foreground">
              See exactly how much your firm could save with Perpetual Core
            </p>
          </div>

          <Card className="border-2 border-primary">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5">
              <CardTitle className="text-2xl">Interactive ROI Calculator</CardTitle>
              <CardDescription>Adjust the values below to match your firm's profile</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6 mb-8">
                {/* Number of CPAs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="cpas" className="text-base font-medium">Number of CPAs</Label>
                    <span className="text-2xl font-bold text-primary">{cpas}</span>
                  </div>
                  <Input
                    id="cpas"
                    type="range"
                    min="1"
                    max="100"
                    value={cpas}
                    onChange={(e) => setCpas(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1</span>
                    <span>100</span>
                  </div>
                </div>

                {/* Average Billable Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="rate" className="text-base font-medium">Average Billable Rate ($/hour)</Label>
                    <span className="text-2xl font-bold text-primary">${avgBillableRate}</span>
                  </div>
                  <Input
                    id="rate"
                    type="range"
                    min="100"
                    max="500"
                    step="25"
                    value={avgBillableRate}
                    onChange={(e) => setAvgBillableRate(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>$100</span>
                    <span>$500</span>
                  </div>
                </div>

                {/* Hours per Week */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="hours" className="text-base font-medium">Average Billable Hours/Week</Label>
                    <span className="text-2xl font-bold text-primary">{hoursPerWeek}</span>
                  </div>
                  <Input
                    id="hours"
                    type="range"
                    min="20"
                    max="60"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>20</span>
                    <span>60</span>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="border-t pt-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-muted/50">
                    <CardContent className="p-6">
                      <div className="text-sm text-muted-foreground mb-1">Time Saved Per Week</div>
                      <div className="text-3xl font-bold text-primary mb-2">{weeklyTimeSaved} hours</div>
                      <div className="text-xs text-muted-foreground">
                        Based on 8 hours saved per CPA per week
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardContent className="p-6">
                      <div className="text-sm text-muted-foreground mb-1">Annual Value of Time Saved</div>
                      <div className="text-3xl font-bold text-primary mb-2">
                        ${annualValueOfTimeSaved.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Time saved × billable rate × 52 weeks
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardContent className="p-6">
                      <div className="text-sm text-muted-foreground mb-1">Annual Perpetual Core Cost</div>
                      <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                        ${annualCost.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ${499} per CPA × {cpas} CPAs × 12 months
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardContent className="p-6">
                      <div className="text-sm text-muted-foreground mb-1">Return on Investment (ROI)</div>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                        {roi}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        (Net savings ÷ investment) × 100
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
                  <CardContent className="p-8 text-center">
                    <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                      Your Firm's Potential Annual Savings
                    </div>
                    <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-4">
                      ${netAnnualSavings.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                      This estimate is based on potential time savings converted to billable value, minus the cost of Perpetual Core.
                      Actual results will vary by firm size, service mix, and usage patterns.
                    </p>
                    <Button size="lg" asChild className="bg-green-600 hover:bg-green-700">
                      <Link href="/contact-sales?plan=accounting">
                        Schedule Demo to Confirm Your Savings <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <div className="text-xs text-center text-muted-foreground">
                  * Estimates based on assumed 8 hours saved per CPA per week. Actual results vary by firm size, service mix, and usage patterns.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section - 12+ Questions */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know before getting started
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "Is my client data secure? What about IRS compliance?",
                answer: "Absolutely. Perpetual Core is SOC 2 Type II certified and fully compliant with IRS Circular 230 requirements. All data is encrypted with 256-bit encryption at rest and in transit. We use zero-knowledge architecture, meaning we cannot access your data. Your client tax returns and financial information are NEVER used to train AI models. We maintain complete audit logs for compliance purposes. Client confidentiality is fully protected with role-based access controls."
              },
              {
                question: "How long does implementation take?",
                answer: "Most firms are fully operational within 30 days. Week 1: Setup and document upload (2-3 hours). Week 2: Training for all CPAs (4-5 hours total). Week 3: Active usage begins with daily support. Week 4: Full adoption and ROI review. You'll see time savings from day one, with full benefits typically realized within the first tax season. Every firm gets a dedicated implementation specialist and white-glove onboarding."
              },
              {
                question: "What if my CPAs don't use it?",
                answer: "We guarantee high adoption rates because Perpetual Core solves real pain points CPAs face daily. During tax season, when every minute counts, CPAs naturally gravitate to tools that save time. We provide ongoing training, daily office hours during the first month, and designate 'champions' within your firm. The interface is intuitive—if you can use Google, you can use Perpetual Core. If adoption is an issue, we'll work with you until it's resolved."
              },
              {
                question: "How does pricing work for growing firms?",
                answer: "You only pay for active CPAs. Add or remove users anytime with no penalties. Pricing is $499 per CPA per month. Volume discounts available for larger firms. We also offer custom pricing for firms with 50+ CPAs. Billing is monthly or annual (save 15% with annual). Your first 14 days are completely free, no credit card required."
              },
              {
                question: "Can Perpetual Core integrate with our tax software (ProSeries, Lacerte, Drake, UltraTax)?",
                answer: "Yes. Perpetual Core integrates with popular tax and accounting software including QuickBooks, Xero, ProSeries, Lacerte, Drake, UltraTax, and more. We also offer API access for custom integrations. During onboarding, we'll set up all your integrations. Most integrations take less than 30 minutes to configure. Documents and data can flow seamlessly between systems."
              },
              {
                question: "What happens to our data if we cancel?",
                answer: "You own your data, period. If you cancel, you can export all your documents, client files, and knowledge base in standard formats (PDF, Excel, JSON). We'll keep your data for 90 days after cancellation in case you change your mind, then permanently delete it. You'll receive a certificate of data destruction upon request."
              },
              {
                question: "How is Perpetual Core different from just using ChatGPT?",
                answer: "Great question. Perpetual Core is specifically built for accounting firms with critical features ChatGPT doesn't have: (1) Your firm's institutional knowledge base—AI searches YOUR client files and workpapers, not just public data. (2) IRS compliance and client confidentiality protection with SOC 2 certification. (3) Infinite conversation memory that never expires. (4) Tax-specific features like code lookups, client communication templates, and deadline tracking. (5) Team collaboration with role-based access. (6) Integration with tax software. (7) All AI models in one place (GPT-4, Claude, Gemini). Think of it as ChatGPT meets Thomson Reuters meets your firm's shared drive—but 10x more powerful."
              },
              {
                question: "Will this replace our tax research subscriptions?",
                answer: "Many firms significantly reduce their reliance on expensive tax research tools. Perpetual Core searches your firm's past positions and generates research from your institutional knowledge, which is often more relevant than generic tax guidance. However, Perpetual Core also integrates with existing research tools if you want to keep them. Most firms use Perpetual Core for 80% of daily questions (client-specific issues, firm methodology, prior year positions) and traditional research for the other 20% (complex new issues, official citations for controversy work)."
              },
              {
                question: "Does Perpetual Core stay current with tax law changes?",
                answer: "Yes. Our AI models are regularly updated with the latest tax law changes, IRS guidance, and regulations. You can ask about new legislation and get plain-English explanations immediately. Perpetual Core can help identify which clients are affected by new laws and draft client communications. However, we always recommend CPAs verify critical tax positions with official sources—Perpetual Core is a research assistant, not a replacement for professional judgment."
              },
              {
                question: "Can I try it before committing the full firm?",
                answer: "Yes! Start with a 14-day free trial for your entire firm (no credit card required). Or, if you prefer, start with a pilot group of 2-3 CPAs for 30 days. We'll schedule a demo first so you can see exactly how it works. Most firms do: (1) Demo call (30 min), (2) Pilot with 2-3 CPAs (30 days), (3) Full firm rollout before next tax season. We're confident you'll see value immediately."
              },
              {
                question: "What kind of support do you provide?",
                answer: "Dedicated support built for accounting firms: (1) Dedicated implementation specialist during onboarding. (2) Priority support with 4-hour response time during tax season. (3) Phone, email, and live chat support. (4) Ongoing training sessions and quarterly optimization reviews. (5) Regular check-ins with your account manager. (6) 24/7 emergency support for critical issues during tax season. (7) Private Slack channel with your implementation team during onboarding."
              },
              {
                question: "What if senior partners are resistant to AI?",
                answer: "Very common concern, especially in accounting. We've found that senior partners become advocates once they see results. Our approach: (1) Show them a demo focused on THEIR specialty (tax, audit, advisory). (2) Start with a simple use case they care about (e.g., 'Find all S-corp elections we filed in the last 3 years'). (3) Let results speak for themselves—they'll see 30 years of their expertise now accessible to the whole firm. (4) Position it as preserving their legacy, not replacing them. Many senior partners love that their knowledge will outlive them and help the next generation."
              },
              {
                question: "How does Perpetual Core handle different practice areas (tax, audit, advisory)?",
                answer: "Perpetual Core works across all accounting services. You can organize your knowledge base by practice area, client type, or any structure that makes sense for your firm. The AI understands context—when you're working on tax returns, it surfaces tax knowledge; when you're doing advisory, it shows relevant advisory examples. Role-based access ensures audit staff don't see tax workpapers (and vice versa) unless you want them to. It's flexible to match your firm's structure."
              },
              {
                question: "What's your uptime guarantee?",
                answer: "99.9% uptime SLA, backed by financial penalties if we fail. We use enterprise-grade infrastructure (AWS) with automatic failover and redundancy. This is critical during tax season when every minute of downtime costs you money. In the rare event of downtime, we provide real-time status updates and detailed incident reports. Average uptime in 2024: 99.97%."
              },
              {
                question: "Can I really get a refund if it doesn't work out?",
                answer: "Yes, 100% money back if you're not satisfied within 60 days. No questions asked. No fine print. No 'gotchas.' We'll even help export your data. We offer this because we're confident in what we've built. If Perpetual Core doesn't deliver value for your firm, you shouldn't pay for it. Simple as that."
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
                Schedule a call with our team. We'll answer all your questions and show you exactly how Perpetual Core works for your firm.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/contact-sales?plan=accounting">
                    Schedule Call <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="mailto:accounting@aios.com">Email Us</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gradient-to-b from-muted/50 to-white dark:from-muted/20 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-xl text-muted-foreground">One price. Everything included. No hidden fees.</p>
            </div>

            <Card className="border-2 border-primary">
              <CardHeader className="text-center bg-gradient-to-r from-primary/5 to-purple-500/5 pb-8">
                <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  Most Popular • Early Adopter Pricing
                </div>
                <CardTitle className="text-4xl md:text-5xl mb-3">
                  $499 <span className="text-xl text-muted-foreground font-normal">/CPA/month</span>
                </CardTitle>
                <CardDescription className="text-lg">
                  Everything your accounting firm needs. Cancel anytime.
                </CardDescription>
                <div className="mt-4 text-sm text-muted-foreground">
                  💰 <strong>Volume discounts:</strong> Contact us for pricing for firms with 20+ CPAs
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 mb-8">
                  {[
                    "Unlimited tax research and code lookups",
                    "Your firm's institutional knowledge base",
                    "Client communication templates",
                    "Infinite conversation memory",
                    "Engagement letter & organizer automation",
                    "All AI models (GPT-4, Claude, Gemini)",
                    "Deadline tracking and reminders",
                    "50,000 AI messages/CPA/month",
                    "Unlimited document storage",
                    "Tax software integrations",
                    "Priority support (4-hour response)",
                    "SOC 2 & IRS compliance",
                    "Dedicated account manager",
                    "Custom integrations available",
                    "White-glove implementation included",
                    "Ongoing training and optimization"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-6 mb-8">
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Potential Value</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">Calculate Your Savings</div>
                    <div className="text-sm text-muted-foreground">
                      Use the ROI calculator above to estimate potential time savings and value for your firm.
                    </div>
                  </div>
                </div>

                {/* Money-Back Guarantee */}
                <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-900/10 mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-2">100% Money-Back Guarantee</h3>
                        <p className="text-sm text-muted-foreground">
                          If you don't see measurable ROI within 60 days, we'll refund 100% of your investment.
                          No questions asked. No fine print. We're that confident in the results.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="flex-1 text-lg" asChild>
                    <Link href="/contact-sales?plan=accounting">
                      Schedule Demo <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1 text-lg" asChild>
                    <Link href="/signup?plan=accounting">Start 14-Day Trial</Link>
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  14-day free trial • No credit card required • Cancel anytime • 100% money-back guarantee
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-primary to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Ready to Transform Your Tax Season?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            See how Perpetual Core can help your firm reduce tax research time, answer client questions faster,
            and preserve institutional knowledge for the next generation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" variant="secondary" asChild className="text-lg px-8">
              <Link href="/contact-sales?plan=accounting">
                Schedule Demo <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 bg-transparent border-white text-white hover:bg-white/10">
              <Link href="/signup?plan=accounting">Start Free Trial</Link>
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm opacity-90 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Free trial available</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>IRS compliant</span>
            </div>
          </div>
          <p className="text-sm opacity-75 mt-6">
            Questions? Email us at accounting@aios.com
          </p>
        </div>
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
                The AI-powered knowledge platform built for accounting firms and CPAs.
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
              © 2024 AI Operating System. All rights reserved. | IRS Compliant | SOC 2 Type II Certified | GDPR Ready
            </p>
            <p className="text-xs">
              Perpetual Core is not a CPA firm and does not provide tax, accounting, or audit services. Professional relationships remain between firms and their clients.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
