"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExternalTasksWidget } from "@/components/briefing/ExternalTasksWidget";

interface AIEmployee {
  id: string;
  name: string;
  title: string;
  avatar: string;
  color: string;
  description: string;
  shortDescription: string;
  benefits: string[];
}

interface SimpleModeDashboardProps {
  userName: string;
  userId: string;
}

// Fallback employee data if API fails
const FALLBACK_EMPLOYEES: AIEmployee[] = [
  {
    id: "atlas",
    name: "Atlas",
    title: "Executive Assistant",
    avatar: "🏛️",
    color: "#6366F1",
    description: "Manages your inbox, calendar, and daily priorities",
    shortDescription: "Email, calendar, and daily priorities",
    benefits: ["Never miss an important email", "Daily priorities handled"],
  },
  {
    id: "echo",
    name: "Echo",
    title: "Community Manager",
    avatar: "📢",
    color: "#EC4899",
    description: "Amplifies your message across social platforms",
    shortDescription: "Social media and community engagement",
    benefits: ["Consistent social presence", "Community engagement"],
  },
  {
    id: "sage",
    name: "Sage",
    title: "Content Writer",
    avatar: "📚",
    color: "#10B981",
    description: "Creates SEO-optimized content that ranks",
    shortDescription: "Blog writing and content strategy",
    benefits: ["SEO-optimized content", "Research-backed articles"],
  },
  {
    id: "scout",
    name: "Scout",
    title: "Lead Generator",
    avatar: "🎯",
    color: "#F59E0B",
    description: "Discovers opportunities and fills your pipeline",
    shortDescription: "Lead generation and outreach",
    benefits: ["Pipeline always full", "Automatic follow-ups"],
  },
  {
    id: "iris",
    name: "Iris",
    title: "Receptionist",
    avatar: "🌈",
    color: "#8B5CF6",
    description: "Your 24/7 front desk for calls and bookings",
    shortDescription: "Phone, bookings, and first contact",
    benefits: ["24/7 availability", "Professional first impressions"],
  },
  {
    id: "cipher",
    name: "Cipher",
    title: "Legal Assistant",
    avatar: "⚖️",
    color: "#64748B",
    description: "Decodes complex legal documents",
    shortDescription: "Contract review and legal analysis",
    benefits: ["Spot risky clauses", "Plain language explanations"],
  },
];

export function SimpleModeDashboard({ userName, userId }: SimpleModeDashboardProps) {
  const router = useRouter();
  const [employees, setEmployees] = useState<AIEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/assistants/seed-employees");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || FALLBACK_EMPLOYEES);
      } else {
        setEmployees(FALLBACK_EMPLOYEES);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees(FALLBACK_EMPLOYEES);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedEmployees = async () => {
    setSeeding(true);
    try {
      const response = await fetch("/api/assistants/seed-employees", {
        method: "POST",
      });
      if (response.ok) {
        setSeeded(true);
      }
    } catch (error) {
      console.error("Error seeding employees:", error);
    } finally {
      setSeeding(false);
    }
  };

  const handleChatWithEmployee = (employeeId: string) => {
    // Navigate to advisors page and potentially open chat with this employee
    router.push(`/dashboard/assistants?employee=${employeeId}`);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {getGreeting()}, {userName}
        </h1>
        <p className="text-muted-foreground text-lg">
          Your AI team is ready to help. Select an employee to get started.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{employees.length}</p>
                <p className="text-xs text-muted-foreground">AI Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">Active</p>
                <p className="text-xs text-muted-foreground">Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Zap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">Instant</p>
                <p className="text-xs text-muted-foreground">Response</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup CTA (if not seeded) */}
      {!seeded && (
        <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-200 dark:border-indigo-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">Activate Your AI Team</h3>
                <p className="text-sm text-muted-foreground">
                  Add your AI employees to start delegating tasks automatically.
                </p>
              </div>
              <Button
                onClick={handleSeedEmployees}
                disabled={seeding}
                className="gap-2"
              >
                {seeding ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Activate Team
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Employees Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your AI Team</h2>
          <Button variant="ghost" size="sm" className="gap-2" asChild>
            <a href="/dashboard/assistants">
              <Settings2 className="h-4 w-4" />
              Manage Team
            </a>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <Card
              key={employee.id}
              className={cn(
                "relative overflow-hidden transition-all hover:shadow-lg cursor-pointer group",
                "hover:ring-2 hover:ring-offset-2"
              )}
              style={{
                // @ts-ignore
                "--ring-color": employee.color,
              }}
              onClick={() => handleChatWithEmployee(employee.id)}
            >
              {/* Color accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: employee.color }}
              />

              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div
                    className="text-3xl p-2 rounded-xl"
                    style={{ backgroundColor: `${employee.color}20` }}
                  >
                    {employee.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {employee.name}
                      <Badge variant="outline" className="text-xs font-normal">
                        AI
                      </Badge>
                    </CardTitle>
                    <CardDescription>{employee.title}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {employee.shortDescription}
                </p>

                {/* Benefits */}
                <ul className="space-y-1">
                  {employee.benefits.slice(0, 2).map((benefit, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <CheckCircle2
                        className="h-3 w-3 flex-shrink-0"
                        style={{ color: employee.color }}
                      />
                      {benefit}
                    </li>
                  ))}
                </ul>

                {/* Chat button */}
                <Button
                  variant="ghost"
                  className="w-full justify-between group-hover:bg-slate-100 dark:group-hover:bg-slate-800"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat with {employee.name}
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* External Tasks (Todoist, Linear) */}
      <ExternalTasksWidget limit={5} compact />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common tasks you can delegate right now</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => handleChatWithEmployee("atlas")}
            >
              <span className="text-2xl mr-3">🏛️</span>
              <div className="text-left">
                <p className="font-medium">Check my inbox</p>
                <p className="text-xs text-muted-foreground">
                  Atlas will summarize important emails
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => handleChatWithEmployee("echo")}
            >
              <span className="text-2xl mr-3">📢</span>
              <div className="text-left">
                <p className="font-medium">Create a social post</p>
                <p className="text-xs text-muted-foreground">
                  Echo will draft platform-optimized content
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => handleChatWithEmployee("sage")}
            >
              <span className="text-2xl mr-3">📚</span>
              <div className="text-left">
                <p className="font-medium">Write a blog post</p>
                <p className="text-xs text-muted-foreground">
                  Sage will research and write SEO content
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => handleChatWithEmployee("cipher")}
            >
              <span className="text-2xl mr-3">⚖️</span>
              <div className="text-left">
                <p className="font-medium">Review a contract</p>
                <p className="text-xs text-muted-foreground">
                  Cipher will analyze and flag issues
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Switch to Advanced Mode */}
      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground mb-2">
          Want more features? Switch to the full dashboard.
        </p>
        <Button variant="link" asChild>
          <a href="/dashboard/settings/appearance">
            Switch to Advanced Mode
          </a>
        </Button>
      </div>
    </div>
  );
}
