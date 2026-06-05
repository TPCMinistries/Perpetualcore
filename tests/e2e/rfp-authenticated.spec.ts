import { expect, test } from "@playwright/test";

const email = process.env.RFP_E2E_EMAIL;
const password = process.env.RFP_E2E_PASSWORD;
const orgId = process.env.RFP_E2E_ORG_ID;

test.describe("RFP authenticated workflow", () => {
  test.setTimeout(60_000);

  test.skip(
    !email || !password || !orgId,
    "Set RFP_E2E_EMAIL, RFP_E2E_PASSWORD, and RFP_E2E_ORG_ID to run authenticated RFP smoke tests.",
  );

  test("opens pursuits and validates the command-file workflow shell", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').first().fill(email!);
    await page.locator('input[type="password"]').first().fill(password!);
    await page.locator('button[type="submit"]').first().click();

    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 20_000,
    });

    await page.goto(`/org/${orgId}/pursuits`);
    await expect(page.getByTestId("rfp-pursuits-page")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("Turn selected opportunities into submitted packets.")).toBeVisible();

    const cards = page.getByTestId("rfp-pursuit-card");
    const cardCount = await cards.count();
    if (cardCount === 0) {
      await expect(page.getByText("No pursuits yet.")).toBeVisible();
      await expect(page.getByRole("link", { name: /Open Discovery/i })).toBeVisible();
      return;
    }

    const proposalBackedCard = cards.filter({
      has: page.getByRole("link", { name: /Open workroom/i }),
    });
    const targetCard = (await proposalBackedCard.count()) > 0
      ? proposalBackedCard.first()
      : cards.first();

    await targetCard.getByTestId("rfp-open-command-file").click();
    await expect(page.getByTestId("rfp-pursuit-detail-page")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("Bid / no-bid").first()).toBeVisible();

    const bundlePanel = page.getByTestId("rfp-submission-bundle-panel");
    if ((await proposalBackedCard.count()) > 0) {
      await expect(bundlePanel).toBeVisible();
      await expect(bundlePanel.getByRole("link", { name: /Download ZIP/i })).toBeVisible();
      await expect(bundlePanel.getByRole("link", { name: /Audit CSV/i })).toBeVisible();
      await expect(bundlePanel.getByRole("link", { name: /Readiness JSON/i })).toBeVisible();
    } else if (await bundlePanel.isVisible().catch(() => false)) {
      await expect(bundlePanel.getByRole("link", { name: /Download ZIP/i })).toBeVisible();
    } else {
      await expect(page.getByText("No draft workroom yet")).toBeVisible();
    }
  });
});
