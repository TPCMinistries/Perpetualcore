/**
 * Browser Automation Service
 * Main entry point for headless browser operations via Browserless.io.
 * Handles URL validation, quota checking, browser action execution, and logging.
 */

import { ToolExecutionContext } from "@/lib/ai/tools/schema";
import { createAdminClient } from "@/lib/supabase/server";
import {
  BrowserAction,
  BrowserResult,
  BrowserQuotaCheckResult,
  BLOCKED_IP_PATTERNS,
  BLOCKED_SCHEMES,
  PRO_BROWSER_DAILY_LIMIT,
  FREE_BROWSER_DAILY_LIMIT,
} from "./types";
import { executeBrowserAction as executeBrowserActionClient } from "./browserless-client";

/**
 * Execute a browser automation action.
 * Validates the target URL, checks user quota, runs the action, and logs the session.
 *
 * @param action - The browser action to perform
 * @param context - Tool execution context with user/org info
 * @returns BrowserResult with action-specific output
 */
export async function executeBrowserAction(
  action: BrowserAction,
  context: ToolExecutionContext
): Promise<BrowserResult> {
  const supabase = createAdminClient();
  const startTime = Date.now();

  // Validate the target URL
  const urlValidation = validateUrl(action.url);
  if (!urlValidation.valid) {
    const result: BrowserResult = {
      success: false,
      data: "",
      url: action.url,
      timing: 0,
      errorMessage: urlValidation.reason,
    };
    await logBrowserSession(supabase, context, action, result);
    return result;
  }

  // Check user quota
  const quota = await checkBrowserQuota(context.userId, supabase);
  if (!quota.allowed) {
    const result: BrowserResult = {
      success: false,
      data: "",
      url: action.url,
      timing: 0,
      errorMessage: `Daily browser session quota exceeded. Remaining: 0. Resets at ${quota.resetAt.toISOString()}.`,
    };
    await logBrowserSession(supabase, context, action, result);
    return result;
  }

  // Insert a pending session record
  const { data: sessionRecord } = await supabase
    .from("browser_sessions")
    .insert({
      user_id: context.userId,
      organization_id: context.organizationId || null,
      action: action.action,
      url: action.url,
      status: "running",
      metadata: {
        selector: action.selector || null,
        waitFor: action.waitFor || null,
        hasJavascript: !!action.javascript,
        conversationId: context.conversationId || null,
      },
    })
    .select("id")
    .single();

  const sessionId = sessionRecord?.id;

  try {
    // Execute the browser action
    const result = await executeBrowserActionClient(action);

    // Update session record with results
    if (sessionId) {
      await supabase
        .from("browser_sessions")
        .update({
          status: result.success ? "completed" : "failed",
          result_type: getResultType(action.action),
          result_size_bytes: Buffer.byteLength(result.data, "utf-8"),
          timing_ms: result.timing,
          error_message: result.errorMessage || null,
        })
        .eq("id", sessionId);
    }

    return result;
  } catch (error: any) {
    console.error("[BrowserService] Unexpected error:", error);

    const errorResult: BrowserResult = {
      success: false,
      data: "",
      url: action.url,
      timing: Date.now() - startTime,
      errorMessage: error.message || "An unexpected error occurred during browser action",
    };

    if (sessionId) {
      await supabase
        .from("browser_sessions")
        .update({
          status: "failed",
          timing_ms: errorResult.timing,
          error_message: error.message || "Unexpected browser error",
        })
        .eq("id", sessionId);
    }

    return errorResult;
  }
}

/**
 * Validate a URL to ensure it is safe to navigate to.
 * Blocks internal/private IP addresses and non-HTTP schemes to prevent SSRF.
 *
 * @param url - The URL to validate
 * @returns Validation result with reason if invalid
 */
function validateUrl(url: string): { valid: boolean; reason?: string } {
  try {
    const parsed = new URL(url);

    // Block non-HTTP(S) schemes
    const scheme = parsed.protocol.toLowerCase();
    if (BLOCKED_SCHEMES.some((blocked) => scheme.startsWith(blocked))) {
      return { valid: false, reason: `URL scheme "${scheme}" is not allowed. Only HTTP and HTTPS are supported.` };
    }

    if (scheme !== "http:" && scheme !== "https:") {
      return { valid: false, reason: `URL scheme "${scheme}" is not allowed. Only HTTP and HTTPS are supported.` };
    }

    // Block private/internal hostnames and IP addresses
    const hostname = parsed.hostname.toLowerCase();
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { valid: false, reason: "Access to internal/private network addresses is not allowed." };
      }
    }

    // Block empty hostnames
    if (!hostname || hostname.length === 0) {
      return { valid: false, reason: "URL must contain a valid hostname." };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: "Invalid URL format. Please provide a valid HTTP or HTTPS URL." };
  }
}

/**
 * Check whether a user is allowed to perform browser actions based on their daily quota.
 *
 * @param userId - The authenticated user's ID
 * @param supabase - Supabase admin client
 * @returns BrowserQuotaCheckResult indicating if action is allowed
 */
async function checkBrowserQuota(
  userId: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<BrowserQuotaCheckResult> {
  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

  // Count today's browser sessions for this user
  const { count, error } = await supabase
    .from("browser_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", todayStart.toISOString())
    .lt("created_at", tomorrowStart.toISOString());

  if (error) {
    console.error("[BrowserQuota] Error checking quota:", error);
    return { allowed: true, remaining: 1, resetAt: tomorrowStart };
  }

  const dailyCount = count ?? 0;

  // Determine user's plan limit
  let maxDaily = FREE_BROWSER_DAILY_LIMIT;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .single();

    if (profile) {
      const tier = (profile as any).subscription_tier;
      if (tier === "pro" || tier === "enterprise" || tier === "team") {
        maxDaily = PRO_BROWSER_DAILY_LIMIT;
      }
    }
  } catch {
    // Default to free limit
  }

  const remaining = Math.max(0, maxDaily - dailyCount);

  return {
    allowed: remaining > 0,
    remaining,
    resetAt: tomorrowStart,
  };
}

/**
 * Determine the result type string for logging based on the action.
 */
function getResultType(action: string): string {
  switch (action) {
    case "screenshot":
      return "image/png";
    case "pdf":
      return "application/pdf";
    case "scrape":
    case "extract":
      return "text/plain";
    case "click":
    case "navigate":
      return "text/plain";
    default:
      return "unknown";
  }
}

/**
 * Log a browser session to the browser_sessions table.
 * Used for pre-execution failures (quota exceeded, URL validation).
 */
async function logBrowserSession(
  supabase: ReturnType<typeof createAdminClient>,
  context: ToolExecutionContext,
  action: BrowserAction,
  result: BrowserResult
): Promise<void> {
  try {
    await supabase.from("browser_sessions").insert({
      user_id: context.userId,
      organization_id: context.organizationId || null,
      action: action.action,
      url: action.url,
      status: "failed",
      result_type: null,
      result_size_bytes: 0,
      timing_ms: result.timing,
      error_message: result.errorMessage || null,
      metadata: {
        conversationId: context.conversationId || null,
        preExecutionFailure: true,
      },
    });
  } catch (error) {
    console.error("[BrowserService] Error logging session:", error);
  }
}

// Re-export types for convenience
export type { BrowserAction, BrowserResult } from "./types";
