"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Minus } from "lucide-react";
import type { ComplianceCheckResult } from "@/lib/compliance/readiness";

interface ComplianceScoreCardProps {
  score: number;
  checks: ComplianceCheckResult[];
  loading?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-green-50 border-green-200";
  if (score >= 60) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

function StatusIcon({ status }: { status: ComplianceCheckResult["status"] }) {
  switch (status) {
    case "pass":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "fail":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case "not_applicable":
      return <Minus className="h-4 w-4 text-gray-400" />;
  }
}

function StatusBadge({ status }: { status: ComplianceCheckResult["status"] }) {
  const variants: Record<string, string> = {
    pass: "bg-green-100 text-green-700",
    fail: "bg-red-100 text-red-700",
    warning: "bg-yellow-100 text-yellow-700",
    not_applicable: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[status]}`}>
      {status === "not_applicable" ? "N/A" : status}
    </span>
  );
}

export default function ComplianceScoreCard({ score, checks, loading }: ComplianceScoreCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-24 w-24 rounded-full bg-gray-200 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const passCount = checks.filter((c) => c.status === "pass").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const warningCount = checks.filter((c) => c.status === "warning").length;

  return (
    <Card className={`border ${getScoreBg(score)}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Security Compliance Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Circle */}
        <div className="flex items-center gap-6">
          <div className="relative h-24 w-24 flex-shrink-0">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="40"
                fill="none" stroke="currentColor"
                strokeWidth="8" className="text-gray-200"
              />
              <circle
                cx="50" cy="50" r="40"
                fill="none" stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${score * 2.51} 251`}
                strokeLinecap="round"
                className={getScoreColor(score)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              <span>{passCount} passed</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
              <span>{warningCount} warnings</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-3.5 w-3.5 text-red-600" />
              <span>{failCount} failed</span>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2 pt-2 border-t">
          {checks.map((check) => (
            <div key={check.name} className="flex items-start gap-2 text-sm">
              <StatusIcon status={check.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{check.name}</span>
                  <StatusBadge status={check.status} />
                </div>
                {check.recommendation && (
                  <p className="text-xs text-gray-500 mt-0.5">{check.recommendation}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
