import { expect, test } from "@playwright/test";

test.describe("RFP production smoke", () => {
  test("RFP health endpoint reports ready aggregate state", async ({ request }) => {
    const response = await request.get("/api/health/rfp");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.open_drift_events).toBe(0);
    expect(data.totals.scoring_coverage_percent).toBe(100);
    expect(data.totals.matches).toBe(data.totals.expected_matches);
  });

  test("public RFP landing page loads", async ({ page }) => {
    await page.goto("/rfp");
    await expect(page).toHaveTitle(/RFP|Proposal|Perpetual/i);
    await expect(page.getByRole("link", { name: /pricing/i }).first()).toBeVisible();
  });

  test("admin RFP console is gated when unauthenticated", async ({ request }) => {
    const response = await request.get("/admin/rfp");
    expect([401, 403, 404]).toContain(response.status());
    expect(response.headers()["x-matched-path"]).toBe("/admin/rfp");
  });
});
