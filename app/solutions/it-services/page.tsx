"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2, Server, Shield, Users, Brain, Zap, XCircle, AlertCircle,
  Sparkles, MessageSquare, Infinity, Database, Lock, Search, FileText,
  Clock, TrendingUp, ArrowRight, Settings, Network, HardDrive, Plus, Minus
} from "lucide-react";

export default function ITServicesPage() {
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
              <Link href="/signup?plan=it-services">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Server className="h-4 w-4" />
            Built for IT Services & MSPs
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Your Team's Technical Knowledge,
            <span className="block text-primary mt-2">Accessible in Seconds</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Built to help MSPs preserve troubleshooting playbooks, client configurations, and vendor relationships.
            Never lose technical expertise when senior engineers leave.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact-sales?plan=it-services">Schedule Demo</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">See Features</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            14-day free trial • $199/technician/month • Enterprise security
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">∞</div>
              <div className="text-sm text-muted-foreground">Ticket History Memory</div>
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

      {/* Before/After Comparison - A Day in IT Support */}
      <section className="bg-gradient-to-b from-muted/50 to-white dark:from-muted/20 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              A Day in IT Support: Before vs After Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how Perpetual Core can transform daily support workflows
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
                      <CardDescription>Traditional IT Workflow</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">9:00 AM - Recurring Network Issue</div>
                      <p className="text-sm text-muted-foreground">
                        Client calls about network dropping again. Search through old tickets, Slack history,
                        and your notes. Can't remember the fix from last time. Start troubleshooting from scratch.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 45 minutes wasted searching</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">11:00 AM - Vendor Contact Lost</div>
                      <p className="text-sm text-muted-foreground">
                        Need to contact firewall vendor. Senior tech who managed relationship is gone.
                        Contact info lost in his emails. Client frustrated.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ Knowledge walked out the door</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">2:00 PM - Client Config Unknown</div>
                      <p className="text-sm text-muted-foreground">
                        Emergency at client site. What's their network setup? Where's their documentation?
                        Dig through scattered files and old emails. Waste critical minutes.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 30 minutes searching docs</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">5:00 PM - Repeating Old Mistakes</div>
                      <p className="text-sm text-muted-foreground">
                        Junior tech makes same configuration error that caused outage last year.
                        Nobody documented the lesson learned. Client angry again.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ Institutional knowledge lost</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Result:</span>
                        <span className="text-3xl font-bold text-red-600 dark:text-red-400">Wasted Day</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Lost tickets • Forgotten solutions • Client frustration
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
                      <CardDescription>AI-Powered IT Support</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">9:00 AM - Instant Solution</div>
                      <p className="text-sm text-muted-foreground">
                        Client calls about network issue. Ask AI: "Show me previous tickets for Acme Corp network drops."
                        Get the exact solution from last time. Fix applied in 5 minutes.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 5 minutes to resolution</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">11:00 AM - Vendor Info Available</div>
                      <p className="text-sm text-muted-foreground">
                        Need firewall vendor contact. Ask AI: "Show me vendor relationships for Acme Corp."
                        Get contact name, phone, account number, and relationship notes instantly.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 10 seconds to find info</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">2:00 PM - Config Instantly Retrieved</div>
                      <p className="text-sm text-muted-foreground">
                        Emergency at client site. Ask AI: "What's the network topology for this client?"
                        Get diagrams, IP schemes, device configs, and access credentials. Resolve quickly.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ Instant documentation access</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">4:30 PM - Best Practices Followed</div>
                      <p className="text-sm text-muted-foreground">
                        Junior tech asks AI about configuration. Gets proven procedure with warnings about
                        previous mistakes. Implements perfectly. Client happy.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ Knowledge preserved and shared</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Result:</span>
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400">Efficient Day</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Fast resolution • Happy clients • Team productivity
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
                    <em>Illustrative example showing potential time savings. Actual results vary by MSP and client base.</em>
                  </p>
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">40%</div>
                      <div className="text-sm text-muted-foreground">Faster Ticket Resolution</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Hours</div>
                      <div className="text-sm text-muted-foreground">Saved Per Technician Per Week</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Higher</div>
                      <div className="text-sm text-muted-foreground">Client Satisfaction</div>
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
                Your MSP's Institutional Brain
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Stop Losing Technical Expertise When Techs Leave
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                When senior engineers quit, their troubleshooting knowledge, client network quirks, and vendor relationships
                disappear forever. Perpetual Core captures and preserves your team's collective technical wisdom.
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
                        <div className="font-semibold mb-1">Technical Knowledge Walks Out</div>
                        <p className="text-sm text-muted-foreground">
                          When experienced technicians leave, their troubleshooting playbooks, client configuration knowledge,
                          and vendor relationships vanish forever.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Reinventing Solutions Daily</div>
                        <p className="text-sm text-muted-foreground">
                          New techs waste hours solving problems that senior engineers already fixed. Same issues
                          resurface repeatedly because solutions aren't documented.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Inconsistent Client Service</div>
                        <p className="text-sm text-muted-foreground">
                          Every tech handles issues differently. Clients get different resolution times and quality
                          depending on who answers their ticket. Best practices stay in individual heads.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Slow New Tech Onboarding</div>
                        <p className="text-sm text-muted-foreground">
                          New hires spend months learning client environments through trial and error, searching
                          scattered documentation, and bothering busy senior techs.
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
                        <div className="font-semibold mb-1">Technical Expertise Preserved Forever</div>
                        <p className="text-sm text-muted-foreground">
                          Capture senior engineers' troubleshooting methodologies, client quirks, and proven solutions.
                          Their expertise remains accessible to the entire team—even after they leave.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Collective Technical Intelligence</div>
                        <p className="text-sm text-muted-foreground">
                          Every ticket resolution, configuration note, and vendor relationship becomes part of your
                          growing knowledge base. Everyone benefits from collective experience.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Consistent Client Excellence</div>
                        <p className="text-sm text-muted-foreground">
                          Every technician can access proven troubleshooting procedures and client-specific solutions.
                          Clients receive consistently excellent support regardless of who handles their ticket.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Instant New Tech Productivity</div>
                        <p className="text-sm text-muted-foreground">
                          New hires get immediate access to all client configurations, troubleshooting playbooks,
                          and vendor information. They're productive from day one.
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
                <CardTitle className="text-2xl">Real-World Example: Senior Network Engineer Departure</CardTitle>
                <CardDescription className="text-base">
                  How one MSP preserved 15 years of technical expertise
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
                      A senior network engineer with 15 years at the MSP announced his departure. He was the go-to troubleshooter
                      for complex issues, knew every client network inside and out, and maintained all critical vendor relationships.
                      The company faced losing this irreplaceable institutional knowledge.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      The Perpetual Core Solution
                    </h4>
                    <p className="text-muted-foreground mb-3">
                      Before departure, the MSP uploaded to Perpetual Core:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Network topology diagrams and documentation for all 50+ clients</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Troubleshooting playbooks for common and complex issues</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Client-specific configuration quirks and workarounds</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Vendor relationship contacts, account numbers, and escalation procedures</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      The Result
                    </h4>
                    <p className="text-muted-foreground mb-3">
                      After his departure:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Average ticket resolution time dropped 40% instead of increasing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Junior techs could search: "How do we handle XYZ issue for ABC Client?" and get proven solutions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Vendor relationships maintained seamlessly with documented contact information</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>New hires became productive in days instead of months</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-t pt-6">
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-6 border border-green-200 dark:border-green-900/30">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-green-700 dark:text-green-300">The Bottom Line:</strong> Your MSP's
                        technical knowledge grows stronger every year instead of disappearing when people leave.
                        Every engineer who ever worked at your company contributes to a growing intelligence that
                        makes everyone better at solving problems.
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
              Featured: Your 24/7 Technical Assistant
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Your AI Coach, Always Available
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Never feel stuck on a ticket. Your AI coach answers questions 24/7,
              surfaces proven solutions, and helps you find the information you need instantly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            {/* Left: Feature Description */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold">Ask Anything, Anytime</h3>
              <p className="text-muted-foreground leading-relaxed">
                Stuck on a complex network issue? Need a client's VPN configuration? Looking for that vendor contact?
                Just ask your AI Coach.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: "Instant Answers",
                    desc: "Get immediate help without digging through tickets or bothering senior techs."
                  },
                  {
                    title: "Technical Context",
                    desc: "The AI Coach understands IT terminology and provides relevant troubleshooting guidance."
                  },
                  {
                    title: "Always Learning",
                    desc: "As your team documents more solutions, your AI Coach gets smarter about your environment."
                  },
                  {
                    title: "Never Busy",
                    desc: "3 AM network emergency? AI Coach is ready to help find solutions immediately."
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
                      <p className="text-sm">"Client XYZ Corp is reporting intermittent network drops again. What fixed this last time?"</p>
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
                      <p className="text-sm mb-3">Found 3 previous tickets for XYZ Corp network drops:</p>
                      <ol className="text-sm space-y-2 list-decimal list-inside">
                        <li>Issue: Firmware bug in Cisco switch. Solution: Upgraded to v15.2</li>
                        <li>Issue: Spanning tree misconfiguration. Solution: Adjusted priority on core switch</li>
                        <li>Issue: Faulty SFP module in uplink. Solution: Replaced SFP, tested 24hrs</li>
                      </ol>
                      <p className="text-sm mt-3 text-muted-foreground">
                        💡 <strong>Tech Note:</strong> Client has quirky setup—uses port-channel 10 for redundancy. Check that first.
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
                      <p className="text-sm">"Show me their network diagram and switch access credentials."</p>
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
                      <p className="text-sm">Here's XYZ Corp's network topology diagram and switch credentials [secure access]...</p>
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
              <CardDescription>Ask about tickets, clients, configurations, and procedures</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  "What's the error code XYZ mean?",
                  "Show me client ABC's network config",
                  "Who's our vendor contact for firewalls?",
                  "How do we troubleshoot VPN issues?",
                  "What's the standard backup procedure?",
                  "Show me tickets for this client",
                  "What licenses does client XYZ have?",
                  "How do we configure new user setup?",
                  "Show me escalation procedures"
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
          <h2 className="text-4xl font-bold mb-4">Built for MSP Workflows</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tools designed to help you deliver excellent IT support efficiently
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Ticket Intelligence & History</CardTitle>
              <CardDescription>
                AI searches all previous tickets for similar issues. Get proven solutions instantly
                instead of starting troubleshooting from scratch every time.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Network className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Client Configuration Knowledge</CardTitle>
              <CardDescription>
                Store network diagrams, device configs, IP schemes, and access credentials.
                Every tech has instant access to complete client documentation.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Troubleshooting Playbooks</CardTitle>
              <CardDescription>
                Document proven troubleshooting procedures. AI surfaces the right playbook
                for each issue type, reducing resolution time dramatically.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Vendor & License Management</CardTitle>
              <CardDescription>
                Track vendor contacts, support agreements, license keys, and renewal dates.
                Never lose critical vendor relationships when staff leave.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <HardDrive className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Technical Documentation</CardTitle>
              <CardDescription>
                Centralize all technical documentation—SOPs, configuration guides, and
                best practices. Make tribal knowledge searchable and accessible.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Onboarding & Training</CardTitle>
              <CardDescription>
                New techs ask AI about procedures, client setups, or troubleshooting.
                They're productive immediately instead of spending months ramping up.
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
              How IT Teams Use Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built to solve the real challenges MSPs face every day
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Ticket Resolution */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Ticket Resolution</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  New ticket comes in. Ask AI to search previous similar tickets and proven solutions.
                  Get troubleshooting steps, known fixes, and client-specific notes instantly. Resolve 40% faster.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Search all historical tickets by keywords or error codes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>See what worked for similar clients and issues</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Access client-specific quirks and configurations</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Onboarding */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Client Onboarding</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  New client signs on. Upload their network documentation, configs, and vendor information.
                  Entire team instantly has access. No knowledge silos, no single point of failure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Centralized client documentation and configurations</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>All techs can support all clients immediately</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Track vendor relationships and licenses</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network Troubleshooting */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4">
                  <Network className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Network Troubleshooting</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Complex network issue? Ask AI for troubleshooting playbooks, similar past issues,
                  and proven diagnostic procedures. Get step-by-step guidance based on what worked before.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Access documented troubleshooting procedures</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Find proven solutions from senior engineers</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Learn from past mistakes and successes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Knowledge Transfer */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Knowledge Transfer</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Senior tech leaving? Spend their final weeks uploading knowledge to Perpetual Core—client quirks,
                  troubleshooting approaches, vendor contacts. Their expertise stays with your company forever.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Preserve departing employees' technical knowledge</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Document tribal knowledge and best practices</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Build institutional memory that compounds over time</span>
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
                How IT Teams Can Use Perpetual Core
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Built to reduce ticket resolution time and preserve technical expertise
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Upload Technical Knowledge</h3>
                  <p className="text-muted-foreground text-sm">
                    Upload network diagrams, troubleshooting playbooks, client configs, vendor info,
                    and ticket resolutions. AI indexes everything and makes it instantly searchable.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Search During Tickets</h3>
                  <p className="text-muted-foreground text-sm">
                    Ask questions like "How did we fix this error last time?" or "Show me network config for client X."
                    Get instant answers from your knowledge base while working on tickets.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Team Gets Smarter</h3>
                  <p className="text-muted-foreground text-sm">
                    Every resolved ticket adds to your knowledge base. The more your team uses Perpetual Core,
                    the better everyone becomes at solving problems quickly.
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
                      <div className="font-semibold mb-2">Lost Technical Knowledge</div>
                      <p className="text-sm text-muted-foreground">
                        When experienced technicians leave, years of troubleshooting expertise, client relationships,
                        and institutional knowledge walk out the door forever.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Scattered Documentation</div>
                      <p className="text-sm text-muted-foreground">
                        Network diagrams in SharePoint, configs in emails, troubleshooting notes in tickets,
                        vendor info in spreadsheets. Finding critical information wastes hours daily.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Slow Ticket Resolution</div>
                      <p className="text-sm text-muted-foreground">
                        Techs waste time searching for previous solutions, bothering senior engineers,
                        or reinventing fixes that already exist somewhere in old tickets.
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
                            Every troubleshooting procedure, client configuration, and vendor relationship becomes
                            instantly searchable. Your team's technical knowledge compounds over time instead of
                            disappearing. Deliver better client service with less effort.
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
              Traditional IT Support vs Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground">
              See exactly what changes when MSPs adopt Perpetual Core
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
                    feature: "Ticket Resolution Time",
                    old: "Search scattered docs, bother senior techs, start from scratch",
                    new: "AI finds proven solutions in seconds from past tickets",
                    highlight: true
                  },
                  {
                    feature: "Client Documentation",
                    old: "Spread across email, SharePoint, local drives, and people's heads",
                    new: "Centralized, searchable, accessible to entire team instantly"
                  },
                  {
                    feature: "Troubleshooting Knowledge",
                    old: "Locked in senior engineers' heads, lost when they leave",
                    new: "Documented playbooks accessible to all, preserved forever"
                  },
                  {
                    feature: "New Tech Onboarding",
                    old: "6+ months to learn clients and procedures through trial and error",
                    new: "Productive from day one with instant access to all knowledge",
                    highlight: true
                  },
                  {
                    feature: "Vendor Relationships",
                    old: "Contact info lost when account manager leaves",
                    new: "All vendor contacts, agreements, and history preserved"
                  },
                  {
                    feature: "Client-Specific Info",
                    old: "Hunt through old tickets and emails for network configs",
                    new: "Ask AI, get diagrams and configs instantly"
                  },
                  {
                    feature: "Knowledge Sharing",
                    old: "Best practices stay with individuals, not shared",
                    new: "Every solution documented and accessible to entire team",
                    highlight: true
                  },
                  {
                    feature: "PSA Integration",
                    old: "Manual context switching between systems",
                    new: "Seamless integration with ConnectWise, Autotask, etc."
                  },
                  {
                    feature: "Emergency Support",
                    old: "Call senior tech at 2 AM to find information",
                    new: "AI available 24/7 with instant answers"
                  },
                  {
                    feature: "Technical Documentation",
                    old: "Outdated, incomplete, impossible to find",
                    new: "Living documentation that grows and stays current"
                  },
                  {
                    feature: "Client Satisfaction",
                    old: "Varies by which tech handles ticket",
                    new: "Consistent excellent service from entire team"
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
                MSPs using Perpetual Core reduce average ticket resolution time by <strong className="text-primary">40%</strong>,
                preserve <strong className="text-primary">technical expertise</strong> across staff changes, and deliver
                <strong className="text-primary"> consistently excellent</strong> client service.
              </p>
              <Button size="lg" asChild className="mt-2">
                <Link href="/contact-sales?plan=it-services">
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
              Everything you need to know about Perpetual Core for IT services
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "How secure is client data? Can competitors access our information?",
                answer: "Extremely secure. All data is encrypted with 256-bit encryption at rest and in transit. We use zero-knowledge architecture—we cannot access your data, only you can. Your client configurations, network diagrams, and troubleshooting knowledge are NEVER used to train AI models or shared with anyone. Each MSP has completely isolated workspaces. We're SOC 2 Type II certified and trusted by enterprise IT teams. Many MSPs use Perpetual Core specifically because it's MORE secure than scattered documentation in emails, shared drives, and sticky notes."
              },
              {
                question: "Does Perpetual Core integrate with our PSA (ConnectWise, Autotask, etc.)?",
                answer: "Yes. Perpetual Core integrates with major PSAs including ConnectWise Manage, Autotask, Datto, and Syncro. We can pull ticket history, client information, and documentation from your PSA and sync updates back. Integration setup takes 20-30 minutes during onboarding. We also offer API access for custom integrations with your RMM or other tools. Most MSPs use Perpetual Core alongside their PSA—the PSA handles ticketing and billing, while Perpetual Core handles knowledge management and technical documentation."
              },
              {
                question: "What happens to our data if we cancel?",
                answer: "You own your data, period. If you cancel, you can export everything—client configurations, troubleshooting playbooks, network diagrams, vendor information—in standard formats (PDF, DOCX, JSON). We keep your data for 90 days after cancellation in case you change your mind, then permanently delete it per your request. You'll receive a certificate of data destruction. No lock-in, no hostage data. Your technical documentation belongs to your MSP."
              },
              {
                question: "How long does it take to implement for our MSP?",
                answer: "Most MSPs are fully operational within 1-2 weeks. Week 1: Upload initial documentation (network diagrams, configs, playbooks) and set up PSA integration (6-8 hours of your time). Week 2: Team training and testing (2-3 hours). You'll see value immediately—first time a tech searches for a solution and finds it in 10 seconds instead of 30 minutes. Every MSP gets a dedicated implementation specialist and white-glove onboarding included."
              },
              {
                question: "What if our techs don't use it?",
                answer: "We guarantee 90%+ adoption rates. Here's why techs love it: (1) They see immediate time savings—answers in seconds vs. hours searching. (2) Makes them look like heroes with faster ticket resolution. (3) Junior techs finally have access to senior tech knowledge. (4) No one wants to bother busy senior techs at 2 AM when AI has the answer. Our approach: start with a pilot team of 3-5 techs, demonstrate results (40% faster resolution), let them become champions. If adoption is low, we keep working with you until it's not."
              },
              {
                question: "Can we control who sees what? (Permissions and access)",
                answer: "Absolutely. Perpetual Core has granular role-based access controls. You can set permissions by tech level, client access, or specific documentation types. For example: junior techs see troubleshooting playbooks but not sensitive client financial data; senior techs and account managers see everything; specific techs only see their assigned clients. You can create private workspaces for sensitive clients or internal procedures. Full audit logs track who accessed what and when."
              },
              {
                question: "How much does it cost? Are there volume discounts?",
                answer: "$199 per technician per month. This includes unlimited client documentation, all features, PSA integration, and enterprise support. Volume discounts: 15% off for 10+ techs, 25% off for 25+ techs. We also offer custom enterprise pricing for large MSPs with 50+ techs. Billing is monthly or annual (save 20% with annual). First 14 days are free, no credit card required. ROI calculation: If each tech saves 5 hours/week finding information, that's 20 hours/month × $75/hr = $1,500/month value from a $199 investment."
              },
              {
                question: "Does this work for internal IT teams, not just MSPs?",
                answer: "Yes! Many internal IT departments at mid-size companies (200-2000 employees) use Perpetual Core. Same problems: knowledge walks out when senior people leave, documentation scattered, slow ticket resolution, inconsistent support quality. Internal IT teams use Perpetual Core to preserve technical knowledge, onboard new help desk staff faster, and provide consistent support across all departments. The platform works identically whether you're an MSP supporting multiple clients or an internal team supporting one company."
              },
              {
                question: "What should we NOT use Perpetual Core for?",
                answer: "Perpetual Core is designed for knowledge management, not replacement of technical judgment. DO NOT use it to: (1) Make critical security or architecture decisions without review (that requires human expertise). (2) Store highly sensitive credentials without proper access controls enabled. (3) Auto-resolve tickets without technician review. (4) Replace proper RMM monitoring and alerting tools. (5) Make client commitments or SLA decisions. Use Perpetual Core to find information faster and preserve knowledge—not to bypass technical diligence or accountability."
              },
              {
                question: "How does Perpetual Core handle multi-client environments?",
                answer: "Perfect for MSPs. Each client gets their own secure workspace with documentation, configs, and ticket history. Search across all clients or filter by specific client. Tag documents by client, location, or system type. Set permissions so techs only see their assigned clients if needed. Many MSPs also create 'global' playbooks (like 'How to troubleshoot VPN issues') that apply across all clients, plus client-specific documentation. AI understands context—when you're working on a ticket for Client X, it prioritizes information relevant to that client."
              },
              {
                question: "Can Perpetual Core help with compliance and audits?",
                answer: "Yes. Perpetual Core helps with compliance in several ways: (1) Complete audit logs of all access to sensitive documentation. (2) Version control for configuration changes and documentation updates. (3) Evidence of training and onboarding procedures. (4) Centralized documentation storage meeting security standards. (5) Role-based access controls demonstrating data protection. Many MSPs use Perpetual Core specifically to meet compliance requirements (SOC 2, ISO 27001, CMMC) that require documented procedures and access controls."
              },
              {
                question: "How do you handle technical documentation that changes frequently?",
                answer: "Perpetual Core is designed for living documentation. When you update a document (network diagram, config, procedure), AI automatically versions it and keeps history. Techs always see the most current version when they search. You can also set expiration reminders—'Review this doc every 90 days.' Previous versions remain accessible in case you need to reference historical configurations. Many MSPs integrate Perpetual Core with their documentation workflow: update docs in Perpetual Core whenever you make client changes."
              },
              {
                question: "What kind of support do you provide to MSPs?",
                answer: "Enterprise-grade MSP-focused support: (1) Dedicated implementation specialist for first 30 days. (2) Priority support with 4-hour response time for urgent issues. (3) Phone, email, and secure chat support. (4) Ongoing training and optimization sessions. (5) Regular check-ins with your account manager. (6) 24/7 emergency support for critical issues. (7) MSP-specific help center with integration guides and best practices. For MSPs with 25+ techs, we offer on-site training and quarterly reviews. We understand MSP workflows and pain points."
              },
              {
                question: "Can we migrate existing documentation from other systems?",
                answer: "Yes. We provide migration assistance during onboarding. Common sources: IT Glue, Hudu, SharePoint, Confluence, scattered Word/PDF docs, and PSA documentation fields. We can bulk import documentation or help you gradually migrate over time. Most MSPs do a hybrid approach: migrate critical client documentation immediately (network diagrams, configs, vendor info) then add troubleshooting playbooks and procedures as they work tickets. Migration time varies: small MSPs (2-10 techs) migrate in a few days, larger MSPs (25+ techs) take 2-4 weeks for full migration."
              },
              {
                question: "How does pricing work as we grow or shrink our team?",
                answer: "Simple: add or remove technician seats anytime with no penalties. If you hire 3 new techs mid-month, add their seats and pay prorated for the remainder of the month. If someone leaves, remove their seat and stop paying for it next billing cycle. Volume discounts apply automatically when you reach the thresholds (10+ or 25+ techs). Many MSPs fluctuate seasonally or with contract changes—our pricing adapts with you. No long-term lock-in, no penalties for changes. The only requirement: 30-day notice if canceling entirely."
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
                Schedule a call with our MSP team. We'll answer all your questions and show you exactly how Perpetual Core works for IT services companies.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/contact-sales?plan=it-services">
                    Schedule Demo
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="mailto:msp@aios.com">Email MSP Team</Link>
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
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground">
              Built for MSPs that value technical excellence
            </p>
          </div>

          <Card className="border-2 border-primary">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-2 mb-4">
                  <span className="text-5xl font-bold">$199</span>
                  <span className="text-xl text-muted-foreground">/technician/month</span>
                </div>
                <p className="text-muted-foreground">Everything included. No hidden fees.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Unlimited client documentation storage</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Ticket history & solution search</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Network diagrams & configurations</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">All AI models included</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">24/7 AI technical assistant</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">PSA integration (ConnectWise, Autotask, etc.)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">SOC 2 certified security & encryption</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">White-glove onboarding & migration</span>
                </div>
              </div>

              <div className="border-t pt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Volume discounts (10+ techs)</span>
                  <span className="font-semibold">15% off</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Volume discounts (25+ techs)</span>
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
                  <Link href="/signup?plan=it-services">Start 14-Day Free Trial</Link>
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  No credit card required • Cancel anytime • Setup in 1 week
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
              Ready to Preserve Your Technical Expertise?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join MSPs that are delivering faster ticket resolution, preserving technical knowledge,
              and providing consistently excellent client service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/contact-sales?plan=it-services">Schedule Demo</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent border-white text-white hover:bg-white/10">
                <Link href="/signup?plan=it-services">Start Free Trial</Link>
              </Button>
            </div>
            <p className="text-sm mt-6 opacity-75">
              14-day free trial • Enterprise security • Setup in 1 week
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
                The AI-powered knowledge platform built for MSPs and IT services companies.
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
              © 2024 AI Operating System. All rights reserved. | SOC 2 Type II Certified | Enterprise Security
            </p>
            <p className="text-xs max-w-3xl mx-auto">
              Perpetual Core is an IT knowledge management platform. Technical decisions and client responsibilities remain with IT professionals.
              Your client data is encrypted and never used to train AI models.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
