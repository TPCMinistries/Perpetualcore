"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2, BookOpen, Users, User, FileText, Search, TrendingUp,
  Shield, XCircle, AlertCircle, Brain, Calendar, MessageCircle, Clock,
  Zap, ArrowRight, Database, Lock, Sparkles, Plus, Minus, GraduationCap
} from "lucide-react";

export default function EducationPage() {
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
              <Link href="/signup?plan=education">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <GraduationCap className="h-4 w-4" />
            Built for Schools & Educational Organizations
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Your School's Teaching Excellence,
            <span className="block text-primary mt-2">Accessible Instantly</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Preserve master teacher expertise, share curriculum across grades, track student insights,
            and support new educators. Build a learning community where teaching wisdom compounds over time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact-sales?plan=education">Schedule Demo</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">See Features</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            14-day free trial • $99/educator/month • FERPA compliant • Data privacy guaranteed
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">∞</div>
              <div className="text-sm text-muted-foreground">Teaching Resources</div>
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

      {/* Before/After Comparison - A Week of Teaching */}
      <section className="bg-gradient-to-b from-muted/50 to-white dark:from-muted/20 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              A Week of Teaching: Before vs After Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how Perpetual Core transforms teaching workflows and student support
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
                      <CardDescription>Traditional Teaching Workflow</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Monday - Lesson Planning from Scratch</div>
                      <p className="text-sm text-muted-foreground">
                        Spend 3 hours creating a lesson plan on photosynthesis. Your colleague taught this last year
                        with amazing hands-on activities, but you can't find her materials. Start from scratch again.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 3 hours recreating existing work</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Tuesday - Parent Communication Confusion</div>
                      <p className="text-sm text-muted-foreground">
                        Parent emails about struggling student. What strategies worked last semester? What did
                        the previous teacher note? Check multiple systems, emails, scattered notes. Nothing found.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ Lost student context</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Wednesday - Substitute Teacher Chaos</div>
                      <p className="text-sm text-muted-foreground">
                        Called in sick. Frantically text colleague to leave sub plans. Substitute gets unclear
                        instructions, students watch video all day. Learning time lost.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ Disorganized handoff, lost instruction time</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">Thursday - IEP Documentation Scattered</div>
                      <p className="text-sm text-muted-foreground">
                        IEP meeting tomorrow. Student accommodations are in three different places. Previous teacher's
                        insights about what works? Gone. Spend 2 hours hunting down information.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 2 hours searching scattered records</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Weekly Total:</span>
                        <span className="text-3xl font-bold text-red-600 dark:text-red-400">50+ hours</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Recreating work • Lost student insights • Teacher burnout
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
                      <CardDescription>AI-Powered Teaching</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Monday - Lesson Planning Streamlined</div>
                      <p className="text-sm text-muted-foreground">
                        Ask AI: "Show me all photosynthesis lesson plans." Instantly access your colleague's hands-on
                        activities from last year, plus 5 other teachers' approaches. Customize and improve in 30 minutes.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 30 minutes with master teacher resources</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Tuesday - Complete Student History</div>
                      <p className="text-sm text-muted-foreground">
                        Parent emails about struggling student. AI shows: last semester's interventions, previous teacher
                        notes, what strategies worked, family context. Write informed, helpful response in 10 minutes.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ Full student context at your fingertips</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Wednesday - Organized Sub Plans</div>
                      <p className="text-sm text-muted-foreground">
                        Called in sick. Access pre-loaded sub plans in Perpetual Core. Substitute gets detailed instructions,
                        student accommodations, and backup activities. Learning continues seamlessly.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ Professional handoff, continued learning</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">Thursday - Centralized Student Insights</div>
                      <p className="text-sm text-muted-foreground">
                        IEP meeting tomorrow. Ask AI for student profile. Get complete history: accommodations that work,
                        previous teacher insights, growth patterns, family communication notes. Ready in 15 minutes.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 15 minutes to full preparation</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Weekly Total:</span>
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400">40 hours</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Leveraging shared expertise • Better student support • Sustainable teaching
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
                    <em>Illustrative example showing potential time savings. Actual results vary by school size and teaching context.</em>
                  </p>
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">10+</div>
                      <div className="text-sm text-muted-foreground">Hours Saved Weekly</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Better</div>
                      <div className="text-sm text-muted-foreground">Student Outcomes</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Reduced</div>
                      <div className="text-sm text-muted-foreground">Teacher Burnout</div>
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
                Your School's Institutional Brain
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Preserve Master Teacher Expertise Forever
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                When veteran teachers retire, decades of curriculum refinement, classroom management strategies, and
                student insight walk out the door. Perpetual Core captures and preserves your school's teaching excellence.
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
                        <div className="font-semibold mb-1">Master Teachers Retire, Wisdom Disappears</div>
                        <p className="text-sm text-muted-foreground">
                          Your best teacher retires after 30 years. Her lesson plans, classroom management techniques,
                          differentiation strategies, and student insights vanish. New teachers start from zero.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Every Teacher Reinvents the Wheel</div>
                        <p className="text-sm text-muted-foreground">
                          New teachers spend years developing lessons, assessments, and interventions that master
                          teachers already perfected. Quality varies wildly across classrooms.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Student Insights Scattered Across Years</div>
                        <p className="text-sm text-muted-foreground">
                          A student who struggled with reading in 3rd grade is now in 8th. What interventions worked?
                          What didn't? Previous teachers knew, but the insights are gone.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Curriculum Knowledge Locked in Silos</div>
                        <p className="text-sm text-muted-foreground">
                          5th grade science teacher has brilliant experiments. 6th grade teacher never sees them.
                          No curriculum coherence across grades. Students experience disconnected learning.
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
                        <div className="font-semibold mb-1">Teaching Excellence Preserved Forever</div>
                        <p className="text-sm text-muted-foreground">
                          Capture master teachers' lesson plans, classroom strategies, and differentiation approaches.
                          Their wisdom remains accessible to every teacher in your school for decades.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">New Teachers Start at Excellence</div>
                        <p className="text-sm text-muted-foreground">
                          First-year teachers access the school's best lesson plans, proven interventions, and veteran
                          strategies from day one. They teach like 10-year veterans immediately.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Complete Student Journey Tracking</div>
                        <p className="text-sm text-muted-foreground">
                          Follow students from kindergarten through graduation. Every teacher adds insights. 8th grade
                          teachers know exactly what worked for struggling readers in 3rd grade.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Curriculum Coherence Across Grades</div>
                        <p className="text-sm text-muted-foreground">
                          All teachers access all grade levels' curriculum. See what students learned last year and
                          what's coming next. Build on previous foundations. Students experience connected learning.
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
                <CardTitle className="text-2xl">Real-World Example: Master Teacher Retirement</CardTitle>
                <CardDescription className="text-base">
                  How one school preserved 30 years of teaching excellence
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
                      Mrs. Rodriguez, a beloved 5th grade teacher with 30 years of experience, announced retirement.
                      She was known for her exceptional ability to teach struggling readers, her hands-on science curriculum,
                      and deep relationships with students and families. The school worried about losing her expertise.
                      New teachers would spend years trying to recreate what she had perfected.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      The Perpetual Core Solution
                    </h4>
                    <p className="text-muted-foreground mb-3">
                      Six months before retirement, the school uploaded to Perpetual Core:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>30 years of refined lesson plans for reading, writing, math, and science</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Differentiation strategies for struggling learners and advanced students</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Classroom management techniques and parent communication frameworks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Student intervention notes and what worked for different learning profiles</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      The Result
                    </h4>
                    <p className="text-muted-foreground mb-3">
                      When the new 5th grade teacher arrived:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>She asked AI: "Show me Mrs. Rodriguez's approach to teaching struggling readers" and got instant frameworks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Used proven lesson plans while adding her own innovations and improvements</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Accessed student histories to understand learning patterns before school even started</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Parents and students experienced continuity in teaching excellence despite teacher transition</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-t pt-6">
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-6 border border-green-200 dark:border-green-900/30">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-green-700 dark:text-green-300">The Bottom Line:</strong> Your school's
                        teaching excellence grows stronger with every generation instead of disappearing. Every great teacher
                        who ever served contributes to a growing educational intelligence that makes the entire school better
                        at educating students.
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
              Featured: Your 24/7 Teaching Assistant
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Your AI Coach, Always Available
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Never feel stuck in lesson planning or student support. Your AI coach answers questions 24/7,
              helps you find resources, and guides you through teaching challenges.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            {/* Left: Feature Description */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold">Ask Anything, Anytime</h3>
              <p className="text-muted-foreground leading-relaxed">
                Need a differentiation strategy? Looking for last year's science lab? Want to remember what
                worked for a struggling student? Just ask your AI Coach.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: "Instant Answers",
                    desc: "Get immediate help without digging through files or waiting for colleagues."
                  },
                  {
                    title: "Pedagogical Guidance",
                    desc: "The AI Coach understands educational context and provides research-based support."
                  },
                  {
                    title: "Always Available",
                    desc: "Sunday night lesson planning? 6 AM before school? AI Coach is ready to help find resources."
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
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm">"I'm teaching photosynthesis next week. What hands-on activities do we have?"</p>
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
                      <p className="text-sm mb-3">I found 7 photosynthesis lessons from our teachers. Top 3:</p>
                      <ol className="text-sm space-y-2 list-decimal list-inside">
                        <li>Mrs. Rodriguez's leaf lab (students test for starch) — highest engagement</li>
                        <li>Mr. Chen's chloroplast model with clay — great for visual learners</li>
                        <li>Ms. Patel's outdoor light experiment — connects to real ecosystems</li>
                      </ol>
                      <p className="text-sm mt-3 text-muted-foreground">
                        💡 <strong>Tip:</strong> Mrs. Rodriguez notes that struggling students need the vocabulary pre-taught. She has a worksheet.
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Follow-up */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm">"Show me Mrs. Rodriguez's vocabulary worksheet."</p>
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
                      <p className="text-sm">Here's the worksheet. She uses picture cues for: photosynthesis, chloroplast, chlorophyll, glucose, carbon dioxide, oxygen. Also includes a matching game...</p>
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
              <CardDescription>Ask about anything in your school's knowledge base</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  "What lesson plans do we have for fractions?",
                  "Show me accommodations for students with ADHD",
                  "What parent communication templates exist?",
                  "How do teachers handle lunch room behavior?",
                  "Show me last year's field trip plans",
                  "What interventions work for struggling readers?",
                  "How did we teach remote learning last year?",
                  "What differentiation strategies are proven?",
                  "Show me IEP documentation templates"
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
          <h2 className="text-4xl font-bold mb-4">Built for Educational Workflows</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tools designed to help educators teach with excellence and support every student
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Lesson Plan Library</CardTitle>
              <CardDescription>
                Access your school's complete lesson plan collection. Search by topic, grade level, or teacher.
                Build on proven curriculum instead of starting from scratch every year.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Curriculum Mapping</CardTitle>
              <CardDescription>
                See what students learned in previous grades and what's coming next. Build curriculum coherence
                and avoid gaps or redundancies across grade levels.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Student Insights & Interventions</CardTitle>
              <CardDescription>
                Track student growth, interventions that worked, learning preferences, and accommodations.
                Every teacher adds insights that follow students through their education journey.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Parent Communications</CardTitle>
              <CardDescription>
                Access templates, previous conversations, and student context before parent meetings.
                Communicate with confidence backed by complete student history.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Professional Development</CardTitle>
              <CardDescription>
                New teachers learn from master teachers' documented strategies. Veteran teachers share
                expertise. Everyone grows from collective professional knowledge.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Assessment & IEP Tracking</CardTitle>
              <CardDescription>
                Centralize assessment data, IEP accommodations, and intervention documentation.
                Access student profiles instantly for meetings and planning.
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
              How Schools Use Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built to solve the real challenges educators face every day
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Lesson Planning */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Collaborative Lesson Planning</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Sunday evening: Ask AI to show all lesson plans on the Revolutionary War. Access 5 different teachers'
                  approaches, differentiation strategies, and assessment ideas. Customize the best parts into your lesson.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Access proven lesson plans across all grades</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Build on master teacher curriculum refinements</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Reduce planning time by 75%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student Support */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Comprehensive Student Support</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Before parent conference, ask AI for student's complete profile. Get learning history from kindergarten,
                  interventions tried, what worked, family context, and previous teacher insights. Walk in fully prepared.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Track student growth across multiple years</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Access proven intervention strategies</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Better parent communication with full context</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* New Teacher Onboarding */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4">
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">New Teacher Onboarding</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  First-year teacher starts in August. Instead of creating curriculum from scratch, she accesses 20 years
                  of refined lesson plans, classroom management strategies, and veteran teacher wisdom. Teaches like a pro from day one.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>New teachers access master teacher expertise</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Reduce first-year overwhelm and burnout</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Improve student outcomes immediately</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Substitute Planning */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Emergency Substitute Planning</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Teacher wakes up sick at 6 AM. Opens Perpetual Core, shares link to pre-loaded emergency sub plans with
                  detailed instructions, student accommodations, and backup activities. Substitute teaches effectively. No instructional time lost.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Pre-loaded emergency sub plans always ready</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Student accommodations included automatically</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Professional handoff preserves learning time</span>
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
                How Schools Use Perpetual Core
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Built to reduce teacher workload and improve student outcomes—while maintaining
                FERPA compliance and data privacy.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Upload Your School's Knowledge</h3>
                  <p className="text-muted-foreground text-sm">
                    Add lesson plans, curriculum maps, intervention strategies, student insights, and master
                    teacher resources. AI organizes everything and makes it instantly searchable.
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
                    Ask questions like "What lesson plans do we have for fractions?" or "Show me interventions
                    for struggling readers." Get instant answers from your school's knowledge base.
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
                    The more your teachers use Perpetual Core, the more valuable it becomes. Your school's teaching
                    excellence compounds over years, building an educational legacy.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing for Schools</h2>
            <p className="text-xl text-muted-foreground">
              Invest in teaching excellence and student success
            </p>
          </div>

          <Card className="border-2 border-primary">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-2 mb-4">
                  <span className="text-5xl font-bold">$99</span>
                  <span className="text-xl text-muted-foreground">/educator/month</span>
                </div>
                <p className="text-muted-foreground">Everything included. No hidden fees.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Unlimited lesson plans & curriculum storage</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Student insights & intervention tracking</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Parent communication templates & history</span>
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
                  <span className="text-sm">Learning management system integration</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">FERPA compliant & SOC 2 certified security</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">White-glove onboarding & training</span>
                </div>
              </div>

              <div className="border-t pt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">School discounts (10+ educators)</span>
                  <span className="font-semibold">15% off</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">District discounts (50+ educators)</span>
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
                  <Link href="/signup?plan=education">Start 14-Day Free Trial</Link>
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  No credit card required • Cancel anytime • Setup in 1 day
                </p>
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
              Everything you need to know about Perpetual Core for schools
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "How do you protect student data and ensure FERPA compliance?",
                answer: "We take student data privacy extremely seriously. All information is encrypted with 256-bit encryption at rest and in transit. We are FERPA compliant and SOC 2 Type II certified. Your school data is NEVER used to train AI models. We maintain complete audit logs and granular permissions—you control exactly who can access what student information. We can sign BAAs and DPAs as required. Many schools use Perpetual Core specifically because it's MORE secure than scattered paper files, emails, and unencrypted documents."
              },
              {
                question: "How much does it cost for a small school?",
                answer: "$99 per educator per month. A small school with 15 teachers would pay $1,485/month. We offer 15% discount for 10+ educators and 25% off for 50+ educators. Annual payment saves an additional 20%. First 14 days are completely free. Consider the ROI: if each teacher saves 10 hours/week (conservative estimate), that's 150 hours/week or $3,000-4,500/week in teacher time saved. The platform pays for itself many times over."
              },
              {
                question: "How does Perpetual Core help with lesson planning specifically?",
                answer: "Upload all your school's lesson plans organized by grade, subject, and topic. When planning a lesson, ask 'Show me all 5th grade fractions lessons' or 'What hands-on science experiments do we have?' AI instantly searches your entire curriculum library and shows you proven lessons from master teachers. Teachers can build on what works instead of starting from scratch. Average planning time drops from 3 hours to 45 minutes while quality improves because you're leveraging collective expertise."
              },
              {
                question: "Can we track student progress and interventions across multiple years?",
                answer: "Absolutely. Create student profiles that follow learners from kindergarten through graduation. Teachers add notes about what interventions worked, learning preferences, accommodations, and growth patterns. When a student struggles in 8th grade, you can see what strategies worked in 3rd grade. Before parent conferences or IEP meetings, ask AI for the complete student history. This continuity of insight is impossible with traditional systems where knowledge is siloed by teacher and year."
              },
              {
                question: "How do new teachers benefit from Perpetual Core?",
                answer: "New teachers are the biggest beneficiaries. Instead of spending years developing curriculum and classroom management strategies, they access decades of master teacher expertise from day one. Ask 'How do veteran teachers handle transitions?' or 'Show me differentiation strategies for reading.' They get proven approaches, tested lesson plans, and institutional knowledge immediately. Schools report new teachers perform like 5-10 year veterans because they're building on collective wisdom instead of starting from zero."
              },
              {
                question: "Does this work with our student information system and LMS?",
                answer: "Perpetual Core integrates with most student information systems (PowerSchool, Infinite Campus, Skyward, etc.) and learning management systems (Google Classroom, Canvas, Schoology, etc.). We can pull roster information and sync updates. Most schools use Perpetual Core alongside their SIS/LMS—the SIS handles grades and attendance, the LMS handles assignments, while Perpetual Core handles curriculum knowledge, lesson plans, and pedagogical expertise. Setup takes 30-60 minutes during onboarding. We also offer API access for custom integrations."
              },
              {
                question: "What happens to our data if we cancel?",
                answer: "You own your data, period. If you cancel, you can export everything—lesson plans, curriculum maps, student insights, intervention notes—in standard formats (PDF, DOCX, CSV). We keep your data for 90 days after cancellation in case you change your mind, then permanently delete it. You'll receive a certificate of data destruction upon request. No lock-in, no hostage data. Your school's educational materials belong to your school."
              },
              {
                question: "How long does it take to set up and train teachers?",
                answer: "Most schools are fully operational within 1-2 weeks. Week 1: Admin uploads initial content (lesson plans, curriculum maps) and sets permissions (2-4 hours total). Day 5: Teacher training session (1 hour—we provide this). Week 2: Teachers start using Perpetual Core with support available. We provide dedicated onboarding, training videos, and live support during your first month. Average time to first value: 48 hours when a teacher finds a lesson plan that saves them 2 hours of work."
              },
              {
                question: "How does this help when veteran teachers retire?",
                answer: "This is one of the most valuable benefits. Six months before a master teacher retires, upload their lesson plans, classroom management strategies, differentiation approaches, and curriculum refinements. When they leave, their wisdom remains accessible to every teacher in the school forever. New teachers can ask 'How did Mrs. Rodriguez teach struggling readers?' and get her proven frameworks. The school's teaching quality improves over generations instead of declining with every retirement. Your best teachers compound their impact indefinitely."
              },
              {
                question: "Can teachers share lesson plans across grade levels and departments?",
                answer: "Yes, this is a core feature. All teachers can access all lesson plans (with permissions you control). 5th grade teachers see what 4th grade taught and what 6th grade will teach. Science teachers see how math teachers explain graphs. This creates curriculum coherence and interdisciplinary connections impossible when teachers work in isolation. Many schools report this cross-pollination of ideas is as valuable as the time savings."
              },
              {
                question: "How do you handle substitute teacher planning?",
                answer: "Teachers create emergency sub plan templates in Perpetual Core with detailed instructions, student accommodations, seating charts, and backup activities. When calling in sick, they share a link to their sub plans. Substitutes get professional, comprehensive guidance. No more scrambling at 6 AM or substitutes showing videos all day. Some schools report this feature alone justifies the cost—parents notice when substitutes teach effectively instead of just supervising."
              },
              {
                question: "What kind of support do you provide to schools?",
                answer: "Education-focused support: (1) Dedicated onboarding specialist for first 60 days. (2) Live training session for all staff (included). (3) Email and chat support with same-day response during school hours. (4) Phone support for urgent needs. (5) Help center with education-specific guides and videos. (6) Monthly check-ins first quarter. (7) Education customer success team who understands teaching context. We view supporting schools as our mission, not just customer service."
              },
              {
                question: "Do you offer discounts for schools or districts?",
                answer: "Yes. We offer: (1) 20% discount for annual payment. (2) School discounts: 15% off for 10+ educators. (3) District discounts: 25% off for 50+ educators, custom pricing for large districts. (4) Special pricing for Title I schools and under-resourced districts (contact us). (5) Free access for qualifying schools in low-income areas (application required). We want to make Perpetual Core accessible to all schools. If cost is a barrier, let's talk—we'll work with you."
              },
              {
                question: "How does this help with parent communication?",
                answer: "Before parent conferences or phone calls, ask AI for student's complete profile including learning history, previous parent communications, intervention attempts, and family context. Write emails using templates that worked before. Access conversation history so you don't repeat what the last teacher said. Parents notice when teachers are fully informed and prepared—it builds trust and partnership. Teachers report parent communication stress drops dramatically because they have full context."
              },
              {
                question: "Can administrators use this for curriculum development and professional development?",
                answer: "Absolutely. Administrators can see patterns across the entire school: which lesson plans get used most (proxy for quality), what interventions teachers document (proxy for effectiveness), where curriculum gaps exist. Use this data for professional development—'Let's learn from our best teachers' approaches to differentiation.' During curriculum adoption, access all current resources to make informed decisions. Many principals use Perpetual Core for new teacher mentoring—'Here's what our best teachers do for classroom management.'"
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
                Schedule a call with our education team. We'll answer all your questions and show you exactly how Perpetual Core works for schools.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/contact-sales?plan=education">
                    Schedule Demo
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="mailto:education@aios.com">Email Education Team</Link>
                </Button>
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
              Ready to Transform Your School?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join schools that are supporting teachers better, preserving master teacher expertise,
              and creating educational excellence that compounds over generations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/contact-sales?plan=education">Schedule Demo</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent border-white text-white hover:bg-white/10">
                <Link href="/signup?plan=education">Start Free Trial</Link>
              </Button>
            </div>
            <p className="text-sm mt-6 opacity-75">
              14-day free trial • FERPA compliant • Setup in 1 day
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
                The AI-powered knowledge platform built for schools and educational organizations.
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
              © 2024 AI Operating System. All rights reserved. | SOC 2 Type II Certified | FERPA Compliant
            </p>
            <p className="text-xs max-w-3xl mx-auto">
              Perpetual Core is a productivity tool designed for schools and educational organizations. Educators are responsible for pedagogical decisions and student outcomes.
              Your school data is encrypted and never used to train AI models.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
