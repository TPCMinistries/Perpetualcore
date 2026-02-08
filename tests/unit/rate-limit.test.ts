import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock Upstash modules before importing rate-limit
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: vi.fn(),
}));
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(),
}));

// Import after mocking
import { createRateLimiter, checkRateLimit } from "@/lib/rate-limit";

function makeRequest(ip = "127.0.0.1"): NextRequest {
  return new NextRequest("http://localhost:3000/api/test", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("Rate Limiter (in-memory fallback)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows requests within limit", async () => {
    const limiter = createRateLimiter({ interval: 60, limit: 5, prefix: "test" });
    const req = makeRequest();

    const result = await limiter.check(req);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests exceeding limit", async () => {
    const limiter = createRateLimiter({ interval: 60, limit: 2, prefix: "block-test" });
    const req = makeRequest("10.0.0.1");

    await limiter.check(req);
    await limiter.check(req);
    const result = await limiter.check(req);

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.response).toBeDefined();
    expect(result.response!.status).toBe(429);
  });

  it("returns correct rate limit headers on 429", async () => {
    const limiter = createRateLimiter({ interval: 60, limit: 1, prefix: "header-test" });
    const req = makeRequest("10.0.0.2");

    await limiter.check(req);
    const result = await limiter.check(req);

    expect(result.response!.headers.get("X-RateLimit-Limit")).toBe("1");
    expect(result.response!.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(result.response!.headers.get("Retry-After")).toBeTruthy();
  });

  it("separates rate limits by IP", async () => {
    const limiter = createRateLimiter({ interval: 60, limit: 1, prefix: "ip-test" });

    const req1 = makeRequest("1.1.1.1");
    const req2 = makeRequest("2.2.2.2");

    const result1 = await limiter.check(req1);
    const result2 = await limiter.check(req2);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });

  it("separates rate limits by user ID", async () => {
    const limiter = createRateLimiter({ interval: 60, limit: 1, prefix: "user-test" });
    const req = makeRequest("3.3.3.3");

    const result1 = await limiter.check(req, "user-a");
    const result2 = await limiter.check(req, "user-b");

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });

  it("checkRateLimit returns null when allowed", async () => {
    const limiter = createRateLimiter({ interval: 60, limit: 10, prefix: "helper-test" });
    const req = makeRequest("4.4.4.4");

    const response = await checkRateLimit(req, limiter);
    expect(response).toBeNull();
  });

  it("checkRateLimit returns 429 response when blocked", async () => {
    const limiter = createRateLimiter({ interval: 60, limit: 1, prefix: "helper-block" });
    const req = makeRequest("5.5.5.5");

    await checkRateLimit(req, limiter);
    const response = await checkRateLimit(req, limiter);

    expect(response).not.toBeNull();
    expect(response!.status).toBe(429);
  });

  it("addHeaders sets rate limit headers on response", async () => {
    const limiter = createRateLimiter({ interval: 60, limit: 10, prefix: "addheader" });
    const req = makeRequest("6.6.6.6");

    const result = await limiter.check(req);
    const response = new (await import("next/server")).NextResponse();
    limiter.addHeaders(response, result);

    expect(response.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(response.headers.get("X-RateLimit-Remaining")).toBeTruthy();
  });
});
