"use client";

import { Sparkles, Building2, Rocket, TrendingUp, CheckCircle, ArrowRight, Users, Zap, Brain } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicMobileNav } from "@/components/layout/PublicMobileNav";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function ConsultingPage() {
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
            <Link href="/features/intelligence" className="text-sm font-medium hover:text-primary transition">Intelligence</Link>
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
            <Sparkles className="h-4 w-4" />
            <span>The Perpetual Transformation Stack</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            <span className="bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
              Complete Intelligence Transformation
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            This is NOT just software. This is a new operating reality for your organization. 
            Architecture, implementation, AI OS, agents, and executive advisory—all in one transformation stack.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8">
              <Link href="/contact-sales">Book Strategy Call</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link href="/pricing">View Product Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* The Offer - 3 Parts */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">The Complete Stack</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three integrated components for complete organizational transformation
            </p>
          </div>

          {/* Part 1 - Perpetual Core */}
          <Card className="mb-12 border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-3xl">PART 1: Perpetual Core</CardTitle>
                  <CardDescription className="text-lg">The AI Operating System</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                The foundational platform that powers your organizational intelligence.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Multi-Model AI</div>
                    <div className="text-sm text-muted-foreground">GPT-4o, Claude 3.5, Gemini</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Infinite Organizational Memory</div>
                    <div className="text-sm text-muted-foreground">Never forget conversations or decisions</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">AI Executive Suite</div>
                    <div className="text-sm text-muted-foreground">CEO, CFO, COO, HR, and more</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Department Agents</div>
                    <div className="text-sm text-muted-foreground">Specialized agents for each department</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Workflow Automation</div>
                    <div className="text-sm text-muted-foreground">Full automation engine</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Document Intelligence</div>
                    <div className="text-sm text-muted-foreground">RAG-powered knowledge base</div>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm font-semibold text-muted-foreground">
                  Value: $5,000 - $150,000/year depending on tier
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Part 2 - Consulting */}
          <Card className="mb-12 border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Rocket className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-3xl">PART 2: Organizational AI Transformation</CardTitle>
                  <CardDescription className="text-lg">Strategic Consulting & Implementation</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                This is where the real value (and transformation) happens. Delivered in 3 phases.
              </p>

              {/* Phase 1 */}
              <div className="mb-8 p-6 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Phase 1: Assessment & Intelligence Architecture</h3>
                    <p className="text-sm text-muted-foreground">2-4 weeks</p>
                  </div>
                </div>
                <ul className="space-y-2 ml-14">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Organizational diagnostic & workflow audit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>SOP extraction & systems mapping</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Leadership interviews & alignment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Intelligence Architecture Blueprint</span>
                  </li>
                </ul>
                <p className="mt-4 ml-14 text-sm font-semibold text-primary">
                  Value: $15,000 - $35,000
                </p>
              </div>

              {/* Phase 2 */}
              <div className="mb-8 p-6 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Phase 2: Implementation & Deployment</h3>
                    <p className="text-sm text-muted-foreground">30-90 days</p>
                  </div>
                </div>
                <ul className="space-y-2 ml-14">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Full Perpetual Core installation & setup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Department Agent creation & configuration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Knowledge ingestion (docs, SOPs, training)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Workflow automation build-out</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Team training & onboarding</span>
                  </li>
                </ul>
                <p className="mt-4 ml-14 text-sm font-semibold text-primary">
                  Value: $25,000 - $75,000
                </p>
              </div>

              {/* Phase 3 */}
              <div className="p-6 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Phase 3: Optimization & Ongoing Intelligence</h3>
                    <p className="text-sm text-muted-foreground">Monthly Retainer</p>
                  </div>
                </div>
                <ul className="space-y-2 ml-14">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>New agents & workflow enhancements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Quarterly architecture upgrades</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Predictive insights & strategic advisory</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Chief AI Officer partnership model</span>
                  </li>
                </ul>
                <p className="mt-4 ml-14 text-sm font-semibold text-primary">
                  Value: $2,500 - $10,000/month
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Part 3 - Command Center */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-3xl">PART 3: Custom LDC Command Center</CardTitle>
                  <CardDescription className="text-lg">Optional Premium Add-On</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                A personal executive OS built JUST for the CEO, founder, minister, or leader.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Daily Briefings</div>
                    <div className="text-sm text-muted-foreground">Personalized intelligence summaries</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Revenue Dashboards</div>
                    <div className="text-sm text-muted-foreground">Real-time financial intelligence</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">AI Chief of Staff</div>
                    <div className="text-sm text-muted-foreground">Personal operational engine</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Relationship Intelligence</div>
                    <div className="text-sm text-muted-foreground">Network & contact management</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Personal Workflows</div>
                    <div className="text-sm text-muted-foreground">Custom automation for leaders</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">Private Vault</div>
                    <div className="text-sm text-muted-foreground">Secure personal intelligence graph</div>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm font-semibold text-muted-foreground">
                  Value: $25,000 - $150,000+ initial + $1,000 - $3,000/month
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Organization?
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Book a strategy call to discuss how the Perpetual Transformation Stack can work for you
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8">
              <Link href="/contact-sales">Book Strategy Call</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link href="/pricing">View Product Pricing</Link>
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
              <Link href="/features/intelligence" className="text-muted-foreground hover:text-foreground">Intelligence</Link>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </ErrorBoundary>
  );
}

