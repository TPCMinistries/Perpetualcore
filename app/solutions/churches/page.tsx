"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2, Heart, Users, BookOpen, MessageCircle, Calendar, XCircle,
  AlertCircle, Brain, Shield, Lock, Database, Sparkles, FileText, Search,
  Clock, Zap, TrendingUp, ArrowRight, DollarSign, Infinity, Plus, Minus
} from "lucide-react";

export default function ChurchesPage() {
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
              <Link href="/signup?plan=churches">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Heart className="h-4 w-4" />
            Built for Churches & Ministries
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Your Church's Ministry Wisdom,
            <span className="block text-primary mt-2">Accessible in Seconds</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Built to help churches preserve pastoral wisdom, organize sermon research, track member care,
            and coordinate volunteers. Steward your ministry resources with faithful excellence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact-sales?plan=churches">Schedule Demo</Link>
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
              <div className="text-sm text-muted-foreground">Ministry Memory</div>
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

      {/* Before/After Comparison - A Week in Ministry */}
      <section className="bg-gradient-to-b from-muted/50 to-white dark:from-muted/20 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              A Week in Ministry: Before vs After Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how Perpetual Core can transform pastoral workflows and member care
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
                      <CardDescription>Traditional Ministry Workflow</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Monday - Sermon Prep Begins</div>
                      <p className="text-sm text-muted-foreground">
                        Spend 4 hours researching commentary, hunting through old notes, and trying to remember
                        that perfect illustration from 3 years ago. Can't find it.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 4 hours searching scattered files</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Tuesday - Prayer Requests Lost</div>
                      <p className="text-sm text-muted-foreground">
                        Sister Mary mentioned her daughter's job interview. Where did you write that down?
                        Check sticky notes, phone notes, email. Can't find it. Feel guilty.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ Members feel forgotten</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Wednesday - Volunteer Chaos</div>
                      <p className="text-sm text-muted-foreground">
                        Children's ministry needs volunteers. Who served last month? What are their
                        preferences? Spend hours digging through spreadsheets and group texts.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 2 hours on volunteer coordination</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Sunday - Forgot Follow-Ups</div>
                      <p className="text-sm text-muted-foreground">
                        Realize you never followed up with 3 visitors from last week. Promised to call
                        the Johnson family about their crisis. Forgot both. Feel overwhelmed.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ Pastoral care suffers</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Weekly Total:</span>
                        <span className="text-3xl font-bold text-red-600 dark:text-red-400">60+ hours</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Administrative overload • Forgotten details • Ministry burnout
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
                      <CardDescription>AI-Powered Ministry</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Monday - Sermon Prep Streamlined</div>
                      <p className="text-sm text-muted-foreground">
                        Ask AI: "Show me all my notes on Romans 8." Instantly get sermons, commentaries,
                        illustrations, and cross-references. Find that perfect story from 3 years ago in 10 seconds.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 45 minutes total research time</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Tuesday - Prayer Tracking Organized</div>
                      <p className="text-sm text-muted-foreground">
                        Sister Mary's daughter interview is logged automatically. AI reminds you to follow up
                        Thursday. You text her an encouraging message. She feels seen and loved.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ Every member feels cared for</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Wednesday - Volunteer Coordination Easy</div>
                      <p className="text-sm text-muted-foreground">
                        Ask AI: "Who can serve in children's ministry this month?" Get instant list with
                        preferences, availability, and background checks. Send request. Done in 5 minutes.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 5 minutes to coordinate volunteers</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Sunday - Follow-Ups Automated</div>
                      <p className="text-sm text-muted-foreground">
                        AI drafted personalized welcome emails to all 3 visitors. Reminded you about Johnson family
                        crisis call on Friday. You called. They felt supported. Ministry is thriving.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ Excellent pastoral care, no stress</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Weekly Total:</span>
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400">45 hours</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Focused ministry • Better care • Healthy work-life balance
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
                    <em>Illustrative example showing potential time savings. Actual results vary by church size and ministry context.</em>
                  </p>
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">10+</div>
                      <div className="text-sm text-muted-foreground">Hours Saved Weekly</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Better</div>
                      <div className="text-sm text-muted-foreground">Member Care</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Reduced</div>
                      <div className="text-sm text-muted-foreground">Ministry Burnout</div>
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
                Your Church's Institutional Brain
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Preserve Decades of Pastoral Wisdom
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                When senior pastors retire, their counseling approaches, theological insights, and community relationships
                walk out the door. Perpetual Core captures and preserves your church's ministry wisdom so it compounds over time.
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
                        <div className="font-semibold mb-1">Pastoral Wisdom Disappears</div>
                        <p className="text-sm text-muted-foreground">
                          When experienced pastors retire or move on, their counseling frameworks, sermon insights,
                          and community relationship history vanish forever.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Starting From Scratch Every Time</div>
                        <p className="text-sm text-muted-foreground">
                          New pastors spend years building the same relationships, relearning congregant histories,
                          and rediscovering ministry approaches their predecessors already mastered.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Inconsistent Ministry Approaches</div>
                        <p className="text-sm text-muted-foreground">
                          Different staff members handle similar situations differently. Members receive inconsistent
                          care. Best practices stay locked in individual heads.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Lost Church History</div>
                        <p className="text-sm text-muted-foreground">
                          Stories of God's faithfulness, answers to prayer, and spiritual milestones fade from
                          collective memory within a generation.
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
                        <div className="font-semibold mb-1">Ministry Wisdom Preserved Forever</div>
                        <p className="text-sm text-muted-foreground">
                          Capture senior pastors' counseling approaches, sermon frameworks, and theological insights.
                          Their wisdom remains accessible to the entire church staff.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Collective Ministry Intelligence</div>
                        <p className="text-sm text-muted-foreground">
                          Every sermon, counseling session insight, and pastoral care note becomes part of your
                          church's growing wisdom. Everyone benefits from collective experience.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Consistent Excellence in Care</div>
                        <p className="text-sm text-muted-foreground">
                          Every staff member can access your church's best practices for counseling, discipleship,
                          and pastoral care. Members receive consistently excellent ministry.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Living Church Legacy</div>
                        <p className="text-sm text-muted-foreground">
                          New pastors get immediate access to decades of church history, testimony, and institutional
                          knowledge. They're effective from day one.
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
                <CardTitle className="text-2xl">Real-World Example: Senior Pastor Transition</CardTitle>
                <CardDescription className="text-base">
                  How one church preserved 35 years of pastoral wisdom
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
                      A senior pastor with 35 years at the church announced retirement. He was beloved for his
                      exceptional counseling skills, deep theological knowledge, and strong community relationships.
                      The congregation worried about losing his wisdom and pastoral touch. The incoming pastor felt
                      the weight of stepping into such large shoes.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      The Perpetual Core Solution
                    </h4>
                    <p className="text-muted-foreground mb-3">
                      Six months before retirement, the church uploaded to Perpetual Core:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>35 years of sermon archives with biblical exposition frameworks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Pastoral counseling frameworks for grief, marriage, addiction, and faith crises</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Theological study notes and biblical interpretation methodologies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Community relationship history and key congregant background notes</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      The Result
                    </h4>
                    <p className="text-muted-foreground mb-3">
                      When the new pastor arrived:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>He asked AI: "Show me Pastor David's approach to grief counseling" and got instant frameworks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Sermons built on the previous pastor's theological foundation while adding fresh insights</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Accessed member histories before pastoral visits, making connections feel personal from day one</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Congregation felt continuity in leadership while experiencing fresh pastoral voice</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-t pt-6">
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-6 border border-green-200 dark:border-green-900/30">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-green-700 dark:text-green-300">The Bottom Line:</strong> Your church's
                        pastoral wisdom grows stronger with every generation instead of disappearing. Every pastor who
                        ever served contributes to a growing ministry intelligence that makes the entire church better
                        at loving and serving people.
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
              Featured: Your 24/7 Ministry Assistant
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Your AI Coach, Always Available
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Never feel stuck in sermon prep or pastoral care. Your AI coach answers questions 24/7,
              helps you find resources, and guides you through ministry challenges.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            {/* Left: Feature Description */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold">Ask Anything, Anytime</h3>
              <p className="text-muted-foreground leading-relaxed">
                Need help with biblical interpretation? Looking for your sermon on grace from 2019?
                Want to remember a member's prayer request? Just ask your AI Coach.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: "Instant Answers",
                    desc: "Get immediate help without digging through files or calling other staff members."
                  },
                  {
                    title: "Theological Guidance",
                    desc: "The AI Coach understands ministry context and provides biblically-grounded support."
                  },
                  {
                    title: "Always Available",
                    desc: "2 AM Saturday night sermon prep? AI Coach is ready to help find your research."
                  },
                  {
                    title: "Judgment-Free",
                    desc: "Ask the same question multiple times. Your AI Coach will answer patiently every time."
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
                      <p className="text-sm">"I'm preaching on Philippians 4:6-7 this Sunday. What insights do I have from previous sermons?"</p>
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
                      <p className="text-sm mb-3">You've preached on this passage 3 times. Here's what you emphasized:</p>
                      <ol className="text-sm space-y-2 list-decimal list-inside">
                        <li>2018: "Anxious for nothing" — focused on surrender and trust</li>
                        <li>2020 (COVID): Prayer as spiritual breathing — emphasized thanksgiving</li>
                        <li>2022: The peace that guards hearts — explored Greek word for "guards"</li>
                      </ol>
                      <p className="text-sm mt-3 text-muted-foreground">
                        💡 <strong>Tip:</strong> Your 2020 sermon had the illustration about worry being like a rocking chair. Members still reference it.
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
                      <p className="text-sm">"Show me that rocking chair illustration."</p>
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
                      <p className="text-sm">"Worry is like a rocking chair. It gives you something to do but doesn't get you anywhere. God invites us to trade the rocking chair of worry for the solid ground of prayer..."</p>
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
              <CardDescription>Ask about anything in your ministry knowledge base</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  "What sermons have I preached on grace?",
                  "Who visited our church last month?",
                  "Show me Mary Johnson's prayer requests",
                  "What's our baptism preparation process?",
                  "Who can serve in children's ministry?",
                  "What biblical counseling resources do we have?",
                  "How did we handle COVID-19 transitions?",
                  "What's our small group curriculum?",
                  "Show me youth ministry volunteer schedule"
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

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 bg-gradient-to-b from-muted/30 to-white dark:from-muted/10 dark:to-gray-900">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Built for Church Ministry Workflows</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tools designed to help you serve your congregation with excellence
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Sermon Preparation & Biblical Research</CardTitle>
              <CardDescription>
                Upload sermon archives, commentaries, and biblical study notes. AI instantly searches
                decades of research to support your weekly preaching preparation.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Pastoral Care & Counseling Knowledge</CardTitle>
              <CardDescription>
                Capture counseling frameworks, pastoral care approaches, and member notes.
                Provide consistent, excellent care across your entire staff.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Prayer Request Management</CardTitle>
              <CardDescription>
                Never forget a prayer request again. Track member needs, set follow-up reminders,
                and show your congregation they are seen and remembered.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Volunteer & Ministry Coordination</CardTitle>
              <CardDescription>
                Manage volunteer schedules, track preferences and availability, and coordinate
                ministries without spreadsheet chaos or endless group texts.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Member Relationship Tracking</CardTitle>
              <CardDescription>
                Remember visitor names, member milestones, family details, and spiritual journeys.
                Build deeper relationships through better information stewardship.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Church History & Legacy Preservation</CardTitle>
              <CardDescription>
                Document answered prayers, spiritual milestones, and God's faithfulness. Build
                a living testimony for future generations.
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
              How Churches Use Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built to solve the real challenges churches face every week
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Sermon Preparation Week */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Sermon Preparation Week</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Monday morning: Ask AI to search all your notes on the passage. Get instant access to
                  commentaries, cross-references, previous sermons, and illustrations. Cut research time by 75%.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Search decades of sermon archives instantly</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Find that perfect illustration from years ago</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Build on previous theological frameworks</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pastoral Counseling */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
                  <Heart className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Pastoral Counseling</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Before a counseling session, ask AI for your church's framework on the issue. Get proven
                  approaches, biblical resources, and previous case insights while maintaining confidentiality.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Access counseling frameworks and biblical resources</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Find recommended books and referral resources</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Build on your senior pastor's pastoral wisdom</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Volunteer Coordination */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Volunteer Coordination</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Need volunteers for Sunday School? Ask AI who's available, qualified, and interested.
                  Get instant lists with background check status and serving preferences. Send requests in minutes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Track volunteer preferences and availability</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Manage background checks and training status</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Coordinate across multiple ministries easily</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Multi-Service/Campus Management */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Multi-Service/Campus Management</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Multiple services or campuses? Share sermon notes, prayer requests, visitor info, and ministry
                  updates across all locations. Keep everyone on the same page effortlessly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Share knowledge across multiple campuses</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Consistent messaging and ministry approaches</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Track visitors and follow-ups centrally</span>
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
                How Churches Can Use Perpetual Core
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Built to reduce administrative burden and improve member care—while maintaining
                appropriate boundaries and theological integrity.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Upload Your Ministry Knowledge</h3>
                  <p className="text-muted-foreground text-sm">
                    Add sermon archives, counseling resources, volunteer information, member notes, and
                    church history. AI organizes everything automatically and makes it instantly searchable.
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
                    Ask questions like "What sermons have I preached on forgiveness?" or "Who can serve
                    in youth ministry?" Get instant answers from your church's knowledge base.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Grows Smarter Over Time</h3>
                  <p className="text-muted-foreground text-sm">
                    The more you use Perpetual Core, the more valuable it becomes. Your church's wisdom compounds
                    over years, building a legacy of faithful ministry.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Old Way vs New Way Comparison Table */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Traditional Ministry Workflow vs Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground">
              See exactly what changes when churches adopt Perpetual Core
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
                    feature: "Sermon Preparation",
                    old: "4+ hours searching files and books for research",
                    new: "45 minutes with instant access to all previous work",
                    highlight: true
                  },
                  {
                    feature: "Prayer Request Tracking",
                    old: "Lost sticky notes, forgotten commitments",
                    new: "Organized database with automated follow-up reminders"
                  },
                  {
                    feature: "Volunteer Coordination",
                    old: "Endless group texts and spreadsheet chaos",
                    new: "Ask AI who's available, get list in seconds"
                  },
                  {
                    feature: "Pastoral Care Follow-ups",
                    old: "Forgotten visits, inconsistent member care",
                    new: "AI reminds you at the right time with context",
                    highlight: true
                  },
                  {
                    feature: "Church History",
                    old: "Stories fade, wisdom lost when leaders leave",
                    new: "Preserved forever in searchable institutional memory"
                  },
                  {
                    feature: "New Pastor Onboarding",
                    old: "Months learning member names and church culture",
                    new: "Instant access to decades of congregant history"
                  },
                  {
                    feature: "Biblical Research",
                    old: "Scattered notes across books and computer files",
                    new: "All study notes searchable in one place",
                    highlight: true
                  },
                  {
                    feature: "Member Relationship Info",
                    old: "Trying to remember family details before visits",
                    new: "Quick lookup shows prayer requests, milestones, context"
                  },
                  {
                    feature: "Multi-Campus Coordination",
                    old: "Different approaches at each location",
                    new: "Shared knowledge and consistent ministry approach"
                  },
                  {
                    feature: "Ministry Consistency",
                    old: "Each staff member has their own systems",
                    new: "Unified approach based on church's best practices"
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
                Churches using Perpetual Core save an average of <strong className="text-primary">10+ hours per staff member per week</strong>,
                provide <strong className="text-primary">better member care</strong>, and
                <strong className="text-primary"> preserve pastoral wisdom</strong> for future generations.
              </p>
              <Button size="lg" asChild className="mt-2">
                <Link href="/contact-sales?plan=churches">
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
              Everything you need to know about Perpetual Core for churches
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "How do you protect sensitive pastoral and member information?",
                answer: "We take data security extremely seriously. All information is encrypted with 256-bit encryption at rest and in transit. We use zero-knowledge architecture, meaning we cannot access your data—only you can. Your church data is NEVER used to train AI models. We're SOC 2 Type II certified and maintain complete audit logs. You control exactly who on your staff can access what information through granular permissions. Many churches use Perpetual Core specifically because it's MORE secure than scattered sticky notes, emails, and unencrypted files."
              },
              {
                question: "How much does it cost for a small church?",
                answer: "$99 per staff member per month. Most small churches (50-300 members) have 2-5 staff members, so typical cost is $200-500/month. We offer 20% discount for annual payment and volume discounts for larger churches (10+ staff). First 14 days are completely free to try. Think of it as stewardship: the time saved (10+ hours/week per staff) is worth far more than the cost. Many churches reallocate a small portion of their office supplies or software budget."
              },
              {
                question: "How does Perpetual Core help with sermon preparation specifically?",
                answer: "Upload all your previous sermons, study notes, commentaries, and biblical research. When preparing a new sermon, ask questions like 'Show me my notes on grace' or 'What did I preach on John 3:16 before?' AI instantly searches decades of your work and surfaces relevant insights, illustrations, and cross-references. Pastors typically cut sermon prep time by 75% while producing better, more theologically consistent messages. You're not starting from scratch—you're building on your previous work."
              },
              {
                question: "Can Perpetual Core help us track prayer requests and follow-ups?",
                answer: "Absolutely. Log prayer requests when members share them (by voice or text). Set follow-up reminders. Ask AI 'Show me Mary's prayer requests' before a pastoral visit. You can also search all prayer requests by topic (illness, employment, family issues) to see patterns and opportunities for targeted ministry. The AI can remind you to check in at appropriate times. No more lost sticky notes or forgotten commitments—show your congregation they're truly seen and remembered."
              },
              {
                question: "How do we manage volunteers and coordinate ministries?",
                answer: "Upload volunteer information including preferences, availability, background check status, and serving history. When you need volunteers, ask 'Who can serve in children's ministry this month?' and get instant filtered lists. Track who's served recently to avoid burnout. Coordinate across multiple ministries without spreadsheet chaos. Send automated reminders and thank-you messages. Makes volunteer coordination that used to take 2 hours take 5 minutes."
              },
              {
                question: "Does this work with our church management software?",
                answer: "Perpetual Core can integrate with most church management systems (Planning Center, Church Community Builder, Breeze, Elvanto, etc.). We can pull member information and sync updates. Most churches use Perpetual Core alongside their ChMS—the ChMS handles attendance and giving, while Perpetual Core handles knowledge management, sermon prep, and pastoral care notes. Setup takes 15-30 minutes during onboarding. We also offer API access for custom integrations."
              },
              {
                question: "What happens to our data if we cancel?",
                answer: "You own your data, period. If you cancel, you can export everything—sermons, notes, member information, prayer requests—in standard formats (PDF, DOCX, CSV). We keep your data for 90 days after cancellation in case you change your mind, then permanently delete it. You'll receive a certificate of data destruction upon request. No lock-in, no hostage data. Your ministry information belongs to your church."
              },
              {
                question: "How long does it take to set up and train our staff?",
                answer: "Most churches are fully operational within 1 week. Day 1: Upload initial content (sermons, notes) and set permissions (2-3 hours). Day 2-3: Staff training (1-hour group session—we provide this). Day 4-7: Staff starts using Perpetual Core with support available. We provide dedicated onboarding, training videos, and live support during your first month. Average time to first value: 24 hours. Most pastors are amazed at how quickly they find value."
              },
              {
                question: "Is it theologically appropriate to use AI for ministry?",
                answer: "Great question. Perpetual Core is a tool for organization and memory, not theological discernment. Think of it like a very smart filing cabinet or research assistant. YOU still do all the theological work, biblical interpretation, and pastoral care. Perpetual Core just helps you find your previous work faster and remember important details. Many pastors view it as faithful stewardship—leveraging technology to serve people better and preserve God's work in their congregation. The AI never replaces prayer, scripture, or the Holy Spirit's guidance."
              },
              {
                question: "What should we NOT use Perpetual Core for?",
                answer: "Perpetual Core is designed for organization, memory, and support—not replacement of pastoral ministry. DO NOT use it to: (1) Make theological or doctrinal decisions (that requires prayerful discernment). (2) Replace actual pastoral visits and counseling (technology assists, doesn't replace presence). (3) Auto-generate sermons without your review and theological oversight. (4) Store highly sensitive confession-level information without proper encryption controls. (5) Make decisions about church discipline or governance. Use Perpetual Core to serve people better, not to avoid the human work of ministry."
              },
              {
                question: "Can multiple staff members access the same information?",
                answer: "Yes, with granular permission controls. You decide exactly who can access what. For example: senior pastor sees everything, associate pastors see their ministry areas, administrative staff see volunteer info but not counseling notes. You can create ministry-specific workspaces (youth ministry, worship, children's) with appropriate access. Full audit logs track who accessed what and when. This allows collaboration while maintaining appropriate boundaries."
              },
              {
                question: "How do you handle multi-campus or multiple service churches?",
                answer: "Perfect for multi-site churches. Share sermon notes, prayer requests, visitor information, and ministry updates across all locations. Maintain consistent theology and approach while allowing campus-specific customization. Track which campus each member attends. Coordinate volunteers across sites. Many multi-campus churches use Perpetual Core specifically to maintain unified vision and knowledge sharing as they grow. Campus pastors can access the senior pastor's theological frameworks while developing their own contextual applications."
              },
              {
                question: "What kind of support do you provide to churches?",
                answer: "White-glove support designed for church leaders: (1) Dedicated onboarding specialist for first 30 days. (2) Live training session for your staff (included). (3) Email and chat support with same-day response. (4) Phone support for urgent needs. (5) Help center with ministry-specific guides and videos. (6) Monthly check-ins first quarter. (7) Ministry-focused customer success team who understands church context. We view supporting churches as ministry, not just customer service."
              },
              {
                question: "Do you offer discounts for churches or ministries?",
                answer: "Yes. We offer: (1) 20% discount for annual payment. (2) Volume discounts: 15% off for 10+ staff, 25% off for 25+ staff. (3) Special pricing for church plants and small churches (contact us). (4) Free access for qualifying international missions and under-resourced ministries (application required). We want to make Perpetual Core accessible to churches of all sizes. If cost is a barrier, talk to us—we'll work with you."
              },
              {
                question: "How does this help when our senior pastor retires or leaves?",
                answer: "This is one of the most valuable benefits. Before the transition, upload the senior pastor's sermon archives, counseling frameworks, theological notes, and relationship histories. When the new pastor arrives, they have instant access to decades of institutional knowledge. They can ask 'How did Pastor John approach grief counseling?' or 'What's the history with the Smith family?' The congregation feels continuity while experiencing fresh leadership. Many churches use Perpetual Core specifically to preserve pastoral wisdom across leadership transitions."
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
                Schedule a call with our team. We'll answer all your questions and show you exactly how Perpetual Core works for churches.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/contact-sales?plan=churches">
                    Schedule Demo
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="mailto:churches@aios.com">Email Church Team</Link>
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
            <h2 className="text-4xl font-bold mb-4">Simple, Honest Pricing for Churches</h2>
            <p className="text-xl text-muted-foreground">
              Faithful stewardship of ministry resources
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
                  <span className="text-sm">Unlimited sermon archives & research</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Prayer request & member care tracking</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Volunteer coordination & scheduling</span>
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
                  <span className="text-sm">Church management software integration</span>
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
                  <Link href="/signup?plan=churches">Start 14-Day Free Trial</Link>
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
              Ready to Transform Your Ministry?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join churches that are serving their congregations better, preserving pastoral wisdom,
              and stewarding ministry time with faithful excellence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/contact-sales?plan=churches">Schedule Demo</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent border-white text-white hover:bg-white/10">
                <Link href="/signup?plan=churches">Start Free Trial</Link>
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
                The AI-powered knowledge platform built for churches and ministries.
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
              Perpetual Core is a productivity tool designed for churches and ministries. Users are responsible for theological accuracy and pastoral care standards.
              Your church data is encrypted and never used to train AI models.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
