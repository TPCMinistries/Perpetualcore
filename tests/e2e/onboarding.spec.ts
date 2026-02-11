import { test, expect } from "@playwright/test";

test.describe("Onboarding Flow", () => {
  test("signup page loads with registration form", async ({ page }) => {
    await page.goto("/signup");

    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });

  test("signup page has password field", async ({ page }) => {
    await page.goto("/signup");

    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
  });

  test("unauthenticated users cannot access onboarding wizard", async ({ page }) => {
    await page.goto("/dashboard/onboarding");

    // Should redirect to login
    await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(login|auth)/);
  });

  test("getting-started page requires auth", async ({ page }) => {
    await page.goto("/dashboard/getting-started");

    await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(login|auth)/);
  });
});

test.describe("Public Marketing Pages", () => {
  test("homepage has call-to-action", async ({ page }) => {
    await page.goto("/");

    const ctaButtons = page.locator(
      'a:has-text("Get Started"), a:has-text("Start"), a:has-text("Try"), button:has-text("Get Started")'
    );

    const count = await ctaButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test("homepage has navigation", async ({ page }) => {
    await page.goto("/");

    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible({ timeout: 10000 });
  });
});
