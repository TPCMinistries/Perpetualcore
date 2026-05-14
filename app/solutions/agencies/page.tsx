"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2, Rocket, FileText, Palette, Users, Briefcase, Sparkles, TrendingUp,
  Brain, Database, Infinity, DollarSign, Shield, ArrowRight,
  Zap, Lock, XCircle, AlertCircle, MessageSquare, Minus, Plus,
  Clock, Award, Building2, Calendar, Target
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AgenciesPage() {
  // ROI Calculator State
  const [teamSize, setTeamSize] = useState(10);
  const [avgHourlyRate, setAvgHourlyRate] = useState(150);
  const [clientsPerMonth, setClientsPerMonth] = useState(5);

  // Calculate ROI
  const weeklyTimeSaved = teamSize * 8; // 8 hours saved per team member per week
  const annualValueOfTimeSaved = weeklyTimeSaved * 52 * avgHourlyRate;
  const annualCost = teamSize * 199 * 12;
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
            <Link href="#features" className="text-sm font-medium hover:underline hidden md:inline">
              Features
            </Link>
            <Button asChild size="sm" className="md:size-default bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
              <Link href="/contact-sales?plan=agency">Schedule Demo →</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-transparent"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Value Prop */}
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Rocket className="h-4 w-4" />
                Built for Creative & Marketing Agencies
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                Your Agency's <span className="text-primary">Collective Knowledge</span>,
                <span className="block mt-2">Always at Your Fingertips</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Built to give every team member instant access to your agency's best work—winning campaigns,
                brand guidelines, client briefs, and creative strategies. Reduce redundant work and preserve
                expertise that typically leaves when talent walks out the door.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" asChild className="text-lg px-8 shadow-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700">
                  <Link href="/contact-sales?plan=agency">
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
                  <span>No credit card required</span>
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
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">Real Value</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Built to increase productivity and reduce wasted time through instant access to your agency's institutional knowledge.
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
              See how Perpetual Core can transform daily agency work
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
                      <CardDescription>Traditional Agency Workflow</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">9:00 AM - Client Brief Arrives</div>
                      <p className="text-sm text-muted-foreground">
                        New social media campaign brief. Account manager searches email, Slack, and Google Drive for similar past campaigns. Can't find that one successful campaign from 6 months ago.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 1.5 hours searching</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">11:00 AM - Creative Kickoff</div>
                      <p className="text-sm text-muted-foreground">
                        Designers start from scratch because they can't find the client's brand guidelines. Copy templates exist somewhere, but no one knows where. Creative director is in meetings.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 2 hours of duplicate work</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">2:00 PM - Asset Organization</div>
                      <p className="text-sm text-muted-foreground">
                        Junior designer spends hours organizing files. "Final_v2_FINAL_actualfinal.png" exists in three different folders. Version control is a nightmare.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 2 hours on file management</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">5:00 PM - Client Update</div>
                      <p className="text-sm text-muted-foreground">
                        Account manager manually writes progress email. Searches through Slack for updates from design and copy teams. Missing key details. Client replies with questions.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 1 hour on status updates</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Total Time Wasted:</span>
                        <span className="text-3xl font-bold text-red-600 dark:text-red-400">6.5 hours</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        High stress • Missed deadlines • Frustrated team
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
                      <CardDescription>AI-Powered Agency Intelligence</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">9:00 AM - Instant Intelligence</div>
                      <p className="text-sm text-muted-foreground">
                        Account manager asks Perpetual Core: "Show all successful social campaigns for retail clients." Gets 5 relevant campaigns with performance data, creative assets, and what worked.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 2 minutes</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">9:15 AM - Creative Brief Auto-Generated</div>
                      <p className="text-sm text-muted-foreground">
                        AI creates comprehensive creative brief using client's brand guidelines, past successful approaches, and campaign objectives. Designer reviews and refines.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 15 minutes to review</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">10:00 AM - Efficient Creation</div>
                      <p className="text-sm text-muted-foreground">
                        Team has everything they need: brand assets, copy templates, previous winning concepts. AI suggests headlines based on what's worked before. All files properly organized and versioned.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 2 hours of focused creative work</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">12:30 PM - Campaign Ready</div>
                      <p className="text-sm text-muted-foreground">
                        First draft complete. AI generates client presentation with campaign rationale. Rest of day spent on strategy, new business, and creative refinement.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ More time for strategic work</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Total Time:</span>
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400">~2.5 hours</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Low stress • On-time delivery • Happy team
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
                    <em>Illustrative example showing potential time savings. Actual results vary by agency and project type.</em>
                  </p>
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">4x</div>
                      <div className="text-sm text-muted-foreground">Faster Project Start</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Hours</div>
                      <div className="text-sm text-muted-foreground">Saved Per Project</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Zero</div>
                      <div className="text-sm text-muted-foreground">Lost Knowledge</div>
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
                Don't know how to organize client assets? Confused about setting up workflows? Need help finding a specific campaign?
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
                      <p className="text-sm">"How do I upload all our client brand guidelines at once?"</p>
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
                        <li>Go to Assets → Upload</li>
                        <li>Click "Bulk Upload" in the top right</li>
                        <li>Drag & drop your folder or select multiple files</li>
                        <li>AI will automatically categorize by client</li>
                      </ol>
                      <p className="text-sm mt-3 text-muted-foreground">
                        💡 <strong>Tip:</strong> Organize files by client before uploading for faster processing.
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
                      <p className="text-sm">We support: PDF, DOCX, DOC, TXT, PNG, JPG, SVG, AI, PSD, and more. Upload anything and we'll organize it automatically!</p>
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
                  "How do I start a new client project?",
                  "Can I integrate with our project management tools?",
                  "How secure is our client data?",
                  "How do I share assets with my team?",
                  "What AI models are available?",
                  "How does billing work?",
                  "Can I export our data?",
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
      <section className="container mx-auto px-4 py-20 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Your Agency's Collective Knowledge, Preserved Forever
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              When senior creatives leave, their expertise stays. When account managers move on, their client insights remain.
              Build a knowledge base that grows stronger every day.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Agency Brain */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Your Agency's AI Brain</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Upload every campaign, brief, brand guideline, and winning strategy. Your AI brain searches across
                  your entire agency's history to find exactly what you need—in seconds.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Searches campaigns, briefs, assets, notes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Understands creative context and strategy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Returns relevant results with source files</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Infinite Memory */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Infinity className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Never Forgets</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Every campaign, every client interaction, every creative strategy is permanently stored and instantly
                  searchable. Pick up where you left off—days, months, or years later.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Unlimited storage for all assets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Conversation history never expires</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Version control for all file changes</span>
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
                  Junior designers get instant access to senior creative expertise. Everyone benefits from
                  your collective intelligence. New hires are productive from day one.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Role-based access and permissions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Real-time collaboration on projects</span>
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

      {/* How It Works */}
      <section id="how-it-works" className="bg-gradient-to-b from-primary/5 to-purple-500/5 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                How Creative Agencies Can Use Perpetual Core
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Designed to solve the biggest challenges facing modern agencies: scattered assets,
                lost expertise, and inefficient project kickoffs.
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
                    Campaigns, briefs, brand guidelines, templates, client assets—upload everything your agency has created.
                    Our AI indexes and categorizes it automatically.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Search in Natural Language</h3>
                  <p className="text-muted-foreground text-sm">
                    Ask questions like you're talking to a creative director: "Show me all successful social campaigns for retail clients."
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
                    The more your team uses Perpetual Core, the smarter it gets. It learns your agency's style, preferences,
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
                      <div className="font-semibold mb-2">Scattered Assets</div>
                      <p className="text-sm text-muted-foreground">
                        Brand guidelines in email, campaign assets in Dropbox, briefs in Google Drive, templates in Slack. Finding anything takes forever.
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
                        When senior creatives leave or account managers move on, their knowledge walks out the door. Years of client insights disappear.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Inefficient Kickoffs</div>
                      <p className="text-sm text-muted-foreground">
                        Team members spend hours searching for past campaigns, brand guidelines, and successful strategies
                        that may have already been done by someone else.
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
                            Every campaign, every conversation, every piece of institutional knowledge becomes searchable and accessible
                            to your entire team—with full security and client confidentiality protection.
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

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything Your Agency Needs</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered tools designed to help creative teams work smarter and faster
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <FileText className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Content Generation</CardTitle>
              <CardDescription>
                AI can help create blog posts, social media content, ad copy, and more based on your brand guidelines.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Blog post drafting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Social media content ideas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Ad copywriting assistance</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Palette className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Creative Assistance</CardTitle>
              <CardDescription>
                Built to help generate design concepts, color schemes, and creative briefs automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Design concept brainstorming</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Brand guideline organization</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Creative brief templates</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Briefcase className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Project Organization</CardTitle>
              <CardDescription>
                Designed to help with project planning, asset management, and deadline tracking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Asset organization & search</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Project timeline assistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Team collaboration tools</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Client Communication</CardTitle>
              <CardDescription>
                AI can help automate client updates, reports, and proposals with generated content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Status update drafts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Proposal assistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Performance report generation</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Target className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Campaign Management</CardTitle>
              <CardDescription>
                Built to help track campaigns, organize deliverables, and maintain brand consistency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Campaign tracking & insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Deliverable checklists</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Brand consistency checks</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Calendar className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>
                Your agency's institutional knowledge preserved and searchable forever.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Searchable campaign archive</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Client history & preferences</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Best practices library</span>
                </li>
              </ul>
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
                Your Agency's Institutional Brain
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Preserve Your Creative Directors' Expertise
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                When senior creatives leave, their award-winning campaign strategies, client briefs, and brand positioning frameworks
                walk out the door. Perpetual Core captures and preserves your agency's collective creative wisdom so it compounds over time
                instead of disappearing.
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
                  <CardDescription className="text-base">Creative genius walks out the door</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Creative Directors Leave, Campaigns Suffer</div>
                        <p className="text-sm text-muted-foreground">
                          When your award-winning creative director quits, their campaign frameworks, brand positioning strategies,
                          and client pitch templates disappear. New creatives start from scratch.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Reinventing Creative Briefs Every Time</div>
                        <p className="text-sm text-muted-foreground">
                          Each account manager writes briefs differently. Designers dig through Slack and old emails to find
                          that perfect campaign from 6 months ago. Nobody can find it.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Client Knowledge Scattered Everywhere</div>
                        <p className="text-sm text-muted-foreground">
                          Brand guidelines in Google Drive, winning campaign assets in Dropbox, client preferences in old emails.
                          Teams waste hours searching instead of creating.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Junior Creatives Learn by Trial and Error</div>
                        <p className="text-sm text-muted-foreground">
                          New hires don't know what campaigns worked, what clients loved, or how senior creatives pitched ideas.
                          They repeat mistakes and miss opportunities.
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
                  <CardDescription className="text-base">Creative genius stays forever</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Capture Creative Directors' Frameworks Forever</div>
                        <p className="text-sm text-muted-foreground">
                          Document your senior creatives' campaign strategies, client pitch approaches, and brand positioning frameworks.
                          When they leave, their 15 years of expertise stays—accessible to every creative, forever.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Every Winning Campaign Becomes a Template</div>
                        <p className="text-sm text-muted-foreground">
                          AI indexes award-winning campaigns, successful briefs, and high-performing creative concepts. Search "retail
                          social campaigns" and instantly find 5 proven examples with performance data.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">All Client Knowledge in One Searchable Place</div>
                        <p className="text-sm text-muted-foreground">
                          Brand guidelines, campaign archives, client preferences, and creative assets—all indexed and searchable.
                          Find anything in seconds instead of hunting through drives and emails.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Junior Creatives Learn from the Best Immediately</div>
                        <p className="text-sm text-muted-foreground">
                          New hires ask AI: "Show me successful tech brand campaigns" or "How did we pitch the Jones account?"
                          They instantly access years of agency wisdom and create better work faster.
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
                    <h3 className="text-2xl font-bold mb-2">Real Example: Award-Winning Creative Director</h3>
                    <p className="text-muted-foreground">
                      How one agency preserved 12 years of campaign brilliance
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
                      Creative director with 12 years at the agency announced she was leaving to start her own shop. She'd led
                      8 award-winning campaigns and had a 90% client retention rate. Her creative brief templates, brand positioning
                      frameworks, client pitch decks, and campaign strategy playbooks lived in her head and scattered across old
                      project folders. The agency panicked—losing her meant losing their competitive edge.
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
                      During her 3-month notice period, she documented everything in Perpetual Core: her creative brief frameworks, campaign
                      ideation process, client pitch templates, brand positioning strategies, and what made each winning campaign work.
                      AI indexed her 12 years of campaigns—successful social strategies, video campaign approaches, brand launch
                      playbooks, client onboarding processes. Every junior creative could now search and learn from her work.
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
                      Six months after she left, the agency won <strong>3 new awards</strong> and <strong>retained 95%</strong> of clients.
                      Why? Every creative now had instant access to her 12 years of brilliance. Junior creatives searched her campaign
                      frameworks before pitches. Account managers used her client brief templates. The new creative director built on
                      her foundation instead of starting over. The agency turned one legend's career into permanent institutional knowledge.
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t">
                  <p className="text-center text-sm text-muted-foreground italic">
                    "We thought losing our creative director would destroy us. Instead, Perpetual Core preserved her genius and made our entire
                    team better. Now when anyone leaves, their best work stays forever."
                    <span className="block mt-2 font-semibold not-italic">— Agency Founder</span>
                  </p>
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
                Client Confidentiality Protected
              </div>
              <h2 className="text-4xl font-bold mb-4">
                Bank-Level Security. SOC 2 Certified.
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
                    desc: "Your campaigns and client files are NEVER used to train AI models. Guaranteed in writing."
                  },
                  {
                    icon: Award,
                    title: "SOC 2 Type II Certified",
                    desc: "Annual third-party security audits. Full compliance documentation available to prospective clients."
                  },
                  {
                    icon: Users,
                    title: "Role-Based Access Control",
                    desc: "Granular permissions per team member, department, and client. Full audit logs of all access."
                  },
                  {
                    icon: FileText,
                    title: "Data Residency Options",
                    desc: "Choose where your data is stored (US, EU, UK). Meet local data sovereignty requirements."
                  },
                  {
                    icon: Building2,
                    title: "Client Confidentiality",
                    desc: "Designed to protect client confidential information with enterprise-grade security controls."
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
                        { badge: "Enterprise\nGrade", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
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
                    <h3 className="text-lg font-bold mb-3">What This Means for Your Agency</h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Client confidentiality is fully protected</strong> with enterprise security</span>
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
                        <span><strong>Full audit trail</strong> for compliance requirements</span>
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

      {/* Pricing */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground">One price. Everything included. No hidden fees.</p>
          </div>

          <Card className="border-2 border-primary">
            <CardHeader className="text-center bg-gradient-to-r from-primary/5 to-purple-500/5 pb-8">
              <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-4">
                Most Popular • Agency Plan
              </div>
              <CardTitle className="text-4xl md:text-5xl mb-3">
                $199 <span className="text-xl text-muted-foreground font-normal">/seat/month</span>
              </CardTitle>
              <CardDescription className="text-lg">
                Everything your agency needs. Cancel anytime.
              </CardDescription>
              <div className="mt-4 text-sm text-muted-foreground">
                💰 <strong>Volume discounts:</strong> 15% off for 20+ seats, 25% off for 50+ seats
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 mb-8">
                {[
                  "Unlimited AI content assistance",
                  "Your agency's knowledge base",
                  "Creative brief templates",
                  "Infinite conversation memory",
                  "Campaign & project tracking",
                  "All AI models (GPT-4, Claude, Gemini)",
                  "Asset organization & search",
                  "25,000 AI messages/seat/month",
                  "Client portal & secure sharing",
                  "Unlimited document storage",
                  "Priority support (4-hour response)",
                  "SOC 2 compliance",
                  "Dedicated account manager",
                  "Custom integrations available",
                  "White-glove onboarding included",
                  "24/7 AI Coach support"
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
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
                        If you don't see measurable value within 60 days, we'll refund 100% of your investment.
                        No questions asked. No fine print.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="flex-1 text-lg" asChild>
                  <Link href="/contact-sales?plan=agency">
                    Schedule Demo <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="flex-1 text-lg" asChild>
                  <Link href="/signup?plan=agency">Start 14-Day Trial</Link>
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground mt-4">
                14-day free trial • No credit card required • Cancel anytime • 100% money-back guarantee
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Interactive ROI Calculator */}
      <section id="roi-calculator" className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Calculate Your Agency's ROI
              </h2>
              <p className="text-xl text-muted-foreground">
                See how much your agency could save with Perpetual Core
              </p>
            </div>

            <Card className="border-2 border-primary">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5">
                <CardTitle className="text-2xl">Interactive ROI Calculator</CardTitle>
                <CardDescription>Adjust the values below to match your agency's profile</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6 mb-8">
                  {/* Team Size */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="teamSize" className="text-base font-medium">Team Size</Label>
                      <span className="text-2xl font-bold text-primary">{teamSize}</span>
                    </div>
                    <Input
                      id="teamSize"
                      type="range"
                      min="1"
                      max="100"
                      value={teamSize}
                      onChange={(e) => setTeamSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>1</span>
                      <span>100</span>
                    </div>
                  </div>

                  {/* Average Hourly Rate */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="rate" className="text-base font-medium">Average Hourly Rate ($/hour)</Label>
                      <span className="text-2xl font-bold text-primary">${avgHourlyRate}</span>
                    </div>
                    <Input
                      id="rate"
                      type="range"
                      min="50"
                      max="300"
                      step="10"
                      value={avgHourlyRate}
                      onChange={(e) => setAvgHourlyRate(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>$50</span>
                      <span>$300</span>
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
                          Based on 8 hours saved per team member per week
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
                          Time saved × hourly rate × 52 weeks
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
                          ${199} per seat × {teamSize} seats × 12 months
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
                        Your Agency's Projected Annual Savings
                      </div>
                      <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-4">
                        ${netAnnualSavings.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground mb-6">
                        This estimate is based on potential time savings converted to billable value, minus the cost of Perpetual Core.
                        Actual results will vary by agency size, project type, and usage patterns.
                      </p>
                      <Button size="lg" asChild className="bg-green-600 hover:bg-green-700">
                        <Link href="/contact-sales?plan=agency">
                          Schedule Demo to Confirm Your Savings <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="text-xs text-center text-muted-foreground">
                    * Estimates based on assumed 8 hours saved per team member per week. Actual results vary by agency size, project type, and usage patterns.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
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
                question: "Is our client data secure? What about confidentiality?",
                answer: "Absolutely. Perpetual Core is SOC 2 Type II certified. All data is encrypted with 256-bit encryption at rest and in transit. We use zero-knowledge architecture, meaning we cannot access your data. Your campaigns and client files are NEVER used to train AI models. Client confidentiality is fully protected with role-based access controls and complete audit logs."
              },
              {
                question: "How long does implementation take?",
                answer: "Most agencies are fully operational within 2 weeks. Week 1: Setup and asset upload (2-3 hours). Week 2: Training and active usage begins (4-5 hours total). You'll see time savings from day one. Every agency gets a dedicated implementation specialist and white-glove onboarding."
              },
              {
                question: "What if our team doesn't use it?",
                answer: "We guarantee high adoption rates. Our onboarding is designed for creative teams. The interface is intuitive, and results are immediate—team members see value from their first search. We provide ongoing training and designate 'champions' within your agency. If adoption is an issue, we'll work with you until it's resolved. That's covered by our 60-day money-back guarantee."
              },
              {
                question: "Can Perpetual Core integrate with our existing tools?",
                answer: "Yes. Perpetual Core integrates with popular agency tools including Asana, Monday.com, Slack, Google Workspace, Dropbox, and more. We also offer API access for custom integrations. During onboarding, we'll set up all your integrations. Most integrations take less than 30 minutes to configure."
              },
              {
                question: "What happens to our data if we cancel?",
                answer: "You own your data, period. If you cancel, you can export all your campaigns, assets, and knowledge base in standard formats (PDF, DOCX, JSON). We'll keep your data for 90 days after cancellation in case you change your mind, then permanently delete it. You'll receive a certificate of data destruction upon request."
              },
              {
                question: "How is Perpetual Core different from just using ChatGPT?",
                answer: "Perpetual Core is specifically built for agencies with features ChatGPT doesn't have: (1) Your agency's knowledge base—AI searches YOUR campaigns and assets, not just public data. (2) Client confidentiality protection with SOC 2 compliance. (3) Infinite conversation memory that never expires. (4) Agency-specific templates and workflows. (5) Team collaboration with role-based access. (6) All AI models in one place (GPT-4, Claude, Gemini). Think of it as ChatGPT meets your agency's shared drive—but infinitely more powerful."
              },
              {
                question: "Can we try it with a small team first?",
                answer: "Yes! Start with a 14-day free trial for your entire agency (no credit card required). Or, if you prefer, start with a pilot group of 3-5 team members for 30 days. Most agencies do: (1) Demo call (30 min), (2) Pilot with 3-5 people (30 days), (3) Full agency rollout. We're confident you'll see value immediately."
              },
              {
                question: "What kind of support do you provide?",
                answer: "Enterprise-grade support: (1) Dedicated implementation specialist during onboarding. (2) Priority support with 4-hour response time. (3) Email, chat, and video call support. (4) 24/7 AI Coach for instant help. (5) Regular check-ins with your account manager. (6) Ongoing training and optimization sessions. For larger agencies, we offer on-site training and quarterly business reviews."
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
                Schedule a call with our team. We'll answer all your questions and show you exactly how Perpetual Core works for your agency.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/contact-sales?plan=agency">
                    Schedule Call <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="mailto:agencies@aios.com">Email Us</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-primary to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Ready to Try Perpetual Core?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            See how Perpetual Core can help your agency preserve institutional knowledge, reduce wasted time,
            and give every team member access to your collective expertise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" variant="secondary" asChild className="text-lg px-8">
              <Link href="/contact-sales?plan=agency">
                Schedule Demo <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 bg-transparent border-white text-white hover:bg-white/10">
              <Link href="/signup?plan=agency">Start Free Trial</Link>
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm opacity-90 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Cancel anytime</span>
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
                The AI-powered knowledge platform built for creative agencies.
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
              © 2024 AI Operating System. All rights reserved. | SOC 2 Type II Certified | GDPR Ready
            </p>
            <p className="text-xs">
              Perpetual Core is a productivity platform. All AI-generated content should be reviewed by qualified professionals.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
