/**
 * Declarative HTTP Executor for Custom Skills
 *
 * Executes HTTP requests based on tool configuration.
 * Handles template resolution, auth injection, SSRF protection, and response mapping.
 */

import type { ToolResult, ToolContext } from "../types";
import type { HttpToolConfig, CustomToolDefinition, CustomSkillAuthType, AuthConfig } from "./types";
import { resolveCredential } from "../credentials";

const MAX_RESPONSE_SIZE = 1_048_576; // 1MB
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 30_000;

// Private IP ranges and metadata endpoints to block (SSRF protection)
const BLOCKED_HOSTS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fd[0-9a-f]{2}:/i,
  /^169\.254\.\d+\.\d+$/, // Link-local / cloud metadata
  /^metadata\.google\.internal$/i,
];

// ========================================
// Template Resolution
// ========================================

/**
 * Resolve {{param}} and {{credential:key}} placeholders in a string
 */
function resolveTemplate(
  template: string,
  params: Record<string, any>,
  credentials: Record<string, string>
): string {
  return template.replace(/\{\{(\w+(?::\w+)?)\}\}/g, (match, key: string) => {
    if (key.startsWith("credential:")) {
      const credKey = key.split(":")[1];
      return credentials[credKey] ?? match;
    }
    const value = params[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Deep-resolve templates in an object/array/string
 */
function resolveDeep(
  value: any,
  params: Record<string, any>,
  credentials: Record<string, string>
): any {
  if (typeof value === "string") {
    return resolveTemplate(value, params, credentials);
  }
  if (Array.isArray(value)) {
    return value.map((v) => resolveDeep(v, params, credentials));
  }
  if (value && typeof value === "object") {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      result[resolveTemplate(k, params, credentials)] = resolveDeep(v, params, credentials);
    }
    return result;
  }
  return value;
}

// ========================================
// Security
// ========================================

function isHostBlocked(hostname: string): boolean {
  return BLOCKED_HOSTS.some((pattern) => pattern.test(hostname));
}

function validateUrl(urlString: string, allowedDomains: string[]): { valid: boolean; error?: string } {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { valid: false, error: "Invalid URL" };
  }

  if (url.protocol !== "https:") {
    return { valid: false, error: "Only HTTPS URLs are allowed" };
  }

  if (isHostBlocked(url.hostname)) {
    return { valid: false, error: "Blocked host: private/internal addresses not allowed" };
  }

  if (allowedDomains.length > 0) {
    const domainAllowed = allowedDomains.some((domain) => {
      const d = domain.toLowerCase();
      const h = url.hostname.toLowerCase();
      return h === d || h.endsWith(`.${d}`);
    });
    if (!domainAllowed) {
      return { valid: false, error: `Domain ${url.hostname} not in allowed domains` };
    }
  }

  return { valid: true };
}

// ========================================
// Auth Injection
// ========================================

async function resolveAuthHeaders(
  authType: CustomSkillAuthType,
  authConfig: AuthConfig,
  context: ToolContext
): Promise<Record<string, string>> {
  if (authType === "none") return {};

  // Try to resolve credential via existing BYOK cascade
  const provider = `custom_${context.skillConfig?._skillSlug || "default"}`;
  const cred = await resolveCredential(provider, context.userId, context.organizationId);

  if (!cred) return {};

  switch (authType) {
    case "bearer":
      return { Authorization: `${authConfig.prefix || "Bearer"} ${cred.key}` };
    case "api_key":
      return { [authConfig.header_name || "X-API-Key"]: cred.key };
    case "basic":
      return { Authorization: `Basic ${Buffer.from(cred.key).toString("base64")}` };
    case "custom_header":
      return authConfig.header_name ? { [authConfig.header_name]: cred.key } : {};
    default:
      return {};
  }
}

// ========================================
// Response Mapping
// ========================================

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => {
    if (current === null || current === undefined) return undefined;
    return current[key];
  }, obj);
}

function mapResponse(
  data: any,
  mapping?: HttpToolConfig["response_mapping"]
): { data: any; display?: ToolResult["display"] } {
  if (!mapping) {
    return { data };
  }

  const extracted = mapping.success_path ? getNestedValue(data, mapping.success_path) : data;

  let display: ToolResult["display"] | undefined;
  if (mapping.display) {
    let content: any = extracted;
    if (mapping.display.type === "card" && mapping.display.title_path) {
      content = {
        title: getNestedValue(extracted, mapping.display.title_path),
        description: mapping.display.description_path
          ? getNestedValue(extracted, mapping.display.description_path)
          : undefined,
        data: extracted,
      };
    }
    display = { type: mapping.display.type, content };
  }

  return { data: extracted, display };
}

// ========================================
// Main Executor
// ========================================

export interface ExecuteHttpToolOptions {
  authType: CustomSkillAuthType;
  authConfig: AuthConfig;
  allowedDomains: string[];
  /** Override credential value (for testing) */
  credentialOverride?: string;
}

export async function executeHttpTool(
  toolConfig: CustomToolDefinition,
  params: Record<string, any>,
  context: ToolContext,
  options: ExecuteHttpToolOptions
): Promise<ToolResult> {
  const { http } = toolConfig;

  // Build credential map
  const credentials: Record<string, string> = {};
  if (options.credentialOverride) {
    credentials.token = options.credentialOverride;
    credentials.key = options.credentialOverride;
    credentials.api_key = options.credentialOverride;
  }

  // Resolve URL template
  let resolvedUrl = resolveTemplate(http.url_template, params, credentials);

  // Add query params
  if (http.query_params) {
    const url = new URL(resolvedUrl);
    for (const [key, value] of Object.entries(http.query_params)) {
      url.searchParams.set(key, resolveTemplate(value, params, credentials));
    }
    resolvedUrl = url.toString();
  }

  // Validate URL (SSRF protection)
  const urlCheck = validateUrl(resolvedUrl, options.allowedDomains);
  if (!urlCheck.valid) {
    return { success: false, error: urlCheck.error };
  }

  // Build headers
  const headers: Record<string, string> = {
    "User-Agent": "PerpetualCore-CustomSkill/1.0",
    Accept: "application/json",
  };

  // Add auth headers
  if (!options.credentialOverride) {
    const authHeaders = await resolveAuthHeaders(options.authType, options.authConfig, context);
    Object.assign(headers, authHeaders);
  } else {
    // Apply auth directly from override
    switch (options.authType) {
      case "bearer":
        headers.Authorization = `${options.authConfig.prefix || "Bearer"} ${options.credentialOverride}`;
        break;
      case "api_key":
        headers[options.authConfig.header_name || "X-API-Key"] = options.credentialOverride;
        break;
      case "basic":
        headers.Authorization = `Basic ${Buffer.from(options.credentialOverride).toString("base64")}`;
        break;
      case "custom_header":
        if (options.authConfig.header_name) {
          headers[options.authConfig.header_name] = options.credentialOverride;
        }
        break;
    }
  }

  // Add custom headers from config
  if (http.headers) {
    for (const [key, value] of Object.entries(http.headers)) {
      headers[resolveTemplate(key, params, credentials)] = resolveTemplate(
        value,
        params,
        credentials
      );
    }
  }

  // Build body
  let body: string | undefined;
  if (http.body_template && http.method !== "GET") {
    const resolved = resolveDeep(http.body_template, params, credentials);
    body = JSON.stringify(resolved);
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  }

  // Timeout
  const timeoutMs = Math.min(http.timeout_ms || DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(resolvedUrl, {
      method: http.method,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check response size via Content-Length header
    const contentLength = response.headers.get("Content-Length");
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
      return { success: false, error: "Response too large (> 1MB)" };
    }

    const text = await response.text();
    if (text.length > MAX_RESPONSE_SIZE) {
      return { success: false, error: "Response too large (> 1MB)" };
    }

    // Parse response
    let responseData: any;
    try {
      responseData = JSON.parse(text);
    } catch {
      responseData = text;
    }

    // Check for HTTP errors
    if (!response.ok) {
      const errorMessage =
        http.response_mapping?.error_path && typeof responseData === "object"
          ? getNestedValue(responseData, http.response_mapping.error_path)
          : typeof responseData === "string"
            ? responseData
            : `HTTP ${response.status}: ${response.statusText}`;

      return {
        success: false,
        error: String(errorMessage),
        data: responseData,
      };
    }

    // Map response
    const mapped = mapResponse(responseData, http.response_mapping);

    return {
      success: true,
      data: mapped.data,
      display: mapped.display,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      return { success: false, error: `Request timed out after ${timeoutMs}ms` };
    }

    return {
      success: false,
      error: error.message || "HTTP request failed",
    };
  }
}
