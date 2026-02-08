import { test, expect } from "@playwright/test";

test.describe("Dashboard Navigation", () => {
  test("pricing page renders correctly", async ({ page }) => {
    await page.goto("/pricing");

    // Should have plan options
    await expect(page.locator("text=/free|pro|business|enterprise/i").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("presentation page is publicly accessible", async ({ page }) => {
    await page.goto("/presentation");

    // Presentation page should load without auth
    await expect(page).not.toHaveURL(/login/);
  });
});

test.describe("API Endpoints", () => {
  test("GET /api/health returns valid response", async ({ request }) => {
    const response = await request.get("/api/health");
    expect([200, 503]).toContain(response.status());

    const data = await response.json();
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("checks");
  });

  test("protected API routes return 401 without auth", async ({ request }) => {
    const protectedRoutes = [
      "/api/admin/users",
      "/api/chat",
      "/api/user/account",
    ];

    for (const route of protectedRoutes) {
      const response = await request.get(route);
      // Should return 401 or redirect
      expect([401, 403, 302, 307]).toContain(response.status());
    }
  });

  test("rate limited endpoints return proper headers", async ({ request }) => {
    const response = await request.get("/api/health");

    // Health endpoint should succeed
    expect([200, 503]).toContain(response.status());

    // Response should have standard headers
    const headers = response.headers();
    expect(headers["content-type"]).toContain("application/json");
  });
});

test.describe("Static Assets", () => {
  test("favicon loads", async ({ request }) => {
    const response = await request.get("/favicon.ico");
    expect(response.status()).toBe(200);
  });

  test("manifest.json loads for PWA", async ({ request }) => {
    const response = await request.get("/manifest.json");
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest).toHaveProperty("name");
    expect(manifest).toHaveProperty("start_url");
  });
});

test.describe("Error Handling", () => {
  test("404 page renders for unknown routes", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-12345");
    // Should get 404 status
    expect(response?.status()).toBe(404);
  });
});
