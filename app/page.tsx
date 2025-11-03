"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles,
  Zap,
  Shield,
  MessageSquare,
  FileText,
  Calendar,
  Mail,
  CheckSquare,
  Bot,
  Users,
  TrendingUp,
  Clock,
  Check,
  ArrowRight,
  Star,
  Brain,
  Database,
  Workflow,
  GraduationCap,
  Infinity,
  Briefcase,
  Play,
  ChevronDown,
  Send,
} from "lucide-react";
import { INDUSTRY_CONFIGS } from "@/lib/dashboard/industry-config";

// Demo chat messages
const DEMO_MESSAGES = [
  {
    type: "user",
    text: "What did we discuss about the Johnson contract last month?",
  },
  {
    type: "ai",
    text: "Based on our conversation on January 15th, you mentioned three key concerns about the Johnson contract: the 90-day payment terms, the liability cap at $500K, and the non-compete clause. You wanted to negotiate these before signing.",
  },
  {
    type: "user",
    text: "Perfect! Can you draft a follow-up email using those points?",
  },
  {
    type: "ai",
    text: "Absolutely! I've drafted an email addressing all three concerns. I'm referencing your preferred negotiation style from our previous discussions and the template you liked from the Wilson deal. Would you like me to make any adjustments?",
  },
  {
    type: "user",
    text: "This is exactly what I needed. Send it.",
  },
];

// Interactive Chat Demo Component - Premium Styling
function ChatDemo() {
  return (
    <>
      {DEMO_MESSAGES.map((message, index) => (
        <div
          key={index}
          className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] rounded-3xl px-6 py-4 ${
              message.type === "user"
                ? "bg-gradient-to-br from-primary via-purple-600 to-purple-700 text-primary-foreground shadow-2xl shadow-primary/20"
                : "backdrop-blur-2xl bg-muted/60 border-2 border-border/50 shadow-xl"
            }`}
          >
            {message.type === "ai" && (
              <div className="flex items-center gap-3 mb-3">
                <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-primary via-purple-600 to-purple-700 flex items-center justify-center shadow-lg">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-primary">Perpetual Core</span>
              </div>
            )}
            <p className={`text-base leading-relaxed ${message.type === "user" ? "font-medium" : ""}`}>
              {message.text}
            </p>
          </div>
        </div>
      ))}
    </>
  );
}

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);
  const [isStatsVisible, setIsStatsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".animate-on-scroll").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Animated counter for stats
  useEffect(() => {
    if (isStatsVisible) {
      // Active Users counter
      const usersEnd = 5000;
      const usersDuration = 2000;
      const usersIncrement = usersEnd / (usersDuration / 16);
      const usersTimer = setInterval(() => {
        setActiveUsersCount((c) => {
          if (c >= usersEnd) {
            clearInterval(usersTimer);
            return usersEnd;
          }
          return Math.min(Math.floor(c + usersIncrement), usersEnd);
        });
      }, 16);

      // Messages counter
      const messagesEnd = 1000000;
      const messagesIncrement = messagesEnd / (usersDuration / 16);
      const messagesTimer = setInterval(() => {
        setMessagesCount((c) => {
          if (c >= messagesEnd) {
            clearInterval(messagesTimer);
            return messagesEnd;
          }
          return Math.min(Math.floor(c + messagesIncrement), messagesEnd);
        });
      }, 16);

      return () => {
        clearInterval(usersTimer);
        clearInterval(messagesTimer);
      };
    }
  }, [isStatsVisible]);

  useEffect(() => {
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isStatsVisible) {
            setIsStatsVisible(true);
          }
        });
      },
      { threshold: 0.5 }
    );

    const statsElement = document.getElementById("stats-section");
    if (statsElement) {
      statsObserver.observe(statsElement);
    }

    return () => statsObserver.disconnect();
  }, [isStatsVisible]);

  // Map industry config keys to solutions URLs
  const solutionUrls: { [key: string]: string } = {
    "law-firm": "/solutions/law-firms",
    healthcare: "/solutions/healthcare",
    sales: "/solutions/sales",
    "real-estate": "/solutions/real-estate",
    agency: "/solutions/agencies",
    accounting: "/solutions/accountants",
    church: "/solutions/churches",
    consulting: "/solutions/consulting",
    "financial-advisor": "/solutions/financial-advisors",
    "it-services": "/solutions/it-services",
    "non-profit": "/solutions/non-profits",
    education: "/solutions/education",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .animate-on-scroll {
          opacity: 0;
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

      {/* Navigation */}
      <header className="border-b backdrop-blur-2xl bg-card/80 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground font-bold shadow-lg">
              AI
            </div>
            <span className="text-xl font-bold">Perpetual Core</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <div className="relative group">
              <Link href="/solutions" className="text-sm font-medium hover:text-primary transition flex items-center gap-1">
                Solutions <ChevronDown className="h-4 w-4 group-hover:rotate-180 transition-transform" />
              </Link>
              <div className="absolute top-full left-0 mt-2 w-56 backdrop-blur-2xl bg-card/95 border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">Professional Services</div>
                  <Link href={solutionUrls["law-firm"]} className="block px-3 py-2 text-sm hover:bg-accent rounded-md transition">Law Firms</Link>
                  <Link href={solutionUrls.accounting} className="block px-3 py-2 text-sm hover:bg-accent rounded-md transition">Accounting</Link>
                  <Link href={solutionUrls.consulting} className="block px-3 py-2 text-sm hover:bg-accent rounded-md transition">Consulting</Link>
                  <Link href={solutionUrls["financial-advisor"]} className="block px-3 py-2 text-sm hover:bg-accent rounded-md transition">Financial Advisors</Link>

                  <div className="border-t border-border my-2" />
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">Service Industries</div>
                  <Link href={solutionUrls.healthcare} className="block px-3 py-2 text-sm hover:bg-accent rounded-md transition">Healthcare</Link>
                  <Link href={solutionUrls["real-estate"]} className="block px-3 py-2 text-sm hover:bg-accent rounded-md transition">Real Estate</Link>
                  <Link href={solutionUrls["it-services"]} className="block px-3 py-2 text-sm hover:bg-accent rounded-md transition">IT Services</Link>
                  <Link href={solutionUrls.sales} className="block px-3 py-2 text-sm hover:bg-accent rounded-md transition">Sales Teams</Link>

                  <div className="border-t border-border my-2" />
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">Organizations</div>
                  <Link href={solutionUrls.agency} className="block px-3 py-2 text-sm hover:bg-accent rounded-md transition">Creative Agencies</Link>
                  <Link href={solutionUrls.church} className="block px-3 py-2 text-sm hover:bg-accent rounded-md transition">Churches</Link>
                  <Link href={solutionUrls["non-profit"]} className="block px-3 py-2 text-sm hover:bg-accent rounded-md transition">Non-Profits</Link>
                  <Link href={solutionUrls.education} className="block px-3 py-2 text-sm hover:bg-accent rounded-md transition">Education</Link>

                  <div className="border-t border-border my-2" />
                  <Link href="/solutions" className="block px-3 py-2 text-sm font-medium text-primary hover:bg-accent rounded-md transition">View All Solutions →</Link>
                </div>
              </div>
            </div>
            <Link href="#features" className="text-sm font-medium hover:text-primary transition">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition">
              How It Works
            </Link>
            <Link href="/pricing" className="text-sm font-medium hover:text-primary transition">
              Pricing
            </Link>
            <Link href="/login" className="text-sm font-medium hover:underline">
              Sign In
            </Link>
            <Button asChild className="shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/signup">Get Started Free</Link>
            </Button>
          </nav>
          <div className="md:hidden flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium">
              Sign In
            </Link>
            <Button size="sm" asChild>
              <Link href="/signup">Start Free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Premium Redesign */}
      <section className="container mx-auto px-4 pt-24 pb-32 md:pt-32 md:pb-48 relative overflow-hidden">
        {/* Subtle animated background */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 opacity-40 transition-all duration-1000"
          style={{
            backgroundPosition: `${scrollY * 0.3}px ${scrollY * 0.2}px`,
          }}
        ></div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Badge */}
          <div className="flex justify-center mb-12 animate-on-scroll">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full backdrop-blur-2xl bg-primary/10 border border-primary/20 text-primary text-sm font-semibold shadow-lg">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="tracking-wide">Infinite Memory AI Platform</span>
            </div>
          </div>

          {/* Massive Headline */}
          <h1 className="text-center text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-12 leading-[0.95] animate-on-scroll">
            <span className="block bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
              Your AI Brain
            </span>
            <span className="block mt-2 bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
              Never Forgets
            </span>
          </h1>

          {/* Subtitle with more breathing room */}
          <p className="text-center text-xl md:text-2xl lg:text-3xl text-muted-foreground/80 mb-16 max-w-4xl mx-auto leading-relaxed font-light animate-on-scroll">
            Access <span className="font-semibold text-foreground">GPT-4, Claude, and Gemini</span> in one place.
            <br className="hidden md:block" />
            Infinite context. Team collaboration. 24/7 automation.
          </p>

          {/* CTA Buttons - Larger, more dramatic */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20 animate-on-scroll">
            <Button
              size="lg"
              asChild
              className="text-xl px-12 py-8 h-auto rounded-2xl shadow-2xl hover:shadow-3xl transition-all bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              <Link href="/signup">
                Start Free Trial <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="text-xl px-12 py-8 h-auto rounded-2xl backdrop-blur-2xl bg-transparent border-2 hover:bg-accent/50 shadow-xl hover:shadow-2xl transition-all"
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>

          {/* Trust indicators - More subtle */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground/60 mb-24 animate-on-scroll">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Cancel anytime</span>
            </div>
          </div>

          {/* Model Pills - Redesigned */}
          <div className="flex flex-wrap items-center justify-center gap-4 animate-on-scroll">
            <div className="px-6 py-3 rounded-2xl backdrop-blur-2xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <MessageSquare className="inline h-4 w-4 mr-2" />
              GPT-4
            </div>
            <div className="px-6 py-3 rounded-2xl backdrop-blur-2xl bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-400 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <Brain className="inline h-4 w-4 mr-2" />
              Claude
            </div>
            <div className="px-6 py-3 rounded-2xl backdrop-blur-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <Sparkles className="inline h-4 w-4 mr-2" />
              Gemini
            </div>
            <div className="px-6 py-3 rounded-2xl backdrop-blur-2xl bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <Infinity className="inline h-4 w-4 mr-2" />
              Infinite Memory
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Chat Demo - THE Centerpiece */}
      <section className="container mx-auto px-4 py-32 md:py-40 relative animate-on-scroll">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-6xl md:text-7xl font-black tracking-tight mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
              See The Magic
            </h2>
            <p className="text-2xl md:text-3xl text-muted-foreground/80 font-light max-w-3xl mx-auto">
              Watch how Perpetual Core remembers context from weeks ago
            </p>
          </div>

          {/* Massive Chat Interface */}
          <div className="relative group">
            {/* Dramatic glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-purple-500/30 to-pink-500/30 rounded-[3rem] opacity-20 group-hover:opacity-30 blur-3xl transition-all duration-700"></div>

            <div className="relative backdrop-blur-3xl bg-card/90 border-2 border-border/50 rounded-[2.5rem] shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.6)] overflow-hidden">
              {/* Chat Header - More premium */}
              <div className="border-b border-border/50 bg-gradient-to-b from-muted/40 to-muted/20 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-purple-700 flex items-center justify-center shadow-xl">
                      <Brain className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Perpetual Core Assistant</h3>
                      <p className="text-sm text-muted-foreground">Infinite memory • Always in context</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">Active</span>
                  </div>
                </div>
              </div>

              {/* Chat Messages - More spacious */}
              <div className="p-10 space-y-6 min-h-[500px] max-h-[600px] overflow-y-auto bg-gradient-to-b from-background/30 via-background/50 to-muted/20">
                <ChatDemo />
              </div>

              {/* Chat Input - Larger, more premium */}
              <div className="border-t border-border/50 bg-gradient-to-b from-muted/20 to-muted/40 px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1 backdrop-blur-2xl bg-background/60 border-2 border-border/50 rounded-2xl px-6 py-4 text-base text-muted-foreground hover:border-primary/30 transition-colors">
                    Ask anything... your AI never forgets
                  </div>
                  <Button size="lg" className="h-14 w-14 rounded-2xl shadow-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Callouts - Larger, more impactful */}
          <div className="mt-20 grid md:grid-cols-3 gap-10">
            <div className="text-center group">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                <Infinity className="h-10 w-10 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3">Infinite Context</h4>
              <p className="text-base text-muted-foreground leading-relaxed">Remembers every conversation forever. Pick up exactly where you left off.</p>
            </div>
            <div className="text-center group">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3">All AI Models</h4>
              <p className="text-base text-muted-foreground leading-relaxed">GPT-4, Claude, Gemini in one place. Switch models instantly.</p>
            </div>
            <div className="text-center group">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                <Database className="h-10 w-10 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3">Your Knowledge</h4>
              <p className="text-base text-muted-foreground leading-relaxed">Searches all your documents, notes, and conversations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Value Props - What Makes Perpetual Core Different */}
      <section className="container mx-auto px-4 py-20 animate-on-scroll">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-primary to-purple-600 dark:from-white dark:via-primary dark:to-purple-400 bg-clip-text text-transparent">
            Why Perpetual Core is Different
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Not just another AI chat tool. A complete operating system for your digital brain.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {/* Infinite Memory */}
          <Card className="backdrop-blur-2xl bg-card/80 border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl group shadow-xl">
            <CardContent className="p-8">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Infinity className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Never Lose Context</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your conversations never expire. Pick up exactly where you left off—days, weeks, or months later. Your
                AI brain remembers everything you've ever discussed.
              </p>
            </CardContent>
          </Card>

          {/* All Models */}
          <Card className="backdrop-blur-2xl bg-card/80 border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl group shadow-xl">
            <CardContent className="p-8">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">All AI Models, One Place</h3>
              <p className="text-muted-foreground leading-relaxed">
                Access GPT-4, Claude, and Gemini in a single conversation. Switch models instantly. Get the best answer
                every time—no more juggling multiple subscriptions.
              </p>
            </CardContent>
          </Card>

          {/* Knowledge Hub */}
          <Card className="backdrop-blur-2xl bg-card/80 border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl group shadow-xl">
            <CardContent className="p-8">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Database className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Your Knowledge Hub</h3>
              <p className="text-muted-foreground leading-relaxed">
                Upload documents, notes, and data. Your AI searches across everything you've stored. One brain that
                knows your entire information universe.
              </p>
            </CardContent>
          </Card>

          {/* Team Collaboration */}
          <Card className="backdrop-blur-2xl bg-card/80 border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl group shadow-xl">
            <CardContent className="p-8">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Team Knowledge Bases</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sales teams share playbooks. Legal teams share templates. Support teams share solutions. Everyone gets
                accurate answers from your team's collective expertise—instantly.
              </p>
            </CardContent>
          </Card>

          {/* Programmable Agents */}
          <Card className="backdrop-blur-2xl bg-card/80 border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl group shadow-xl">
            <CardContent className="p-8">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Workflow className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Programmable Automation</h3>
              <p className="text-muted-foreground leading-relaxed">
                Create AI agents that work 24/7. Automate workflows, schedule tasks, and build custom solutions. Your
                AI does the work while you sleep.
              </p>
            </CardContent>
          </Card>

          {/* AI Coach */}
          <Card className="backdrop-blur-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl group shadow-xl">
            <CardContent className="p-8">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">AI Coach & Learning</h3>
              <p className="text-muted-foreground leading-relaxed">
                Don't know how to do something? Your personal AI coach guides you step-by-step. Learn new skills and
                master the platform with intelligent assistance.
              </p>
              <div className="mt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-2xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-700 dark:text-yellow-300 text-xs font-semibold shadow-lg">
                  <Sparkles className="h-3 w-3" />
                  NEW FEATURE
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Industries We Serve - REDESIGNED & MOVED DOWN */}
      <section id="industries" className="container mx-auto px-4 py-20 animate-on-scroll">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-2xl bg-gradient-to-r from-primary/20 to-purple-500/20 border-2 border-primary/30 text-primary text-sm font-medium mb-6 shadow-xl">
            <Briefcase className="h-4 w-4" />
            <span className="font-semibold">Built for Your Industry</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-primary to-purple-600 dark:from-white dark:via-primary dark:to-purple-400 bg-clip-text text-transparent">
            Featured Industries
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Tailored AI solutions for professionals who need institutional memory and expertise preservation
          </p>
        </div>

        {/* Featured 6 Industries in 2 rows of 3 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {["law-firm", "healthcare", "sales", "real-estate", "non-profit", "education"].map((industryKey) => {
            const industry = INDUSTRY_CONFIGS[industryKey];
            if (!industry) return null;

            const Icon = industry.icon;
            const gradients: { [key: string]: string } = {
              "law-firm": "from-blue-500 to-cyan-600",
              healthcare: "from-green-500 to-emerald-600",
              sales: "from-purple-500 to-pink-600",
              "real-estate": "from-orange-500 to-amber-600",
              "non-profit": "from-rose-500 to-pink-600",
              education: "from-amber-500 to-orange-600",
            };
            const gradient = gradients[industryKey as keyof typeof gradients] || "from-blue-500 to-purple-600";

            const solutionUrl = solutionUrls[industryKey] || `/solutions/${industryKey}`;

            return (
              <Link key={industryKey} href={solutionUrl} className="group relative block">
                <div
                  className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500`}
                />
                <Card className="relative h-full backdrop-blur-2xl bg-card/80 border-2 border-border hover:border-primary/50 transition-all duration-300 shadow-xl hover:shadow-2xl">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`h-16 w-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                      {industry.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{industry.subheadline}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-4">Plus 6 more industries tailored for your needs</p>
          <Button size="lg" variant="outline" asChild className="backdrop-blur-2xl bg-card/80 border-2 shadow-xl hover:shadow-2xl transition-all">
            <Link href="/signup">
              View All Solutions <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Security & Privacy Section - Enhanced Glassmorphic */}
      <section className="container mx-auto px-4 py-20 animate-on-scroll">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-2xl bg-green-500/20 border-2 border-green-500/30 text-green-700 dark:text-green-300 text-sm font-semibold mb-4 shadow-xl">
              <Shield className="h-4 w-4" />
              <span>Enterprise-Grade Security</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-primary to-purple-600 dark:from-white dark:via-primary dark:to-purple-400 bg-clip-text text-transparent">
              Your Data Stays Yours
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Complete privacy and security. Your personal AI brain that nobody else can access.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-12">
            {/* Left: Security Features */}
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-xl backdrop-blur-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">100% Private & Secure</h3>
                  <p className="text-muted-foreground">
                    Your data is encrypted at rest and in transit. Row-level security ensures only you can access your
                    information. Other users cannot see or access your conversations or documents.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-xl backdrop-blur-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Never Used for Training</h3>
                  <p className="text-muted-foreground">
                    Your data is NEVER used to train GPT-4, Claude, or Gemini. These AI companies have strict policies
                    against using customer data for model training.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-xl backdrop-blur-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Database className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Your Personal AI Brain</h3>
                  <p className="text-muted-foreground">
                    We use advanced RAG (Retrieval Augmented Generation) to make AI aware of YOUR documents without
                    retraining models. Your knowledge stays in your secure vault.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-xl backdrop-blur-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">You Control Sharing</h3>
                  <p className="text-muted-foreground">
                    Team collaboration is opt-in. You decide exactly what to share with teammates and what stays
                    private. Full audit logs show who accessed what.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Compliance Badges */}
            <div className="flex items-center justify-center">
              <Card className="p-8 backdrop-blur-2xl bg-card/80 border-2 border-border w-full shadow-2xl">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Trusted Security</h3>
                  <p className="text-muted-foreground">Enterprise-grade protection for your peace of mind</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg backdrop-blur-2xl bg-muted/50 border border-border shadow-lg">
                    <Check className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <div>
                      <div className="font-semibold">SOC 2 Type II Compliant</div>
                      <div className="text-sm text-muted-foreground">Annual security audits</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg backdrop-blur-2xl bg-muted/50 border border-border shadow-lg">
                    <Check className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <div>
                      <div className="font-semibold">GDPR & CCPA Ready</div>
                      <div className="text-sm text-muted-foreground">Full data privacy compliance</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg backdrop-blur-2xl bg-muted/50 border border-border shadow-lg">
                    <Check className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <div>
                      <div className="font-semibold">256-bit Encryption</div>
                      <div className="text-sm text-muted-foreground">Bank-level security</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg backdrop-blur-2xl bg-muted/50 border border-border shadow-lg">
                    <Check className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <div>
                      <div className="font-semibold">99.9% Uptime SLA</div>
                      <div className="text-sm text-muted-foreground">Always available when you need it</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center backdrop-blur-2xl bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl p-8 border-2 border-green-500/20 shadow-xl">
            <h3 className="text-2xl font-bold mb-2">Your AI. Your Data. Your Control.</h3>
            <p className="text-muted-foreground mb-4">
              Experience the power of AI without compromising your privacy.
            </p>
            <Button size="lg" variant="default" asChild className="shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/signup">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid - Enhanced Glassmorphic */}
      <section id="features" className="container mx-auto px-4 py-20 animate-on-scroll">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-primary to-purple-600 dark:from-white dark:via-primary dark:to-purple-400 bg-clip-text text-transparent">
            Everything you need to work smarter
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete suite of AI-powered tools to transform how you work
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="backdrop-blur-2xl bg-card/80 border-2 border-border hover:border-primary/50 transition-all duration-300 shadow-xl hover:shadow-2xl"
              >
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg backdrop-blur-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-4 shadow-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-4 py-20 animate-on-scroll">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-primary to-purple-600 dark:from-white dark:via-primary dark:to-purple-400 bg-clip-text text-transparent">
            Get started in minutes
          </h2>
          <p className="text-xl text-muted-foreground">Simple setup, powerful results</p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.title} className="text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-purple-600 text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-xl">
                {index + 1}
              </div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section with Animated Stats */}
      <section id="stats-section" className="container mx-auto px-4 py-20 animate-on-scroll">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-primary to-purple-600 dark:from-white dark:via-primary dark:to-purple-400 bg-clip-text text-transparent">
              Why teams choose Perpetual Core
            </h2>
            <div className="space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-lg">{benefit}</p>
                </div>
              ))}
            </div>
            <Button size="lg" asChild className="mt-8 shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/signup">
                Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <div className="backdrop-blur-2xl bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-12 border-2 border-primary/20 shadow-2xl">
            <div className="text-center">
              <div className="text-6xl font-extrabold text-primary mb-2">10x</div>
              <div className="text-xl font-semibold mb-8">Faster Workflows</div>
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold mb-1">
                    {activeUsersCount.toLocaleString()}
                    {activeUsersCount >= 5000 ? "+" : ""}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">
                    {messagesCount >= 1000000 ? "1M+" : `${Math.floor(messagesCount / 1000)}K+`}
                  </div>
                  <div className="text-sm text-muted-foreground">AI Messages</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">24/7</div>
                  <div className="text-sm text-muted-foreground">Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Enhanced Glassmorphic */}
      <section className="container mx-auto px-4 py-20 animate-on-scroll">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-primary to-purple-600 dark:from-white dark:via-primary dark:to-purple-400 bg-clip-text text-transparent">
            Loved by teams worldwide
          </h2>
          <p className="text-xl text-muted-foreground">See what our customers have to say</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.author}
              className="backdrop-blur-2xl bg-card/80 border-2 border-border hover:border-primary/50 transition-all duration-300 shadow-xl hover:shadow-2xl"
            >
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">&quot;{testimonial.quote}&quot;</p>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Teaser - Enhanced Glassmorphic */}
      <section className="container mx-auto px-4 py-20 animate-on-scroll">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-primary to-purple-600 dark:from-white dark:via-primary dark:to-purple-400 bg-clip-text text-transparent">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-muted-foreground mb-12">Choose the plan that&apos;s right for your team</p>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={
                  tier.popular
                    ? "backdrop-blur-2xl bg-card/80 border-2 border-primary shadow-2xl"
                    : "backdrop-blur-2xl bg-card/80 border-2 border-border shadow-xl hover:shadow-2xl transition-all duration-300"
                }
              >
                {tier.popular && (
                  <div className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground text-sm font-medium py-1 text-center">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">${tier.price}</span>
                    {tier.price > 0 && <span className="text-muted-foreground">/month</span>}
                  </div>
                  <p className="text-muted-foreground mb-2">{tier.description}</p>
                  <p className="text-sm font-semibold text-primary mb-6">{tier.features}</p>
                  <Button
                    className="w-full shadow-lg hover:shadow-xl transition-shadow"
                    variant={tier.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12">
            <Link href="/pricing" className="text-primary font-medium hover:underline">
              View detailed pricing and features →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20 animate-on-scroll">
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary to-purple-600 text-primary-foreground border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to transform your workflow?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of teams using Perpetual Core to work smarter, not harder
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="text-lg px-8 shadow-xl hover:shadow-2xl transition-shadow">
                <Link href="/signup">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="text-lg px-8 bg-transparent border-white text-white hover:bg-white/10 shadow-xl hover:shadow-2xl transition-all"
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm opacity-75">No credit card required • 14-day free trial • Cancel anytime</p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t backdrop-blur-2xl bg-card/80 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground font-bold shadow-lg">
                  AI
                </div>
                <span className="text-lg font-bold">Perpetual Core</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your intelligent productivity platform powered by cutting-edge AI
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-primary transition">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-primary transition">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition">
                    Roadmap
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition">
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary transition">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/terms" className="hover:text-primary transition">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-primary transition">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-primary transition">
                    Cookies
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 AI Operating System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: "AI Chat",
    description:
      "Interact with Claude, GPT-4, and Gemini. Get instant answers, brainstorm ideas, and solve complex problems.",
    icon: MessageSquare,
  },
  {
    title: "Smart Documents",
    description: "Upload, analyze, and extract insights from any document with AI-powered intelligence.",
    icon: FileText,
  },
  {
    title: "Calendar Integration",
    description: "Sync your calendar and let AI manage scheduling, meetings, and reminders automatically.",
    icon: Calendar,
  },
  {
    title: "Email Assistant",
    description: "Draft, review, and send emails with AI. Get smart replies and email templates instantly.",
    icon: Mail,
  },
  {
    title: "Task Automation",
    description: "Auto-extract tasks from conversations and emails. Set up smart workflows and reminders.",
    icon: CheckSquare,
  },
  {
    title: "AI Workflows",
    description: "Build custom automation with if-then rules. Connect your tools and eliminate repetitive work.",
    icon: Zap,
  },
  {
    title: "AI Agents",
    description: "Deploy autonomous AI agents to handle complex tasks while you focus on what matters.",
    icon: Bot,
  },
  {
    title: "Team Collaboration",
    description: "Real-time collaboration with your team. Share documents, tasks, and AI conversations.",
    icon: Users,
  },
  {
    title: "Analytics & Insights",
    description: "Track productivity, measure AI usage, and get actionable insights for your team.",
    icon: TrendingUp,
  },
];

const steps = [
  {
    title: "Sign Up Free",
    description: "Create your account in seconds. No credit card required for the 14-day trial.",
  },
  {
    title: "Connect Your Tools",
    description: "Integrate with Gmail, Google Calendar, Slack, and your favorite productivity apps.",
  },
  {
    title: "Start Automating",
    description: "Chat with AI, create workflows, and watch your productivity soar.",
  },
];

const benefits = [
  "Save 10+ hours per week on repetitive tasks",
  "Access multiple AI models from one platform",
  "Enterprise-grade security with SOC 2 compliance",
  "Real-time collaboration for distributed teams",
  "Seamless integration with 50+ apps and services",
  "24/7 customer support with 99.9% uptime SLA",
];

const testimonials = [
  {
    author: "Sarah Chen",
    role: "CEO, TechStartup Inc",
    quote:
      "Perpetual Core transformed how our team works. We're 3x more productive and our customers love the faster response times.",
  },
  {
    author: "Michael Rodriguez",
    role: "Product Manager, InnovateCo",
    quote:
      "The AI automation features are game-changing. What used to take hours now takes minutes. Highly recommend!",
  },
  {
    author: "Emily Thompson",
    role: "Head of Operations, ScaleUp Ltd",
    quote:
      "Best investment we've made this year. The ROI was clear within the first month. Our team can't imagine working without it.",
  },
];

const pricingTiers = [
  {
    name: "Free",
    price: 0,
    description: "Perfect for trying out Perpetual Core",
    features: "50 messages/month",
    popular: false,
  },
  {
    name: "Pro",
    price: 49,
    description: "For individuals and professionals",
    features: "1,000 messages/month",
    popular: true,
  },
  {
    name: "Business",
    price: 149,
    description: "For teams and growing businesses",
    features: "4,000 messages/month",
    popular: false,
  },
];
