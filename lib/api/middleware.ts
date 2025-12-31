import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createHash } from "crypto";
import { gateFeature } from "@/lib/features/gate";
import { trackAPICall } from "@/lib/billing/metering";

export interface APIKeyValidation {
  valid: boolean;
  apiKeyId?: string;
  organizationId?: string;
  userId?: string;
  scopes?: string[];
  rateLimitPerMinute?: number;
  error?: string;
}

export interface APIContext {
  apiKeyId: string;
  organizationId: string;
  userId: string;
  scopes: string[];
  requestId: string;
  startTime: number;
}

/**
 * Hash an API key for secure storage/lookup
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Generate a new API key
 */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const prefix = "pk_live_";
  const randomPart = Array.from({ length: 32 }, () =>
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(
      Math.floor(Math.random() * 62)
    )
  ).join("");

  const key = prefix + randomPart;
  const hash = hashApiKey(key);

  return { key, prefix: key.substring(0, 12), hash };
}

/**
 * Extract API key from request headers
 */
export function extractApiKey(req: NextRequest): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = req.headers.get("x-api-key");
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Validate an API key
 */
export async function validateApiKey(key: string): Promise<APIKeyValidation> {
  const supabase = await createClient();
  const keyHash = hashApiKey(key);

  const { data, error } = await supabase.rpc("validate_api_key", {
    p_key_hash: keyHash,
  });

  if (error) {
    console.error("[API] Error validating key:", error);
    return { valid: false, error: "Validation error" };
  }

  const result = data?.[0];

  if (!result?.is_valid) {
    return { valid: false, error: result?.error_message || "Invalid API key" };
  }

  return {
    valid: true,
    apiKeyId: result.api_key_id,
    organizationId: result.organization_id,
    userId: result.user_id,
    scopes: result.scopes || [],
    rateLimitPerMinute: result.rate_limit_per_minute,
  };
}

/**
 * Check if API key has required scope
 */
export function hasScope(scopes: string[], required: string): boolean {
  // Check exact match
  if (scopes.includes(required)) return true;

  // Check wildcard (e.g., "chat:*" matches "chat:read")
  const [category] = required.split(":");
  if (scopes.includes(`${category}:*`)) return true;

  // Check admin scope
  if (scopes.includes("admin:*")) return true;

  return false;
}

/**
 * Log API usage
 */
export async function logApiUsage(
  apiKeyId: string,
  organizationId: string,
  endpoint: string,
  method: string,
  status: number,
  responseTimeMs: number,
  options?: {
    tokensUsed?: number;
    costUsd?: number;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
  }
): Promise<void> {
  const supabase = await createClient();

  await supabase.rpc("log_api_usage", {
    p_api_key_id: apiKeyId,
    p_org_id: organizationId,
    p_endpoint: endpoint,
    p_method: method,
    p_status: status,
    p_response_time_ms: responseTimeMs,
    p_tokens_used: options?.tokensUsed || 0,
    p_cost_usd: options?.costUsd || 0,
    p_ip_address: options?.ipAddress,
    p_user_agent: options?.userAgent,
    p_request_id: options?.requestId,
  });

  // Also track in billing meters
  await trackAPICall(organizationId);
}

/**
 * API authentication middleware
 */
export async function withApiAuth(
  req: NextRequest,
  handler: (req: NextRequest, context: APIContext) => Promise<Response>,
  options?: {
    requiredScopes?: string[];
  }
): Promise<Response> {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  // Extract API key
  const apiKey = extractApiKey(req);
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Missing API key",
        code: "MISSING_API_KEY",
        message: "Provide API key via Authorization header or X-API-Key",
      },
      { status: 401 }
    );
  }

  // Validate API key
  const validation = await validateApiKey(apiKey);
  if (!validation.valid) {
    return NextResponse.json(
      {
        error: "Invalid API key",
        code: "INVALID_API_KEY",
        message: validation.error,
      },
      { status: 401 }
    );
  }

  // Check feature gate for API access
  const gate = await gateFeature("api_access", validation.organizationId);
  if (!gate.allowed) {
    return NextResponse.json(
      {
        error: "API access not available",
        code: "FEATURE_GATED",
        message: gate.reason,
        upgrade: gate.upgrade,
      },
      { status: 403 }
    );
  }

  // Check required scopes
  if (options?.requiredScopes) {
    for (const scope of options.requiredScopes) {
      if (!hasScope(validation.scopes!, scope)) {
        return NextResponse.json(
          {
            error: "Insufficient permissions",
            code: "MISSING_SCOPE",
            message: `API key missing required scope: ${scope}`,
            required: scope,
          },
          { status: 403 }
        );
      }
    }
  }

  // Create context
  const context: APIContext = {
    apiKeyId: validation.apiKeyId!,
    organizationId: validation.organizationId!,
    userId: validation.userId!,
    scopes: validation.scopes!,
    requestId,
    startTime,
  };

  // Execute handler
  try {
    const response = await handler(req, context);

    // Log usage
    await logApiUsage(
      context.apiKeyId,
      context.organizationId,
      new URL(req.url).pathname,
      req.method,
      response.status,
      Date.now() - startTime,
      {
        ipAddress: req.headers.get("x-forwarded-for") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
        requestId,
      }
    );

    return response;
  } catch (error) {
    // Log error
    await logApiUsage(
      context.apiKeyId,
      context.organizationId,
      new URL(req.url).pathname,
      req.method,
      500,
      Date.now() - startTime,
      { requestId }
    );

    console.error("[API] Handler error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        request_id: requestId,
      },
      { status: 500 }
    );
  }
}

/**
 * Create rate-limited response
 */
export function rateLimitResponse(retryAfter: number): Response {
  return NextResponse.json(
    {
      error: "Rate limit exceeded",
      code: "RATE_LIMITED",
      message: "Too many requests. Please slow down.",
      retry_after: retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
      },
    }
  );
}
