/**
 * Browser Automation Skill
 *
 * Provides browser automation tools: screenshots, scraping, form filling,
 * structured data extraction, multi-step flows, and page monitoring.
 */

import { Skill, ToolContext, ToolResult } from "../types";
import { executeBrowserAction } from "@/lib/browser/browserless-client";
import {
  fillForm,
  multiStepFlow,
  extractTable,
  monitorPage,
} from "@/lib/browser/automation";

async function browserScreenshot(
  params: { url: string; selector?: string; waitFor?: string | number },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const result = await executeBrowserAction({
      action: "screenshot",
      url: params.url,
      selector: params.selector,
      waitFor: params.waitFor,
    });

    if (!result.success) {
      return { success: false, error: result.errorMessage || "Screenshot failed" };
    }

    return {
      success: true,
      data: { screenshot: result.data, url: result.url, timing: result.timing },
      display: {
        type: "image",
        content: `data:image/png;base64,${result.data}`,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function browserScrape(
  params: { url: string; selector?: string; waitFor?: string | number },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const result = await executeBrowserAction({
      action: "scrape",
      url: params.url,
      selector: params.selector,
      waitFor: params.waitFor,
    });

    if (!result.success) {
      return { success: false, error: result.errorMessage || "Scrape failed" };
    }

    const text = result.data.length > 3000
      ? result.data.substring(0, 3000) + "..."
      : result.data;

    return {
      success: true,
      data: { text: result.data, url: result.url, timing: result.timing },
      display: { type: "text", content: text },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function browserFillForm(
  params: {
    url: string;
    fields: Array<{ selector: string; value: string; type?: string }>;
    submitSelector?: string;
  },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const result = await fillForm(
      params.url,
      params.fields.map((f) => ({
        selector: f.selector,
        value: f.value,
        type: (f.type || "text") as any,
      })),
      params.submitSelector
    );

    if (!result.success) {
      return { success: false, error: result.errorMessage || "Form fill failed" };
    }

    return {
      success: true,
      data: { message: result.data, url: result.url, timing: result.timing },
      display: { type: "text", content: result.data },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function browserExtractData(
  params: { url: string; selector: string; type?: "table" | "list" | "text" },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const extractType = params.type || "table";

    if (extractType === "table") {
      const tableData = await extractTable(params.url, params.selector);

      if (tableData.headers.length === 0 && tableData.rows.length === 0) {
        return {
          success: true,
          data: tableData,
          display: { type: "text", content: "No table data found at the given selector." },
        };
      }

      return {
        success: true,
        data: tableData,
        display: {
          type: "table",
          content: {
            headers: tableData.headers,
            rows: tableData.rows,
          },
        },
      };
    }

    // For list/text extraction, use scrape
    const result = await executeBrowserAction({
      action: "scrape",
      url: params.url,
      selector: params.selector,
    });

    if (!result.success) {
      return { success: false, error: result.errorMessage || "Extraction failed" };
    }

    return {
      success: true,
      data: { content: result.data, url: result.url },
      display: { type: "text", content: result.data },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function browserMultiStep(
  params: {
    steps: Array<{
      action: string;
      url?: string;
      selector?: string;
      value?: string;
      fields?: Array<{ selector: string; value: string; type?: string }>;
      waitMs?: number;
      javascript?: string;
    }>;
  },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const results = await multiStepFlow(
      params.steps.map((s) => ({
        action: s.action as any,
        url: s.url,
        selector: s.selector,
        value: s.value,
        fields: s.fields?.map((f) => ({
          selector: f.selector,
          value: f.value,
          type: (f.type || "text") as any,
        })),
        waitMs: s.waitMs,
        javascript: s.javascript,
      }))
    );

    const allSucceeded = results.every((r) => r.success);
    const summary = results
      .map((r, i) => `Step ${i + 1}: ${r.success ? "OK" : "FAILED"} - ${r.data || r.errorMessage}`)
      .join("\n");

    return {
      success: allSucceeded,
      data: { steps: results },
      display: { type: "markdown", content: `**Multi-step Result**\n\n\`\`\`\n${summary}\n\`\`\`` },
      error: allSucceeded ? undefined : "One or more steps failed",
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function browserMonitor(
  params: { url: string; selector: string },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const { content } = await monitorPage(params.url, params.selector);

    if (!content) {
      return {
        success: true,
        data: { content: "", url: params.url },
        display: { type: "text", content: "No content found at the given selector." },
      };
    }

    return {
      success: true,
      data: { content, url: params.url },
      display: { type: "text", content: content.substring(0, 2000) },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export const browserSkill: Skill = {
  id: "browser",
  name: "Browser Automation",
  description: "Automate web browsers: screenshots, scraping, form filling, data extraction, and multi-step flows",
  version: "1.0.0",
  author: "Perpetual Core",

  category: "automation",
  tags: ["browser", "scraping", "automation", "forms", "screenshots"],

  icon: "🌐",
  color: "#4A90D9",

  requiredEnvVars: ["BROWSERLESS_API_KEY"],

  tier: "pro",
  isBuiltIn: true,

  tools: [
    {
      name: "browser_screenshot",
      description: "Take a screenshot of a web page or specific element",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to screenshot" },
          selector: { type: "string", description: "CSS selector for specific element (optional)" },
          waitFor: { type: "string", description: "CSS selector or milliseconds to wait before screenshot" },
        },
        required: ["url"],
      },
      execute: browserScreenshot,
    },
    {
      name: "browser_scrape",
      description: "Extract text content from a web page or element",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to scrape" },
          selector: { type: "string", description: "CSS selector for specific element (optional)" },
          waitFor: { type: "string", description: "CSS selector or milliseconds to wait before scraping" },
        },
        required: ["url"],
      },
      execute: browserScrape,
    },
    {
      name: "browser_fill_form",
      description: "Fill and optionally submit a web form",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL of the page with the form" },
          fields: {
            type: "array",
            description: "Form fields to fill: [{selector, value, type?}]",
          },
          submitSelector: { type: "string", description: "CSS selector for the submit button" },
        },
        required: ["url", "fields"],
      },
      execute: browserFillForm,
    },
    {
      name: "browser_extract_data",
      description: "Extract structured data (tables, lists) from a web page",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to extract data from" },
          selector: { type: "string", description: "CSS selector for the data element" },
          type: {
            type: "string",
            description: "Type of data to extract: table, list, or text",
            enum: ["table", "list", "text"],
          },
        },
        required: ["url", "selector"],
      },
      execute: browserExtractData,
    },
    {
      name: "browser_multi_step",
      description: "Execute a multi-step browser automation (navigate, fill, click, extract, wait, screenshot)",
      parameters: {
        type: "object",
        properties: {
          steps: {
            type: "array",
            description: "Array of steps: [{action, url?, selector?, value?, fields?, waitMs?, javascript?}]",
          },
        },
        required: ["steps"],
      },
      execute: browserMultiStep,
    },
    {
      name: "browser_monitor",
      description: "Check current content of a page element (for change detection)",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to monitor" },
          selector: { type: "string", description: "CSS selector for the element to monitor" },
        },
        required: ["url", "selector"],
      },
      execute: browserMonitor,
    },
  ],

  systemPrompt: `You have browser automation capabilities. You can:
- Take screenshots of web pages or elements
- Scrape text content from any URL
- Fill and submit web forms
- Extract structured data like tables
- Run multi-step browser automations (navigate, fill, click, extract, wait)
- Monitor page elements for content

Use browser_scrape for text extraction. Use browser_extract_data for structured data like tables.
For complex flows, use browser_multi_step with a sequence of actions.`,
};
