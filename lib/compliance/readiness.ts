import { createAdminClient } from "@/lib/supabase/server";

export interface ComplianceCheckResult {
  name: string;
  category: "security" | "access_control" | "audit" | "data_protection" | "compliance";
  status: "pass" | "fail" | "warning" | "not_applicable";
  weight: number;
  description: string;
  recommendation?: string;
}

export interface ComplianceScore {
  overall_score: number;
  category_scores: Record<string, { score: number; total: number; checks: ComplianceCheckResult[] }>;
  checks: ComplianceCheckResult[];
  assessed_at: string;
}

export async function calculateComplianceScore(organizationId: string): Promise<ComplianceScore> {
  const supabase = createAdminClient();
  const checks: ComplianceCheckResult[] = [];

  // 1. SSO Configuration
  const { data: ssoProviders } = await supabase
    .from("sso_providers")
    .select("id, enabled")
    .eq("organization_id", organizationId);

  const hasSSOEnabled = ssoProviders?.some((p) => p.enabled) ?? false;
  checks.push({
    name: "SSO Configuration",
    category: "access_control",
    status: hasSSOEnabled ? "pass" : "fail",
    weight: 15,
    description: "Single Sign-On is configured and enabled",
    recommendation: hasSSOEnabled ? undefined : "Configure SAML or OAuth SSO for centralized authentication",
  });

  // 2. MFA Enforcement
  const { data: sessionPolicy } = await supabase
    .from("session_policies")
    .select("enforce_mfa")
    .eq("organization_id", organizationId)
    .single();

  const mfaEnforced = sessionPolicy?.enforce_mfa ?? false;
  checks.push({
    name: "MFA Enforcement",
    category: "access_control",
    status: mfaEnforced ? "pass" : "warning",
    weight: 15,
    description: "Multi-factor authentication is enforced for all users",
    recommendation: mfaEnforced ? undefined : "Enable MFA enforcement in session policies",
  });

  // 3. IP Whitelist
  const { data: ipRules } = await supabase
    .from("ip_whitelist")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("enabled", true);

  const hasIPWhitelist = (ipRules?.length ?? 0) > 0;
  checks.push({
    name: "IP Whitelisting",
    category: "security",
    status: hasIPWhitelist ? "pass" : "warning",
    weight: 10,
    description: "IP access restrictions are configured",
    recommendation: hasIPWhitelist ? undefined : "Add trusted IP ranges to restrict access",
  });

  // 4. Audit Logging
  const { count: auditCount } = await supabase
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  const hasAuditLogs = (auditCount ?? 0) > 0;
  checks.push({
    name: "Audit Logging",
    category: "audit",
    status: hasAuditLogs ? "pass" : "fail",
    weight: 15,
    description: "Audit logging is active and recording events",
    recommendation: hasAuditLogs ? undefined : "Ensure audit logging is enabled for your organization",
  });

  // 5. Data Retention Policy
  const { data: retentionPolicies } = await supabase
    .from("data_retention_policies")
    .select("id")
    .eq("organization_id", organizationId);

  const hasRetentionPolicy = (retentionPolicies?.length ?? 0) > 0;
  checks.push({
    name: "Data Retention Policy",
    category: "data_protection",
    status: hasRetentionPolicy ? "pass" : "warning",
    weight: 10,
    description: "Data retention policies are defined",
    recommendation: hasRetentionPolicy ? undefined : "Configure data retention policies for compliance",
  });

  // 6. Session Policy
  const hasSessionPolicy = sessionPolicy !== null;
  checks.push({
    name: "Session Management",
    category: "security",
    status: hasSessionPolicy ? "pass" : "warning",
    weight: 10,
    description: "Session timeout and management policies are configured",
    recommendation: hasSessionPolicy ? undefined : "Configure session timeout policies",
  });

  // 7. RBAC Configuration
  const { data: roles } = await supabase
    .from("roles")
    .select("id")
    .eq("organization_id", organizationId);

  const hasCustomRoles = (roles?.length ?? 0) > 0;
  checks.push({
    name: "Role-Based Access Control",
    category: "access_control",
    status: hasCustomRoles ? "pass" : "warning",
    weight: 10,
    description: "Custom roles and permissions are configured",
    recommendation: hasCustomRoles ? undefined : "Define custom roles for granular access control",
  });

  // 8. Compliance Attestations
  const { data: attestations } = await supabase
    .from("compliance_attestations")
    .select("id, status")
    .eq("organization_id", organizationId);

  const hasActiveAttestations = attestations?.some(
    (a) => a.status === "completed" || a.status === "in_progress"
  ) ?? false;
  checks.push({
    name: "Compliance Attestations",
    category: "compliance",
    status: hasActiveAttestations ? "pass" : "warning",
    weight: 5,
    description: "Compliance attestations are on file",
    recommendation: hasActiveAttestations
      ? undefined
      : "Upload compliance certifications (SOC 2, HIPAA BAA, etc.)",
  });

  // 9. Encryption at Rest (always passes — Supabase encrypts at rest)
  checks.push({
    name: "Encryption at Rest",
    category: "data_protection",
    status: "pass",
    weight: 5,
    description: "Data is encrypted at rest via Supabase infrastructure",
  });

  // 10. Encryption in Transit (always passes — HTTPS enforced)
  checks.push({
    name: "Encryption in Transit",
    category: "data_protection",
    status: "pass",
    weight: 5,
    description: "All data in transit is encrypted via TLS/HTTPS",
  });

  // Calculate scores
  const categoryScores: ComplianceScore["category_scores"] = {};
  let totalWeight = 0;
  let earnedWeight = 0;

  for (const check of checks) {
    const cat = check.category;
    if (!categoryScores[cat]) {
      categoryScores[cat] = { score: 0, total: 0, checks: [] };
    }
    categoryScores[cat].total += check.weight;
    categoryScores[cat].checks.push(check);

    totalWeight += check.weight;
    if (check.status === "pass") {
      earnedWeight += check.weight;
      categoryScores[cat].score += check.weight;
    } else if (check.status === "warning") {
      earnedWeight += check.weight * 0.5;
      categoryScores[cat].score += check.weight * 0.5;
    }
  }

  const overallScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  return {
    overall_score: overallScore,
    category_scores: categoryScores,
    checks,
    assessed_at: new Date().toISOString(),
  };
}
