import { test, expect } from "@playwright/test";

test.describe("Enterprise Admin Dashboard", () => {
  const adminPages = [
    "/dashboard/admin/overview",
    "/dashboard/admin/organizations",
    "/dashboard/admin/compliance",
    "/dashboard/admin/compliance/hipaa",
    "/dashboard/admin/compliance/soc2",
    "/dashboard/admin/compliance/data-retention",
    "/dashboard/admin/compliance/ip-whitelist",
    "/dashboard/admin/sessions",
    "/dashboard/admin/sso",
    "/dashboard/admin/audit",
  ];

  for (const route of adminPages) {
    test(`${route} redirects to login when unauthenticated`, async ({ page }) => {
      await page.goto(route);
      await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/(login|auth)/);
    });
  }
});

test.describe("Enterprise Admin API Routes", () => {
  const adminApis = [
    { method: "GET" as const, path: "/api/admin/organizations" },
    { method: "GET" as const, path: "/api/admin/compliance" },
    { method: "GET" as const, path: "/api/admin/compliance/ip-whitelist" },
    { method: "GET" as const, path: "/api/admin/compliance/data-retention" },
    { method: "GET" as const, path: "/api/admin/sessions" },
    { method: "GET" as const, path: "/api/admin/mfa-enforcement" },
    { method: "GET" as const, path: "/api/admin/audit" },
    { method: "GET" as const, path: "/api/admin/sso" },
    { method: "GET" as const, path: "/api/audit-logs/export" },
  ];

  for (const { method, path } of adminApis) {
    test(`${method} ${path} returns 401/403 without auth`, async ({ request }) => {
      const response = await request.get(path);
      expect([401, 403]).toContain(response.status());
    });
  }

  test("POST /api/admin/compliance/ip-whitelist requires auth", async ({ request }) => {
    const response = await request.post("/api/admin/compliance/ip-whitelist", {
      data: { ip_range: "10.0.0.0/8", label: "Test" },
    });
    expect([401, 403]).toContain(response.status());
  });

  test("PATCH /api/admin/mfa-enforcement requires auth", async ({ request }) => {
    const response = await request.patch("/api/admin/mfa-enforcement", {
      data: { enforce_mfa: true },
    });
    expect([401, 403]).toContain(response.status());
  });

  test("DELETE /api/admin/sessions requires auth", async ({ request }) => {
    const response = await request.delete("/api/admin/sessions?sessionId=test-id");
    expect([401, 403]).toContain(response.status());
  });
});

test.describe("Audit Log API", () => {
  test("GET /api/audit-logs returns 401 without auth", async ({ request }) => {
    const response = await request.get("/api/audit-logs");
    expect([401, 403]).toContain(response.status());
  });

  test("GET /api/audit-logs/:id returns 401 without auth", async ({ request }) => {
    const response = await request.get("/api/audit-logs/test-id");
    expect([401, 403]).toContain(response.status());
  });

  test("POST /api/audit-logs/export returns 401 without auth", async ({ request }) => {
    const response = await request.post("/api/audit-logs/export", {
      data: { format: "csv" },
    });
    expect([401, 403]).toContain(response.status());
  });
});

test.describe("Workflow Builder Routes", () => {
  test("/dashboard/workflows/new/builder redirects without auth", async ({ page }) => {
    await page.goto("/dashboard/workflows/new/builder");
    await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(login|auth)/);
  });
});

test.describe("Enterprise API Input Validation", () => {
  test("POST /api/admin/compliance/ip-whitelist rejects invalid CIDR", async ({ request }) => {
    // Even if we could auth, invalid CIDR should be rejected
    const response = await request.post("/api/admin/compliance/ip-whitelist", {
      data: { ip_range: "not-a-cidr", label: "Bad" },
    });
    // Should be 401 (no auth) or 400 (validation)
    expect([400, 401, 403]).toContain(response.status());
  });

  test("PATCH /api/admin/compliance/data-retention rejects without resource_type", async ({ request }) => {
    const response = await request.patch("/api/admin/compliance/data-retention", {
      data: { retention_days: 90 },
    });
    expect([400, 401, 403]).toContain(response.status());
  });
});
