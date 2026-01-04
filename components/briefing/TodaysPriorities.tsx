"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  CheckSquare,
  Calendar,
  Mail,
  Zap,
  ArrowRight,
  Brain,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Priority {
  id: string;
  title: string;
  type: "task" | "meeting" | "email" | "automation";
  dueAt?: string;
  aiScore: number;
  context?: string;
}

interface TodaysPrioritiesProps {
  priorities: Priority[];
}

const typeConfig = {
  task: { icon: CheckSquare, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30", href: "/dashboard/tasks" },
  meeting: { icon: Calendar, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", href: "/dashboard/calendar" },
  email: { icon: Mail, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", href: "/dashboard/inbox" },
  automation: { icon: Zap, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30", href: "/dashboard/automation" },
};

function getPriorityBadge(score: number) {
  if (score >= 0.8) return { label: "Critical", variant: "destructive" as const };
  if (score >= 0.6) return { label: "High", variant: "default" as const };
  if (score >= 0.4) return { label: "Medium", variant: "secondary" as const };
  return { label: "Low", variant: "outline" as const };
}

export function TodaysPriorities({ priorities }: TodaysPrioritiesProps) {
  const topPriorities = priorities.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet-500" />
            Today&apos;s Priorities
            <Badge variant="secondary" className="ml-2 text-xs">
              AI Ranked
            </Badge>
          </CardTitle>
          <Link href="/dashboard/tasks">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {topPriorities.length === 0 ? (
          <div className="text-center py-8">
            <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No priorities for today. Enjoy your free time!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {topPriorities.map((priority, index) => {
              const config = typeConfig[priority.type];
              const badge = getPriorityBadge(priority.aiScore);
              const Icon = config.icon;

              return (
                <Link
                  key={priority.id}
                  href={config.href}
                  className="block"
                >
                  <div className={`flex items-start gap-3 p-3 rounded-lg ${config.bg} hover:opacity-90 transition-opacity`}>
                    {/* Rank Number */}
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <span className="text-xs font-semibold">{index + 1}</span>
                    </div>

                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {priority.title}
                        </span>
                        <Badge variant={badge.variant} className="text-xs flex-shrink-0">
                          {badge.label}
                        </Badge>
                      </div>
                      {(priority.dueAt || priority.context) && (
                        <div className="flex items-center gap-2 mt-1">
                          {priority.dueAt && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(priority.dueAt), { addSuffix: true })}
                            </span>
                          )}
                          {priority.context && (
                            <span className="text-xs text-muted-foreground truncate">
                              {priority.context}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
