"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2, Heart, Users, BookOpen, MessageCircle, Calendar, XCircle,
  AlertCircle, Brain, Shield, Lock, Database, Sparkles, FileText, Search,
  Clock, Zap, TrendingUp, ArrowRight, DollarSign, Plus, Minus
} from "lucide-react";

export default function NonProfitsPage() {
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
              <Link href="/signup?plan=non-profits">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Heart className="h-4 w-4" />
            Built for Non-Profits & Social Impact Organizations
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Your Organization's Impact Intelligence,
            <span className="block text-primary mt-2">Accessible in Seconds</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Built to help non-profits preserve grant strategies, track donor relationships, organize program wisdom,
            and maintain institutional memory when staff transitions happen. Amplify your impact with intelligent knowledge management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact-sales?plan=non-profits">Schedule Demo</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">See Features</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            14-day free trial • $99/staff member/month • Data privacy guaranteed
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">∞</div>
              <div className="text-sm text-muted-foreground">Institutional Memory</div>
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
              <div className="text-sm text-muted-foreground">Secure & Private</div>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Comparison - A Week at a Non-Profit */}
      <section className="bg-gradient-to-b from-muted/50 to-white dark:from-muted/20 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              A Week at a Non-Profit: Before vs After Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how Perpetual Core transforms grant writing, donor relations, and program management
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
                      <CardDescription>Traditional Non-Profit Workflow</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Monday - Grant Writing Chaos</div>
                      <p className="text-sm text-muted-foreground">
                        Spend 6 hours digging through old grant applications for successful language and metrics.
                        Can't find last year's foundation proposal. Start from scratch. Again.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 6 hours searching scattered files</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Tuesday - Lost Donor History</div>
                      <p className="text-sm text-muted-foreground">
                        Major donor calls. What did they fund last year? What are their interests? Check emails,
                        CRM, old notes. Can't find complete history. Miss opportunity to personalize ask.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ Generic outreach, lower engagement</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Wednesday - Staff Knowledge Walks Out</div>
                      <p className="text-sm text-muted-foreground">
                        Program director gives notice. Their 5 years of program insights, community relationships,
                        and best practices exist only in their head. No transition documentation.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ Institutional memory vanishes</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Thursday - Scattered Impact Data</div>
                      <p className="text-sm text-muted-foreground">
                        Board meeting tomorrow. Need program success stories and metrics. Data is in spreadsheets,
                        reports, emails, and staff heads. Scramble to compile. Present incomplete picture.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 4 hours cobbling together impact report</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Weekly Total:</span>
                        <span className="text-3xl font-bold text-red-600 dark:text-red-400">55+ hours</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Administrative overload • Lost knowledge • Missed opportunities
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
                      <CardDescription>AI-Powered Impact Organization</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Monday - Grant Writing Streamlined</div>
                      <p className="text-sm text-muted-foreground">
                        Ask AI: "Show me successful grant language for education programs." Get instant templates,
                        proven metrics, and winning narratives. Adapt and customize. Submit in 90 minutes.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 90 minutes with better quality</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Tuesday - Personalized Donor Engagement</div>
                      <p className="text-sm text-muted-foreground">
                        Donor calls. Ask AI for complete giving history, program interests, and past interactions.
                        Reference their passion for youth programs. Personalized ask lands. Increased commitment.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ Deeper relationships, higher retention</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Wednesday - Institutional Memory Preserved</div>
                      <p className="text-sm text-muted-foreground">
                        Program director's transition is smooth. All their program insights, community contacts,
                        and best practices are in Perpetual Core. New hire accesses complete knowledge base on day one.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ Zero knowledge loss, seamless transition</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Thursday - Organized Success Stories</div>
                      <p className="text-sm text-muted-foreground">
                        Board meeting. Ask AI: "Generate impact summary for youth program this quarter."
                        Get comprehensive report with metrics, stories, and outcomes. Present complete picture.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 15 minutes for compelling impact report</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Weekly Total:</span>
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400">42 hours</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        More time for mission • Preserved wisdom • Greater impact
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
                    <em>Illustrative example showing potential time savings. Actual results vary by organization size and mission focus.</em>
                  </p>
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">13+</div>
                      <div className="text-sm text-muted-foreground">Hours Saved Weekly</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Higher</div>
                      <div className="text-sm text-muted-foreground">Grant Success Rate</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Stronger</div>
                      <div className="text-sm text-muted-foreground">Donor Relationships</div>
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
                Your Organization's Institutional Brain
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Preserve Decades of Program Wisdom
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                When experienced staff leave, their grant strategies, community relationships, and program insights
                walk out the door. Perpetual Core captures and preserves your organization's knowledge so it compounds over time.
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
                        <div className="font-semibold mb-1">Grant Strategies Disappear</div>
                        <p className="text-sm text-muted-foreground">
                          When your development director leaves, their winning grant templates, funder relationship
                          histories, and successful narrative approaches vanish forever.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Inconsistent Donor Communication</div>
                        <p className="text-sm text-muted-foreground">
                          Different staff members communicate differently with donors. Giving histories get lost.
                          Relationship context disappears. Donors feel like numbers, not partners.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Program Knowledge Evaporates</div>
                        <p className="text-sm text-muted-foreground">
                          Program staff transitions mean lost community contacts, forgotten best practices,
                          and undocumented success strategies. New hires start from scratch.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Impact Stories Get Lost</div>
                        <p className="text-sm text-muted-foreground">
                          Powerful testimonials, measurable outcomes, and program success stories exist in scattered
                          emails and reports. When you need them for grants or board meetings, they're impossible to find.
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
                        <div className="font-semibold mb-1">Grant Success Strategies Preserved</div>
                        <p className="text-sm text-muted-foreground">
                          Capture every successful grant application, funder preference, winning narrative, and proven
                          metric. New development staff access decades of winning strategies instantly.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Consistent Donor Relationships</div>
                        <p className="text-sm text-muted-foreground">
                          Every donor interaction, giving preference, and relationship note becomes part of your
                          organizational memory. Every staff member can provide personalized, informed engagement.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Program Excellence Compounds</div>
                        <p className="text-sm text-muted-foreground">
                          Every program insight, community connection, and best practice is documented and searchable.
                          New staff inherit institutional wisdom, not empty filing cabinets.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Impact Stories Always Accessible</div>
                        <p className="text-sm text-muted-foreground">
                          All success stories, testimonials, and program outcomes are organized and instantly retrievable.
                          Ask AI for impact data and get compelling narratives in seconds.
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
                <CardTitle className="text-2xl">Real-World Example: Development Director Transition</CardTitle>
                <CardDescription className="text-base">
                  How one non-profit preserved 8 years of grant success knowledge
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
                      A youth development non-profit's development director resigned after 8 years. She had built
                      relationships with 15 major foundations, maintained a 78% grant success rate, and developed
                      compelling narrative frameworks. Her knowledge existed in scattered files, her memory, and
                      personal relationships. The board worried about funding continuity during the transition.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      The Perpetual Core Solution
                    </h4>
                    <p className="text-muted-foreground mb-3">
                      During the 3-month transition period, they uploaded to Perpetual Core:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>All successful grant applications with funder-specific language and preferences</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Donor relationship histories including giving patterns, program interests, and communication preferences</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Program impact data, success metrics, and compelling testimonials organized by theme</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Grant calendar, reporting schedules, and funder communication templates</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      The Result
                    </h4>
                    <p className="text-muted-foreground mb-3">
                      When the new development director started:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Asked AI: "What language resonates with the Smith Foundation?" Got instant templates and proven approaches</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Maintained relationships with all major donors by accessing complete interaction histories</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Submitted first grant in week 2 using Perpetual Core templates—approved with full funding</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Grant success rate remained at 75% during transition—board saw zero funding disruption</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-t pt-6">
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-6 border border-green-200 dark:border-green-900/30">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-green-700 dark:text-green-300">The Bottom Line:</strong> Your organization's
                        fundraising and program knowledge grows stronger with every staff generation instead of disappearing.
                        Every team member who ever worked at your non-profit contributes to growing institutional intelligence
                        that makes the entire organization more effective at creating impact.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 bg-gradient-to-b from-muted/30 to-white dark:from-muted/10 dark:to-gray-900">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Built for Non-Profit Workflows</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tools designed to help you maximize mission impact and operational efficiency
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Grant Library & Templates</CardTitle>
              <CardDescription>
                Store every successful grant application, funder preference, and winning narrative.
                AI instantly retrieves proven language for new applications.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Donor CRM & Relationship Management</CardTitle>
              <CardDescription>
                Track donor giving histories, program interests, communication preferences, and relationship notes.
                Build deeper, more personalized connections.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Program Documentation & Best Practices</CardTitle>
              <CardDescription>
                Capture program insights, community relationships, intervention strategies, and what works.
                Preserve institutional knowledge across staff transitions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Volunteer Management & Coordination</CardTitle>
              <CardDescription>
                Manage volunteer schedules, skills, preferences, and impact hours. Coordinate across
                programs without spreadsheet chaos.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Impact Reporting & Success Stories</CardTitle>
              <CardDescription>
                Organize program outcomes, testimonials, and measurable impact. Generate compelling
                reports for funders and boards in minutes.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Board Communications & Governance</CardTitle>
              <CardDescription>
                Track board meeting notes, strategic decisions, policy documents, and governance materials.
                Make organizational memory accessible to leadership.
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
              How Non-Profits Use Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built to solve the real challenges non-profits face every day
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Grant Writing Excellence */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Grant Writing Excellence</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Starting a new grant? Ask AI to search all successful applications to that funder. Get instant
                  templates, proven metrics, compelling narratives. Increase win rate and cut writing time by 75%.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Access every successful grant application instantly</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Retrieve funder-specific language and preferences</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Build on proven impact narratives</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Donor Relationship Management */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
                  <Heart className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Donor Relationship Management</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Before donor meetings, ask AI for complete giving history, program interests, and past conversations.
                  Make every interaction personal and informed. Increase retention and lifetime value.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Track complete donor relationship histories</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Personalize outreach based on preferences</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Build deeper, more meaningful partnerships</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Staff Transitions */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Seamless Staff Transitions</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  When staff leave, their knowledge stays. New hires access complete program histories, community
                  contacts, best practices, and institutional wisdom. Reduce onboarding time from months to days.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Preserve departing staff knowledge</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Accelerate new hire effectiveness</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Maintain program quality during transitions</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Impact Reporting */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Impact Reporting & Storytelling</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Need impact data for board meeting or grant report? Ask AI for program outcomes, success stories,
                  and metrics. Generate compelling reports in minutes instead of hours of data archaeology.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Organize all impact data and testimonials</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Generate reports with compelling narratives</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Track outcomes across programs and time</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Coach Feature Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-primary/5 to-purple-500/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Sparkles className="h-4 w-4" />
              Featured: Your 24/7 Impact Assistant
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Your AI Coach, Always Available
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Never feel stuck in grant writing or program planning. Your AI coach answers questions 24/7,
              helps you find resources, and guides you through organizational challenges.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            {/* Left: Feature Description */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold">Ask Anything, Anytime</h3>
              <p className="text-muted-foreground leading-relaxed">
                Need grant language for a foundation? Looking for donor giving history? Want to find that perfect
                impact story? Just ask your AI Coach.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: "Instant Knowledge Access",
                    desc: "Get immediate answers from your organization's complete knowledge base without searching files."
                  },
                  {
                    title: "Context-Aware Guidance",
                    desc: "AI Coach understands non-profit context and provides mission-aligned, practical support."
                  },
                  {
                    title: "Always Available",
                    desc: "11 PM grant deadline? Weekend board report? AI Coach is ready to help find what you need."
                  },
                  {
                    title: "Learns Your Organization",
                    desc: "The more you use it, the better AI Coach understands your programs, funders, and impact model."
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
                      <p className="text-sm">"I'm writing a grant to the Thompson Foundation. What language has worked with them before?"</p>
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
                      <p className="text-sm mb-3">You've received 3 grants from Thompson Foundation. Here's what resonated:</p>
                      <ol className="text-sm space-y-2 list-decimal list-inside">
                        <li>They value "measurable outcomes" and "evidence-based approaches"</li>
                        <li>Strong emphasis on youth development and educational equity</li>
                        <li>They funded your after-school program at $75K (2022) and $85K (2023)</li>
                      </ol>
                      <p className="text-sm mt-3 text-muted-foreground">
                        💡 <strong>Tip:</strong> Your 2023 application had compelling data on reading level improvements. They specifically mentioned it in the award letter.
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
                      <p className="text-sm">"Show me that reading data section."</p>
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
                      <p className="text-sm">"87% of program participants improved reading levels by at least one grade equivalent. Students who attended 80%+ of sessions showed 2.3 grade level improvement on average..."</p>
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
              <CardDescription>Ask about anything in your organizational knowledge base</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  "What grants did we win last year?",
                  "Show me donor Smith's giving history",
                  "What are our youth program outcomes?",
                  "Find impact stories about education",
                  "Who are our community partners?",
                  "What's our volunteer onboarding process?",
                  "Show me budget templates for grants",
                  "What does donor Johnson care about?",
                  "Find testimonials from program participants"
                ].map((topic, i) => (
                  <Button key={i} variant="outline" className="justify-start text-left h-auto py-3">
                    <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{topic}</span>
                  </Button>
                ))}
              </div>
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
              Everything you need to know about Perpetual Core for non-profits
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "How do you protect sensitive donor and program participant data?",
                answer: "Data security is our top priority. All information is encrypted with 256-bit encryption at rest and in transit. We use zero-knowledge architecture—we cannot access your data, only you can. Your data is NEVER used to train AI models. We're SOC 2 Type II certified with complete audit logs. You control access with granular permissions by role and program area. Many non-profits use Perpetual Core specifically because it's MORE secure than scattered files, emails, and unencrypted spreadsheets."
              },
              {
                question: "How much does it cost for a small non-profit?",
                answer: "$99 per staff member per month. Most small non-profits (3-10 staff) pay $300-1,000/month. We offer 20% discount for annual payment and volume discounts for larger organizations (10+ staff). First 14 days are free. The ROI is compelling: staff save 10+ hours weekly, grant success rates increase, and institutional knowledge is preserved. Many organizations reallocate budget from other software tools or view it as capacity-building investment."
              },
              {
                question: "How does Perpetual Core help with grant writing specifically?",
                answer: "Upload all successful grant applications, funder research, and impact data. When writing a new grant, ask: 'Show me winning language for education grants' or 'What did the Smith Foundation fund before?' AI instantly retrieves proven templates, successful metrics, and compelling narratives. Customize for your current proposal. Non-profits typically cut grant writing time by 75% while increasing success rates because you're building on proven approaches, not starting from scratch every time."
              },
              {
                question: "Can Perpetual Core help us manage donor relationships?",
                answer: "Absolutely. Track every donor interaction, giving history, program interests, communication preferences, and relationship notes. Before donor meetings, ask AI for complete relationship context. Send personalized thank-yous referencing their specific interests. Track pledge fulfillment and engagement patterns. The AI can remind you of follow-up tasks. Result: donors feel personally known and valued, leading to higher retention rates and increased giving."
              },
              {
                question: "What happens when program staff leave? How do we preserve their knowledge?",
                answer: "This is where Perpetual Core shines. Throughout employment, staff document program insights, community relationships, best practices, and success strategies in Perpetual Core. When they transition out, all their knowledge remains accessible. New hires ask AI: 'What were Maria's community partnerships?' or 'How did we handle [specific situation]?' They inherit complete institutional memory instead of empty filing cabinets. Organizations report reducing onboarding time from 6+ months to 2-3 weeks."
              },
              {
                question: "Does this work with our existing donor management software?",
                answer: "Perpetual Core integrates with most donor management systems (Salesforce NPSP, Bloomerang, DonorPerfect, Little Green Light, Network for Good, etc.). We can sync donor data and update records. Many non-profits use Perpetual Core alongside their donor database—the database handles transactions and contact info, while Perpetual Core handles knowledge management, grant writing, and program documentation. Setup takes 15-30 minutes during onboarding. We also offer API access for custom integrations."
              },
              {
                question: "How do we track program impact and outcomes?",
                answer: "Document all program activities, participant outcomes, success stories, and measurable metrics in Perpetual Core. Ask AI to generate impact reports filtered by program, time period, demographic, or outcome type. Get compelling narratives with supporting data in minutes. Perfect for grant reports, board presentations, donor updates, or annual reports. AI can identify patterns and trends across programs that might not be obvious in scattered data."
              },
              {
                question: "Can multiple staff members access information? How do permissions work?",
                answer: "Yes, with granular role-based permissions. You control exactly who sees what. For example: Executive Director sees everything, Program Directors see their program areas, Development staff see donor/grant info but not HR data, Board members see strategic documents but not daily operations. Create program-specific or department-specific workspaces. Full audit logs track all access. This enables collaboration while maintaining appropriate confidentiality boundaries."
              },
              {
                question: "What should we NOT use Perpetual Core for?",
                answer: "Perpetual Core is for organization, memory, and support—not decision replacement. DO NOT use it to: (1) Make strategic or programmatic decisions without human judgment. (2) Store highly confidential case management information without proper controls. (3) Auto-generate grant applications without thorough review for accuracy and mission alignment. (4) Replace actual community relationships and program delivery. (5) Make hiring, firing, or personnel decisions. Use Perpetual Core to work smarter and preserve knowledge, not to avoid the human work of social impact."
              },
              {
                question: "How long does it take to set up and train staff?",
                answer: "Most non-profits are fully operational within 1 week. Day 1: Upload initial content (grants, impact reports, donor lists) and configure permissions (2-3 hours). Day 2-3: Staff training (1-hour group session we provide). Day 4-7: Team starts using Perpetual Core with our support. We provide dedicated onboarding, training materials, and live support during your first month. Average time to first value: 24 hours. Most teams are amazed how quickly they see benefits."
              },
              {
                question: "What kind of support do you provide to non-profits?",
                answer: "Mission-focused support: (1) Dedicated onboarding specialist for first 30 days. (2) Live training for your team (included). (3) Email and chat support with same-day response. (4) Phone support for urgent needs. (5) Help center with non-profit-specific guides. (6) Monthly check-ins first quarter. (7) Customer success team who understands non-profit context. We view supporting mission-driven organizations as part of our own mission, not just customer service."
              },
              {
                question: "Do you offer discounts for non-profits?",
                answer: "Yes. We offer: (1) 20% discount for annual payment. (2) Volume discounts: 15% off for 10+ staff, 25% off for 25+ staff. (3) Special pricing for small non-profits and startups (contact us). (4) Reduced rates for qualifying international development organizations (application required). We want Perpetual Core accessible to organizations of all sizes. If cost is a barrier to increasing your impact, talk to us—we'll work with you."
              },
              {
                question: "How does Perpetual Core help with board communications and governance?",
                answer: "Store all board meeting minutes, strategic plans, policy documents, committee reports, and governance materials. Board members can ask AI: 'What did we decide about the strategic plan?' or 'Show me last year's program outcomes.' New board members access complete organizational history during orientation. Generate board reports by asking AI to summarize program updates, financial status, or strategic initiatives. Makes governance more informed and efficient."
              },
              {
                question: "Can we use Perpetual Core for volunteer management?",
                answer: "Absolutely. Track volunteer information including skills, availability, interests, training status, and service hours. When you need volunteers, ask: 'Who's trained for youth mentoring and available Saturday mornings?' Get instant filtered lists. Coordinate across programs. Send automated reminders and appreciation messages. Track volunteer impact hours for grants and annual reports. Makes volunteer coordination that used to take hours take minutes."
              },
              {
                question: "What happens to our data if we cancel?",
                answer: "You own your data, period. If you cancel, export everything—grants, donor records, program documentation, impact reports—in standard formats (PDF, DOCX, CSV, Excel). We keep your data for 90 days after cancellation in case you change your mind, then permanently delete it. You'll receive a certificate of data destruction upon request. No lock-in, no data hostage situations. Your organizational knowledge belongs to your organization."
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
                Schedule a call with our team. We'll answer all your questions and show you exactly how Perpetual Core works for non-profits.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/contact-sales?plan=non-profits">
                    Schedule Demo
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="mailto:nonprofits@aios.com">Email Non-Profit Team</Link>
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
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing for Non-Profits</h2>
            <p className="text-xl text-muted-foreground">
              Invest in capacity building and institutional memory
            </p>
          </div>

          <Card className="border-2 border-primary">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-2 mb-4">
                  <span className="text-5xl font-bold">$99</span>
                  <span className="text-xl text-muted-foreground">/staff member/month</span>
                </div>
                <p className="text-muted-foreground">Everything included. No hidden fees.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Unlimited grant templates & storage</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Donor relationship management</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Program documentation & best practices</span>
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
                  <span className="text-sm">Donor database integrations</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">SOC 2 certified security & encryption</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Dedicated onboarding & training</span>
                </div>
              </div>

              <div className="border-t pt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Volume discounts (10+ staff)</span>
                  <span className="font-semibold">15% off</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Volume discounts (25+ staff)</span>
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
                  <Link href="/signup?plan=non-profits">Start 14-Day Free Trial</Link>
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
              Ready to Amplify Your Impact?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join non-profits that are increasing grant success rates, strengthening donor relationships,
              and building institutional memory that compounds over time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/contact-sales?plan=non-profits">Schedule Demo</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent border-white text-white hover:bg-white/10">
                <Link href="/signup?plan=non-profits">Start Free Trial</Link>
              </Button>
            </div>
            <p className="text-sm mt-6 opacity-75">
              14-day free trial • Data privacy guaranteed • Setup in 1 day
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
                The AI-powered knowledge platform built for non-profits and social impact organizations.
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
              © 2024 AI Operating System. All rights reserved. | SOC 2 Type II Certified | Data Privacy Guaranteed
            </p>
            <p className="text-xs max-w-3xl mx-auto">
              Perpetual Core is a productivity tool designed for non-profits and social impact organizations. Users are responsible for grant accuracy and program evaluation standards.
              Your organizational data is encrypted and never used to train AI models.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
