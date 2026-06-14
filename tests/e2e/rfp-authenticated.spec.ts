import { expect, type Page, test } from "@playwright/test";

const email = process.env.RFP_E2E_EMAIL;
const password = process.env.RFP_E2E_PASSWORD;
const orgId = process.env.RFP_E2E_ORG_ID;
const proposalId = process.env.RFP_E2E_PROPOSAL_ID;

async function signIn(page: Page) {
  await page.goto("/login");
  await page.locator('input[type="email"]').first().fill(email!);
  await page.locator('input[type="password"]').first().fill(password!);
  await page.locator('button[type="submit"]').first().click();

  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 20_000,
  });
}

test.describe("RFP authenticated workflow", () => {
  test.setTimeout(60_000);

  test.skip(
    !email || !password || !orgId,
    "Set RFP_E2E_EMAIL, RFP_E2E_PASSWORD, and RFP_E2E_ORG_ID to run authenticated RFP smoke tests.",
  );

  test("opens pursuits and validates the command-file workflow shell", async ({ page }) => {
    await signIn(page);

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

  test("validates proposal workroom exports and status API", async ({ page }) => {
    await signIn(page);

    let targetProposalId = proposalId;
    if (!targetProposalId) {
      await page.goto(`/org/${orgId}/proposals`);
      const href = await page
        .locator(`a[href^="/org/${orgId}/proposals/"]`)
        .first()
        .getAttribute("href");
      targetProposalId = href?.split("/").pop();
    }
    expect(targetProposalId).toBeTruthy();

    await page.goto(`/org/${orgId}/proposals/${targetProposalId}`);
    await expect(page.getByText(/First-pass draft/i)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("rfp-submission-bundle-panel")).toBeVisible();
    await expect(page.getByRole("link", { name: /Download ZIP/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Readiness JSON/i })).toBeVisible();
    await expect(page.getByText(/Submission bundle/i).first()).toBeVisible();
    await expect(page.getByText(/Reviewer/i).first()).toBeVisible();

    const exportChecks = [
      `/api/rfp/proposals/${targetProposalId}/submit-readiness`,
      `/api/rfp/proposals/${targetProposalId}/export/manifest-csv`,
      `/api/rfp/proposals/${targetProposalId}/export/audit-trail-csv`,
      `/api/rfp/proposals/${targetProposalId}/export/bundle-zip`,
    ];

    for (const path of exportChecks) {
      const response = await page.request.get(path);
      expect(response.status(), path).toBe(200);
      const body = await response.body();
      expect(body.length, path).toBeGreaterThan(20);
    }

    const closeResponse = await page.request.patch(
      `/api/rfp/proposals/${targetProposalId}/status`,
      {
        data: {
          status: "no_bid",
          notes: "E2E launch-gate status transition smoke.",
        },
      },
    );
    expect(closeResponse.status()).toBe(200);
    await expect(closeResponse.json()).resolves.toMatchObject({
      status: "no_bid",
    });

    const resetResponse = await page.request.patch(
      `/api/rfp/proposals/${targetProposalId}/status`,
      {
        data: {
          status: "draft",
          notes: "E2E launch-gate reset.",
        },
      },
    );
    expect(resetResponse.status()).toBe(200);
    await expect(resetResponse.json()).resolves.toMatchObject({
      status: "draft",
    });
  });
});
