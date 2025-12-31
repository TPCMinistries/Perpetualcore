/**
 * Feature Gating Module
 *
 * Provides tier-based feature access control with:
 * - Feature flags with per-tier configuration
 * - Organization-level overrides
 * - Beta access management
 * - API route gating middleware
 */

// Feature flags
export {
  checkFeatureAccess,
  getOrganizationFeatures,
  getAllFeatureFlags,
  getFeaturesByCategory,
  checkFeatureLimit,
  grantFeatureOverride,
  revokeFeatureOverride,
  getBetaFeatures,
  type FeatureFlag,
  type FeatureAccess,
  type OrganizationFeature,
  type PlanType,
} from './flags';

// Feature gating
export {
  gateFeature,
  gateFeatureWithLimit,
  createGatedResponse,
  withFeatureGate,
  gateMultipleFeatures,
  getFeatureGateData,
  type GateResult,
} from './gate';

// Feature matrix
export {
  FEATURE_MATRIX,
  FEATURE_CATEGORIES,
  getFeatureForPlan,
  isFeatureAvailable,
  getFeatureLimit,
  getMinimumPlanForFeature,
  getFeaturesForPlan,
  getUpgradeFeatures,
  getAdditionalFeatures,
  type FeatureLimit,
} from './matrix';
