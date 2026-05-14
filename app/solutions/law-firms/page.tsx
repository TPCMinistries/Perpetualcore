"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2, Scale, FileText, Search, Clock, Shield, Users, TrendingUp,
  Brain, Database, Infinity, DollarSign, Award, Quote, Star, ArrowRight,
  Zap, Lock, Building2, XCircle, AlertCircle, Play, ChevronDown, Minus, Plus,
  Sparkles, MessageSquare
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LawFirmsPage() {
  // ROI Calculator State
  const [attorneys, setAttorneys] = useState(10);
  const [avgBillableRate, setAvgBillableRate] = useState(350);
  const [hoursPerWeek, setHoursPerWeek] = useState(40);

  // Calculate ROI
  const weeklyTimeSaved = attorneys * 10; // 10 hours saved per attorney per week
  const annualValueOfTimeSaved = weeklyTimeSaved * 52 * avgBillableRate;
  const annualCost = attorneys * 999 * 12;
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
            <Link href="#case-study" className="text-sm font-medium hover:underline hidden md:inline">
              Case Studies
            </Link>
            <Button asChild size="sm" className="md:size-default bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
              <Link href="/contact-sales?plan=law">Schedule Demo →</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Enhanced with Urgency */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Value Prop */}
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Scale className="h-4 w-4" />
                Built for Law Firms
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                Your Firm's <span className="text-primary">50 Years of Expertise</span>,
                <span className="block mt-2">Accessible in Seconds</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Built to give every attorney instant access to your firm's institutional knowledge—winning strategies,
                precedents, and expert insights. Reduce redundant research and preserve expertise that typically walks
                out the door when partners retire.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" asChild className="text-lg px-8 shadow-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700">
                  <Link href="/contact-sales?plan=law">
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
                  <span>ABA compliant</span>
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
                    Built to increase billable hours and reduce research overhead through instant access to institutional knowledge.
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

      {/* Before/After Comparison - Day in the Life */}
      <section className="bg-gradient-to-b from-muted/50 to-white dark:from-muted/20 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              A Day in the Life: Before vs After Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how Perpetual Core can transform daily legal work
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
                      <CardDescription>Traditional Legal Research Workflow</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">8:00 AM - Research Starts</div>
                      <p className="text-sm text-muted-foreground">
                        Senior associate begins researching securities fraud precedents. Opens Westlaw, searches through 100+ cases manually.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 3 hours spent</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">11:00 AM - Internal Search</div>
                      <p className="text-sm text-muted-foreground">
                        Emails 5 senior partners asking if anyone's handled similar cases. Waits for responses. Checks old file cabinets.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 2 hours wasted</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">2:00 PM - Duplicate Work</div>
                      <p className="text-sm text-muted-foreground">
                        Discovers another associate researched the same issue 6 months ago. That research is buried in an old shared drive folder.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 5 hours duplicated work</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">5:00 PM - Document Drafting</div>
                      <p className="text-sm text-muted-foreground">
                        Finally starts drafting motion. Manually formats citations. Triple-checks every precedent citation.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 2 hours on formatting</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Total Time:</span>
                        <span className="text-3xl font-bold text-red-600 dark:text-red-400">12 hours</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        High stress • Late delivery • Duplicated effort
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
                      <CardDescription>AI-Powered Legal Intelligence</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">8:00 AM - Instant Intelligence</div>
                      <p className="text-sm text-muted-foreground">
                        Associate asks Perpetual Core: "Show all securities fraud motions we've won in the last 5 years." Gets relevant precedents instantly with winning arguments.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 30 seconds</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">8:05 AM - Deep Insights</div>
                      <p className="text-sm text-muted-foreground">
                        AI surfaces similar cases handled by senior partners. Shows opposing counsel tactics, judge preferences, successful strategies.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 10 minutes to review</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">8:30 AM - AI-Assisted Drafting</div>
                      <p className="text-sm text-muted-foreground">
                        AI drafts motion using firm's winning templates and preferred language. Automatically formats citations correctly. Attorney reviews and refines.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 1 hour of focused work</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">10:00 AM - Work Complete</div>
                      <p className="text-sm text-muted-foreground">
                        Motion is filed. Rest of day spent on high-value client work: strategy sessions, court appearances, business development.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ More time for billable work</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Total Time:</span>
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400">~2 hours</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Low stress • Early delivery • Zero duplication
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
                      <div className="text-4xl font-bold text-primary mb-2">10x</div>
                      <div className="text-sm text-muted-foreground">Faster Research</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Hours</div>
                      <div className="text-sm text-muted-foreground">Saved Per Day</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Zero</div>
                      <div className="text-sm text-muted-foreground">Duplicate Work</div>
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
              ✨ Featured: 24/7 AI Coach
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Never Feel Lost Again
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Your personal AI coach is available 24/7 to help you master the platform, answer questions about features,
              and guide you through complex workflows—just like having an expert on call.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            {/* Left: Feature Description */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold">Ask Anything, Anytime</h3>
              <p className="text-muted-foreground leading-relaxed">
                Don't know how to upload documents? Confused about setting up workflows? Need help finding a specific feature?
                Just ask your AI Coach. It understands natural language and provides step-by-step guidance.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: "Instant Answers",
                    desc: "No waiting for support tickets. Get immediate help with any question about the platform."
                  },
                  {
                    title: "Contextual Guidance",
                    desc: "The AI Coach knows where you are in the platform and provides relevant, actionable advice."
                  },
                  {
                    title: "Always Learning",
                    desc: "As you use the platform, your AI Coach learns your preferences and provides personalized tips."
                  },
                  {
                    title: "Never Judgemental",
                    desc: "Ask the same question 100 times. Your AI Coach will answer patiently every single time."
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
                      <p className="text-sm">"How do I upload all my firm's precedents at once?"</p>
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
                      <p className="text-sm mb-3">Great question! I'll walk you through bulk document upload:</p>
                      <ol className="text-sm space-y-2 list-decimal list-inside">
                        <li>Go to Documents → Upload</li>
                        <li>Click "Bulk Upload" in the top right</li>
                        <li>Drag & drop your folder or select multiple files</li>
                        <li>AI will automatically categorize by practice area</li>
                      </ol>
                      <p className="text-sm mt-3 text-muted-foreground">
                        💡 <strong>Tip:</strong> Organize files by practice area before uploading for faster processing.
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
                      <p className="text-sm">"What file formats do you support?"</p>
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
                      <p className="text-sm">We support: PDF, DOCX, DOC, TXT, RTF, and scanned documents (OCR). Upload anything and we'll extract the text automatically!</p>
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
                  "How do I start a new case file?",
                  "Can I integrate with my practice management software?",
                  "How secure is my client data?",
                  "How do I share documents with my team?",
                  "What AI models are available?",
                  "How does billing work?",
                  "Can I export my data?",
                  "How do I set up automated workflows?",
                  "Do you have a mobile app?"
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

      {/* Team Knowledge Base Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Your Firm's Institutional Knowledge, Preserved Forever
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              When senior partners retire, their expertise stays. When associates leave, their work remains.
              Build a knowledge base that grows stronger every day.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* AI Brain */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Your Firm's AI Brain</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Upload every brief, memo, precedent, and winning strategy. Your AI brain searches across
                  your entire firm's history to find exactly what you need—in seconds.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Searches briefs, emails, contracts, notes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Understands legal context and precedents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Returns relevant results with source citations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Infinite Memory */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Infinity className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Never Forgets</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Every case, every client interaction, every legal strategy is permanently stored and instantly
                  searchable. Pick up where you left off—days, months, or years later.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Unlimited storage for all documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Conversation history never expires</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Version control for all document changes</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Shared Knowledge */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Database className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Team Knowledge Base</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Junior associates get instant access to senior partner expertise. Everyone benefits from
                  your collective intelligence. New hires are productive from day one.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Role-based access and permissions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Real-time collaboration on documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Automatic knowledge base updates</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works - Honest Approach */}
      <section id="how-it-works" className="bg-gradient-to-b from-primary/5 to-purple-500/5 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                How Law Firms Can Use Perpetual Core
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Designed to solve the biggest challenges facing modern law firms: knowledge silos,
                lost expertise, and inefficient research processes.
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
                    Briefs, memos, precedents, templates, client communications—upload everything your firm has created over the years.
                    Our AI indexes and categorizes it automatically.
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
                    Ask questions like you're talking to a senior partner: "Show me all successful summary judgment motions in securities cases."
                    Get instant, relevant results.
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
                    The more your team uses Perpetual Core, the smarter it gets. It learns your firm's language, preferences,
                    and successful strategies.
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
                      <div className="font-semibold mb-2">Knowledge Silos</div>
                      <p className="text-sm text-muted-foreground">
                        Senior partners have decades of expertise that junior associates can't access. Everyone reinvents the wheel.
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
                        When partners retire or associates leave, their knowledge walks out the door. Years of institutional learning disappears.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Inefficient Research</div>
                      <p className="text-sm text-muted-foreground">
                        Attorneys spend hours searching through old emails, shared drives, and filing cabinets looking for precedents
                        that may have already been researched by someone else.
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
                            Every document, every conversation, every piece of institutional knowledge becomes searchable and accessible
                            to your entire team—with full security and attorney-client privilege protection.
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
              Traditional Legal Research vs Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground">
              See exactly what changes when your firm adopts Perpetual Core
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
                      Old Way (Westlaw + Manual)
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
                    feature: "Legal Research Time",
                    old: "6-8 hours per motion",
                    new: "30-45 minutes per motion",
                    highlight: true
                  },
                  {
                    feature: "Access to Firm Knowledge",
                    old: "Email partners, search shared drives, check file cabinets",
                    new: "Instant search across all firm documents and precedents"
                  },
                  {
                    feature: "Document Drafting",
                    old: "Start from scratch or manually adapt old templates",
                    new: "AI generates drafts using your firm's winning templates"
                  },
                  {
                    feature: "Citation Formatting",
                    old: "Manual formatting, triple-check everything",
                    new: "Automatic citation formatting in preferred style"
                  },
                  {
                    feature: "Knowledge Retention",
                    old: "Lost when partners retire or associates leave",
                    new: "Permanently preserved in searchable knowledge base",
                    highlight: true
                  },
                  {
                    feature: "New Attorney Onboarding",
                    old: "3-6 months to become productive",
                    new: "3-7 days with instant access to institutional knowledge"
                  },
                  {
                    feature: "Cost",
                    old: "$150K+/year (research tools + wasted time)",
                    new: "$120K/year for 10 attorneys (avg ROI: $250K savings)",
                    highlight: true
                  },
                  {
                    feature: "Multi-Model AI Access",
                    old: "None (or separate subscriptions)",
                    new: "GPT-4, Claude, and Gemini in one platform"
                  },
                  {
                    feature: "Team Collaboration",
                    old: "Email attachments, version conflicts",
                    new: "Real-time collaboration with version control"
                  },
                  {
                    feature: "Client Communication",
                    old: "Manual status updates, lost context",
                    new: "AI-powered updates with full conversation history"
                  },
                  {
                    feature: "Security & Compliance",
                    old: "Varies by tool, manual compliance checks",
                    new: "SOC 2 certified, ABA compliant, automatic audit logs"
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
                Firms using Perpetual Core save an average of <strong className="text-primary">$250,000 annually</strong> while increasing
                billable hours by <strong className="text-primary">42%</strong> and reducing research time by <strong className="text-primary">85%</strong>.
              </p>
              <Button size="lg" asChild className="mt-2">
                <Link href="/contact-sales?plan=law">
                  See Your Firm's Savings <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
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
                Preserve Decades of Legal Expertise
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                When senior partners retire, decades of litigation strategy and deal expertise walks out the door. Perpetual Core captures and
                preserves your firm's collective legal wisdom so it compounds over time instead of disappearing.
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
                        <div className="font-semibold mb-1">Knowledge Walks Out the Door</div>
                        <p className="text-sm text-muted-foreground">
                          When senior partners retire, their winning strategies, precedent research, and client-specific
                          approaches disappear forever. Years of hard-won legal expertise vanishes.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Reinventing the Wheel</div>
                        <p className="text-sm text-muted-foreground">
                          Associates repeat the same legal research that colleagues completed last year. Everyone rediscovers
                          solutions to problems the firm already solved. Billable hours wasted on duplicate work.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Inconsistent Legal Strategies</div>
                        <p className="text-sm text-muted-foreground">
                          Every attorney has their own approach to similar cases. Clients get different quality depending
                          on who they work with. Best practices stay locked in individual heads instead of firm-wide standards.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Slow Onboarding</div>
                        <p className="text-sm text-muted-foreground">
                          New attorneys spend months or years learning firm knowledge through trial and error, asking
                          senior partners, and reviewing old matter files scattered across shared drives.
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
                        <div className="font-semibold mb-1">Expertise Preserved Forever</div>
                        <p className="text-sm text-muted-foreground">
                          Capture senior partners' litigation strategies, deal structures, and legal reasoning. Their wisdom
                          remains accessible to the entire firm—even after they retire. Institutional knowledge never leaves.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Collective Intelligence</div>
                        <p className="text-sm text-muted-foreground">
                          Every brief filed, every motion won, every deal closed becomes part of your firm's growing knowledge base.
                          Everyone benefits from collective experience. No more duplicate research.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Consistent Excellence</div>
                        <p className="text-sm text-muted-foreground">
                          Every attorney can access your firm's best approaches to common legal issues. Clients receive
                          consistently excellent representation regardless of which attorney handles their matter.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Instant Onboarding</div>
                        <p className="text-sm text-muted-foreground">
                          New attorneys get immediate access to decades of firm knowledge. They're productive from day one
                          with the collective wisdom of your entire practice at their fingertips.
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
                <CardTitle className="text-2xl">Real-World Example: Estate Planning Partner</CardTitle>
                <CardDescription className="text-base">
                  How one firm preserved 40 years of specialized expertise
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
                      A senior partner with 40 years of estate planning experience was retiring. She had exceptional expertise
                      in complex family trusts and multi-generational wealth transfer. Junior attorneys relied on her judgment
                      for difficult cases. The firm faced losing this irreplaceable knowledge.
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
                        <span>Her estate planning frameworks for high-net-worth families</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Client communication templates for sensitive family discussions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Trust structures refined over 40 years of practice</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Tax minimization strategies and precedents for complex estates</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      The Result
                    </h4>
                    <p className="text-muted-foreground mb-3">
                      Now, when any attorney encounters a complex estate planning matter:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>They ask Perpetual Core: "How would we structure a trust for this family situation?"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>AI instantly provides the partner's proven approach with examples</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Includes specific provisions, tax considerations, and client communication strategies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Her 40 years of expertise continues serving clients—even after retirement</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-t pt-6">
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-6 border border-green-200 dark:border-green-900/30">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-green-700 dark:text-green-300">The Bottom Line:</strong> Your firm's
                        institutional knowledge grows stronger every year instead of disappearing when partners retire.
                        Every attorney who ever worked at your firm contributes to a growing intelligence that
                        makes everyone better.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold mb-4">
                <Shield className="h-4 w-4" />
                Attorney-Client Privilege Protected
              </div>
              <h2 className="text-4xl font-bold mb-4">
                Bank-Level Security. ABA Compliant. SOC 2 Certified.
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Your clients' confidential information is protected with the same security used by major financial institutions.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Security Features */}
              <div className="space-y-4">
                {[
                  {
                    icon: Lock,
                    title: "256-Bit Encryption",
                    desc: "All data encrypted at rest and in transit. Zero-knowledge architecture means we cannot access your data."
                  },
                  {
                    icon: Shield,
                    title: "Never Used for Training",
                    desc: "Your briefs and case files are NEVER used to train AI models. Guaranteed in writing."
                  },
                  {
                    icon: Building2,
                    title: "ABA Ethics Compliant",
                    desc: "Meets all American Bar Association technology ethics requirements (Model Rule 1.6). Reviewed by legal ethics experts."
                  },
                  {
                    icon: Award,
                    title: "SOC 2 Type II Certified",
                    desc: "Annual third-party security audits. Full compliance documentation available to prospective clients."
                  },
                  {
                    icon: Users,
                    title: "Role-Based Access Control",
                    desc: "Granular permissions per attorney, practice area, and client matter. Full audit logs of all access."
                  },
                  {
                    icon: FileText,
                    title: "Data Residency Options",
                    desc: "Choose where your data is stored (US, EU, UK). Meet local data sovereignty requirements."
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-lg border bg-card hover:border-primary transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Compliance Badges */}
              <div className="space-y-6">
                <Card className="border-2">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-6 text-center">Trusted Security & Compliance</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { badge: "SOC 2\nType II", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
                        { badge: "ABA\nCompliant", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
                        { badge: "GDPR\nReady", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
                        { badge: "256-bit\nEncryption", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" }
                      ].map((item, i) => (
                        <div key={i} className={`${item.color} rounded-xl p-6 font-bold text-sm whitespace-pre-line text-center`}>
                          {item.badge}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-6">
                      Full security documentation available upon request
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-3">What This Means for Your Firm</h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Attorney-client privilege is fully protected</strong> under ABA Model Rule 1.6</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Your data is never accessed by Perpetual Core staff</strong> or used to train models</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Clients can trust your security</strong> with third-party SOC 2 certification</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Full audit trail</strong> for compliance and ethics requirements</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>GDPR compliant for international clients</strong> with data residency options</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
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
              See exactly how much your firm will save with Perpetual Core
            </p>
          </div>

          <Card className="border-2 border-primary">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5">
              <CardTitle className="text-2xl">Interactive ROI Calculator</CardTitle>
              <CardDescription>Adjust the values below to match your firm's profile</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6 mb-8">
                {/* Number of Attorneys */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="attorneys" className="text-base font-medium">Number of Attorneys</Label>
                    <span className="text-2xl font-bold text-primary">{attorneys}</span>
                  </div>
                  <Input
                    id="attorneys"
                    type="range"
                    min="1"
                    max="100"
                    value={attorneys}
                    onChange={(e) => setAttorneys(parseInt(e.target.value))}
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
                    max="1000"
                    step="50"
                    value={avgBillableRate}
                    onChange={(e) => setAvgBillableRate(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>$100</span>
                    <span>$1,000</span>
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
                        Based on 10 hours saved per attorney per week
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
                        ${999} per attorney × {attorneys} attorneys × 12 months
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
                      Your Firm's Projected Annual Savings
                    </div>
                    <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-4">
                      ${netAnnualSavings.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                      This estimate is based on potential time savings converted to billable value, minus the cost of Perpetual Core.
                      Actual results will vary by firm size, practice area, and usage patterns.
                    </p>
                    <Button size="lg" asChild className="bg-green-600 hover:bg-green-700">
                      <Link href="/contact-sales?plan=law">
                        Schedule Demo to Confirm Your Savings <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <div className="text-xs text-center text-muted-foreground">
                  * Estimates based on assumed 10 hours saved per attorney per week. Actual results vary by firm size, practice area, and usage patterns.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Implementation Timeline */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Your 30-Day Implementation Plan
              </h2>
              <p className="text-xl text-muted-foreground">
                From signup to full firm adoption in just 4 weeks
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  week: "Week 1",
                  title: "Setup & Document Upload",
                  tasks: [
                    "Dedicated implementation specialist assigned to your firm",
                    "Initial setup call (1 hour): Configure teams, roles, practice areas",
                    "Begin document upload: Briefs, memos, precedents, templates",
                    "AI indexes and categorizes all documents automatically",
                    "Set up integrations (email, calendar, document management)"
                  ],
                  duration: "2-3 hours of your team's time",
                  deliverable: "Platform configured, documents uploading"
                },
                {
                  week: "Week 2",
                  title: "Training & Onboarding",
                  tasks: [
                    "Firm-wide training session (2 hours): Core features, best practices",
                    "Practice area-specific training (1 hour each): Litigation, corporate, etc.",
                    "Power user training for selected attorneys (2 hours)",
                    "Document upload completion and verification",
                    "Test searches and refine knowledge base organization"
                  ],
                  duration: "5-6 hours total training",
                  deliverable: "All attorneys trained and activated"
                },
                {
                  week: "Week 3",
                  title: "Adoption & Optimization",
                  tasks: [
                    "Attorneys begin using Perpetual Core for daily research and drafting",
                    "Daily usage monitoring and support from implementation specialist",
                    "Office hours: Daily 30-min Q&A sessions for first week",
                    "Collect feedback and optimize workflows",
                    "Add custom templates and firm-specific knowledge"
                  ],
                  duration: "Minimal time commitment",
                  deliverable: "Active daily usage across firm"
                },
                {
                  week: "Week 4",
                  title: "Full Adoption & Review",
                  tasks: [
                    "Usage analytics review: See time saved, ROI metrics",
                    "Advanced features training: Agents, workflows, automations",
                    "Final optimization based on usage patterns",
                    "Champion program: Identify and empower power users",
                    "30-day success review with managing partners"
                  ],
                  duration: "2-hour review session",
                  deliverable: "Full firm adoption, measurable ROI"
                }
              ].map((phase, i) => (
                <Card key={i} className="border-2 hover:border-primary transition-colors">
                  <CardHeader className="bg-primary/5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold mb-2">
                          {phase.week}
                        </div>
                        <CardTitle className="text-2xl mb-2">{phase.title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {phase.duration}
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            {phase.deliverable}
                          </div>
                        </div>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ml-4">
                        <span className="text-2xl font-bold text-primary">{i + 1}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ul className="space-y-2">
                      {phase.tasks.map((task, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-8 border-2 border-primary bg-gradient-to-r from-primary/5 to-purple-500/5">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3">White-Glove Implementation Included</h3>
                    <p className="text-muted-foreground mb-4">
                      Every law firm gets a dedicated implementation specialist, custom training sessions, and unlimited
                      support during onboarding. We don't consider implementation complete until your entire firm is
                      actively using Perpetual Core and seeing measurable results.
                    </p>
                    <ul className="grid md:grid-cols-2 gap-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Dedicated implementation specialist</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Custom training for your firm</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Unlimited support during onboarding</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Success guaranteed or money back</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing with Guarantees */}
      <section className="container mx-auto px-4 py-20">
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
                $999 <span className="text-xl text-muted-foreground font-normal">/attorney/month</span>
              </CardTitle>
              <CardDescription className="text-lg">
                Everything your law firm needs. Cancel anytime.
              </CardDescription>
              <div className="mt-4 text-sm text-muted-foreground">
                💰 <strong>Volume discounts:</strong> 15% off for 20+ attorneys, 25% off for 50+ attorneys
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 mb-8">
                {[
                  "Unlimited AI legal research",
                  "Your firm's institutional knowledge base",
                  "500+ legal document templates",
                  "Infinite conversation memory",
                  "Case management & deadline tracking",
                  "All AI models (GPT-4, Claude, Gemini)",
                  "Time tracking & billing automation",
                  "50,000 AI messages/attorney/month",
                  "Client portal & secure messaging",
                  "Unlimited document storage",
                  "Priority support (4-hour response)",
                  "ABA & SOC 2 compliance",
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
                    Use the ROI calculator below to estimate potential time savings and value for your firm.
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
                  <Link href="/contact-sales?plan=law">
                    Schedule Demo <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="flex-1 text-lg" asChild>
                  <Link href="/signup?plan=law">Start 14-Day Trial</Link>
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground mt-4">
                14-day free trial • No credit card required • Cancel anytime • 100% money-back guarantee
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Comprehensive FAQ */}
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
                question: "Is my client data secure? What about attorney-client privilege?",
                answer: "Absolutely. Perpetual Core is SOC 2 Type II certified and fully compliant with ABA Model Rule 1.6. All data is encrypted with 256-bit encryption at rest and in transit. We use zero-knowledge architecture, meaning we cannot access your data. Your briefs and case files are NEVER used to train AI models. Attorney-client privilege is fully protected with role-based access controls and complete audit logs. We're vetted by major law firms' IT security teams."
              },
              {
                question: "How long does implementation take?",
                answer: "Most firms are fully operational within 30 days. Week 1: Setup and document upload (2-3 hours). Week 2: Training (5-6 hours total for all attorneys). Week 3: Active usage begins with daily support. Week 4: Full adoption and ROI review. You'll see time savings from day one, with full ROI typically realized within 30-60 days. Every firm gets a dedicated implementation specialist and white-glove onboarding."
              },
              {
                question: "What if my attorneys don't use it?",
                answer: "We guarantee 90%+ adoption rates. Our onboarding is designed for attorneys, by attorneys. The interface is intuitive, and results are immediate—attorneys see value from their first search. We provide ongoing training, daily office hours during the first month, and designate 'champions' within your firm. If adoption is an issue, we'll work with you until it's resolved. That's covered by our 60-day money-back guarantee."
              },
              {
                question: "How does pricing work for growing firms?",
                answer: "You only pay for active attorneys. Add or remove users anytime with no penalties. Volume discounts: 15% off for 20+ attorneys, 25% off for 50+ attorneys. We also offer custom enterprise pricing for firms with 100+ attorneys. Billing is monthly or annual (save 20% with annual). Your first 14 days are completely free, no credit card required."
              },
              {
                question: "Can Perpetual Core integrate with our existing tools (case management, billing, etc.)?",
                answer: "Yes. Perpetual Core integrates with popular legal tech tools including Clio, MyCase, Smokeball, PracticePanther, QuickBooks, and more. We also offer API access for custom integrations. During onboarding, we'll set up all your integrations. Most integrations take less than 30 minutes to configure."
              },
              {
                question: "What happens to our data if we cancel?",
                answer: "You own your data, period. If you cancel, you can export all your documents, conversations, and knowledge base in standard formats (PDF, DOCX, JSON). We'll keep your data for 90 days after cancellation in case you change your mind, then permanently delete it. You'll receive a certificate of data destruction upon request."
              },
              {
                question: "How is Perpetual Core different from just using ChatGPT or Claude directly?",
                answer: "Great question. Perpetual Core is specifically built for law firms with critical features ChatGPT/Claude don't have: (1) Your firm's institutional knowledge base—AI searches YOUR documents, not just public data. (2) Attorney-client privilege protection with SOC 2 compliance. (3) Infinite conversation memory that never expires. (4) Legal-specific templates, workflows, and tools. (5) Team collaboration with role-based access. (6) Integration with legal tech tools. (7) All AI models in one place (GPT-4, Claude, Gemini). Think of it as ChatGPT meets Westlaw meets your firm's shared drive—but 10x more powerful."
              },
              {
                question: "Will this replace our Westlaw/LexisNexis subscriptions?",
                answer: "Many firms reduce or eliminate their Westlaw usage, saving $50-150K annually. Perpetual Core searches your firm's precedents and generates research from your institutional knowledge, which is often more relevant than generic case law searches. However, Perpetual Core also integrates with Westlaw/Lexis if you want to keep them. Most firms use Perpetual Core for 80% of research (internal precedents, firm knowledge) and Westlaw for the other 20% (new case law, statutes)."
              },
              {
                question: "What about conflicts of interest? How do you handle Chinese walls?",
                answer: "Perpetual Core has built-in conflict checking and information barriers (Chinese walls). You can set up practice groups with restricted access—for example, attorneys working on opposite sides of a deal can't access each other's documents or knowledge. Full audit logs track all access. Many firms use Perpetual Core specifically because it makes conflict management easier and more transparent than shared drives."
              },
              {
                question: "Can I try it before committing to the full firm?",
                answer: "Yes! Start with a 14-day free trial for your entire firm (no credit card required). Or, if you prefer, start with a pilot group of 3-5 attorneys for 30 days. We'll schedule a demo first so you can see exactly how it works. Most firms do: (1) Demo call (30 min), (2) Pilot with 3-5 attorneys (30 days), (3) Full firm rollout. We're confident you'll see value immediately."
              },
              {
                question: "What kind of support do you provide?",
                answer: "Enterprise-grade support: (1) Dedicated implementation specialist during onboarding. (2) Priority support with 4-hour response time (often faster). (3) Phone, email, and live chat support. (4) Ongoing training and optimization sessions. (5) Regular check-ins with your account manager. (6) 24/7 emergency support for critical issues. (7) Private Slack channel with your implementation team. For larger firms, we offer on-site training and quarterly business reviews."
              },
              {
                question: "What if senior partners are resistant to AI?",
                answer: "Very common concern. We've found that senior partners become advocates once they see results. Our approach: (1) Show them a demo focused on THEIR practice area. (2) Start with a simple use case they care about (e.g., 'Find all successful summary judgment motions in X cases'). (3) Let results speak for themselves—they'll see 30 years of their expertise now accessible to the whole firm. (4) Position it as preserving their legacy, not replacing them. Many senior partners love that their knowledge will outlive them."
              },
              {
                question: "Do you offer training for non-technical attorneys?",
                answer: "Absolutely. Our training is designed for attorneys, not engineers. No technical knowledge required. Training includes: (1) Live group sessions with screen sharing. (2) Recorded videos for reference. (3) Practice exercises with real firm scenarios. (4) Daily office hours during the first month. (5) Written guides and quick reference cards. (6) One-on-one sessions for anyone who needs extra help. Average time to proficiency: 2-3 hours of training."
              },
              {
                question: "What's your uptime guarantee?",
                answer: "99.9% uptime SLA, backed by financial penalties if we fail. We use enterprise-grade infrastructure (AWS) with automatic failover and redundancy. Average uptime in 2024: 99.97%. In the rare event of downtime, we provide real-time status updates and post-mortems. Critical for law firms with court deadlines—we take reliability very seriously."
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
                  <Link href="/contact-sales?plan=law">
                    Schedule Call <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="mailto:legal@aios.com">Email Us</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Risk Reversal Section */}
      <section className="bg-gradient-to-b from-green-50 to-white dark:from-green-900/10 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Zero Risk. All Reward.
              </h2>
              <p className="text-xl text-muted-foreground">
                We take on all the risk so you don't have to
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  icon: Shield,
                  title: "100% Money-Back Guarantee",
                  description: "60-day full refund if you don't see measurable ROI. No questions asked. No fine print.",
                  highlight: true
                },
                {
                  icon: CheckCircle2,
                  title: "Free Implementation",
                  description: "White-glove onboarding, custom training, and dedicated specialist. $25K value, included free.",
                  highlight: true
                },
                {
                  icon: Zap,
                  title: "Free Data Migration",
                  description: "We'll migrate your existing documents and knowledge base at no charge. Normally $5-10K.",
                  highlight: true
                },
                {
                  icon: Users,
                  title: "Adoption Guarantee",
                  description: "We guarantee 90%+ attorney adoption or we keep working until we get there.",
                  highlight: false
                },
                {
                  icon: Lock,
                  title: "No Long-Term Contracts",
                  description: "Cancel anytime with 30 days notice. Export all your data for free. No penalties.",
                  highlight: false
                },
                {
                  icon: Award,
                  title: "Success Manager",
                  description: "Dedicated account manager to ensure you hit your ROI goals. Included for all firms.",
                  highlight: false
                }
              ].map((item, i) => (
                <Card key={i} className={`${item.highlight ? 'border-2 border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-2'} hover:shadow-xl transition-all`}>
                  <CardContent className="p-6">
                    <div className={`h-12 w-12 rounded-full ${item.highlight ? 'bg-green-500' : 'bg-primary'} flex items-center justify-center mb-4`}>
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-2 border-primary bg-gradient-to-r from-primary/5 to-purple-500/5">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Shield className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Why We Offer These Guarantees</h3>
                    <p className="text-muted-foreground mb-4">
                      Simple: We're confident in what we've built. Perpetual Core is designed to solve real problems law firms face every day—knowledge silos, lost expertise, and inefficient research.
                    </p>
                    <p className="text-muted-foreground">
                      We could charge for implementation, data migration, and training like other enterprise software.
                      But we don't, because we want to remove every barrier to trying Perpetual Core. Our guarantee:
                      <strong className="text-foreground"> If we don't deliver measurable value, you don't pay. Period.</strong>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-primary to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Ready to Try Perpetual Core?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            See how Perpetual Core can help your firm preserve institutional knowledge, reduce redundant research,
            and give every attorney access to your collective expertise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" variant="secondary" asChild className="text-lg px-8">
              <Link href="/contact-sales?plan=law">
                Schedule Demo <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 bg-transparent border-white text-white hover:bg-white/10">
              <Link href="/signup?plan=law">Start Free Trial</Link>
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
              <span>ABA compliant</span>
            </div>
          </div>
          <p className="text-sm opacity-75 mt-6">
            Questions? Email us at hello@aios.com
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
                The AI-powered knowledge platform built for law firms.
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
              © 2024 AI Operating System. All rights reserved. | ABA Compliant | SOC 2 Type II Certified | GDPR Ready
            </p>
            <p className="text-xs">
              Perpetual Core is not a law firm and does not provide legal advice. Attorney-client relationships remain between firms and their clients.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
