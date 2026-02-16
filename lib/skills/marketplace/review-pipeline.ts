/**
 * Skills Marketplace Review Pipeline
 *
 * Automated security scanning for skill submissions.
 * This is our security moat vs OpenClaw's malware problem.
 * Every skill submitted to the marketplace goes through automated
 * checks before being queued for human review.
 */

import { createAdminClient } from "@/lib/supabase/server";

export interface SecurityScanResult {
  passed: boolean;
  score: number; // 0-100
  checks: SecurityCheck[];
  recommendations: string[];
}

interface SecurityCheck {
  name: string;
  passed: boolean;
  severity: "info" | "warning" | "critical";
  message: string;
}

// Private/internal IP patterns
const PRIVATE_IP_PATTERNS = [
  /192\.168\.\d{1,3}\.\d{1,3}/,
  /10\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
  /172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}/,
  /127\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
  /localhost/i,
  /0\.0\.0\.0/,
  /\[::1\]/,
];

// Common credential patterns
const CREDENTIAL_PATTERNS = [
  /sk_live_[a-zA-Z0-9]{20,}/,
  /sk_test_[a-zA-Z0-9]{20,}/,
  /pk_live_[a-zA-Z0-9]{20,}/,
  /pk_test_[a-zA-Z0-9]{20,}/,
  /ghp_[a-zA-Z0-9]{36,}/,
  /gho_[a-zA-Z0-9]{36,}/,
  /AIza[a-zA-Z0-9_-]{35}/,
  /ya29\.[a-zA-Z0-9_-]+/,
  /xox[baprs]-[a-zA-Z0-9-]+/,
  /Bearer\s+[a-zA-Z0-9._~+\/=-]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /password\s*[:=]\s*["'][^"']{6,}/i,
  /api[_-]?key\s*[:=]\s*["'][^"']{10,}/i,
  /secret[_-]?key\s*[:=]\s*["'][^"']{10,}/i,
  /token\s*[:=]\s*["'][a-zA-Z0-9._~+\/=-]{20,}["']/i,
];

// Dangerous system call patterns
const DANGEROUS_PATTERNS = [
  /\beval\s*\(/,
  /\bexec\s*\(/,
  /\bspawn\s*\(/,
  /\bexecSync\s*\(/,
  /\bexecFile\s*\(/,
  /child_process/,
  /\bFunction\s*\(/,
  /require\s*\(\s*['"]child_process['"]\s*\)/,
  /require\s*\(\s*['"]fs['"]\s*\)/,
  /require\s*\(\s*['"]os['"]\s*\)/,
  /import\s+.*from\s+['"]child_process['"]/,
  /process\.env/,
  /__dirname/,
  /__filename/,
];

/**
 * Recursively extract all string values from a nested object
 */
function extractStringValues(obj: unknown): string[] {
  const values: string[] = [];

  if (typeof obj === "string") {
    values.push(obj);
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      values.push(...extractStringValues(item));
    }
  } else if (obj && typeof obj === "object") {
    for (const value of Object.values(obj)) {
      values.push(...extractStringValues(value));
    }
  }

  return values;
}

/**
 * Extract all URLs from a manifest
 */
function extractUrls(manifest: Record<string, unknown>): string[] {
  const allStrings = extractStringValues(manifest);
  const urlPattern = /https?:\/\/[^\s"'<>]+/gi;
  const urls: string[] = [];

  for (const str of allStrings) {
    const matches = str.match(urlPattern);
    if (matches) {
      urls.push(...matches);
    }
  }

  return [...new Set(urls)];
}

/**
 * Run automated security scan on a skill manifest
 */
export async function scanSkillSecurity(
  skillManifest: Record<string, unknown>
): Promise<SecurityScanResult> {
  const checks: SecurityCheck[] = [];
  const recommendations: string[] = [];
  const allStrings = extractStringValues(skillManifest);
  const allUrls = extractUrls(skillManifest);

  // 1. Domain whitelist check - no internal IPs, localhost, etc.
  {
    let passed = true;
    const flagged: string[] = [];

    for (const url of allUrls) {
      for (const pattern of PRIVATE_IP_PATTERNS) {
        if (pattern.test(url)) {
          passed = false;
          flagged.push(url);
          break;
        }
      }
    }

    checks.push({
      name: "Domain Whitelist",
      passed,
      severity: passed ? "info" : "critical",
      message: passed
        ? "No internal/private IP addresses found"
        : `Found private/internal URLs: ${flagged.join(", ")}`,
    });

    if (!passed) {
      recommendations.push(
        "Remove all references to internal/private IP addresses and localhost. Use publicly accessible HTTPS endpoints."
      );
    }
  }

  // 2. HTTPS enforcement - all external URLs must use HTTPS
  {
    const httpUrls = allUrls.filter(
      (url) => url.startsWith("http://") && !url.includes("localhost")
    );
    const passed = httpUrls.length === 0;

    checks.push({
      name: "HTTPS Enforcement",
      passed,
      severity: passed ? "info" : "warning",
      message: passed
        ? "All external URLs use HTTPS"
        : `Found ${httpUrls.length} URL(s) using insecure HTTP: ${httpUrls.slice(0, 3).join(", ")}`,
    });

    if (!passed) {
      recommendations.push(
        "Upgrade all HTTP URLs to HTTPS for secure communication."
      );
    }
  }

  // 3. Credential exposure check
  {
    let passed = true;
    const flaggedPatterns: string[] = [];

    for (const str of allStrings) {
      for (const pattern of CREDENTIAL_PATTERNS) {
        if (pattern.test(str)) {
          passed = false;
          flaggedPatterns.push(pattern.source.slice(0, 30));
          break;
        }
      }
    }

    checks.push({
      name: "Credential Exposure",
      passed,
      severity: passed ? "info" : "critical",
      message: passed
        ? "No exposed credentials or API keys detected"
        : `Potential credential exposure detected (${[...new Set(flaggedPatterns)].length} pattern(s) matched)`,
    });

    if (!passed) {
      recommendations.push(
        "Remove all hardcoded API keys, tokens, and passwords from the manifest. Use environment variables or credential references instead."
      );
    }
  }

  // 4. Required fields check
  {
    const requiredFields = ["name", "description", "version", "author"];
    const missingFields = requiredFields.filter(
      (field) => !skillManifest[field]
    );
    const passed = missingFields.length === 0;

    checks.push({
      name: "Required Fields",
      passed,
      severity: passed ? "info" : "warning",
      message: passed
        ? "All required fields present (name, description, version, author)"
        : `Missing required fields: ${missingFields.join(", ")}`,
    });

    if (!passed) {
      recommendations.push(
        `Add the missing fields to your manifest: ${missingFields.join(", ")}`
      );
    }
  }

  // 5. Tool parameter validation
  {
    const tools = skillManifest.tools;
    let passed = true;
    const issues: string[] = [];

    if (Array.isArray(tools)) {
      for (const tool of tools) {
        if (typeof tool !== "object" || tool === null) {
          passed = false;
          issues.push("Tool entry is not a valid object");
          continue;
        }

        const t = tool as Record<string, unknown>;

        if (!t.name || typeof t.name !== "string") {
          passed = false;
          issues.push("Tool missing 'name' field");
        }

        if (!t.description || typeof t.description !== "string") {
          passed = false;
          issues.push(`Tool '${t.name || "unknown"}' missing 'description'`);
        }

        if (t.parameters && typeof t.parameters === "object") {
          const params = t.parameters as Record<string, unknown>;
          if (params.type !== "object") {
            passed = false;
            issues.push(
              `Tool '${t.name || "unknown"}' parameters.type should be 'object'`
            );
          }
        }
      }
    } else if (tools !== undefined) {
      passed = false;
      issues.push("'tools' field should be an array");
    }

    checks.push({
      name: "Tool Parameter Validation",
      passed,
      severity: passed ? "info" : "warning",
      message: passed
        ? "All tools have valid parameter definitions"
        : `Tool validation issues: ${issues.slice(0, 3).join("; ")}`,
    });

    if (!passed) {
      recommendations.push(
        "Ensure all tools have a name, description, and properly typed parameters object."
      );
    }
  }

  // 6. Dangerous system calls
  {
    let passed = true;
    const flagged: string[] = [];

    for (const str of allStrings) {
      for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(str)) {
          passed = false;
          flagged.push(pattern.source.replace(/\\b/g, "").slice(0, 20));
          break;
        }
      }
    }

    checks.push({
      name: "Dangerous System Calls",
      passed,
      severity: passed ? "info" : "critical",
      message: passed
        ? "No dangerous system call patterns detected"
        : `Detected dangerous patterns: ${[...new Set(flagged)].join(", ")}`,
    });

    if (!passed) {
      recommendations.push(
        "Remove all references to system-level operations (eval, exec, child_process, direct filesystem access). Skills should only interact through defined HTTP APIs."
      );
    }
  }

  // 7. Rate limiting declaration
  {
    const hasRateLimits =
      skillManifest.rateLimits !== undefined ||
      skillManifest.rate_limits !== undefined ||
      skillManifest.rateLimit !== undefined;

    checks.push({
      name: "Rate Limiting Declaration",
      passed: hasRateLimits,
      severity: hasRateLimits ? "info" : "warning",
      message: hasRateLimits
        ? "Rate limiting configuration declared"
        : "No rate limiting declared. Consider adding rate limits to prevent abuse.",
    });

    if (!hasRateLimits) {
      recommendations.push(
        "Add a 'rateLimits' field to your manifest specifying maximum calls per minute/hour to prevent abuse."
      );
    }
  }

  // Calculate overall score
  const criticalFails = checks.filter(
    (c) => !c.passed && c.severity === "critical"
  ).length;
  const warningFails = checks.filter(
    (c) => !c.passed && c.severity === "warning"
  ).length;
  const totalChecks = checks.length;
  const passedChecks = checks.filter((c) => c.passed).length;

  // Score: start at 100, deduct 30 per critical fail, 10 per warning fail
  let score = Math.max(
    0,
    100 - criticalFails * 30 - warningFails * 10
  );

  // Also factor in pass rate
  const passRate = (passedChecks / totalChecks) * 100;
  score = Math.round((score + passRate) / 2);

  const passed = criticalFails === 0 && score >= 50;

  return {
    passed,
    score,
    checks,
    recommendations,
  };
}

/**
 * Submit a skill for marketplace review.
 * Runs automated security scan and creates a submission record.
 */
export async function submitSkillForReview(
  userId: string,
  skillId: string,
  skillManifest: Record<string, unknown>
): Promise<{ submissionId: string; scanResult: SecurityScanResult }> {
  const supabase = createAdminClient();

  // 1. Run automated security scan
  const scanResult = await scanSkillSecurity(skillManifest);

  // 2. Determine status based on scan
  // If critical issues found, auto-reject. Otherwise pending for human review.
  const status = scanResult.passed ? "pending_review" : "auto_rejected";

  // 3. Store submission with scan results
  const { data: submission, error } = await supabase
    .from("skill_submissions")
    .insert({
      skill_id: skillId,
      submitter_id: userId,
      status,
      skill_manifest: skillManifest,
      security_scan_result: scanResult as unknown as Record<string, unknown>,
      reviewer_notes: scanResult.passed
        ? null
        : `Auto-rejected: ${scanResult.checks
            .filter((c) => !c.passed && c.severity === "critical")
            .map((c) => c.message)
            .join("; ")}`,
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !submission) {
    throw new Error(
      `Failed to create submission record: ${error?.message || "Unknown error"}`
    );
  }

  return {
    submissionId: submission.id,
    scanResult,
  };
}

/**
 * Approve a skill submission (admin action).
 */
export async function approveSubmission(
  submissionId: string,
  reviewerNotes?: string
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("skill_submissions")
    .update({
      status: "approved",
      reviewer_notes: reviewerNotes || "Approved after security review",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) {
    throw new Error(`Failed to approve submission: ${error.message}`);
  }

  // Also update the marketplace item status
  const { data: submission } = await supabase
    .from("skill_submissions")
    .select("skill_id")
    .eq("id", submissionId)
    .single();

  if (submission) {
    await supabase
      .from("marketplace_items")
      .update({ status: "approved" })
      .eq("id", submission.skill_id);
  }
}

/**
 * Reject a skill submission (admin action).
 */
export async function rejectSubmission(
  submissionId: string,
  reviewerNotes: string
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("skill_submissions")
    .update({
      status: "rejected",
      reviewer_notes: reviewerNotes,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) {
    throw new Error(`Failed to reject submission: ${error.message}`);
  }
}
