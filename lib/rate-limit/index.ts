/**
 * Rate Limiting Utility
 *
 * Uses Upstash Redis for distributed rate limiting across serverless instances.
 * Falls back to in-memory store when Redis is not configured (development).
 *
 * Usage:
 * ```typescript
 * const limiter = createRateLimiter({ interval: 60, limit: 10 });
 *
 * export async function POST(req: NextRequest) {
 *   const rateLimitResult = await limiter.check(req);
 *   if (!rateLimitResult.success) {
 *     return rateLimitResult.response;
 *   }
 *   // ... handle request
 * }
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitConfig {
  /** Time window in seconds */
  interval: number;
  /** Maximum requests per interval */
  limit: number;
  /** Unique key prefix for this limiter */
  prefix?: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  response?: NextResponse;
}

// Initialize Redis client if env vars are set
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const useRedis = !!redis;

// In-memory fallback for development without Redis
const rateLimitStore = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60 * 1000;
let lastCleanup = Date.now();

function cleanupStore() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get identifier for rate limiting
 * Uses user ID if authenticated, otherwise falls back to IP
 */
function getIdentifier(req: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

  return `ip:${ip}`;
}

/**
 * Create a rate limiter with the specified configuration.
 * Uses Upstash Redis when available, in-memory fallback otherwise.
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { interval, limit, prefix = "rate" } = config;
  const intervalMs = interval * 1000;

  // Create Upstash rate limiter if Redis is available
  const upstashLimiter =
    redis
      ? new Ratelimit({
          redis,
          limiter: Ratelimit.fixedWindow(limit, `${interval} s`),
          prefix: `ratelimit:${prefix}`,
          analytics: true,
        })
      : null;

  return {
    /**
     * Check if the request should be rate limited
     */
    async check(req: NextRequest, userId?: string): Promise<RateLimitResult> {
      const identifier = getIdentifier(req, userId);
      const key = `${prefix}:${identifier}`;

      // Use Upstash Redis rate limiter
      if (upstashLimiter) {
        const result = await upstashLimiter.limit(key);
        const reset = Math.ceil((result.reset - Date.now()) / 1000);

        if (!result.success) {
          const response = NextResponse.json(
            {
              error: "Too many requests",
              message: `Rate limit exceeded. Please try again in ${reset} seconds.`,
              retryAfter: reset,
            },
            {
              status: 429,
              headers: {
                "X-RateLimit-Limit": result.limit.toString(),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": result.reset.toString(),
                "Retry-After": reset.toString(),
              },
            }
          );
          return { success: false, remaining: 0, reset, response };
        }

        return { success: true, remaining: result.remaining, reset };
      }

      // Fallback: in-memory rate limiting
      cleanupStore();
      const now = Date.now();

      let entry = rateLimitStore.get(key);
      if (!entry || entry.resetAt < now) {
        entry = { count: 0, resetAt: now + intervalMs };
      }

      entry.count++;
      rateLimitStore.set(key, entry);

      const remaining = Math.max(0, limit - entry.count);
      const reset = Math.ceil((entry.resetAt - now) / 1000);

      if (entry.count > limit) {
        const response = NextResponse.json(
          {
            error: "Too many requests",
            message: `Rate limit exceeded. Please try again in ${reset} seconds.`,
            retryAfter: reset,
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": entry.resetAt.toString(),
              "Retry-After": reset.toString(),
            },
          }
        );
        return { success: false, remaining: 0, reset, response };
      }

      return { success: true, remaining, reset };
    },

    /**
     * Add rate limit headers to a response
     */
    addHeaders(response: NextResponse, result: RateLimitResult): NextResponse {
      response.headers.set("X-RateLimit-Limit", limit.toString());
      response.headers.set(
        "X-RateLimit-Remaining",
        result.remaining.toString()
      );
      response.headers.set(
        "X-RateLimit-Reset",
        (Date.now() + result.reset * 1000).toString()
      );
      return response;
    },
  };
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  /** General API - 100 requests per minute */
  api: createRateLimiter({ interval: 60, limit: 100, prefix: "api" }),

  /** Chat API - 30 requests per minute (expensive operations) */
  chat: createRateLimiter({ interval: 60, limit: 30, prefix: "chat" }),

  /** Auth API - 10 requests per minute (prevent brute force) */
  auth: createRateLimiter({ interval: 60, limit: 10, prefix: "auth" }),

  /** Image generation - 10 requests per minute */
  imageGen: createRateLimiter({ interval: 60, limit: 10, prefix: "imggen" }),

  /** Search API - 60 requests per minute */
  search: createRateLimiter({ interval: 60, limit: 60, prefix: "search" }),

  /** Export API - 5 requests per minute */
  export: createRateLimiter({ interval: 60, limit: 5, prefix: "export" }),

  /** Webhook endpoints - 1000 requests per minute */
  webhook: createRateLimiter({ interval: 60, limit: 1000, prefix: "webhook" }),

  /** Strict rate limit for sensitive operations - 5 per minute */
  strict: createRateLimiter({ interval: 60, limit: 5, prefix: "strict" }),
};

/**
 * Helper function to apply rate limiting to an API route
 */
export async function checkRateLimit(
  req: NextRequest,
  limiter: ReturnType<typeof createRateLimiter>,
  userId?: string
): Promise<NextResponse | null> {
  const result = await limiter.check(req, userId);
  if (!result.success) {
    return result.response!;
  }
  return null;
}

/** Whether Redis-backed rate limiting is active */
export const isRedisRateLimiting = useRedis;

export default rateLimiters;
