import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: CheckResult;
    memory: CheckResult;
    environment: CheckResult;
  };
}

interface CheckResult {
  status: "pass" | "fail" | "warn";
  message?: string;
  duration_ms?: number;
}

// Track server start time for uptime calculation
const serverStartTime = Date.now();

/**
 * GET /api/health - Health check endpoint
 * Returns the health status of the application and its dependencies.
 *
 * Response codes:
 * - 200: All systems operational
 * - 503: One or more critical services are down
 */
export async function GET() {
  const startTime = performance.now();

  const checks = {
    database: await checkDatabase(),
    memory: checkMemory(),
    environment: checkEnvironment(),
  };

  // Determine overall status
  const hasFailure = Object.values(checks).some((c) => c.status === "fail");
  const hasWarning = Object.values(checks).some((c) => c.status === "warn");

  const overallStatus: HealthStatus["status"] = hasFailure
    ? "unhealthy"
    : hasWarning
    ? "degraded"
    : "healthy";

  const response: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "unknown",
    uptime: Math.floor((Date.now() - serverStartTime) / 1000),
    checks,
  };

  // Return appropriate status code
  const statusCode = overallStatus === "unhealthy" ? 503 : 200;

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<CheckResult> {
  const startTime = performance.now();

  try {
    const supabase = await createClient();

    // Simple query to check database connectivity
    const { error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .maybeSingle();

    const duration = Math.round(performance.now() - startTime);

    if (error) {
      // Permission errors are OK - means DB is reachable but auth failed
      if (error.code === "PGRST301" || error.message.includes("permission")) {
        return {
          status: "pass",
          message: "Database reachable (auth check)",
          duration_ms: duration,
        };
      }

      return {
        status: "fail",
        message: error.message,
        duration_ms: duration,
      };
    }

    // Warn if query is slow (> 500ms)
    if (duration > 500) {
      return {
        status: "warn",
        message: "Database slow",
        duration_ms: duration,
      };
    }

    return {
      status: "pass",
      message: "Database operational",
      duration_ms: duration,
    };
  } catch (error) {
    return {
      status: "fail",
      message: error instanceof Error ? error.message : "Unknown database error",
      duration_ms: Math.round(performance.now() - startTime),
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): CheckResult {
  if (typeof process.memoryUsage !== "function") {
    return {
      status: "pass",
      message: "Memory check not available in edge runtime",
    };
  }

  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const usagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

  // Warn if memory usage is high (> 85%)
  if (usagePercent > 85) {
    return {
      status: "warn",
      message: `High memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent}%)`,
    };
  }

  return {
    status: "pass",
    message: `${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent}%)`,
  };
}

/**
 * Check critical environment variables
 */
function checkEnvironment(): CheckResult {
  const criticalEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];

  const missingVars = criticalEnvVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    return {
      status: "fail",
      message: `Missing environment variables: ${missingVars.join(", ")}`,
    };
  }

  // Check optional but important vars
  const optionalVars = ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"];
  const hasAIProvider = optionalVars.some((v) => !!process.env[v]);

  if (!hasAIProvider) {
    return {
      status: "warn",
      message: "No AI provider configured",
    };
  }

  return {
    status: "pass",
    message: "Environment configured",
  };
}

/**
 * HEAD /api/health - Lightweight health check
 * Used by load balancers for simple up/down status
 */
export async function HEAD() {
  try {
    // Quick database ping
    const supabase = await createClient();
    await supabase.from("profiles").select("id").limit(1).maybeSingle();

    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
