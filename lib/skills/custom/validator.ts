/**
 * Custom Skill Validator
 *
 * Validates skill definitions before saving to the database.
 * Enforces security constraints and schema correctness.
 */

import type { CreateCustomSkillInput, CustomToolDefinition, HttpToolConfig } from "./types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
const TOOL_NAME_REGEX = /^[a-z][a-z0-9_]{1,48}[a-z0-9]$/;
const MAX_TOOLS_PER_SKILL = 10;
const VALID_PARAM_TYPES = ["string", "number", "boolean", "integer", "array"];
const VALID_CATEGORIES = [
  "communication",
  "productivity",
  "development",
  "media",
  "voice",
  "automation",
  "analytics",
  "integration",
  "utility",
];

// Private/internal hosts that must be blocked
const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\.0\.0\.0$/,
  /^169\.254\./,
  /^metadata\./i,
  /\.internal$/i,
  /\.local$/i,
];

/**
 * Validate a complete custom skill input
 */
export function validateCustomSkill(input: CreateCustomSkillInput): ValidationResult {
  const errors: string[] = [];

  // Name
  if (!input.name || input.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters");
  }
  if (input.name && input.name.length > 100) {
    errors.push("Name must be under 100 characters");
  }

  // Slug
  if (!input.slug) {
    errors.push("Slug is required");
  } else if (!SLUG_REGEX.test(input.slug)) {
    errors.push("Slug must be 3-50 chars, lowercase alphanumeric and hyphens, cannot start/end with hyphen");
  }

  // Description
  if (input.description && input.description.length > 500) {
    errors.push("Description must be under 500 characters");
  }

  // Category
  if (input.category && !VALID_CATEGORIES.includes(input.category)) {
    errors.push(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`);
  }

  // Tags
  if (input.tags && input.tags.length > 10) {
    errors.push("Maximum 10 tags allowed");
  }

  // Visibility
  if (input.visibility && !["private", "organization", "public"].includes(input.visibility)) {
    errors.push("Visibility must be private, organization, or public");
  }

  // Tools
  if (!input.tools || input.tools.length === 0) {
    errors.push("At least one tool is required");
  } else if (input.tools.length > MAX_TOOLS_PER_SKILL) {
    errors.push(`Maximum ${MAX_TOOLS_PER_SKILL} tools per skill`);
  } else {
    // Validate each tool
    const toolNames = new Set<string>();
    for (let i = 0; i < input.tools.length; i++) {
      const toolErrors = validateTool(input.tools[i], i);
      errors.push(...toolErrors);

      if (toolNames.has(input.tools[i].name)) {
        errors.push(`Duplicate tool name: ${input.tools[i].name}`);
      }
      toolNames.add(input.tools[i].name);
    }
  }

  // Auth consistency: credential placeholders require auth_type
  if (input.auth_type === "none" || !input.auth_type) {
    const hasCredentialPlaceholder = JSON.stringify(input.tools).includes("{{credential:");
    if (hasCredentialPlaceholder) {
      errors.push("Tools use {{credential:...}} placeholders but auth_type is 'none'. Set an auth_type.");
    }
  }

  // Allowed domains must match tool URL domains
  if (input.allowed_domains && input.allowed_domains.length > 0 && input.tools) {
    for (const tool of input.tools) {
      const domainCheck = validateToolUrlDomains(tool.http, input.allowed_domains);
      if (!domainCheck.valid) {
        errors.push(...domainCheck.errors);
      }
    }
  }

  // System prompt length
  if (input.system_prompt && input.system_prompt.length > 5000) {
    errors.push("System prompt must be under 5000 characters");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a single tool definition
 */
function validateTool(tool: CustomToolDefinition, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Tool[${index}]`;

  // Name
  if (!tool.name) {
    errors.push(`${prefix}: name is required`);
  } else if (!TOOL_NAME_REGEX.test(tool.name)) {
    errors.push(
      `${prefix}: name must be 3-50 chars, lowercase alphanumeric and underscores, start with letter`
    );
  }

  // Description
  if (!tool.description || tool.description.trim().length < 5) {
    errors.push(`${prefix}: description must be at least 5 characters`);
  }
  if (tool.description && tool.description.length > 300) {
    errors.push(`${prefix}: description must be under 300 characters`);
  }

  // Parameters
  if (!tool.parameters || tool.parameters.type !== "object") {
    errors.push(`${prefix}: parameters must be a JSON Schema object`);
  } else if (tool.parameters.properties) {
    for (const [paramName, param] of Object.entries(tool.parameters.properties)) {
      if (!VALID_PARAM_TYPES.includes(param.type)) {
        errors.push(`${prefix}: parameter '${paramName}' has invalid type '${param.type}'`);
      }
      if (!param.description) {
        errors.push(`${prefix}: parameter '${paramName}' must have a description`);
      }
    }
  }

  // HTTP config
  const httpErrors = validateHttpConfig(tool.http, prefix);
  errors.push(...httpErrors);

  return errors;
}

/**
 * Validate HTTP configuration
 */
function validateHttpConfig(http: HttpToolConfig, prefix: string): string[] {
  const errors: string[] = [];

  if (!http) {
    errors.push(`${prefix}: http configuration is required`);
    return errors;
  }

  // Method
  const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  if (!validMethods.includes(http.method)) {
    errors.push(`${prefix}: method must be one of ${validMethods.join(", ")}`);
  }

  // URL template
  if (!http.url_template) {
    errors.push(`${prefix}: url_template is required`);
  } else {
    // Check for HTTPS (allow template placeholders in domain for flexibility)
    if (!http.url_template.startsWith("https://")) {
      errors.push(`${prefix}: url_template must use HTTPS`);
    }

    // Check for blocked hosts (only if URL doesn't contain template vars in host)
    try {
      // Replace template vars with safe values for URL parsing
      const testUrl = http.url_template.replace(/\{\{[^}]+\}\}/g, "test");
      const parsed = new URL(testUrl);
      if (BLOCKED_HOST_PATTERNS.some((p) => p.test(parsed.hostname))) {
        errors.push(`${prefix}: url_template cannot point to private/internal addresses`);
      }
    } catch {
      // URL might have templates in the host part, which is ok
    }
  }

  // Timeout
  if (http.timeout_ms !== undefined) {
    if (http.timeout_ms < 1000 || http.timeout_ms > 30000) {
      errors.push(`${prefix}: timeout_ms must be between 1000 and 30000`);
    }
  }

  // Response mapping display type
  if (http.response_mapping?.display?.type) {
    const validTypes = ["text", "markdown", "table", "card"];
    if (!validTypes.includes(http.response_mapping.display.type)) {
      errors.push(`${prefix}: display type must be one of ${validTypes.join(", ")}`);
    }
  }

  return errors;
}

/**
 * Validate that tool URL domains match allowed_domains
 */
function validateToolUrlDomains(
  http: HttpToolConfig,
  allowedDomains: string[]
): ValidationResult {
  const errors: string[] = [];

  if (!http.url_template) return { valid: true, errors: [] };

  try {
    const testUrl = http.url_template.replace(/\{\{[^}]+\}\}/g, "test");
    const parsed = new URL(testUrl);

    const domainAllowed = allowedDomains.some((domain) => {
      const d = domain.toLowerCase();
      const h = parsed.hostname.toLowerCase();
      return h === d || h.endsWith(`.${d}`);
    });

    if (!domainAllowed) {
      errors.push(
        `URL domain '${parsed.hostname}' is not in the allowed domains list. Add it to allowed_domains.`
      );
    }
  } catch {
    // Template vars in host, can't validate
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Generate a slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}
