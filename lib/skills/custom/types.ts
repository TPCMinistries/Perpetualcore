/**
 * Custom Skills Type Definitions
 *
 * Custom skills use a declarative HTTP execution model:
 * Users define URL, method, headers, body template -> system makes requests safely.
 * No arbitrary code execution.
 */

import type { SkillCategory } from "../types";

// ========================================
// HTTP Tool Configuration
// ========================================

export interface HttpToolConfig {
  /** HTTP method */
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** URL with {{param}} placeholders, e.g. "https://api.example.com/users/{{user_id}}" */
  url_template: string;
  /** Headers with optional {{credential:key}} placeholders */
  headers?: Record<string, string>;
  /** JSON body template with {{param}} placeholders */
  body_template?: any;
  /** Query parameters with {{param}} placeholders */
  query_params?: Record<string, string>;
  /** How to extract and display the response */
  response_mapping?: {
    /** Dot-notation path to success data, e.g. "data.results" */
    success_path?: string;
    /** Dot-notation path to error message */
    error_path?: string;
    /** Display formatting */
    display?: {
      type: "text" | "markdown" | "table" | "card";
      title_path?: string;
      description_path?: string;
    };
  };
  /** Request timeout in ms (default 10000, max 30000) */
  timeout_ms?: number;
}

// ========================================
// Custom Tool Definition
// ========================================

export interface CustomToolDefinition {
  /** Tool name (lowercase, underscores, 3-50 chars) */
  name: string;
  /** Tool description for AI */
  description: string;
  /** JSON Schema for parameters */
  parameters: {
    type: "object";
    properties: Record<string, ToolParameterSchema>;
    required?: string[];
  };
  /** HTTP execution config */
  http: HttpToolConfig;
}

export interface ToolParameterSchema {
  type: "string" | "number" | "boolean" | "integer" | "array";
  description: string;
  enum?: string[];
  default?: any;
  items?: { type: string };
}

// ========================================
// Auth Configuration
// ========================================

export type CustomSkillAuthType =
  | "none"
  | "api_key"
  | "bearer"
  | "basic"
  | "custom_header";

export interface AuthConfig {
  /** Header name for api_key/custom_header types */
  header_name?: string;
  /** Prefix for bearer type (default "Bearer") */
  prefix?: string;
  /** Label shown to users when configuring credentials */
  credential_label?: string;
  /** Help text for credential setup */
  credential_help?: string;
}

// ========================================
// Custom Skill Record (mirrors DB)
// ========================================

export interface CustomSkillRecord {
  id: string;
  creator_id: string;
  organization_id: string | null;
  name: string;
  slug: string;
  description: string;
  category: SkillCategory;
  tags: string[];
  icon: string;
  color: string | null;
  visibility: "private" | "organization" | "public";
  is_published: boolean;
  system_prompt: string | null;
  config_schema: Record<string, any>;
  default_config: Record<string, any>;
  tools: CustomToolDefinition[];
  auth_type: CustomSkillAuthType;
  auth_config: AuthConfig;
  allowed_domains: string[];
  install_count: number;
  execution_count: number;
  created_at: string;
  updated_at: string;
}

// ========================================
// API Request/Response Types
// ========================================

export interface CreateCustomSkillInput {
  name: string;
  slug: string;
  description: string;
  category?: SkillCategory;
  tags?: string[];
  icon?: string;
  color?: string;
  visibility?: "private" | "organization" | "public";
  system_prompt?: string;
  config_schema?: Record<string, any>;
  default_config?: Record<string, any>;
  tools: CustomToolDefinition[];
  auth_type?: CustomSkillAuthType;
  auth_config?: AuthConfig;
  allowed_domains?: string[];
}

export interface UpdateCustomSkillInput extends Partial<CreateCustomSkillInput> {
  is_published?: boolean;
}

export interface TestToolInput {
  tool_index: number;
  params: Record<string, any>;
  credential_value?: string;
}
