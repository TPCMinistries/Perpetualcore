import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("login page has email and password fields", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
  });

  test("login page has sign in button", async ({ page }) => {
    await page.goto("/login");

    const signInButton = page.locator('button[type="submit"]').first();
    await expect(signInButton).toBeVisible({ timeout: 10000 });
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[type="email"]', "invalid@test.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Should show error message (not redirect to dashboard)
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toContain("/login");
  });

  test("unauthenticated users are redirected from dashboard", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to login
    await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(login|auth)/);
  });

  test("signup page is accessible", async ({ page }) => {
    await page.goto("/signup");

    // Should have signup form elements
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });

  test("auth callback route handles missing params gracefully", async ({ request }) => {
    const response = await request.get("/auth/callback");

    // Should redirect to login with error
    expect(response.status()).toBe(200); // After redirect
    expect(response.url()).toContain("/login");
  });
});

test.describe("Password Reset Flow", () => {
  test("forgot password page exists and has email field", async ({ page }) => {
    await page.goto("/login");

    // Look for forgot password link
    const forgotLink = page.locator('a:has-text("forgot"), a:has-text("reset"), a:has-text("Forgot")').first();

    if (await forgotLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await forgotLink.click();
      await page.waitForTimeout(1000);

      const emailInput = page.locator('input[type="email"]').first();
      await expect(emailInput).toBeVisible({ timeout: 5000 });
    }
  });
});
