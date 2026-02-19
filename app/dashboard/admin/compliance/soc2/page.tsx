"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, AlertTriangle, Shield } from "lucide-react";
import Link from "next/link";
import type { ComplianceScore } from "@/lib/compliance/readiness";

interface SOC2Control {
  id: string;
  name: string;
  principle: string;
  description: string;
  status: "implemented" | "partial" | "not_implemented";
  evidence: string;
}

const SOC2_TRUST_PRINCIPLES = ["Security", "Availability", "Processing Integrity", "Confidentiality", "Privacy"] as const;

const SOC2_CONTROLS: SOC2Control[] = [
  // Security
  {
    id: "CC6.1",
    name: "Logical Access Security",
    principle: "Security",
    description: "The entity implements logical access security software, infrastructure, and architectures",
    status: "implemented",
    evidence: "RBAC, SSO/SAML, MFA enforcement, session management",
  },
  {
    id: "CC6.2",
    name: "User Authentication",
    principle: "Security",
    description: "Prior to issuing system credentials, the entity registers and authorizes new users",
    status: "implemented",
    evidence: "Supabase Auth with email verification, SSO provisioning",
  },
  {
    id: "CC6.3",
    name: "Access Restrictions",
    principle: "Security",
    description: "The entity authorizes, modifies, or removes access based on authorized personnel",
    status: "implemented",
    evidence: "Role-based permissions, IP whitelisting, org-level isolation",
  },
  {
    id: "CC7.1",
    name: "Monitoring Activities",
    principle: "Security",
    description: "To meet its objectives, the entity uses detection and monitoring procedures",
    status: "implemented",
    evidence: "Audit logging, usage monitoring, security event tracking",
  },
  {
    id: "CC7.2",
    name: "Anomaly Detection",
    principle: "Security",
    description: "The entity monitors system components for anomalies indicative of malicious acts",
    status: "partial",
    evidence: "Rate limiting active; automated anomaly detection in development",
  },
  // Availability
  {
    id: "A1.1",
    name: "System Availability",
    principle: "Availability",
    description: "The entity maintains, monitors, and evaluates current processing capacity",
    status: "implemented",
    evidence: "Vercel auto-scaling, Supabase managed infrastructure, heartbeat cron",
  },
  {
    id: "A1.2",
    name: "Recovery Procedures",
    principle: "Availability",
    description: "The entity authorizes, designs, develops recovery infrastructure",
    status: "implemented",
    evidence: "Supabase PITR backups, Vercel deployment rollbacks",
  },
  // Processing Integrity
  {
    id: "PI1.1",
    name: "Data Processing Integrity",
    principle: "Processing Integrity",
    description: "The entity implements quality assurance procedures over system processing",
    status: "implemented",
    evidence: "Input validation, database constraints, TypeScript strict mode",
  },
  // Confidentiality
  {
    id: "C1.1",
    name: "Confidential Information Protection",
    principle: "Confidentiality",
    description: "The entity identifies and maintains confidential information",
    status: "implemented",
    evidence: "Encryption at rest/transit, RLS policies, org isolation",
  },
  {
    id: "C1.2",
    name: "Data Disposal",
    principle: "Confidentiality",
    description: "The entity disposes of confidential information to meet objectives",
    status: "partial",
    evidence: "Data retention policies configurable; automated deletion in development",
  },
  // Privacy
  {
    id: "P1.1",
    name: "Privacy Notice",
    principle: "Privacy",
    description: "The entity provides notice about its privacy practices",
    status: "partial",
    evidence: "Privacy policy exists; needs update for enterprise features",
  },
];

export default function SOC2ReadinessPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading compliance data
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const implementedCount = SOC2_CONTROLS.filter((c) => c.status === "implemented").length;
  const totalControls = SOC2_CONTROLS.length;
  const readinessScore = Math.round((implementedCount / totalControls) * 100);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SOC 2 Type II Readiness</h1>
        <p className="text-muted-foreground mt-1">
          Service Organization Control 2 — Trust Services Criteria assessment
        </p>
      </div>

      {/* Back Nav */}
      <div className="flex gap-2 text-sm">
        <Link
          href="/dashboard/admin/compliance"
          className="px-3 py-1.5 bg-muted text-foreground rounded-lg hover:bg-muted"
        >
          &larr; Compliance Overview
        </Link>
      </div>

      {/* Readiness Score */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-700">{readinessScore}%</div>
              <div className="text-sm text-blue-600">SOC 2 Ready</div>
            </div>
            <div className="flex-1 text-sm text-blue-800 space-y-1">
              <p>{implementedCount} of {totalControls} controls fully implemented</p>
              <p>{SOC2_CONTROLS.filter((c) => c.status === "partial").length} controls partially implemented</p>
              <p>{SOC2_CONTROLS.filter((c) => c.status === "not_implemented").length} controls pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Principles Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        {SOC2_TRUST_PRINCIPLES.map((principle) => {
          const controls = SOC2_CONTROLS.filter((c) => c.principle === principle);
          const implemented = controls.filter((c) => c.status === "implemented").length;
          return (
            <Card key={principle}>
              <CardContent className="p-4 text-center">
                <Shield className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs font-medium text-muted-foreground">{principle}</p>
                <p className="text-lg font-bold mt-1">
                  {implemented}/{controls.length}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Controls Detail */}
      {SOC2_TRUST_PRINCIPLES.map((principle) => {
        const controls = SOC2_CONTROLS.filter((c) => c.principle === principle);
        if (controls.length === 0) return null;

        return (
          <Card key={principle}>
            <CardHeader>
              <CardTitle className="text-lg">{principle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {controls.map((control) => (
                  <div key={control.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                    {control.status === "implemented" ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : control.status === "partial" ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{control.id}</code>
                        <span className="font-medium text-sm">{control.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{control.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium">Evidence:</span> {control.evidence}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
