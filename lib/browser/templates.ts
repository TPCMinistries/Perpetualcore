/**
 * Browser Automation Templates
 *
 * Pre-built multi-step automation flows for common tasks.
 */

import { MultiStepAction } from "./types";

export interface BrowserTemplate {
  name: string;
  description: string;
  steps: MultiStepAction[];
}

export const BROWSER_TEMPLATES: Record<string, BrowserTemplate> = {
  googleSearch: {
    name: "Google Search",
    description: "Search Google and extract results",
    steps: [
      { action: "navigate", url: "https://www.google.com" },
      {
        action: "fill",
        fields: [{ selector: 'textarea[name="q"], input[name="q"]', value: "{{query}}" }],
      },
      { action: "click", selector: 'input[name="btnK"], button[type="submit"]' },
      { action: "wait", waitMs: 2000 },
      {
        action: "extract",
        javascript: `
          Array.from(document.querySelectorAll('#search .g')).slice(0, 5).map(el => ({
            title: el.querySelector('h3')?.innerText || '',
            url: el.querySelector('a')?.href || '',
            snippet: el.querySelector('.VwiC3b')?.innerText || ''
          }))
        `,
      },
    ],
  },

  linkedInProfile: {
    name: "LinkedIn Profile Scrape",
    description: "Extract public profile data from LinkedIn",
    steps: [
      { action: "navigate", url: "{{profileUrl}}" },
      { action: "wait", waitMs: 3000 },
      {
        action: "extract",
        javascript: `
          (() => {
            const name = document.querySelector('.text-heading-xlarge')?.innerText || '';
            const headline = document.querySelector('.text-body-medium')?.innerText || '';
            const location = document.querySelector('.text-body-small.inline')?.innerText || '';
            const about = document.querySelector('#about ~ .display-flex .inline-show-more-text')?.innerText || '';
            return { name: name.trim(), headline: headline.trim(), location: location.trim(), about: about.trim() };
          })()
        `,
      },
    ],
  },

  formSubmit: {
    name: "Generic Form Submit",
    description: "Navigate to a page, fill a form, and submit",
    steps: [
      { action: "navigate", url: "{{url}}" },
      { action: "fill", fields: [] }, // Fields injected at runtime
      { action: "click", selector: "{{submitSelector}}" },
      { action: "wait", waitMs: 2000 },
      { action: "screenshot" },
    ],
  },

  priceMonitor: {
    name: "Price Monitor",
    description: "Extract price from a product page",
    steps: [
      { action: "navigate", url: "{{productUrl}}" },
      { action: "wait", waitMs: 2000 },
      {
        action: "extract",
        javascript: `
          (() => {
            const priceEl = document.querySelector(
              '[data-testid="price"], .price, .product-price, .a-price .a-offscreen, [itemprop="price"]'
            );
            const titleEl = document.querySelector(
              'h1, [data-testid="product-title"], .product-title'
            );
            return {
              title: (titleEl?.innerText || '').trim(),
              price: (priceEl?.innerText || priceEl?.getAttribute('content') || '').trim(),
              url: window.location.href,
              timestamp: new Date().toISOString(),
            };
          })()
        `,
      },
    ],
  },
};

/**
 * Get a template by key and inject parameter values.
 */
export function resolveTemplate(
  templateKey: string,
  params: Record<string, string>
): MultiStepAction[] | null {
  const template = BROWSER_TEMPLATES[templateKey];
  if (!template) return null;

  // Deep clone and replace {{param}} placeholders
  const stepsJson = JSON.stringify(template.steps);
  let resolved = stepsJson;

  for (const [key, value] of Object.entries(params)) {
    resolved = resolved.replace(
      new RegExp(`\\{\\{${key}\\}\\}`, "g"),
      value.replace(/"/g, '\\"')
    );
  }

  return JSON.parse(resolved) as MultiStepAction[];
}
