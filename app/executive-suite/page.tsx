"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Crown,
  Briefcase,
  DollarSign,
  Scale,
  Megaphone,
  Users,
  Code,
  Shield,
  TrendingUp,
  HeartPulse,
  Lightbulb,
  Target,
  BarChart3,
  Handshake,
  Building2,
  ArrowRight,
  Check,
  Sparkles,
  Zap,
  Play,
} from "lucide-react";
import { PublicMobileNav } from "@/components/layout/PublicMobileNav";

const EXECUTIVE_ROLES = [
  {
    icon: Crown,
    title: "CEO Advisor",
    description: "Strategic planning, vision alignment, stakeholder communication, and executive decision support.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: DollarSign,
    title: "CFO Advisor",
    description: "Financial analysis, budgeting, forecasting, cash flow management, and investment strategy.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Briefcase,
    title: "COO Advisor",
    description: "Operations optimization, process improvement, supply chain, and efficiency analysis.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Code,
    title: "CTO Advisor",
    description: "Technology strategy, architecture decisions, build vs buy analysis, and technical roadmaps.",
    color: "from-purple-500 to-violet-500",
  },
  {
    icon: Megaphone,
    title: "CMO Advisor",
    description: "Marketing strategy, brand positioning, campaign planning, and customer acquisition.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: TrendingUp,
    title: "Sales Director",
    description: "Sales strategy, pipeline management, objection handling, and revenue optimization.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Scale,
    title: "Legal Counsel",
    description: "Contract review, compliance guidance, risk assessment, and legal strategy.",
    color: "from-slate-500 to-gray-600",
  },
  {
    icon: Users,
    title: "HR Director",
    description: "Hiring strategies, employee engagement, policies, and organizational development.",
    color: "from-teal-500 to-cyan-500",
  },
  {
    icon: Shield,
    title: "Risk Manager",
    description: "Risk identification, mitigation strategies, crisis planning, and business continuity.",
    color: "from-red-500 to-rose-600",
  },
  {
    icon: BarChart3,
    title: "Data Analyst",
    description: "Data interpretation, KPI tracking, trend analysis, and reporting insights.",
    color: "from-indigo-500 to-blue-500",
  },
  {
    icon: Lightbulb,
    title: "Innovation Lead",
    description: "Product ideation, market opportunities, R&D strategy, and competitive analysis.",
    color: "from-yellow-500 to-amber-500",
  },
  {
    icon: Target,
    title: "Strategy Consultant",
    description: "Market positioning, competitive strategy, growth planning, and M&A analysis.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: Handshake,
    title: "Business Development",
    description: "Partnership strategy, deal structuring, negotiation support, and relationship management.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: HeartPulse,
    title: "Customer Success",
    description: "Retention strategies, customer feedback analysis, and satisfaction optimization.",
    color: "from-emerald-500 to-green-500",
  },
  {
    icon: Building2,
    title: "Project Manager",
    description: "Project planning, resource allocation, timeline management, and milestone tracking.",
    color: "from-gray-500 to-slate-600",
  },
];

const BENEFITS = [
  "Deploy all 15 AI executives with one click",
  "Each role trained on industry best practices",
  "Consistent availability 24/7",
  "No hiring, training, or salary costs",
  "Instant expertise across all departments",
  "Seamlessly collaborate with your team",
];

export default function ExecutiveSuitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground font-bold shadow-lg">
              AI
            </div>
            <span className="text-lg sm:text-xl font-bold">Perpetual Core</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <Link href="/login" className="text-sm font-medium hover:underline">
                Sign In
              </Link>
            </div>
            <div className="md:hidden">
              <PublicMobileNav />
            </div>
            <Button asChild size="sm" className="h-9 shadow-md active:scale-95 transition-all">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium mb-6">
            <Crown className="h-4 w-4" />
            Executive Suite
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Your AI
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent"> C-Suite</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            15 pre-configured AI specialists ready to advise on every aspect of your business.
            Deploy your entire virtual executive team with one click.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg" asChild>
              <Link href="/signup">
                Deploy Executive Suite <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/enterprise-demo">
                <Play className="mr-2 h-5 w-5" /> Watch Demo
              </Link>
            </Button>
          </div>
        </div>

        {/* Benefits Bar */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {BENEFITS.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span className="text-sm font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Executive Roles Grid */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">15 AI Executives</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Each role is trained on industry best practices and ready to provide expert guidance
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {EXECUTIVE_ROLES.map((role, index) => {
              const Icon = role.icon;
              return (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{role.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {role.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started with your AI executive team in minutes
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Sign Up</h3>
              <p className="text-muted-foreground">Create your Perpetual Core account with a 14-day free trial</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Deploy</h3>
              <p className="text-muted-foreground">One-click deployment of all 15 executive AI specialists</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Collaborate</h3>
              <p className="text-muted-foreground">Chat with any executive for instant strategic guidance</p>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-20">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl sm:text-3xl">Perfect For</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold">Startups & Founders</h4>
                      <p className="text-sm text-muted-foreground">Get C-suite expertise without C-suite salaries</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold">Small Businesses</h4>
                      <p className="text-sm text-muted-foreground">Access strategic guidance previously only available to large corporations</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold">Consultants</h4>
                      <p className="text-sm text-muted-foreground">Augment your expertise with specialized AI advisors</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold">Growing Teams</h4>
                      <p className="text-sm text-muted-foreground">Fill expertise gaps before you can afford to hire</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold">Solo Entrepreneurs</h4>
                      <p className="text-sm text-muted-foreground">Have a full advisory board at your fingertips</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold">Enterprise Teams</h4>
                      <p className="text-sm text-muted-foreground">Supplement your leadership with 24/7 AI support</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
            <CardContent className="p-8 sm:p-12">
              <Crown className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Deploy Your AI C-Suite Today</h2>
              <p className="text-lg mb-8 opacity-90">
                Start your 14-day free trial. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/signup">
                    Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" asChild>
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Perpetual Core. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/cookies" className="hover:underline">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
