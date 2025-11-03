"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2, TrendingUp, Users, Target, Brain, Zap, Shield, DollarSign,
  XCircle, AlertCircle, Sparkles, MessageSquare, Infinity, Database, Lock,
  Search, FileText, Clock, Plus, Minus, ArrowRight
} from "lucide-react";

export default function SalesTeamsPage() {
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
              <Link href="/signup?plan=sales">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <TrendingUp className="h-4 w-4" />
            Built for Sales Teams
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Your Team's Sales Playbook,
            <span className="block text-primary mt-2">Powered by AI</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Built to help sales teams share winning strategies, objection handlers, and competitive intel.
            Every rep gets instant access to your collective sales expertise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact-sales?plan=sales">Schedule Demo</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">See Features</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            14-day free trial • $79/user/month • Cancel anytime
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">∞</div>
              <div className="text-sm text-muted-foreground">Conversation Memory</div>
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
              <div className="text-sm text-muted-foreground">Secure</div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How Sales Teams Use Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built to solve the real challenges sales teams face every day
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Handle Objections */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Handle Any Objection</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pricing pushback? Timing concerns? Competitor comparisons? Perpetual Core instantly surfaces your
                  top performers' proven objection handlers—with win rates and real examples.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Search all objection responses by type</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>See what works for your best reps</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Get answers in seconds during calls</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Competitive Differentiation */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Competitive Differentiation</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Never lose to a competitor because you didn't know the right talking points. Perpetual Core searches
                  your entire competitive intel database and surfaces exactly what you need.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Battle cards for every competitor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Win/loss analysis and insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Updated in real-time by your team</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Clone Top Performers */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Clone Top Performers</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Your best reps have the answers. Perpetual Core learns from their winning emails, call scripts,
                  and deal strategies—then shares it with everyone on the team.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Upload top performers' templates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>AI drafts in their voice and style</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Every rep performs like your best</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Never Forget Follow-ups */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Never Forget a Follow-Up</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Perpetual Core remembers every prospect conversation, action item, and commitment. Get reminded
                  at the right time with the perfect follow-up already drafted.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Infinite memory of all conversations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Smart follow-up suggestions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Auto-drafted personalized emails</span>
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
                Your Team's Institutional Brain
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Stop Losing Your Best Sales Strategies
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                When your top performers leave, their objection handlers, deal strategies, and relationship-building tactics walk out the door.
                Perpetual Core captures and preserves your team's collective sales wisdom so it compounds over time instead of disappearing.
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
                  <CardDescription className="text-base">Knowledge walks out the door</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Top Performers Leave, Knowledge Vanishes</div>
                        <p className="text-sm text-muted-foreground">
                          When your best rep quits, their proven objection handlers, email templates, and deal strategies
                          disappear forever. New reps start from scratch.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Knowledge Silos Cost Deals</div>
                        <p className="text-sm text-muted-foreground">
                          Each rep has their own "tricks" but never shares them. Team loses deals that could have been won
                          with knowledge sitting in someone else's head.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Inconsistent Messaging Confuses Prospects</div>
                        <p className="text-sm text-muted-foreground">
                          Every rep tells a different story about pricing, ROI, and features. Prospects get confused.
                          Deals stall or go to competitors with clearer messaging.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">New Reps Take Months to Ramp</div>
                        <p className="text-sm text-muted-foreground">
                          New hires spend 6+ months learning through trial and error. They lose deals they should have won
                          because they don't know the playbooks.
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
                  <CardDescription className="text-base">Knowledge compounds forever</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Capture Top Performers' Strategies Forever</div>
                        <p className="text-sm text-muted-foreground">
                          Upload winning emails, call recordings, and objection handlers from your best reps.
                          When they leave, their expertise stays—accessible to everyone, forever.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Every Rep Accesses Team's Collective Intelligence</div>
                        <p className="text-sm text-muted-foreground">
                          AI searches every playbook, battle card, and won deal in seconds. No more knowledge silos—
                          everyone performs like your top 10%.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Unified Messaging Across Your Team</div>
                        <p className="text-sm text-muted-foreground">
                          AI suggests proven talking points, pricing responses, and ROI calculators based on what actually works.
                          Every prospect hears a consistent, winning message.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">New Reps Productive From Day One</div>
                        <p className="text-sm text-muted-foreground">
                          New hires instantly access every playbook, objection handler, and competitive intel.
                          They ask AI any question and get answers from your best reps' knowledge.
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
                    <h3 className="text-2xl font-bold mb-2">Real Example: Enterprise Sales Director</h3>
                    <p className="text-muted-foreground">
                      How one company preserved 15 years of enterprise sales expertise
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
                      Top enterprise sales director with 15 years at the company announced retirement. She closed 60% of all
                      $500K+ deals. Her objection handling scripts, relationship-building tactics, and pricing negotiation strategies
                      lived in her head and old email folders. Nobody else knew how she consistently won against competitors.
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
                      Before she left, the team spent 3 weeks uploading her winning email templates, call recordings,
                      competitive battle cards, and deal playbooks to Perpetual Core. They had her answer common objections and
                      document her account management strategies. AI indexed everything—pricing negotiations, enterprise
                      stakeholder mapping, contract terms she'd successfully negotiated.
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
                      Six months after she retired, the team's enterprise win rate actually <strong>increased</strong> by 18%.
                      Why? Now <em>every</em> rep could search her strategies instantly. Her successor used AI to find her
                      exact objection handlers during calls. New AEs studied her winning email sequences. The company turned
                      one expert's 15-year career into institutional knowledge that made everyone better.
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t">
                  <p className="text-center text-sm text-muted-foreground italic">
                    "We used to lose our top performers' expertise when they left. Now it stays forever and compounds.
                    Perpetual Core turned our sales team from a collection of individuals into a true learning organization."
                    <span className="block mt-2 font-semibold not-italic">— VP of Sales</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Built for High-Performing Sales Teams</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Share knowledge, close more deals, onboard reps faster
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Team Playbook */}
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Shared Sales Playbook</CardTitle>
              <CardDescription>
                Upload your best scripts, objection handlers, and competitive battle cards.
                Every rep has instant access to what works.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Competitive Intel */}
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Competitive Intelligence</CardTitle>
              <CardDescription>
                AI searches your entire competitive intel database. Get the right talking points
                for every competitor, instantly.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Deal Insights */}
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>AI Deal Coaching</CardTitle>
              <CardDescription>
                Get instant recommendations based on similar won deals. AI analyzes patterns
                and suggests next-best actions.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Email Automation */}
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Smart Email Sequences</CardTitle>
              <CardDescription>
                AI drafts personalized follow-ups based on your top performers' emails.
                Maintain your voice, at scale.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Onboarding */}
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Instant Rep Onboarding</CardTitle>
              <CardDescription>
                New reps ask your AI coach any question. Product specs, pricing, objections—
                they're productive from day one.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Security */}
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Enterprise Security</CardTitle>
              <CardDescription>
                Your playbooks stay private. SOC 2 compliant, encrypted at rest and in transit.
                Never used to train AI models.
              </CardDescription>
            </CardHeader>
          </Card>
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
              See how Perpetual Core can transform daily sales workflows
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
                      <CardDescription>Traditional Sales Process</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">9:00 AM - Discovery Call</div>
                      <p className="text-sm text-muted-foreground">
                        Prospect asks about competitor comparison. Frantically search through old emails
                        and Slack messages for battle card. Can't find it. Wing the answer.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 15 minutes lost searching</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">11:00 AM - Objection Handling</div>
                      <p className="text-sm text-muted-foreground">
                        "You're too expensive." Can't remember how top rep handled this last week.
                        Give generic response. Prospect unconvinced.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ Opportunity at risk</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">2:00 PM - Follow-Up Emails</div>
                      <p className="text-sm text-muted-foreground">
                        Need to send personalized follow-ups to 12 prospects. Manually craft each one.
                        Copy-paste from old emails. Takes forever.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 2 hours on emails</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">5:00 PM - Lost Deal</div>
                      <p className="text-sm text-muted-foreground">
                        Deal goes to competitor. Realize another rep closed similar deal last month
                        with different approach. Nobody told you.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ Knowledge silos cost deals</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Result:</span>
                        <span className="text-3xl font-bold text-red-600 dark:text-red-400">Lost Deal</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Wasted time • Knowledge silos • Inconsistent messaging
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
                      <CardDescription>AI-Powered Sales</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">9:00 AM - Discovery Call</div>
                      <p className="text-sm text-muted-foreground">
                        Prospect asks about competitor. Ask AI: "Show competitor X battle card."
                        Get 3 key differentiators, customer testimonials, and proven talking points instantly.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 10 seconds</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">11:00 AM - Objection Handling</div>
                      <p className="text-sm text-muted-foreground">
                        "You're too expensive." AI surfaces top 3 pricing objection handlers from your best reps,
                        with win rates and examples. Use the best one. Prospect convinced.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ Deal back on track</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">2:00 PM - Follow-Up Emails</div>
                      <p className="text-sm text-muted-foreground">
                        AI drafts personalized follow-ups for all 12 prospects based on top performers' templates.
                        Review, tweak, send. Your voice, at scale.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 20 minutes total</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">4:30 PM - Deal Won</div>
                      <p className="text-sm text-muted-foreground">
                        Close deal. AI recommended strategy from similar won opportunity.
                        Entire team now has access to this winning approach for future deals.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ Knowledge compounds</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Result:</span>
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400">Deal Won</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Hours saved • Team expertise shared • Consistent excellence
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
                    <em>Illustrative example showing potential improvements. Actual results vary by team and sales cycle.</em>
                  </p>
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">10x</div>
                      <div className="text-sm text-muted-foreground">Faster Info Access</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Hours</div>
                      <div className="text-sm text-muted-foreground">Saved Per Week</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Shared</div>
                      <div className="text-sm text-muted-foreground">Team Knowledge</div>
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
              Your AI Sales Coach
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              New to the platform? Your AI coach helps you master Perpetual Core, find the right playbooks,
              and get answers instantly—24/7.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            {/* Left: Feature Description */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold">Ask Anything, Anytime</h3>
              <p className="text-muted-foreground leading-relaxed">
                Need to find your pricing objection playbook? Want to see competitive intel for a specific company?
                Just ask your AI Coach.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: "Instant Answers",
                    desc: "No more hunting through Slack or Google Docs. AI finds what you need in seconds."
                  },
                  {
                    title: "Sales Context",
                    desc: "The AI Coach understands sales terminology and provides relevant, actionable guidance."
                  },
                  {
                    title: "Always Learning",
                    desc: "As your team adds more playbooks and intel, your AI Coach gets smarter."
                  },
                  {
                    title: "Never Judges",
                    desc: "Ask the same question 100 times. Your AI Coach will answer patiently every time."
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
                      <p className="text-sm">"How do I handle pricing objections for enterprise deals?"</p>
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
                      <p className="text-sm mb-3">Here are your top 3 pricing objection handlers for enterprise:</p>
                      <ol className="text-sm space-y-2 list-decimal list-inside">
                        <li><strong>ROI Calculator:</strong> Show 6-month payback with saved productivity hours</li>
                        <li><strong>Risk Reversal:</strong> "Pay nothing until you see results in 90 days"</li>
                        <li><strong>Tier Comparison:</strong> Enterprise tier is 40% cheaper per-seat than Pro at scale</li>
                      </ol>
                      <p className="text-sm mt-3 text-muted-foreground">
                        💡 <strong>Top performer tip:</strong> Lead with ROI calculator. 85% close rate when shown first.
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
                      <p className="text-sm">"Can you draft the follow-up email?"</p>
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
                      <p className="text-sm">Absolutely! Here's a draft based on your top performers' templates...</p>
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
                  "How do I find competitor battle cards?",
                  "What's our pricing for enterprise?",
                  "Show me cold email templates",
                  "How do top reps handle objections?",
                  "What's the best demo flow?",
                  "How do I qualify leads faster?",
                  "What are common deal blockers?",
                  "How do I accelerate my pipeline?",
                  "Can I see won deal examples?"
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

      {/* How It Works Section */}
      <section className="bg-gradient-to-b from-primary/5 to-purple-500/5 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                How Sales Teams Use Perpetual Core
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Built to solve knowledge silos, inconsistent messaging, and slow rep onboarding
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Upload Your Playbooks</h3>
                  <p className="text-muted-foreground text-sm">
                    Upload scripts, battle cards, objection handlers, email templates, and winning deal playbooks.
                    AI indexes and organizes everything automatically.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Search During Calls</h3>
                  <p className="text-muted-foreground text-sm">
                    Ask questions in natural language: "Show pricing objection for enterprise" or "Competitor X battle card."
                    Get instant answers while prospects are on the line.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">AI Learns Your Patterns</h3>
                  <p className="text-muted-foreground text-sm">
                    The more your team uses Perpetual Core, the smarter it gets. It learns what works, surfaces winning
                    strategies, and helps every rep perform like your top 10%.
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
                        Your top performers know how to handle every objection, but that knowledge stays locked in their heads.
                        New reps and struggling reps never get access.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Inconsistent Messaging</div>
                      <p className="text-sm text-muted-foreground">
                        Every rep tells a different story about pricing, features, and ROI. Prospects get confused.
                        Deals slip through the cracks.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Slow Onboarding</div>
                      <p className="text-sm text-muted-foreground">
                        New reps take 6+ months to ramp. They don't know the playbooks, haven't seen the objections,
                        and lose deals they should have won.
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
                            Every playbook, script, and winning strategy becomes instantly searchable and accessible
                            to your entire team. Share knowledge, not just quotas.
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
              Traditional Sales Process vs Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground">
              See exactly what changes when your team adopts Perpetual Core
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
                    feature: "Objection Handling",
                    old: "Wing it or search through old Slack messages",
                    new: "Instant access to top performers' proven responses",
                    highlight: true
                  },
                  {
                    feature: "Competitive Intel",
                    old: "Scattered across emails, docs, and tribal knowledge",
                    new: "Centralized battle cards updated in real-time"
                  },
                  {
                    feature: "New Rep Onboarding",
                    old: "6+ months to ramp, learning through trial and error",
                    new: "Productive from day 1 with instant playbook access"
                  },
                  {
                    feature: "Follow-Up Emails",
                    old: "Manually craft each one, copy-paste old templates",
                    new: "AI drafts personalized emails using top performers' style",
                    highlight: true
                  },
                  {
                    feature: "Knowledge Sharing",
                    old: "Top performers' strategies stay in their heads",
                    new: "Every win is captured and shared with the team"
                  },
                  {
                    feature: "Deal Strategy",
                    old: "Ask managers for advice, wait for responses",
                    new: "AI suggests strategies from similar won deals"
                  },
                  {
                    feature: "Consistency",
                    old: "Every rep tells a different story",
                    new: "Unified messaging based on what works",
                    highlight: true
                  },
                  {
                    feature: "CRM Integration",
                    old: "Manual data entry, context switching",
                    new: "Seamless integration with automatic logging"
                  },
                  {
                    feature: "Prospect Research",
                    old: "Google, LinkedIn, company websites",
                    new: "AI compiles research + your team's insights"
                  },
                  {
                    feature: "Team Collaboration",
                    old: "Knowledge buried in inboxes and drives",
                    new: "Searchable knowledge base with infinite memory"
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
                Teams using Perpetual Core close <strong className="text-primary">30% more deals</strong>,
                reduce onboarding time by <strong className="text-primary">75%</strong>, and save
                <strong className="text-primary"> 10+ hours per rep per week</strong>.
              </p>
              <Button size="lg" asChild className="mt-2">
                <Link href="/contact-sales?plan=sales">
                  See How It Works <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-primary to-purple-600 text-white border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Turn Every Rep into a Top Performer
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Give your team the collective intelligence of your best salespeople.
              Start sharing knowledge today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/contact-sales?plan=sales">Schedule Demo</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent border-white text-white hover:bg-white/10">
                <Link href="/signup?plan=sales">Start Free Trial</Link>
              </Button>
            </div>
            <p className="text-sm mt-6 opacity-75">
              14-day free trial • No credit card required • Setup in 5 minutes
            </p>
          </CardContent>
        </Card>
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
                question: "Does Perpetual Core integrate with our CRM (Salesforce, HubSpot, etc.)?",
                answer: "Yes. Perpetual Core integrates with all major CRMs including Salesforce, HubSpot, Pipedrive, and Close. The integration is bidirectional—Perpetual Core can pull context from your CRM and log activities back to it automatically. Setup takes about 15 minutes during onboarding. We also offer API access for custom integrations with your sales tools."
              },
              {
                question: "How secure is our sales data? Can competitors access it?",
                answer: "Your data is completely isolated and encrypted. We're SOC 2 Type II certified with 256-bit encryption at rest and in transit. Your playbooks, battle cards, and customer data are NEVER used to train AI models or shared with anyone. Each team has its own secure workspace. We use zero-knowledge architecture—even our staff can't access your data."
              },
              {
                question: "Can we control who sees what? (Team permissions and access)",
                answer: "Absolutely. Perpetual Core has granular role-based access controls. You can set permissions by team, role, or individual rep. For example, you might give SDRs access to prospecting playbooks but restrict pricing info to AEs. You can also create private workspaces for specific teams or deals. Full audit logs track who accessed what and when."
              },
              {
                question: "How does pricing work? What happens if our team grows?",
                answer: "Simple: $79 per user per month, billed monthly or annually (save 20% with annual). Add or remove users anytime with no penalties. Volume discounts available for 20+ users. Your first 14 days are completely free, no credit card required. If you grow from 10 to 50 reps mid-year, you just add the new seats and pay for what you use."
              },
              {
                question: "How long does it take to onboard our sales team?",
                answer: "Most teams are fully up and running within 1 week. Day 1: Upload your playbooks and connect integrations (2-3 hours). Day 2-3: Team training (1 hour group session). Day 4-7: Reps start using Perpetual Core daily with support available. We provide dedicated onboarding specialists, live training, and daily office hours during your first week. Average time to first value: under 24 hours."
              },
              {
                question: "What if our reps don't use it?",
                answer: "We guarantee 90%+ adoption rates. Here's how: (1) Reps see immediate value—answers in seconds vs. hours searching. (2) Training is hands-on with real sales scenarios. (3) We identify 'champions' on your team to drive adoption. (4) Usage analytics help managers spot who needs help. (5) Daily support during first month. If adoption is low, we'll work with you until it's not—that's covered by our satisfaction guarantee."
              },
              {
                question: "How do you measure ROI? What metrics should we track?",
                answer: "We track several metrics: (1) Time saved per rep per week (usually 5-10 hours). (2) Onboarding time reduction (typically 50-75%). (3) Win rate improvement (often 15-30% increase). (4) Deal velocity (faster closes). (5) Rep productivity (more calls, emails, meetings). You'll get a monthly analytics report showing these metrics. Most teams see positive ROI within 30-60 days."
              },
              {
                question: "What happens to our data if we cancel?",
                answer: "You own your data, period. If you cancel, you can export everything—playbooks, conversations, analytics—in standard formats (PDF, CSV, JSON). We keep your data for 90 days after cancellation in case you change your mind, then permanently delete it. You'll receive a certificate of data destruction upon request. No lock-in, no hostage data."
              },
              {
                question: "Can Perpetual Core replace our sales training and enablement programs?",
                answer: "Perpetual Core complements your existing programs, it doesn't replace them. Think of it as 'on-demand enablement.' Traditional training happens once (onboarding, quarterly sessions). Perpetual Core provides instant access to that knowledge 24/7. Many teams use Perpetual Core to reinforce training—upload session recordings, slides, and playbooks so reps can reference them anytime."
              },
              {
                question: "Does Perpetual Core work for remote/distributed sales teams?",
                answer: "Yes, it's perfect for remote teams. Since everything is cloud-based and searchable, location doesn't matter. Remote reps get the same instant access to team knowledge as in-office reps. Many distributed teams use Perpetual Core specifically because it solves the 'water cooler' problem—where remote reps miss informal knowledge sharing that happens in offices."
              },
              {
                question: "What kind of support do you provide?",
                answer: "Enterprise-grade support included: (1) Dedicated onboarding specialist for first 30 days. (2) Email and live chat support (4-hour response time). (3) Phone support for urgent issues. (4) Weekly check-ins during first month. (5) Ongoing training sessions and webinars. (6) Private Slack channel with your team (for larger accounts). (7) Help center with guides, videos, and best practices. For teams of 50+, we offer on-site training and quarterly business reviews."
              },
              {
                question: "How is this different from just using ChatGPT for sales?",
                answer: "Great question. ChatGPT is generic—it doesn't know YOUR playbooks, YOUR objection handlers, or YOUR winning deals. Perpetual Core is trained on your team's specific knowledge and integrates with your CRM. Key differences: (1) Searches your sales playbooks and battle cards, not generic internet. (2) Infinite memory of all customer conversations. (3) Team collaboration and knowledge sharing. (4) CRM integration and workflow automation. (5) Enterprise security and compliance. (6) All AI models in one place (GPT-4, Claude, Gemini). Think: ChatGPT meets Salesforce meets your team's collective intelligence."
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
                Schedule a call with our team. We'll answer all your questions and show you exactly how Perpetual Core works for sales teams.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/contact-sales?plan=sales">
                    Schedule Call <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="mailto:sales@aios.com">Email Us</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
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
                The AI-powered knowledge platform built for sales teams.
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
              Your sales data is encrypted and never used to train AI models. Enterprise security built for sales teams.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
