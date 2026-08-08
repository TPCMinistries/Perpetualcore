import { expect, type Page, test } from "@playwright/test";

const email = process.env.RFP_E2E_EMAIL;
const password = process.env.RFP_E2E_PASSWORD;
const orgId = process.env.RFP_E2E_ORG_ID;
const proposalId = process.env.RFP_E2E_PROPOSAL_ID;

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844, minNavWidth: 320 },
  { name: "tablet", width: 834, height: 1112, minNavWidth: 420 },
  { name: "desktop", width: 1440, height: 1000, minNavWidth: 420 },
] as const;

const ROUTES = [
  { name: "proposal", path: () => `/org/${orgId}/proposals/${proposalId}` },
  { name: "pursuits", path: () => `/org/${orgId}/pursuits` },
  { name: "billing", path: () => `/org/${orgId}/settings/billing` },
] as const;

type RouteName = (typeof ROUTES)[number]["name"];

interface TextOverflow {
  tag: string;
  text: string;
  clientWidth: number;
  scrollWidth: number;
}

async function signIn(page: Page) {
  await page.goto("/login");
  await page.locator('input[type="email"]').first().fill(email!);
  await page.locator('input[type="password"]').first().fill(password!);
  await page.locator('button[type="submit"]').first().click();

  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 20_000,
  });
}

async function waitForRouteReady(page: Page, routeName: RouteName) {
  if (routeName === "proposal") {
    await expect(page.getByTestId("rfp-submission-bundle-panel")).toBeVisible({
      timeout: 20_000,
    });
    return;
  }

  if (routeName === "pursuits") {
    await expect(page.getByTestId("rfp-pursuits-page")).toBeVisible({
      timeout: 20_000,
    });
    return;
  }

  await expect(page.getByText(/Settings · Billing/i)).toBeVisible({
    timeout: 20_000,
  });
}

async function collectLayoutMetrics(page: Page): Promise<{
  innerWidth: number;
  htmlScrollWidth: number;
  bodyScrollWidth: number;
  horizontalOverflow: boolean;
  visibleCookieText: boolean;
  visibleTextOverflows: TextOverflow[];
}> {
  return page.evaluate(() => {
    const visibleTextOverflows: TextOverflow[] = [];
    const selectors = [
      "button",
      "a",
      '[role="button"]',
      "h1",
      "h2",
      "h3",
      "p",
      "span",
      "dd",
      "dt",
    ].join(",");

    for (const el of Array.from(document.querySelectorAll(selectors))) {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      const style = getComputedStyle(el);
      if (
        style.overflowX === "visible" &&
        el.scrollWidth > Math.ceil(el.clientWidth) + 2
      ) {
        visibleTextOverflows.push({
          tag: el.tagName,
          text: (el.textContent ?? "").trim().slice(0, 80),
          clientWidth: el.clientWidth,
          scrollWidth: el.scrollWidth,
        });
      }
    }

    const visibleCookieText = Array.from(document.querySelectorAll("body *")).some(
      (el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        const style = getComputedStyle(el);
        if (style.visibility === "hidden" || style.display === "none") return false;
        return /\bcookies?\b/i.test(el.textContent ?? "");
      },
    );

    return {
      innerWidth: window.innerWidth,
      htmlScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      horizontalOverflow:
        document.documentElement.scrollWidth > window.innerWidth ||
        document.body.scrollWidth > window.innerWidth,
      visibleCookieText,
      visibleTextOverflows: visibleTextOverflows.slice(0, 10),
    };
  });
}

test.describe("RFP authenticated visual regression", () => {
  test.setTimeout(90_000);

  test.skip(
    !email || !password || !orgId || !proposalId,
    "Set RFP_E2E_EMAIL, RFP_E2E_PASSWORD, RFP_E2E_ORG_ID, and RFP_E2E_PROPOSAL_ID to run authenticated RFP visual checks.",
  );

  for (const viewport of VIEWPORTS) {
    test(`${viewport.name} app surfaces have no overflow or authenticated cookie overlay`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await signIn(page);

      for (const route of ROUTES) {
        await test.step(route.name, async () => {
          await page.goto(route.path(), { waitUntil: "domcontentloaded" });
          await waitForRouteReady(page, route.name);

          const metrics = await collectLayoutMetrics(page);
          expect(metrics.horizontalOverflow, route.name).toBe(false);
          expect(metrics.visibleCookieText, route.name).toBe(false);
          expect(metrics.visibleTextOverflows, route.name).toEqual([]);

          const nav = await page
            .getByRole("navigation", { name: "Workspace" })
            .boundingBox();
          expect(nav?.width ?? 0, `${route.name} nav width`).toBeGreaterThanOrEqual(
            viewport.minNavWidth,
          );
        });
      }
    });
  }

  test("proposal export bundle tiles keep readable dimensions", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await signIn(page);
    await page.goto(`/org/${orgId}/proposals/${proposalId}`, {
      waitUntil: "domcontentloaded",
    });

    const bundle = page.getByTestId("rfp-submission-bundle-panel");
    await expect(bundle).toBeVisible();

    const tiles = await bundle.locator("a.group").evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          text: (node.textContent ?? "").trim().slice(0, 80),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      }),
    );

    expect(tiles).toHaveLength(6);
    for (const tile of tiles) {
      expect(tile.width, tile.text).toBeGreaterThanOrEqual(200);
      expect(tile.height, tile.text).toBeGreaterThanOrEqual(120);
    }

    const metrics = await collectLayoutMetrics(page);
    expect(metrics.visibleTextOverflows).toEqual([]);
  });
});
