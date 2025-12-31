"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  CheckSquare,
  Zap,
  AlertCircle,
  AtSign,
  UserPlus,
  Sparkles
} from "lucide-react";

interface OvernightSummaryProps {
  summary: {
    newEmails: number;
    newTasks: number;
    completedAutomations: number;
    failedAutomations: number;
    newMentions: number;
    newContacts: number;
    highlights: string[];
  };
}

export function OvernightSummary({ summary }: OvernightSummaryProps) {
  const stats = [
    { label: "New Emails", value: summary.newEmails, icon: Mail, color: "text-blue-500" },
    { label: "New Tasks", value: summary.newTasks, icon: CheckSquare, color: "text-green-500" },
    { label: "Automations Run", value: summary.completedAutomations, icon: Zap, color: "text-violet-500" },
    { label: "Failed", value: summary.failedAutomations, icon: AlertCircle, color: "text-red-500", showIfZero: false },
    { label: "Mentions", value: summary.newMentions, icon: AtSign, color: "text-amber-500" },
    { label: "New Contacts", value: summary.newContacts, icon: UserPlus, color: "text-cyan-500" },
  ].filter(stat => stat.showIfZero !== false || stat.value > 0);

  const hasActivity = stats.some(s => s.value > 0) || summary.highlights.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          While You Were Away
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasActivity ? (
          <p className="text-sm text-muted-foreground">
            All caught up! Nothing happened while you were away.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <stat.icon className={`h-5 w-5 ${stat.color} mb-1`} />
                  <span className="text-2xl font-semibold">{stat.value}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Highlights */}
            {summary.highlights.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Highlights</h4>
                <ul className="space-y-1.5">
                  {summary.highlights.map((highlight, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-violet-500 mt-1">•</span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
