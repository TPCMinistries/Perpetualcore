/**
 * Browser Automation Types
 * Interfaces for headless browser operations via Browserless.io
 */

/** Supported browser automation actions */
export type BrowserActionType =
  | "screenshot"
  | "scrape"
  | "pdf"
  | "click"
  | "navigate"
  | "extract";

/** Status of a browser session */
export type BrowserSessionStatus = "pending" | "running" | "completed" | "failed" | "timeout";

/**
 * Request to perform a browser automation action.
 * Supports screenshots, scraping, PDF generation, and JavaScript extraction.
 */
export interface BrowserAction {
  /** The type of browser action to perform */
  action: BrowserActionType;
  /** Target URL to navigate to */
  url: string;
  /** CSS selector to target a specific element (for click, extract, screenshot) */
  selector?: string;
  /** Wait for a selector or milliseconds before acting */
  waitFor?: string | number;
  /** JavaScript code to execute on the page (for extract action) */
  javascript?: string;
}

/**
 * Result returned from a browser automation action.
 * The data field contains action-specific output.
 */
export interface BrowserResult {
  /** Whether the action completed successfully */
  success: boolean;
  /** Action-specific result data:
   *  - screenshot: base64-encoded PNG string
   *  - scrape: extracted text content
   *  - pdf: base64-encoded PDF string
   *  - extract: JavaScript execution result as string
   *  - click/navigate: confirmation message
   */
  data: string;
  /** The final URL after any redirects */
  url: string;
  /** Total time taken in milliseconds */
  timing: number;
  /** Error message if the action failed */
  errorMessage?: string;
}

/**
 * User browser session quota tracking.
 * Limits the number of browser operations per day.
 */
export interface BrowserQuota {
  /** User who owns this quota */
  userId: string;
  /** Number of browser sessions used today */
  dailySessions: number;
  /** Maximum allowed sessions per day */
  maxDailySessions: number;
  /** Timestamp when the daily counter was last reset */
  lastReset: Date;
}

/**
 * Result from a browser quota check.
 */
export interface BrowserQuotaCheckResult {
  /** Whether the user is allowed to perform a browser action */
  allowed: boolean;
  /** Number of sessions remaining today */
  remaining: number;
  /** When the quota resets (next midnight UTC) */
  resetAt: Date;
}

/** Default browser action timeout in milliseconds (30 seconds) */
export const DEFAULT_BROWSER_TIMEOUT = 30000;

/** Maximum browser action timeout in milliseconds (2 minutes) */
export const MAX_BROWSER_TIMEOUT = 120000;

/** Default daily browser session limit for pro users */
export const PRO_BROWSER_DAILY_LIMIT = 50;

/** Default daily browser session limit for free users */
export const FREE_BROWSER_DAILY_LIMIT = 5;

/**
 * Known private/internal IP ranges that should be blocked.
 * Prevents SSRF attacks against internal infrastructure.
 */
export const BLOCKED_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^fc00:/i,
  /^fe80:/i,
  /^::1$/,
  /^localhost$/i,
  /^.*\.local$/i,
  /^.*\.internal$/i,
];

/**
 * Blocked URL schemes to prevent access to non-HTTP resources.
 */
export const BLOCKED_SCHEMES = ["file:", "ftp:", "data:", "javascript:", "about:", "chrome:"];
