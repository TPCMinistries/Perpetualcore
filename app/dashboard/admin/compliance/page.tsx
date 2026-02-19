"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, FileCheck, Globe, Clock, Lock } from "lucide-react";
import Link from "next/link";
import ComplianceScoreCard from "@/components/admin/ComplianceScoreCard";
import type { ComplianceScore } from "@/lib/compliance/readiness";

export default function ComplianceOverviewPage() {
  const [data, setData] = useState<ComplianceScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/compliance")
      .then((res) => res.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance & Security</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your organization&apos;s security posture and compliance readiness
        </p>
      </div>

      {/* Quick Nav */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/dashboard/admin/compliance"
          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-medium"
        >
          Overview
        </Link>
        <Link
          href="/dashboard/admin/compliance/soc2"
          className="px-3 py-1.5 bg-muted text-foreground rounded-lg hover:bg-muted"
        >
          SOC 2
        </Link>
        <Link
          href="/dashboard/admin/compliance/hipaa"
          className="px-3 py-1.5 bg-muted text-foreground rounded-lg hover:bg-muted"
        >
          HIPAA
        </Link>
        <Link
          href="/dashboard/admin/compliance/data-retention"
          className="px-3 py-1.5 bg-muted text-foreground rounded-lg hover:bg-muted"
        >
          Data Retention
        </Link>
        <Link
          href="/dashboard/admin/compliance/ip-whitelist"
          className="px-3 py-1.5 bg-muted text-foreground rounded-lg hover:bg-muted"
        >
          IP Whitelist
        </Link>
        <Link
          href="/dashboard/admin/sessions"
          className="px-3 py-1.5 bg-muted text-foreground rounded-lg hover:bg-muted"
        >
          Sessions
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Card */}
        {data ? (
          <ComplianceScoreCard
            score={data.overall_score}
            checks={data.checks}
          />
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Failed to load compliance data
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Security Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickAction
                icon={Shield}
                title="SOC 2 Type II Readiness"
                description="Review controls and evidence for SOC 2 certification"
                href="/dashboard/admin/compliance/soc2"
              />
              <QuickAction
                icon={FileCheck}
                title="HIPAA Compliance"
                description="BAA status and HIPAA control checklist"
                href="/dashboard/admin/compliance/hipaa"
              />
              <QuickAction
                icon={Globe}
                title="IP Whitelist"
                description="Manage trusted IP ranges for access control"
                href="/dashboard/admin/compliance/ip-whitelist"
              />
              <QuickAction
                icon={Clock}
                title="Data Retention"
                description="Configure retention policies for all data types"
                href="/dashboard/admin/compliance/data-retention"
              />
              <QuickAction
                icon={Lock}
                title="Session Management"
                description="View active sessions, enforce MFA, set timeouts"
                href="/dashboard/admin/sessions"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Breakdown */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(data.category_scores).map(([category, catData]) => {
            const percentage = catData.total > 0 ? Math.round((catData.score / catData.total) * 100) : 0;
            return (
              <Card key={category}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium capitalize">
                      {category.replace(/_/g, " ")}
                    </span>
                    <span className={`text-sm font-bold ${
                      percentage >= 80 ? "text-green-600" : percentage >= 60 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        percentage >= 80 ? "bg-green-500" : percentage >= 60 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {catData.checks.filter((c) => c.status === "pass").length}/{catData.checks.length} checks passed
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: typeof Shield;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
    >
      <div className="p-2 bg-slate-100 rounded-lg flex-shrink-0">
        <Icon className="h-4 w-4 text-slate-600" />
      </div>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </Link>
  );
}
