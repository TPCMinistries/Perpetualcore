/**
 * Public API Module
 * Exports API authentication, middleware, and scope utilities
 */

export {
  hashApiKey,
  generateApiKey,
  extractApiKey,
  validateApiKey,
  hasScope,
  logApiUsage,
  withApiAuth,
  rateLimitResponse,
  type APIKeyValidation,
  type APIContext,
} from "./middleware";

export {
  API_SCOPES,
  SCOPE_CATEGORIES,
  DEFAULT_SCOPES_BY_TIER,
  getScopesForTier,
  validateScopesForTier,
  getScope,
  isSensitiveScope,
  type ScopeDefinition,
} from "./scopes";
