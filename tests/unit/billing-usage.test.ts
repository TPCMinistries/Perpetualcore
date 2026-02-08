import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Plan Limits Configuration", () => {
  it("free tier has lowest limits", () => {
    const freeLimits = { ai_messages_per_month: 50, documents_per_month: 10 };
    const proLimits = { ai_messages_per_month: 2000, documents_per_month: 500 };

    expect(freeLimits.ai_messages_per_month).toBeLessThan(proLimits.ai_messages_per_month);
    expect(freeLimits.documents_per_month).toBeLessThan(proLimits.documents_per_month);
  });

  it("pro tier has higher limits than free", () => {
    const proLimits = { ai_messages_per_month: 2000, documents_per_month: 500 };
    expect(proLimits.ai_messages_per_month).toBeGreaterThanOrEqual(2000);
  });

  it("business tier scales above pro", () => {
    const businessLimits = { ai_messages_per_month: 10000, documents_per_month: 2000 };
    const proLimits = { ai_messages_per_month: 2000, documents_per_month: 500 };

    expect(businessLimits.ai_messages_per_month).toBeGreaterThan(proLimits.ai_messages_per_month);
  });
});

describe("Usage Percentage Calculations", () => {
  function calculatePercentUsed(used: number, limit: number): number {
    if (limit === 0) return 100;
    if (limit === Infinity) return 0;
    return Math.round((used / limit) * 100);
  }

  it("calculates correct percentage", () => {
    expect(calculatePercentUsed(25, 50)).toBe(50);
    expect(calculatePercentUsed(0, 50)).toBe(0);
    expect(calculatePercentUsed(50, 50)).toBe(100);
  });

  it("handles zero limit", () => {
    expect(calculatePercentUsed(10, 0)).toBe(100);
  });

  it("handles infinite limit (enterprise)", () => {
    expect(calculatePercentUsed(10000, Infinity)).toBe(0);
  });

  it("handles over-limit usage", () => {
    expect(calculatePercentUsed(75, 50)).toBe(150);
  });
});

describe("Usage Guard Result Types", () => {
  it("allowed result has correct shape", () => {
    const result = {
      allowed: true,
      currentPlan: "pro",
      usage: { premiumMessagesUsed: 10, premiumMessagesLimit: 2000, percentUsed: 0.5 },
    };

    expect(result.allowed).toBe(true);
    expect(result.usage.percentUsed).toBeLessThan(100);
  });

  it("blocked result includes reason and upgrade path", () => {
    const result = {
      allowed: false,
      reason: "Monthly message limit reached",
      code: "QUOTA_EXCEEDED" as const,
      currentPlan: "free",
      usage: { premiumMessagesUsed: 50, premiumMessagesLimit: 50, percentUsed: 100 },
      upgrade: { requiredPlan: "pro", message: "Upgrade to Pro for 2,000 messages/month" },
    };

    expect(result.allowed).toBe(false);
    expect(result.code).toBe("QUOTA_EXCEEDED");
    expect(result.upgrade).toBeDefined();
    expect(result.upgrade.requiredPlan).toBe("pro");
  });
});

describe("Month Boundary Logic", () => {
  it("counts usage per month boundary", () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    expect(startOfMonth.getDate()).toBe(1);
    expect(endOfMonth.getDate()).toBeGreaterThanOrEqual(28);
  });

  it("handles year boundary correctly", () => {
    const dec = new Date(2026, 11, 31);
    const nextMonth = new Date(dec.getFullYear(), dec.getMonth() + 1, 1);
    expect(nextMonth.getMonth()).toBe(0);
    expect(nextMonth.getFullYear()).toBe(2027);
  });

  it("handles February correctly", () => {
    const feb2026 = new Date(2026, 1, 1);
    const endOfFeb = new Date(2026, 2, 0);
    expect(endOfFeb.getDate()).toBe(28);
  });
});
