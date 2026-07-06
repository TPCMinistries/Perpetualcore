import { test, expect } from "@playwright/test";

test.describe("Protected Dashboard Routes", () => {
  const protectedPages = [
    "/dashboard/home",
    "/dashboard/chat",
    "/dashboard/library",
    "/dashboard/contacts",
    "/dashboard/agents",
    "/dashboard/workflows",
    "/dashboard/settings",
    "/dashboard/voice-memos",
    "/dashboard/meetings",
    "/dashboard/developer",
  ];

  for (const route of protectedPages) {
    test(`${route} redirects to login when unauthenticated`, async ({ page }) => {
      await page.goto(route);

      await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/(login|auth)/);
    });
  }
});

test.describe("Protected API Routes", () => {
  const protectedApis = [
    { method: "GET" as const, path: "/api/admin/revenue" },
    { method: "GET" as const, path: "/api/admin/users" },
    { method: "GET" as const, path: "/api/contacts" },
    { method: "GET" as const, path: "/api/documents" },
    { method: "GET" as const, path: "/api/agents" },
    { method: "GET" as const, path: "/api/skills" },
    { method: "GET" as const, path: "/api/user/account" },
    { method: "GET" as const, path: "/api/stripe/usage" },
    { method: "GET" as const, path: "/api/stripe/limits" },
    { method: "POST" as const, path: "/api/stripe/create-checkout-session" },
  ];

  for (const { method, path } of protectedApis) {
    test(`${method} ${path} returns 401/403 without auth`, async ({ request }) => {
      const response = method === "GET"
        ? await request.get(path)
        : await request.post(path, { data: {} });

      expect([401, 403]).toContain(response.status());
    });
  }
});

test.describe("Cron Endpoints Require CRON_SECRET", () => {
  const cronEndpoints = [
    "/api/cron/billing-sync",
    "/api/cron/sync-usage",
    "/api/cron/usage-alerts",
    "/api/cron/finalize-overages",
    "/api/cron/refresh-tokens",
  ];

  for (const endpoint of cronEndpoints) {
    test(`${endpoint} returns 401 without CRON_SECRET`, async ({ request }) => {
      const response = await request.get(endpoint);

      expect([401, 403]).toContain(response.status());
    });
  }
});

test.describe("Admin Routes Require Admin Access", () => {
  test("admin overview page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard/admin/overview");

    await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(login|auth)/);
  });

  test("admin users page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard/admin/users");

    await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(login|auth)/);
  });

  test("admin usage page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard/admin/usage");

    await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(login|auth)/);
  });
});
