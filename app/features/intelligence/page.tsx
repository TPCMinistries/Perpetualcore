"use client";

import { Brain, Sparkles, TrendingUp, Network, Lightbulb, Target, Zap, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicMobileNav } from "@/components/layout/PublicMobileNav";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { LoadingButton } from "@/components/ui/loading-button";

export default function IntelligenceFeaturesPage() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Perpetual Core
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition">Home</Link>
            <Link href="/features/intelligence" className="text-sm font-medium text-primary">Intelligence</Link>
            <Link href="/agents" className="text-sm font-medium hover:text-primary transition">Agents</Link>
            <Link href="/pricing" className="text-sm font-medium hover:text-primary transition">Pricing</Link>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>
          <div className="md:hidden">
            <PublicMobileNav />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-8">
            <Brain className="h-4 w-4" />
            <span>Adaptive Intelligence Engine</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            <span className="bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
              Intelligence That Learns
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Perpetual Core doesn't just store information—it learns, adapts, and gets smarter with every interaction. 
            Your organization's intelligence layer that evolves with you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LoadingButton size="lg" asChild className="text-lg px-8">
              <Link href="/signup">Start Free Trial</Link>
            </LoadingButton>
            <LoadingButton size="lg" variant="outline" asChild className="text-lg px-8">
              <Link href="/consulting">See Consulting Options</Link>
            </LoadingButton>
          </div>
        </div>
      </section>

      {/* Core Intelligence Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How Intelligence Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Every conversation, document, and action makes Perpetual Core smarter
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Insight Extraction */}
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Automatic Insight Extraction</CardTitle>
                <CardDescription>
                  AI analyzes every conversation to extract key insights, preferences, and patterns automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Identifies user preferences and communication styles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Extracts actionable insights from discussions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Builds confidence scores for each insight</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Pattern Recognition */}
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Pattern Recognition</CardTitle>
                <CardDescription>
                  Recognizes recurring patterns across conversations, workflows, and behaviors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Temporal patterns (time-based behaviors)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Behavioral patterns (recurring actions)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Content patterns (recurring topics)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Knowledge Graph */}
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Network className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Knowledge Graph</CardTitle>
                <CardDescription>
                  Maps relationships between concepts, topics, and entities across your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Identifies concept relationships</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Maps dependencies and connections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Enables concept discovery</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Preference Learning */}
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Preference Learning</CardTitle>
                <CardDescription>
                  Learns your preferences and applies them automatically to future interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Preferred AI model selection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Communication tone and style</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Response format preferences</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Predictive Suggestions */}
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Predictive Suggestions</CardTitle>
                <CardDescription>
                  Generates intelligent, actionable suggestions based on insights and patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Action recommendations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Optimization opportunities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Priority-based suggestions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Continuous Learning */}
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Continuous Learning</CardTitle>
                <CardDescription>
                  Gets smarter with every interaction, building organizational intelligence over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Real-time learning from conversations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Adaptive intelligence improvements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Cross-conversation intelligence</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">The Intelligence Cycle</h2>
            <p className="text-xl text-muted-foreground">
              How Perpetual Core learns and adapts
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">You Interact</h3>
                <p className="text-muted-foreground">
                  Have conversations, upload documents, create workflows, and use the platform
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">AI Analyzes</h3>
                <p className="text-muted-foreground">
                  Perpetual Core automatically extracts insights, recognizes patterns, and learns preferences
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Intelligence Builds</h3>
                <p className="text-muted-foreground">
                  Knowledge graphs expand, patterns strengthen, and preferences become more accurate
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">You Benefit</h3>
                <p className="text-muted-foreground">
                  Get smarter suggestions, personalized responses, and predictive insights that improve over time
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Experience Adaptive Intelligence?
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Start using Perpetual Core and watch it learn and adapt to your organization
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8">
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Perpetual Core. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link>
              <Link href="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
              <Link href="/consulting" className="text-muted-foreground hover:text-foreground">Consulting</Link>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </ErrorBoundary>
  );
}

