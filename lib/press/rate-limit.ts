import type { NextRequest, NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/rate-limit";

const pressMutationLimiter = createRateLimiter({ interval: 60, limit: 10, prefix: "press-mutation" });
const pressJobLimiter = createRateLimiter({ interval: 60, limit: 5, prefix: "press-job" });

async function check(
  limiter: ReturnType<typeof createRateLimiter>,
  request: NextRequest,
  userId: string,
): Promise<NextResponse | null> {
  const result = await limiter.check(request, userId);
  return result.success ? null : result.response ?? null;
}

export function checkPressMutationRateLimit(request: NextRequest, userId: string) {
  return check(pressMutationLimiter, request, userId);
}

export function checkPressJobRateLimit(request: NextRequest, userId: string) {
  return check(pressJobLimiter, request, userId);
}
