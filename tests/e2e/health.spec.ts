import { test, expect } from "@playwright/test";

test.describe("Health Check Endpoint", () => {
  test("GET /api/health returns 200 and health status", async ({ request }) => {
    const response = await request.get("/api/health");

    // Should return 200 (or 503 if services are down)
    expect([200, 503]).toContain(response.status());

    const data = await response.json();

    // Check response structure
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("timestamp");
    expect(data).toHaveProperty("version");
    expect(data).toHaveProperty("uptime");
    expect(data).toHaveProperty("checks");

    // Status should be one of the valid values
    expect(["healthy", "degraded", "unhealthy"]).toContain(data.status);

    // Checks should have the expected structure
    expect(data.checks).toHaveProperty("database");
    expect(data.checks).toHaveProperty("memory");
    expect(data.checks).toHaveProperty("environment");

    // Each check should have a status
    expect(["pass", "fail", "warn"]).toContain(data.checks.database.status);
    expect(["pass", "fail", "warn"]).toContain(data.checks.memory.status);
    expect(["pass", "fail", "warn"]).toContain(data.checks.environment.status);
  });

  test("HEAD /api/health returns 200 for quick check", async ({ request }) => {
    const response = await request.head("/api/health");

    // Should return 200 or 503
    expect([200, 503]).toContain(response.status());
  });

  test("Health endpoint has no-cache headers", async ({ request }) => {
    const response = await request.get("/api/health");

    const cacheControl = response.headers()["cache-control"];
    expect(cacheControl).toContain("no-store");
  });
});

test.describe("Public Pages Load", () => {
  test("Homepage loads successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Perpetual/i);
  });

  test("Pricing page loads successfully", async ({ page }) => {
    await page.goto("/pricing");
    // Should have pricing content
    await expect(page.locator("text=pricing").first()).toBeVisible({ timeout: 10000 });
  });

  test("Login page loads successfully", async ({ page }) => {
    await page.goto("/login");
    // Should have a sign in form
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Security Headers", () => {
  test("Response includes security headers", async ({ request }) => {
    const response = await request.get("/");

    const headers = response.headers();

    // Check for security headers
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(headers["referrer-policy"]).toBeTruthy();
  });
});
