"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Users, Zap, TrendingUp, ArrowUpRight } from "lucide-react";

export default function TeamBillingPage() {
  const [teamPlan, setTeamPlan] = useState({
    plan: "team",
    seats: { used: 4, total: 10 },
    billing: "monthly",
    nextBilling: "2026-03-16",
    monthlyTotal: 499,
  });

  const usageItems = [
    { label: "AI Messages", used: 12450, limit: -1, unit: "messages" },
    { label: "Documents", used: 87, limit: -1, unit: "docs" },
    { label: "Storage", used: 24.5, limit: -1, unit: "GB" },
    { label: "Browser Actions", used: 34, limit: -1, unit: "daily" },
    { label: "Voice Calls", used: 12, limit: 100, unit: "monthly" },
    { label: "Custom Skills", used: 8, limit: -1, unit: "skills" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Billing</h1>
        <p className="text-muted-foreground">
          Manage your team plan, seats, and usage
        </p>
      </div>

      {/* Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Team Plan
              </CardTitle>
              <CardDescription>
                ${teamPlan.monthlyTotal}/month billed {teamPlan.billing}
              </CardDescription>
            </div>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {teamPlan.plan.charAt(0).toUpperCase() + teamPlan.plan.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Next billing date</span>
            <span className="text-sm font-medium">
              {new Date(teamPlan.nextBilling).toLocaleDateString()}
            </span>
          </div>
          <Button variant="outline" className="w-full">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Manage Plan
          </Button>
        </CardContent>
      </Card>

      {/* Seats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Seats
          </CardTitle>
          <CardDescription>
            {teamPlan.seats.used} of {teamPlan.seats.total} seats used
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress
            value={(teamPlan.seats.used / teamPlan.seats.total) * 100}
            className="h-3 mb-3"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {teamPlan.seats.total - teamPlan.seats.used} seats available
            </span>
            <Button variant="outline" size="sm">
              Add Seats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Current Usage
          </CardTitle>
          <CardDescription>This billing period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usageItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {typeof item.used === "number" && item.used % 1 !== 0
                        ? item.used.toFixed(1)
                        : item.used.toLocaleString()}{" "}
                      {item.limit === -1 ? "(unlimited)" : `/ ${item.limit}`}{" "}
                      {item.unit}
                    </span>
                  </div>
                  {item.limit !== -1 && (
                    <Progress
                      value={(item.used / item.limit) * 100}
                      className="h-2"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
