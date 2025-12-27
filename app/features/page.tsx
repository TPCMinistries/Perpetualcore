"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Brain,
  MessageSquare,
  FileText,
  Users,
  Workflow,
  Bot,
  Calendar,
  Mail,
  Shield,
  Zap,
  Database,
  Search,
  Clock,
  Infinity,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";
import { PublicMobileNav } from "@/components/layout/PublicMobileNav";

const CORE_FEATURES = [
  {
    icon: Infinity,
    title: "Infinite Conversation Memory",
    description: "Unlike ChatGPT's 200-message limit, Perpetual Core never forgets. Access conversations from weeks or months ago instantly.",
    highlight: true,
  },
  {
    icon: Brain,
    title: "Multi-Model AI Access",
    description: "Switch between GPT-4, Claude, Gemini, and DeepSeek in one interface. No juggling subscriptions or tabs.",
    highlight: true,
  },
  {
    icon: FileText,
    title: "Document Intelligence (RAG)",
    description: "Upload documents and search them with AI. Get instant answers from your PDFs, contracts, and files.",
    highlight: true,
  },
  {
    icon: Users,
    title: "Team Knowledge Bases",
    description: "Shared workspaces where your team's expertise is preserved and searchable by everyone.",
    highlight: false,
  },
  {
    icon: Bot,
    title: "30+ Pre-Built AI Agents",
    description: "Deploy specialized AI agents for research, writing, analysis, coding, and more with one click.",
    highlight: false,
  },
  {
    icon: Workflow,
    title: "Custom Automations",
    description: "Build if-then workflows that run 24/7. Automate repetitive tasks and let AI handle the work.",
    highlight: false,
  },
];

const PRODUCTIVITY_FEATURES = [
  {
    icon: Calendar,
    title: "Calendar Integration",
    description: "Sync with Google Calendar. AI understands your schedule and helps you plan.",
  },
  {
    icon: Mail,
    title: "Email Assistant",
    description: "Draft emails, summarize threads, and manage your inbox with AI assistance.",
  },
  {
    icon: Search,
    title: "Semantic Search",
    description: "Search your entire knowledge base using natural language, not just keywords.",
  },
  {
    icon: Clock,
    title: "Context Retrieval",
    description: "AI automatically pulls relevant context from past conversations and documents.",
  },
];

const ENTERPRISE_FEATURES = [
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Row-level security, encryption at rest and in transit, SOC 2 infrastructure.",
  },
  {
    icon: Users,
    title: "SSO & SAML",
    description: "Single sign-on integration with your existing identity provider.",
  },
  {
    icon: Database,
    title: "Audit Logs",
    description: "Complete visibility into who accessed what, when.",
  },
  {
    icon: Zap,
    title: "API Access",
    description: "Build custom integrations with our developer-friendly API.",
  },
];

export default function FeaturesPage() {
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI That Never Forgets
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Everything You Need in
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"> One Platform</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Perpetual Core combines infinite memory, multi-model AI, document intelligence, and team collaboration
            into a single AI operating system for your work.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="shadow-lg">
              <Link href="/signup">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>

        {/* Core Features */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Core Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The foundation of your AI-powered second brain
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CORE_FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className={`relative overflow-hidden ${
                    feature.highlight
                      ? "border-primary/50 bg-gradient-to-br from-primary/5 to-purple-500/5"
                      : ""
                  }`}
                >
                  {feature.highlight && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg">
                      Core
                    </div>
                  )}
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Productivity Features */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Productivity Tools</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Integrations and tools to supercharge your workflow
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRODUCTIVITY_FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Enterprise Features */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Enterprise Ready</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Security and compliance features for organizations
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ENTERPRISE_FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
                  <CardHeader className="pb-2">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Comparison Section */}
        <section className="mb-20">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl sm:text-3xl">Why Perpetual Core?</CardTitle>
              <CardDescription className="text-lg">
                See how we compare to using ChatGPT alone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-muted-foreground">ChatGPT</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-red-500 mt-1">✕</span>
                      Forgets after 200 messages
                    </li>
                    <li className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-red-500 mt-1">✕</span>
                      One model at a time
                    </li>
                    <li className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-red-500 mt-1">✕</span>
                      Limited document upload
                    </li>
                    <li className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-red-500 mt-1">✕</span>
                      No team collaboration
                    </li>
                    <li className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-red-500 mt-1">✕</span>
                      No automation/workflows
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-primary">Perpetual Core</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5" />
                      Infinite conversation memory
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5" />
                      GPT-4, Claude, Gemini, DeepSeek
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5" />
                      Unlimited docs with RAG search
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5" />
                      Team knowledge bases
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5" />
                      30+ AI agents & automations
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary to-purple-600 text-white border-0">
            <CardContent className="p-8 sm:p-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Get Started?</h2>
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
                  <Link href="/enterprise-demo">Book a Demo</Link>
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
