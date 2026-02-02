/**
 * Skills Framework Types
 *
 * Skills are modular capabilities that extend Perpetual Core.
 * Similar to OpenClaw's skill system but designed for managed SaaS.
 */

export interface Skill {
  // Identity
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;

  // Categorization
  category: SkillCategory;
  tags: string[];

  // Display
  icon: string; // Emoji or icon name
  color?: string; // Brand color

  // Requirements
  requiredEnvVars?: string[];
  requiredScopes?: string[];
  requiredIntegrations?: string[];

  // Pricing
  tier: "free" | "pro" | "enterprise";
  isBuiltIn: boolean;

  // Capabilities
  tools: SkillTool[];
  triggers?: SkillTrigger[];

  // AI Context
  systemPrompt?: string; // Instructions for AI when skill is active

  // Configuration
  configSchema?: Record<string, ConfigField>;
  defaultConfig?: Record<string, any>;
}

export type SkillCategory =
  | "communication"
  | "productivity"
  | "development"
  | "media"
  | "voice"
  | "automation"
  | "analytics"
  | "integration"
  | "utility";

export interface SkillTool {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, ToolParameter>;
    required?: string[];
  };
  execute: (params: any, context: ToolContext) => Promise<ToolResult>;
}

export interface ToolParameter {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  enum?: string[];
  default?: any;
}

export interface ToolContext {
  userId: string;
  organizationId: string;
  skillConfig: Record<string, any>;
  conversationId?: string;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  display?: {
    type: "text" | "markdown" | "table" | "card";
    content: any;
  };
}

export interface SkillTrigger {
  type: "schedule" | "webhook" | "event";
  config: Record<string, any>;
  handler: (payload: any, context: ToolContext) => Promise<void>;
}

export interface ConfigField {
  type: "string" | "number" | "boolean" | "select" | "multiselect";
  label: string;
  description?: string;
  required?: boolean;
  default?: any;
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export interface UserSkillConfig {
  skillId: string;
  enabled: boolean;
  config: Record<string, any>;
  installedAt: string;
  lastUsedAt?: string;
}

export interface SkillExecutionLog {
  id: string;
  userId: string;
  skillId: string;
  toolName: string;
  input: any;
  output: ToolResult;
  durationMs: number;
  executedAt: string;
}
