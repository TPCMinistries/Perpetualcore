"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2, Home, FileText, Search, Clock, Shield, Users, TrendingUp,
  Brain, Database, Infinity, DollarSign, Award, Quote, Star, ArrowRight,
  Zap, Lock, Building2, XCircle, AlertCircle, Play, ChevronDown, Minus, Plus,
  Sparkles, MessageSquare, Mail, Calendar, MapPin, Key
} from "lucide-react";

export default function RealEstatePage() {
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
            <Link href="#how-it-works" className="text-sm font-medium hover:underline hidden md:inline">
              How It Works
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:underline hidden md:inline">
              Pricing
            </Link>
            <Button asChild size="sm" className="md:size-default bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
              <Link href="/contact-sales?plan=realestate">Schedule Demo →</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-transparent"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Value Prop */}
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Home className="h-4 w-4" />
                Built for Real Estate Agents
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                Your Personal AI Assistant for <span className="text-primary">Every Deal</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Built to help you manage listings, follow up with clients, draft contracts, and stay organized—so you can focus on closing deals and building relationships.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" asChild className="text-lg px-8 shadow-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700">
                  <Link href="/contact-sales?plan=realestate">
                    Schedule Demo <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg px-8">
                  <Link href="#pricing">See Pricing</Link>
                </Button>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Right: Trust Signals */}
            <div className="space-y-6">
              {/* Value Card */}
              <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-green-700 dark:text-green-300">Designed to Help You</div>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">Close More</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Built to save you time on admin work and help you stay on top of every client, listing, and opportunity.
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
              See how Perpetual Core can transform your daily routine as a real estate agent
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
                      <CardDescription>Traditional Agent Workflow</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">7:00 AM - Listing Prep</div>
                      <p className="text-sm text-muted-foreground">
                        Spend 2 hours writing listing descriptions, creating social posts, and formatting MLS data. Manually copy-paste details across platforms.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 2 hours on admin</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">10:00 AM - Client Follow-ups</div>
                      <p className="text-sm text-muted-foreground">
                        Dig through emails and sticky notes trying to remember who to call. Miss following up with 3 hot leads because they got buried in your inbox.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ Lost opportunities</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">1:00 PM - Showing Prep</div>
                      <p className="text-sm text-muted-foreground">
                        Scramble to pull comps and neighborhood data before afternoon showings. Can't remember what buyers said they wanted 3 weeks ago.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ Unprepared & stressed</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">6:00 PM - Contract Chaos</div>
                      <p className="text-sm text-muted-foreground">
                        Spend 2 hours filling out purchase agreements manually. Check and re-check every field to avoid mistakes.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 2 hours on paperwork</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Total Time:</span>
                        <span className="text-3xl font-bold text-red-600 dark:text-red-400">~6 hours</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        On admin work instead of closing deals
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
                      <CardDescription>AI-Powered Real Estate</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">7:00 AM - Instant Listings</div>
                      <p className="text-sm text-muted-foreground">
                        Upload property photos. AI generates compelling listing description, social posts, and MLS-ready data in 2 minutes. Review and publish.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 15 minutes total</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">7:30 AM - Smart Follow-ups</div>
                      <p className="text-sm text-muted-foreground">
                        AI shows you exactly who to call today: "Sarah Johnson - 7 days since last contact, was interested in downtown condos under $400K." One-click to see entire conversation history.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ Never miss a lead</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">1:00 PM - Showing Ready</div>
                      <p className="text-sm text-muted-foreground">
                        Ask AI: "Pull comps for 123 Main St and remind me what the Johnsons are looking for." Get instant property analysis and full client preference history.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 5 minutes, fully prepared</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">6:00 PM - Auto-Contracts</div>
                      <p className="text-sm text-muted-foreground">
                        AI pre-fills purchase agreement with property and client details. You review, sign, send. Done in 15 minutes with zero errors.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 15 minutes, error-free</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Total Time:</span>
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400">~45 min</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Rest of day free for showings & clients
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
                    <em>Illustrative example showing potential time savings. Actual results vary by agent and workflow.</em>
                  </p>
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">5+ hrs</div>
                      <div className="text-sm text-muted-foreground">Saved Per Day</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Zero</div>
                      <div className="text-sm text-muted-foreground">Missed Follow-ups</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">More</div>
                      <div className="text-sm text-muted-foreground">Time for Deals</div>
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
              Your Personal AI Assistant, Always Available
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Never feel overwhelmed again. Your AI Coach is available 24/7 to help you manage listings,
              follow up with clients, prepare for showings, and stay organized—just like having an experienced assistant on call.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            {/* Left: Feature Description */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold">Ask Anything, Anytime</h3>
              <p className="text-muted-foreground leading-relaxed">
                Need to pull property details? Can't remember what a client said last week? Want to draft a follow-up email?
                Just ask your AI Coach. It understands natural language and has perfect memory of every conversation and listing.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: "Perfect Memory",
                    desc: "Never forget a client preference, property detail, or conversation. Your AI remembers everything."
                  },
                  {
                    title: "Instant Property Intel",
                    desc: "Ask for comps, neighborhood data, or listing history—get answers in seconds, not hours."
                  },
                  {
                    title: "Smart Reminders",
                    desc: "AI proactively tells you who to follow up with and when, so no lead falls through the cracks."
                  },
                  {
                    title: "Always Learning",
                    desc: "As you work, your AI learns your style, your clients, and your market to help you even better."
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
                      <p className="text-sm">"Who should I follow up with today?"</p>
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
                      <p className="text-sm mb-3">Here are your top 3 priorities today:</p>
                      <ol className="text-sm space-y-2 list-decimal list-inside">
                        <li><strong>Sarah Johnson</strong> - 7 days since last contact. She was interested in downtown condos under $400K.</li>
                        <li><strong>Mike Chen</strong> - Requested showing for 123 Oak St last week. Follow up on his decision.</li>
                        <li><strong>The Martins</strong> - Pre-approved buyers, looking in Riverside. New listing just hit at $525K—perfect match!</li>
                      </ol>
                      <p className="text-sm mt-3 text-muted-foreground">
                        💡 <strong>Tip:</strong> The Martins' listing is brand new—reach out now to get first showing!
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
                      <p className="text-sm">"Draft an email to The Martins about that new listing"</p>
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
                      <p className="text-sm font-semibold mb-2">Subject: Perfect Riverside Home Just Listed - $525K</p>
                      <p className="text-sm">Hi Tom and Lisa,</p>
                      <p className="text-sm mt-2">
                        A beautiful 4-bed, 3-bath home just hit the market in Riverside at $525K—right in your target range! It has the open floor plan and updated kitchen you mentioned wanting. I'd love to get you in for a showing this week before it goes fast.
                      </p>
                      <p className="text-sm mt-2">Are you available Thursday or Friday afternoon?</p>
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
              <CardDescription>See what your AI assistant can help with</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  "Who should I follow up with today?",
                  "Pull comps for 123 Main Street",
                  "What did the Johnsons say they wanted?",
                  "Draft a listing description for my new property",
                  "Show me my schedule for this week",
                  "Which clients are pre-approved?",
                  "Remind me about the Smith showing notes",
                  "Generate a market report for buyers",
                  "What listings match the Chen family?"
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

      {/* Infinite Memory Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Perfect Memory. Zero Missed Details.
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Every client conversation, every property detail, every showing note—remembered forever and instantly accessible.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Client Memory */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Every Client Detail</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  AI remembers every conversation, preference, budget, and timeline for every client—so you always
                  know exactly where you left off, even months later.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Budget, preferences, must-haves</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Every email, text, and call</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Properties viewed & feedback</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Property Memory */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Home className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Every Listing</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  All your listings, showing notes, offer history, and marketing materials—organized and searchable.
                  Find any detail in seconds.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>MLS data, photos, descriptions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Showing schedules & feedback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Offer history & negotiations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Transaction Memory */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl group">
              <CardContent className="p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Every Transaction</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Complete transaction history with contracts, deadlines, and communications—never lose track of
                  where a deal stands.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Contracts & disclosures</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Important dates & deadlines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Full communication history</span>
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
                How Real Estate Agents Can Use Perpetual Core
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Designed to help you stay organized, follow up consistently, and spend more time on
                what matters: building relationships and closing deals.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Home className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Manage Listings</h3>
                  <p className="text-muted-foreground text-sm">
                    Create compelling listing descriptions, social posts, and marketing materials in minutes. AI helps you showcase every property at its best.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Stay on Top of Clients</h3>
                  <p className="text-muted-foreground text-sm">
                    AI remembers every detail about every client and tells you exactly who to follow up with and when. Never miss a lead or forget a conversation.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Automate Paperwork</h3>
                  <p className="text-muted-foreground text-sm">
                    Generate contracts, disclosures, and transaction documents quickly. AI pre-fills details so you just review and send.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-primary">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-center">Built to Solve Common Agent Problems</h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Drowning in Admin Work</div>
                      <p className="text-sm text-muted-foreground">
                        Agents spend 50-60% of their time on paperwork, emails, and admin instead of selling. That's 4-5 hours per day that could be spent with clients.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Missed Follow-ups</div>
                      <p className="text-sm text-muted-foreground">
                        Leads fall through the cracks because you're juggling 20+ clients and can't remember who said what or when to follow up.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Information Overload</div>
                      <p className="text-sm text-muted-foreground">
                        Client preferences, property details, and showing feedback scattered across emails, texts, and sticky notes. Impossible to keep track.
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
                          <div className="font-semibold mb-2">Perpetual Core is Built to Help</div>
                          <p className="text-sm text-muted-foreground">
                            Automate the admin work, remember every detail, and keep you organized—so you can focus on
                            building relationships and closing more deals.
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

      {/* Key Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built specifically for real estate agents who want to work smarter, not harder
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Home,
                title: "Smart Listing Creator",
                desc: "Generate compelling property descriptions, social posts, and marketing materials in minutes—not hours."
              },
              {
                icon: Users,
                title: "Client Relationship Manager",
                desc: "Track every client conversation, preference, and timeline. AI tells you exactly who to follow up with."
              },
              {
                icon: Calendar,
                title: "Showing Coordinator",
                desc: "Manage showings, track feedback, and access property details instantly before every appointment."
              },
              {
                icon: FileText,
                title: "Contract Generator",
                desc: "Auto-fill purchase agreements, listing contracts, and disclosures with property and client details."
              },
              {
                icon: Mail,
                title: "Email & Communication",
                desc: "Draft professional emails and texts to clients in seconds. AI learns your voice and style."
              },
              {
                icon: Search,
                title: "Property Intelligence",
                desc: "Pull comps, neighborhood data, and market trends instantly to prepare for showings and listings."
              },
              {
                icon: Brain,
                title: "Infinite Memory",
                desc: "AI remembers every detail about every client, property, and conversation—forever. Never forget anything."
              },
              {
                icon: MessageSquare,
                title: "24/7 AI Coach",
                desc: "Ask questions anytime: 'Who should I call today?' 'What did the Smiths say they wanted?' Get instant answers."
              },
              {
                icon: Shield,
                title: "100% Secure",
                desc: "Bank-level encryption. Your client data is completely private and secure. SOC 2 certified."
              }
            ].map((feature, i) => (
              <Card key={i} className="border-2 hover:border-primary transition-all">
                <CardContent className="p-6">
                  <feature.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
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
                Your Brokerage's Institutional Brain
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Preserve Your Top Agents' Market Knowledge
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                When your top-producing agents retire or leave, their negotiation tactics, local market insights, and client
                relationship strategies disappear. Perpetual Core captures and preserves your brokerage's collective real estate wisdom
                so it compounds over time instead of vanishing.
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
                        <div className="font-semibold mb-1">Top Agents Leave, Knowledge Vanishes</div>
                        <p className="text-sm text-muted-foreground">
                          When your luxury specialist retires, 25 years of negotiation tactics, buyer psychology insights, and
                          neighborhood knowledge disappear. New agents start from scratch.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Local Market Expertise Lost Forever</div>
                        <p className="text-sm text-muted-foreground">
                          Each agent knows which streets get multiple offers, which inspectors are thorough, which lenders close fast—
                          but that intel stays locked in their heads until they leave.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Reinventing the Wheel on Every Deal</div>
                        <p className="text-sm text-muted-foreground">
                          Agents repeat the same research, make the same mistakes, and lose deals that someone else in the
                          brokerage already figured out how to win.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">New Agents Take Years to Learn the Market</div>
                        <p className="text-sm text-muted-foreground">
                          New hires struggle for 2-3 years learning neighborhoods, pricing strategies, and client handling—
                          all knowledge veteran agents already have but never shared.
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
                        <div className="font-semibold mb-1">Capture Veteran Agents' Wisdom Forever</div>
                        <p className="text-sm text-muted-foreground">
                          Document top producers' negotiation strategies, pricing insights, and market knowledge before they leave.
                          When they retire, their 25 years of expertise stays—accessible to every agent, forever.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Build a Searchable Market Intelligence Database</div>
                        <p className="text-sm text-muted-foreground">
                          Every agent's local insights—best streets, pricing patterns, buyer trends—indexed and searchable.
                          New agents instantly access decades of accumulated market knowledge.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Every Deal Becomes Institutional Learning</div>
                        <p className="text-sm text-muted-foreground">
                          AI captures what worked in tough negotiations, creative financing solutions, and winning strategies.
                          Every agent learns from every other agent's wins and losses.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">New Agents Ramp Up in Weeks, Not Years</div>
                        <p className="text-sm text-muted-foreground">
                          New hires ask AI about neighborhoods, pricing strategies, and handling objections. They instantly access
                          your top agents' knowledge and start closing deals faster.
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
                    <h3 className="text-2xl font-bold mb-2">Real Example: Luxury Real Estate Specialist</h3>
                    <p className="text-muted-foreground">
                      How one brokerage preserved 25 years of high-end market expertise
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
                      Top luxury agent with 25 years experience announced retirement. She dominated the $2M+ market—70% of all
                      high-end sales. Her negotiation tactics with wealthy buyers, relationships with estate attorneys, pricing
                      strategies for luxury properties, and knowledge of which neighborhoods were about to appreciate—all lived
                      in her head. The brokerage was terrified of losing her and her market dominance.
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
                      Six months before retirement, she spent time with Perpetual Core documenting everything: her luxury buyer scripts,
                      negotiation frameworks for $5M+ deals, neighborhood-by-neighborhood pricing insights, relationships with
                      high-net-worth clients, creative financing strategies for luxury properties. AI indexed her 25 years of
                      market intelligence, objection responses, and winning tactics for competing against other luxury brokerages.
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
                      One year after her retirement, the brokerage's luxury market share actually <strong>grew</strong> by 22%.
                      Why? Three younger agents now had instant access to her 25 years of wisdom. They searched her negotiation
                      scripts during $3M deals. They used her pricing models for estates. They followed her luxury buyer playbook.
                      The brokerage turned one legend's career into permanent institutional knowledge that made <em>every</em> agent better.
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t">
                  <p className="text-center text-sm text-muted-foreground italic">
                    "Our top producer retired, but her expertise didn't. Now every agent can tap into her 25 years of market knowledge.
                    Perpetual Core transformed our brokerage from a collection of solo operators into a true knowledge-sharing powerhouse."
                    <span className="block mt-2 font-semibold not-italic">— Brokerage Owner</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-xl text-muted-foreground">One price. Everything included. No hidden fees.</p>
            </div>

            <Card className="border-2 border-primary">
              <CardHeader className="text-center bg-gradient-to-r from-primary/5 to-purple-500/5 pb-8">
                <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  Beta Pricing • Limited Time
                </div>
                <CardTitle className="text-4xl md:text-5xl mb-3">
                  $149 <span className="text-xl text-muted-foreground font-normal">/agent/month</span>
                </CardTitle>
                <CardDescription className="text-lg">
                  Everything you need to run your real estate business. Cancel anytime.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 mb-8">
                  {[
                    "Infinite conversation memory",
                    "24/7 AI Coach",
                    "Smart listing creator",
                    "Client relationship manager",
                    "Contract & document generator",
                    "All AI models (GPT-4, Claude, Gemini)",
                    "Email & communication drafting",
                    "Property intelligence & comps",
                    "Showing coordinator",
                    "30,000 AI messages/month",
                    "Unlimited document storage",
                    "Mobile app (iOS & Android)",
                    "Priority support",
                    "All future features included",
                    "Training & onboarding",
                    "No long-term contract"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-6 mb-8">
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Designed to Save You</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">5+ Hours Per Day</div>
                    <div className="text-sm text-muted-foreground">
                      That's 25+ extra hours per week you can spend on showings, listings, and closing deals.
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
                        <h3 className="text-lg font-bold mb-2">14-Day Free Trial</h3>
                        <p className="text-sm text-muted-foreground">
                          Try Perpetual Core free for 14 days. No credit card required. See if it helps you close more deals
                          before you pay a penny.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="flex-1 text-lg" asChild>
                    <Link href="/signup?plan=realestate">
                      Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1 text-lg" asChild>
                    <Link href="/contact-sales?plan=realestate">Schedule Demo</Link>
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  14-day free trial • No credit card required • Cancel anytime • No long-term contract
                </p>
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
                question: "Is my client data secure and private?",
                answer: "Absolutely. Perpetual Core uses bank-level 256-bit encryption for all data. We're SOC 2 certified and fully compliant with real estate data privacy regulations. Your client information is never shared, never used to train AI models, and completely private. We take security seriously—many brokerages trust us with their agents' data."
              },
              {
                question: "How long does it take to get started?",
                answer: "Most agents are up and running in under 30 minutes. Sign up, add your first few clients and listings, and start using your AI Coach immediately. We provide guided onboarding, video tutorials, and live chat support to help you get started. You'll see time savings from day one."
              },
              {
                question: "Do I need to be tech-savvy to use Perpetual Core?",
                answer: "Not at all! Perpetual Core is designed for real estate agents, not engineers. If you can send a text message, you can use Perpetual Core. Just type what you need in plain English—no technical knowledge required. Plus, our 24/7 AI Coach can help you learn as you go."
              },
              {
                question: "Can Perpetual Core integrate with my existing tools (MLS, CRM, etc.)?",
                answer: "Yes! Perpetual Core integrates with popular real estate platforms including major MLS systems, Zillow, Realtor.com, and CRMs like Follow Up Boss and kvCORE. During setup, we'll help you connect your tools. Most integrations take less than 5 minutes."
              },
              {
                question: "What if I already use a CRM like Follow Up Boss?",
                answer: "Great! Perpetual Core can work alongside your existing CRM or replace it entirely—your choice. Many agents use Perpetual Core as their primary system because it has smarter memory and better automation. But if you love your current CRM, Perpetual Core can integrate with it and add AI superpowers on top."
              },
              {
                question: "Will this replace my transaction coordinator or assistant?",
                answer: "Perpetual Core is built to complement your team, not replace them. Think of it as a tireless assistant that handles routine tasks (drafting emails, pulling comps, reminding you about follow-ups) so you and your human team can focus on high-value work. Many agents find they need less admin support because Perpetual Core handles so much."
              },
              {
                question: "Can I use Perpetual Core on my phone?",
                answer: "Yes! Perpetual Core works on any device—desktop, tablet, or mobile. We have native iOS and Android apps, plus a mobile-optimized web version. Text your AI Coach from anywhere, pull up client details during showings, or draft emails on the go."
              },
              {
                question: "What if I'm working with multiple clients at the same time?",
                answer: "That's exactly what Perpetual Core is built for! It tracks every client separately with perfect memory. Switch between clients instantly—AI knows exactly where you left off with each one. No more confusion or mixing up details."
              },
              {
                question: "Do you offer training or onboarding?",
                answer: "Yes! Every new agent gets: (1) Guided setup wizard, (2) Video tutorial library, (3) Live onboarding webinars (optional), (4) 24/7 AI Coach to answer questions, (5) Live chat support. Most agents are comfortable within a few hours. For brokerages with multiple agents, we offer group training sessions."
              },
              {
                question: "What happens to my data if I cancel?",
                answer: "You own your data, period. If you cancel, you can export all your client information, listings, and documents in standard formats (CSV, PDF). We'll keep your data for 30 days after cancellation in case you change your mind, then permanently delete it."
              },
              {
                question: "Is there a long-term contract?",
                answer: "No contracts. Pay month-to-month and cancel anytime with 30 days notice. We believe you should stay because Perpetual Core helps you close more deals, not because you're locked into a contract."
              },
              {
                question: "Do you offer a discount for brokerages or teams?",
                answer: "Yes! Brokerages and teams with 5+ agents get volume pricing. Contact us at sales@aios.com for custom team pricing. We also offer white-label solutions for larger brokerages."
              },
              {
                question: "What kind of support do you provide?",
                answer: "Comprehensive support: (1) 24/7 AI Coach for instant answers, (2) Live chat support during business hours, (3) Email support (response within 24 hours), (4) Video tutorials and help docs, (5) Regular webinars and training sessions. We're here to help you succeed."
              },
              {
                question: "Can I really try it free for 14 days?",
                answer: "Yes! Full access to everything for 14 days. No credit card required to start. No hidden fees. No tricks. We're confident you'll love Perpetual Core, so we make it easy to try risk-free. If you don't find value, just walk away—no hard feelings."
              },
              {
                question: "How is Perpetual Core different from ChatGPT?",
                answer: "Great question! ChatGPT forgets everything after each conversation. Perpetual Core remembers every client, property, and conversation forever. Plus, Perpetual Core is built specifically for real estate with features like contract generation, MLS integration, and client tracking. ChatGPT is general-purpose; Perpetual Core is your real estate assistant."
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
                Schedule a demo with our team. We'll answer all your questions and show you exactly how Perpetual Core can help you close more deals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/contact-sales?plan=realestate">
                    Schedule Demo <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="mailto:realestate@aios.com">Email Us</Link>
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
            Ready to Close More Deals?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            See how Perpetual Core can help you spend less time on admin and more time on what matters:
            building relationships and closing deals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" variant="secondary" asChild className="text-lg px-8">
              <Link href="/signup?plan=realestate">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 bg-transparent border-white text-white hover:bg-white/10">
              <Link href="/contact-sales?plan=realestate">Schedule Demo</Link>
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
            Questions? Email us at realestate@aios.com
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
                Your AI-powered assistant for real estate success.
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
                <li><Link href="/blog" className="hover:underline">Blog</Link></li>
                <li><Link href="/tutorials" className="hover:underline">Tutorials</Link></li>
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
              © 2024 AI Operating System. All rights reserved. | SOC 2 Certified | Bank-Level Security
            </p>
            <p className="text-xs">
              Perpetual Core is a software tool designed to assist real estate professionals. Users are responsible for compliance with all applicable real estate laws and regulations.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
