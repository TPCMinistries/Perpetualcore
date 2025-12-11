"use client";

import { Bot, Users, Briefcase, Heart, GraduationCap, Building2, DollarSign, FileText, MessageSquare, Calendar, Mail, CheckSquare, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicMobileNav } from "@/components/layout/PublicMobileNav";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const AGENT_CATEGORIES = [
  {
    name: "Executive Suite",
    description: "C-level AI advisors trained on your organization",
    agents: [
      { name: "AI CEO", icon: Users, description: "Strategic planning, decision support, organizational vision" },
      { name: "AI CFO", icon: DollarSign, description: "Financial analysis, budgeting, revenue optimization" },
      { name: "AI COO", icon: Briefcase, description: "Operations management, process optimization, efficiency" },
      { name: "AI CMO", icon: TrendingUp, description: "Marketing strategy, campaign planning, brand management" },
    ],
  },
  {
    name: "Department Leaders",
    description: "Specialized agents for each department",
    agents: [
      { name: "AI HR Director", icon: Users, description: "Recruitment, onboarding, employee relations" },
      { name: "AI Operations Manager", icon: Briefcase, description: "Workflow optimization, process management" },
      { name: "AI Sales Manager", icon: TrendingUp, description: "Sales strategy, pipeline management, forecasting" },
      { name: "AI Grant Writer", icon: FileText, description: "Grant applications, proposals, compliance" },
    ],
  },
  {
    name: "Ministry & Nonprofit",
    description: "Specialized agents for faith-based and nonprofit organizations",
    agents: [
      { name: "AI Pastor/Ministry Assistant", icon: Heart, description: "Sermon preparation, pastoral care, ministry planning" },
      { name: "AI Youth Coordinator", icon: GraduationCap, description: "Youth programs, curriculum, engagement" },
      { name: "AI Community Programs Manager", icon: Users, description: "Program development, outreach, impact tracking" },
      { name: "AI Donor Relations", icon: Heart, description: "Donor communication, stewardship, fundraising" },
    ],
  },
  {
    name: "Workforce & Education",
    description: "Agents for workforce development and educational institutions",
    agents: [
      { name: "AI Case Manager", icon: Users, description: "Client tracking, service coordination, outcomes" },
      { name: "AI Workforce Coordinator", icon: Briefcase, description: "Job placement, training, career development" },
      { name: "AI Education Coordinator", icon: GraduationCap, description: "Curriculum management, student support, reporting" },
      { name: "AI Program Director", icon: Building2, description: "Program oversight, compliance, evaluation" },
    ],
  },
  {
    name: "Productivity Assistants",
    description: "Agents that help with daily tasks and workflows",
    agents: [
      { name: "AI Email Assistant", icon: Mail, description: "Email management, drafting, prioritization" },
      { name: "AI Calendar Manager", icon: Calendar, description: "Scheduling, meeting prep, time optimization" },
      { name: "AI Task Coordinator", icon: CheckSquare, description: "Task management, prioritization, tracking" },
      { name: "AI Research Assistant", icon: FileText, description: "Research, analysis, information synthesis" },
    ],
  },
];

export default function AgentsLibraryPage() {
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
            <Link href="/agents" className="text-sm font-medium text-primary">Agents</Link>
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
            <Bot className="h-4 w-4" />
            <span>30+ Pre-Built AI Agents</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            <span className="bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
              Your AI Leadership Team
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Meet your AI executive suite, department leaders, and specialized assistants. 
            Each trained on your data, your goals, and your language. Ready to work 24/7.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8">
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link href="/consulting">Custom Agent Development</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Agent Categories */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-7xl mx-auto">
          {AGENT_CATEGORIES.map((category, categoryIdx) => (
            <div key={categoryIdx} className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">{category.name}</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {category.description}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.agents.map((agent, agentIdx) => {
                  const Icon = agent.icon;
                  return (
                    <Card key={agentIdx} className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                      <CardHeader>
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {agent.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Custom Agents Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-8">
            <Sparkles className="h-4 w-4" />
            <span>Custom Development</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Need a Custom Agent?
          </h2>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Our consulting team can build custom AI agents tailored to your specific needs, 
            workflows, and industry requirements.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8">
              <Link href="/consulting">Learn About Custom Agents</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link href="/contact-sales">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Deploy Your AI Team?
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Start using pre-built agents or create custom ones for your organization
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

