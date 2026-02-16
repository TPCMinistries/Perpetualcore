/**
 * Browser Automation Engine
 *
 * High-level automation functions built on top of the Browserless CDP client.
 * Provides form filling, login flows, multi-step automation, and data extraction.
 */

import {
  executeBrowserAction,
  executeFormFill,
  executeMultiStep,
} from "./browserless-client";
import {
  BrowserResult,
  FormField,
  MultiStepAction,
  CookieData,
} from "./types";

/**
 * Fill a form on a page and optionally submit it.
 */
export async function fillForm(
  url: string,
  fields: FormField[],
  submitSelector?: string
): Promise<BrowserResult> {
  return executeFormFill(url, fields, submitSelector);
}

/**
 * Execute a login flow: navigate, fill credentials, submit, return result.
 */
export async function loginFlow(
  url: string,
  credentials: { username: string; password: string },
  selectors: {
    usernameField: string;
    passwordField: string;
    submitButton: string;
  }
): Promise<BrowserResult> {
  const steps: MultiStepAction[] = [
    { action: "navigate", url },
    {
      action: "fill",
      fields: [
        { selector: selectors.usernameField, value: credentials.username },
        { selector: selectors.passwordField, value: credentials.password, type: "text" },
      ],
    },
    { action: "click", selector: selectors.submitButton },
    { action: "wait", waitMs: 2000 },
  ];

  const results = await executeMultiStep(steps);
  const lastResult = results[results.length - 1];

  if (!lastResult) {
    return {
      success: false,
      data: "",
      url,
      timing: 0,
      errorMessage: "Login flow produced no results",
    };
  }

  return {
    success: lastResult.success,
    data: lastResult.success
      ? `Login completed. Final URL: ${lastResult.url}`
      : lastResult.data,
    url: lastResult.url,
    timing: results.reduce((sum, r) => sum + r.timing, 0),
    errorMessage: lastResult.errorMessage,
  };
}

/**
 * Execute a multi-step browser flow sequentially, maintaining session.
 */
export async function multiStepFlow(
  steps: MultiStepAction[]
): Promise<BrowserResult[]> {
  return executeMultiStep(steps);
}

/**
 * Extract structured table data from a page.
 */
export async function extractTable(
  url: string,
  selector: string
): Promise<{ headers: string[]; rows: string[][] }> {
  const result = await executeBrowserAction({
    action: "extract",
    url,
    javascript: `
      (() => {
        const table = document.querySelector('${selector.replace(/'/g, "\\'")}');
        if (!table) return { headers: [], rows: [] };

        const headers = Array.from(table.querySelectorAll('thead th, thead td, tr:first-child th'))
          .map(th => (th.innerText || th.textContent || '').trim());

        const bodyRows = table.querySelectorAll('tbody tr');
        const dataRows = bodyRows.length > 0
          ? bodyRows
          : table.querySelectorAll('tr:not(:first-child)');

        const rows = Array.from(dataRows).map(tr =>
          Array.from(tr.querySelectorAll('td, th'))
            .map(td => (td.innerText || td.textContent || '').trim())
        );

        return { headers, rows };
      })()
    `,
  });

  if (!result.success || !result.data) {
    return { headers: [], rows: [] };
  }

  try {
    return JSON.parse(result.data);
  } catch {
    return { headers: [], rows: [] };
  }
}

/**
 * Monitor a page element for content changes.
 * Scrapes the content at the given selector and returns it.
 * Caller is responsible for comparing against previous values.
 */
export async function monitorPage(
  url: string,
  selector: string
): Promise<{ content: string }> {
  const result = await executeBrowserAction({
    action: "scrape",
    url,
    selector,
  });

  return {
    content: result.success ? result.data : "",
  };
}
