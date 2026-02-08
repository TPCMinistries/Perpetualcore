import { test, expect } from "@playwright/test";

test.describe("Billing & Pricing", () => {
  test("pricing page shows all plan tiers", async ({ page }) => {
    await page.goto("/pricing");

    // Should display plan names
    const content = await page.textContent("body");
    const contentLower = content?.toLowerCase() || "";

    // At minimum should have free and pro tiers
    expect(contentLower).toMatch(/free|starter/);
    expect(contentLower).toMatch(/pro|professional/);
  });

  test("pricing page has CTA buttons", async ({ page }) => {
    await page.goto("/pricing");

    // Should have at least one call-to-action button
    const ctaButtons = page.locator(
      'a:has-text("Get Started"), a:has-text("Start"), button:has-text("Get Started"), button:has-text("Start"), a:has-text("Subscribe"), button:has-text("Subscribe"), a:has-text("Try"), button:has-text("Try")'
    );

    const count = await ctaButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test("stripe invoice API returns 401 without auth", async ({ request }) => {
    const response = await request.get("/api/stripe/invoices");
    expect([401, 403]).toContain(response.status());
  });
});
