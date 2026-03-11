"use client";

import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  ExternalLink,
  BookOpen,
  Award,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const ACADEMY_BASE_URL = "https://academy.humanadvancementinstitute.org";

const ACADEMY_TRACKS = [
  {
    tier: "Tier 1",
    name: "AI Foundations",
    description: "Master the fundamentals of AI — prompting, tools, and workflows",
    modules: 5,
    price: "Free",
    color: "from-blue-500 to-cyan-500",
  },
  {
    tier: "Tier 2",
    name: "AI Practitioner",
    description: "Advanced AI integration — automation, agents, and business workflows",
    modules: 5,
    price: "$497",
    color: "from-violet-500 to-purple-500",
  },
  {
    tier: "Tier 3",
    name: "AI Specialist",
    description: "Deep specialization — custom AI solutions, RAG, and deployment",
    modules: 5,
    price: "$997",
    color: "from-orange-500 to-red-500",
  },
  {
    tier: "Tier 4",
    name: "AI Workforce Fellow",
    description: "Hands-on cohort experience with real-world AI implementation projects",
    modules: 8,
    price: "$2,497",
    color: "from-emerald-500 to-green-600",
  },
];

const STATS = [
  { icon: BookOpen, label: "Modules", value: "23+" },
  { icon: Award, label: "Certifications", value: "4 Tiers" },
  { icon: Users, label: "Community", value: "Growing" },
  { icon: Sparkles, label: "AI-Powered", value: "100%" },
];

interface LearnClientProps {
  userEmail: string;
  userName: string;
}

export function LearnClient({ userEmail, userName }: LearnClientProps) {
  const academyUrl = `${ACADEMY_BASE_URL}?ref=perpetualcore&email=${encodeURIComponent(userEmail)}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Learn</h1>
          <p className="text-muted-foreground mt-1">
            AI certification &amp; training through IHA Academy
          </p>
        </div>
        <a
          href={academyUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="gap-2">
            Open Academy
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </a>
      </div>

      {/* Hero Card */}
      <div className="rounded-2xl border bg-gradient-to-br from-violet-500/5 via-background to-blue-500/5 p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-1">
              IHA AI Academy
            </h2>
            <p className="text-muted-foreground mb-4 max-w-xl">
              The Institute for Human Advancement&apos;s AI certification
              program. From foundations to fellowship — learn AI skills that
              translate directly into career advancement and business growth.
            </p>
            <a href={academyUrl} target="_blank" rel="noopener noreferrer">
              <Button className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 gap-2">
                Start Learning
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-card p-4 text-center"
          >
            <stat.icon className="h-5 w-5 text-violet-500 mx-auto mb-2" />
            <p className="text-lg font-semibold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Certification Tracks */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Certification Tracks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ACADEMY_TRACKS.map((track) => (
            <a
              key={track.tier}
              href={academyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border bg-card p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md bg-gradient-to-r ${track.color} text-white`}
                >
                  {track.tier}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {track.price}
                </span>
              </div>
              <h4 className="font-medium mb-1 group-hover:text-violet-600 transition-colors">
                {track.name}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {track.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {track.modules} modules
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* Embedded Academy */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Academy Portal</h3>
        <div
          className="rounded-xl border overflow-hidden bg-background"
          style={{ height: "600px" }}
        >
          <iframe
            src={academyUrl}
            className="w-full h-full border-0"
            title="IHA AI Academy"
            allow="clipboard-write"
          />
        </div>
      </div>
    </div>
  );
}
