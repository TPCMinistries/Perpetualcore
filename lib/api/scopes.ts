/**
 * API Scopes Configuration
 * Defines all available API permission scopes
 */

export interface ScopeDefinition {
  name: string;
  category: string;
  description: string;
  isSensitive: boolean;
  requiredTier: string;
}

export const API_SCOPES: Record<string, ScopeDefinition> = {
  // Chat
  "chat:read": {
    name: "chat:read",
    category: "chat",
    description: "Read conversations and messages",
    isSensitive: false,
    requiredTier: "pro",
  },
  "chat:write": {
    name: "chat:write",
    category: "chat",
    description: "Send messages, create conversations",
    isSensitive: false,
    requiredTier: "pro",
  },

  // Documents
  "documents:read": {
    name: "documents:read",
    category: "documents",
    description: "Read documents and search",
    isSensitive: false,
    requiredTier: "pro",
  },
  "documents:write": {
    name: "documents:write",
    category: "documents",
    description: "Upload and modify documents",
    isSensitive: false,
    requiredTier: "pro",
  },
  "documents:delete": {
    name: "documents:delete",
    category: "documents",
    description: "Delete documents",
    isSensitive: true,
    requiredTier: "pro",
  },

  // Search/RAG
  "search:read": {
    name: "search:read",
    category: "search",
    description: "Perform RAG searches",
    isSensitive: false,
    requiredTier: "pro",
  },

  // Workflows
  "workflows:read": {
    name: "workflows:read",
    category: "workflows",
    description: "Read workflow definitions",
    isSensitive: false,
    requiredTier: "pro",
  },
  "workflows:execute": {
    name: "workflows:execute",
    category: "workflows",
    description: "Trigger workflow execution",
    isSensitive: false,
    requiredTier: "pro",
  },
  "workflows:write": {
    name: "workflows:write",
    category: "workflows",
    description: "Create and modify workflows",
    isSensitive: true,
    requiredTier: "team",
  },

  // Agents
  "agents:read": {
    name: "agents:read",
    category: "agents",
    description: "Read agent configurations",
    isSensitive: false,
    requiredTier: "pro",
  },
  "agents:execute": {
    name: "agents:execute",
    category: "agents",
    description: "Trigger agent tasks",
    isSensitive: false,
    requiredTier: "pro",
  },
  "agents:write": {
    name: "agents:write",
    category: "agents",
    description: "Create and modify agents",
    isSensitive: true,
    requiredTier: "team",
  },

  // Webhooks
  "webhooks:read": {
    name: "webhooks:read",
    category: "webhooks",
    description: "Read webhook configurations",
    isSensitive: false,
    requiredTier: "pro",
  },
  "webhooks:write": {
    name: "webhooks:write",
    category: "webhooks",
    description: "Manage webhooks",
    isSensitive: false,
    requiredTier: "pro",
  },

  // Users
  "users:read": {
    name: "users:read",
    category: "users",
    description: "Read team members",
    isSensitive: false,
    requiredTier: "team",
  },
  "users:write": {
    name: "users:write",
    category: "users",
    description: "Manage team members",
    isSensitive: true,
    requiredTier: "team",
  },

  // Admin
  "admin:read": {
    name: "admin:read",
    category: "admin",
    description: "Read organization settings",
    isSensitive: true,
    requiredTier: "business",
  },
  "admin:write": {
    name: "admin:write",
    category: "admin",
    description: "Modify organization settings",
    isSensitive: true,
    requiredTier: "business",
  },
};

/**
 * Scope categories for grouping in UI
 */
export const SCOPE_CATEGORIES = {
  chat: {
    name: "Chat",
    description: "Conversation and messaging",
    scopes: ["chat:read", "chat:write"],
  },
  documents: {
    name: "Documents",
    description: "Document management and RAG",
    scopes: ["documents:read", "documents:write", "documents:delete", "search:read"],
  },
  automation: {
    name: "Automation",
    description: "Workflows and agents",
    scopes: ["workflows:read", "workflows:execute", "workflows:write", "agents:read", "agents:execute", "agents:write"],
  },
  webhooks: {
    name: "Webhooks",
    description: "Webhook management",
    scopes: ["webhooks:read", "webhooks:write"],
  },
  team: {
    name: "Team",
    description: "Team and user management",
    scopes: ["users:read", "users:write"],
  },
  admin: {
    name: "Admin",
    description: "Organization administration",
    scopes: ["admin:read", "admin:write"],
  },
};

/**
 * Default scopes for new API keys by tier
 */
export const DEFAULT_SCOPES_BY_TIER: Record<string, string[]> = {
  free: [],
  starter: [],
  pro: ["chat:read", "chat:write", "documents:read", "search:read"],
  team: ["chat:read", "chat:write", "documents:read", "documents:write", "search:read", "workflows:read", "workflows:execute"],
  business: ["chat:read", "chat:write", "documents:read", "documents:write", "search:read", "workflows:read", "workflows:execute", "workflows:write", "agents:read", "agents:execute"],
  enterprise: Object.keys(API_SCOPES), // All scopes
};

/**
 * Get scopes available for a tier
 */
export function getScopesForTier(tier: string): string[] {
  const tierOrder: Record<string, number> = {
    free: 0,
    starter: 1,
    pro: 2,
    team: 3,
    business: 4,
    enterprise: 5,
  };

  const userTierLevel = tierOrder[tier] ?? 0;

  return Object.entries(API_SCOPES)
    .filter(([_, scope]) => {
      const requiredLevel = tierOrder[scope.requiredTier] ?? 0;
      return requiredLevel <= userTierLevel;
    })
    .map(([name]) => name);
}

/**
 * Validate scopes are available for tier
 */
export function validateScopesForTier(
  requestedScopes: string[],
  tier: string
): { valid: boolean; invalidScopes: string[] } {
  const availableScopes = getScopesForTier(tier);
  const invalidScopes = requestedScopes.filter(
    (scope) => !availableScopes.includes(scope)
  );

  return {
    valid: invalidScopes.length === 0,
    invalidScopes,
  };
}

/**
 * Get scope by name
 */
export function getScope(name: string): ScopeDefinition | undefined {
  return API_SCOPES[name];
}

/**
 * Check if scope is sensitive
 */
export function isSensitiveScope(name: string): boolean {
  return API_SCOPES[name]?.isSensitive ?? false;
}
