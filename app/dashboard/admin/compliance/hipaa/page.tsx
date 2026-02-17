"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, AlertTriangle, FileText } from "lucide-react";
import Link from "next/link";
import type { ComplianceScore } from "@/lib/compliance/readiness";

interface HIPAAControl {
  id: string;
  name: string;
  requirement: string;
  category: string;
  status: "met" | "partial" | "not_met" | "not_applicable";
  evidence: string;
}

const HIPAA_CONTROLS: HIPAAControl[] = [
  {
    id: "164.312(a)(1)",
    name: "Access Control",
    requirement: "Implement technical policies and procedures for electronic information systems that maintain ePHI",
    category: "Technical Safeguards",
    status: "met",
    evidence: "RBAC system with role-based permissions, SSO integration",
  },
  {
    id: "164.312(a)(2)(i)",
    name: "Unique User Identification",
    requirement: "Assign a unique name and/or number for identifying and tracking user identity",
    category: "Technical Safeguards",
    status: "met",
    evidence: "Supabase Auth with UUID-based user identification",
  },
  {
    id: "164.312(a)(2)(iii)",
    name: "Automatic Logoff",
    requirement: "Implement electronic procedures that terminate a session after a predetermined time of inactivity",
    category: "Technical Safeguards",
    status: "met",
    evidence: "Session timeout policies configurable per organization",
  },
  {
    id: "164.312(a)(2)(iv)",
    name: "Encryption and Decryption",
    requirement: "Implement a mechanism to encrypt and decrypt ePHI",
    category: "Technical Safeguards",
    status: "met",
    evidence: "AES-256 encryption at rest (Supabase), TLS 1.3 in transit",
  },
  {
    id: "164.312(b)",
    name: "Audit Controls",
    requirement: "Implement hardware, software, and/or procedural mechanisms that record and examine activity",
    category: "Technical Safeguards",
    status: "met",
    evidence: "Comprehensive audit logging with export capability",
  },
  {
    id: "164.312(c)(1)",
    name: "Integrity Controls",
    requirement: "Implement policies and procedures to protect ePHI from improper alteration or destruction",
    category: "Technical Safeguards",
    status: "met",
    evidence: "RLS policies, database constraints, input validation",
  },
  {
    id: "164.312(d)",
    name: "Person or Entity Authentication",
    requirement: "Implement procedures to verify that a person or entity seeking access to ePHI is who they claim",
    category: "Technical Safeguards",
    status: "met",
    evidence: "MFA enforcement, SSO/SAML, email verification",
  },
  {
    id: "164.312(e)(1)",
    name: "Transmission Security",
    requirement: "Implement technical security measures to guard against unauthorized access to ePHI during transmission",
    category: "Technical Safeguards",
    status: "met",
    evidence: "TLS/HTTPS enforced for all data in transit",
  },
  {
    id: "164.308(a)(1)(ii)(D)",
    name: "Information System Activity Review",
    requirement: "Implement procedures to regularly review records of information system activity",
    category: "Administrative Safeguards",
    status: "partial",
    evidence: "Audit log dashboard available; automated review pending",
  },
  {
    id: "164.310(d)(1)",
    name: "Device and Media Controls",
    requirement: "Implement policies governing the receipt and removal of hardware and electronic media",
    category: "Physical Safeguards",
    status: "not_applicable",
    evidence: "Cloud-hosted infrastructure (Vercel/Supabase) — managed by providers",
  },
  {
    id: "164.502",
    name: "Business Associate Agreement",
    requirement: "Establish BAA with all business associates that handle ePHI",
    category: "Organizational",
    status: "partial",
    evidence: "BAA template available; needs execution with each covered entity",
  },
];

export default function HIPAACompliancePage() {
  const [complianceData, setComplianceData] = useState<ComplianceScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/compliance")
      .then((res) => res.json())
      .then(setComplianceData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const metCount = HIPAA_CONTROLS.filter((c) => c.status === "met").length;
  const partialCount = HIPAA_CONTROLS.filter((c) => c.status === "partial").length;
  const notMetCount = HIPAA_CONTROLS.filter((c) => c.status === "not_met").length;

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const categories = [...new Set(HIPAA_CONTROLS.map((c) => c.category))];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">HIPAA Compliance</h1>
        <p className="text-gray-600 mt-1">
          Health Insurance Portability and Accountability Act readiness checklist
        </p>
      </div>

      {/* Back Nav */}
      <div className="flex gap-2 text-sm">
        <Link
          href="/dashboard/admin/compliance"
          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          &larr; Compliance Overview
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <SummaryCard label="Total Controls" value={HIPAA_CONTROLS.length.toString()} />
        <SummaryCard label="Met" value={metCount.toString()} color="text-green-600" />
        <SummaryCard label="Partial" value={partialCount.toString()} color="text-yellow-600" />
        <SummaryCard label="Not Met" value={notMetCount.toString()} color="text-red-600" />
      </div>

      {/* Controls by Category */}
      {categories.map((category) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-500" />
              {category}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {HIPAA_CONTROLS.filter((c) => c.category === category).map((control) => (
                <div key={control.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <StatusIcon status={control.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">{control.id}</code>
                      <span className="font-medium text-sm">{control.name}</span>
                      <StatusBadge status={control.status} />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{control.requirement}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Evidence:</span> {control.evidence}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${color ?? "text-slate-900"}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function StatusIcon({ status }: { status: HIPAAControl["status"] }) {
  switch (status) {
    case "met":
      return <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />;
    case "not_met":
      return <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />;
    case "partial":
      return <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />;
    case "not_applicable":
      return <div className="h-5 w-5 rounded-full bg-gray-300 flex-shrink-0 mt-0.5" />;
  }
}

function StatusBadge({ status }: { status: HIPAAControl["status"] }) {
  const styles: Record<string, string> = {
    met: "bg-green-100 text-green-700",
    partial: "bg-yellow-100 text-yellow-700",
    not_met: "bg-red-100 text-red-700",
    not_applicable: "bg-gray-100 text-gray-500",
  };
  const labels: Record<string, string> = {
    met: "Met",
    partial: "Partial",
    not_met: "Not Met",
    not_applicable: "N/A",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
