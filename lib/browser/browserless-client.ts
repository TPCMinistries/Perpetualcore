/**
 * Browserless.io CDP Client
 * Headless browser automation via Puppeteer connecting to Browserless.io.
 * Supports screenshots, scraping, PDF generation, and JavaScript extraction.
 *
 * @see https://www.browserless.io/docs
 */

import puppeteer, { Browser, Page } from "puppeteer-core";
import {
  BrowserAction,
  BrowserResult,
  DEFAULT_BROWSER_TIMEOUT,
  MAX_BROWSER_TIMEOUT,
} from "./types";

/**
 * Get the Browserless CDP endpoint URL with authentication.
 */
function getBrowserlessEndpoint(): string {
  const token = process.env.BROWSERLESS_API_KEY;
  if (!token) {
    throw new Error("BROWSERLESS_API_KEY environment variable is not set");
  }
  const baseUrl = process.env.BROWSERLESS_URL || "wss://chrome.browserless.io";
  return `${baseUrl}?token=${token}`;
}

/**
 * Execute a browser automation action via Browserless.io.
 * Connects to a remote Chrome instance via CDP (Chrome DevTools Protocol).
 *
 * @param action - The browser action to perform
 * @returns BrowserResult with action-specific output
 */
export async function executeBrowserAction(
  action: BrowserAction
): Promise<BrowserResult> {
  const startTime = Date.now();
  const timeout = DEFAULT_BROWSER_TIMEOUT;
  let browser: Browser | null = null;

  try {
    browser = await puppeteer.connect({
      browserWSEndpoint: getBrowserlessEndpoint(),
    });

    const page = await browser.newPage();

    // Set reasonable defaults
    await page.setViewport({ width: 1280, height: 720 });
    page.setDefaultTimeout(timeout);
    page.setDefaultNavigationTimeout(timeout);

    // Set a user agent to avoid bot detection
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    );

    // Navigate to the URL
    await page.goto(action.url, {
      waitUntil: "networkidle2",
      timeout,
    });

    // Wait for optional selector or delay
    if (action.waitFor) {
      if (typeof action.waitFor === "number") {
        await new Promise((resolve) => setTimeout(resolve, action.waitFor as number));
      } else {
        await page.waitForSelector(action.waitFor, { timeout });
      }
    }

    // Execute the appropriate action
    let result: BrowserResult;

    switch (action.action) {
      case "screenshot":
        result = await takeScreenshot(page, action, startTime);
        break;
      case "scrape":
        result = await scrapePage(page, action, startTime);
        break;
      case "pdf":
        result = await generatePdf(page, startTime);
        break;
      case "extract":
        result = await extractWithJs(page, action, startTime);
        break;
      case "click":
        result = await clickElement(page, action, startTime);
        break;
      case "navigate":
        result = await navigatePage(page, action, startTime);
        break;
      default:
        result = {
          success: false,
          data: "",
          url: action.url,
          timing: Date.now() - startTime,
          errorMessage: `Unsupported action: ${action.action}`,
        };
    }

    return result;
  } catch (error: any) {
    const timing = Date.now() - startTime;

    // Detect timeout errors
    const isTimeout =
      error.message?.includes("timeout") ||
      error.message?.includes("Navigation timeout") ||
      error.name === "TimeoutError";

    return {
      success: false,
      data: "",
      url: action.url,
      timing,
      errorMessage: isTimeout
        ? `Browser action timed out after ${timeout}ms`
        : error.message || "Unknown browser error",
    };
  } finally {
    if (browser) {
      try {
        browser.disconnect();
      } catch (disconnectError) {
        console.error("[Browserless] Error disconnecting:", disconnectError);
      }
    }
  }
}

/**
 * Take a screenshot of the page or a specific element.
 * Returns the screenshot as a base64-encoded PNG string.
 */
async function takeScreenshot(
  page: Page,
  action: BrowserAction,
  startTime: number
): Promise<BrowserResult> {
  let screenshotBase64: string;

  if (action.selector) {
    const element = await page.$(action.selector);
    if (!element) {
      return {
        success: false,
        data: "",
        url: page.url(),
        timing: Date.now() - startTime,
        errorMessage: `Element not found for selector: ${action.selector}`,
      };
    }
    screenshotBase64 = (await element.screenshot({ encoding: "base64" })) as string;
  } else {
    screenshotBase64 = (await page.screenshot({
      encoding: "base64",
      fullPage: true,
    })) as string;
  }

  return {
    success: true,
    data: screenshotBase64,
    url: page.url(),
    timing: Date.now() - startTime,
  };
}

/**
 * Scrape text content from the page or a specific element.
 * Returns cleaned text with HTML tags stripped.
 */
async function scrapePage(
  page: Page,
  action: BrowserAction,
  startTime: number
): Promise<BrowserResult> {
  let textContent: string;

  if (action.selector) {
    const element = await page.$(action.selector);
    if (!element) {
      return {
        success: false,
        data: "",
        url: page.url(),
        timing: Date.now() - startTime,
        errorMessage: `Element not found for selector: ${action.selector}`,
      };
    }
    textContent = await page.evaluate(
      (el) => (el as HTMLElement).innerText || el.textContent || "",
      element
    );
  } else {
    // Get the full page text content, cleaned up
    textContent = await page.evaluate(() => {
      // Remove script and style elements
      const scripts = document.querySelectorAll("script, style, noscript");
      scripts.forEach((s) => s.remove());

      // Get clean text content
      const body = document.body;
      return body ? body.innerText || body.textContent || "" : "";
    });
  }

  // Clean up excessive whitespace
  const cleanedText = textContent
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  return {
    success: true,
    data: cleanedText,
    url: page.url(),
    timing: Date.now() - startTime,
  };
}

/**
 * Generate a PDF of the current page.
 * Returns the PDF as a base64-encoded string.
 */
async function generatePdf(
  page: Page,
  startTime: number
): Promise<BrowserResult> {
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" },
  });

  return {
    success: true,
    data: Buffer.from(pdfBuffer).toString("base64"),
    url: page.url(),
    timing: Date.now() - startTime,
  };
}

/**
 * Execute JavaScript on the page and return the result.
 * Used for custom data extraction from complex pages.
 */
async function extractWithJs(
  page: Page,
  action: BrowserAction,
  startTime: number
): Promise<BrowserResult> {
  if (!action.javascript) {
    return {
      success: false,
      data: "",
      url: page.url(),
      timing: Date.now() - startTime,
      errorMessage: "JavaScript code is required for the extract action",
    };
  }

  try {
    const result = await page.evaluate(action.javascript);
    const resultString =
      typeof result === "string" ? result : JSON.stringify(result, null, 2);

    return {
      success: true,
      data: resultString || "",
      url: page.url(),
      timing: Date.now() - startTime,
    };
  } catch (evalError: any) {
    return {
      success: false,
      data: "",
      url: page.url(),
      timing: Date.now() - startTime,
      errorMessage: `JavaScript evaluation error: ${evalError.message}`,
    };
  }
}

/**
 * Click an element on the page identified by CSS selector.
 * Waits for navigation after clicking.
 */
async function clickElement(
  page: Page,
  action: BrowserAction,
  startTime: number
): Promise<BrowserResult> {
  if (!action.selector) {
    return {
      success: false,
      data: "",
      url: page.url(),
      timing: Date.now() - startTime,
      errorMessage: "Selector is required for the click action",
    };
  }

  try {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {
        // Navigation may not occur for all clicks (e.g., modals, AJAX)
      }),
      page.click(action.selector),
    ]);

    return {
      success: true,
      data: `Clicked element "${action.selector}". Current URL: ${page.url()}`,
      url: page.url(),
      timing: Date.now() - startTime,
    };
  } catch (clickError: any) {
    return {
      success: false,
      data: "",
      url: page.url(),
      timing: Date.now() - startTime,
      errorMessage: `Click failed: ${clickError.message}`,
    };
  }
}

/**
 * Navigate to a URL and return page information.
 * Useful as a standalone action to verify a page loads correctly.
 */
async function navigatePage(
  page: Page,
  action: BrowserAction,
  startTime: number
): Promise<BrowserResult> {
  const title = await page.title();
  const finalUrl = page.url();

  return {
    success: true,
    data: `Navigated to "${title}" at ${finalUrl}`,
    url: finalUrl,
    timing: Date.now() - startTime,
  };
}
