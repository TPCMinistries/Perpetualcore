/**
 * Feature Matrix Configuration
 * Central configuration for all feature access by tier
 *
 * Values:
 * - true: Feature enabled
 * - false: Feature disabled
 * - number: Limit (e.g., 5 means 5 allowed, -1 means unlimited)
 */

export type PlanType = 'free' | 'starter' | 'pro' | 'team' | 'business' | 'enterprise';

export interface FeatureLimit {
  free: boolean | number;
  starter: boolean | number;
  pro: boolean | number;
  team: boolean | number;
  business: boolean | number;
  enterprise: boolean | number;
}

export const FEATURE_MATRIX: Record<string, FeatureLimit> = {
  // ========================================
  // AI FEATURES
  // ========================================
  'basic_ai_models': {
    free: true,
    starter: true,
    pro: true,
    team: true,
    business: true,
    enterprise: true,
  },
  'premium_ai_models': {
    free: false,
    starter: 100, // 100 requests/month
    pro: -1,      // Unlimited
    team: -1,
    business: -1,
    enterprise: -1,
  },
  'ai_agents': {
    free: false,
    starter: 1,
    pro: 5,
    team: 10,
    business: 50,
    enterprise: -1,
  },
  'custom_training': {
    free: false,
    starter: false,
    pro: false,
    team: false,
    business: true,
    enterprise: true,
  },

  // ========================================
  // INTEGRATIONS
  // ========================================
  'custom_bots': {
    free: false,
    starter: false,
    pro: 3,
    team: 10,
    business: 50,
    enterprise: -1,
  },
  'api_access': {
    free: false,
    starter: false,
    pro: true,
    team: true,
    business: true,
    enterprise: true,
  },
  'webhooks': {
    free: false,
    starter: false,
    pro: 5,
    team: 20,
    business: 100,
    enterprise: -1,
  },
  'email_integration': {
    free: false,
    starter: true,
    pro: true,
    team: true,
    business: true,
    enterprise: true,
  },
  'calendar_integration': {
    free: false,
    starter: true,
    pro: true,
    team: true,
    business: true,
    enterprise: true,
  },
  'whatsapp': {
    free: false,
    starter: false,
    pro: false,
    team: false,
    business: true,
    enterprise: true,
  },
  'slack_integration': {
    free: false,
    starter: false,
    pro: false,
    team: true,
    business: true,
    enterprise: true,
  },

  // ========================================
  // TEAM FEATURES
  // ========================================
  'team_members': {
    free: 1,
    starter: 1,
    pro: 1,
    team: 10,
    business: 50,
    enterprise: 250,
  },
  'sso_saml': {
    free: false,
    starter: false,
    pro: false,
    team: true,
    business: true,
    enterprise: true,
  },
  'rbac': {
    free: false,
    starter: false,
    pro: false,
    team: true,
    business: true,
    enterprise: true,
  },
  'audit_logs': {
    free: false,
    starter: false,
    pro: false,
    team: false,
    business: true,
    enterprise: true,
  },

  // ========================================
  // STORAGE & DOCUMENTS
  // ========================================
  'document_storage_gb': {
    free: 1,
    starter: 10,
    pro: 50,
    team: 200,
    business: 1000,
    enterprise: -1,
  },
  'document_upload': {
    free: 5,
    starter: -1,
    pro: -1,
    team: -1,
    business: -1,
    enterprise: -1,
  },

  // ========================================
  // WORKFLOWS & AUTOMATION
  // ========================================
  'workflows': {
    free: 5,
    starter: -1,
    pro: -1,
    team: -1,
    business: -1,
    enterprise: -1,
  },

  // ========================================
  // BRANDING & WHITE-LABEL
  // ========================================
  'white_label': {
    free: false,
    starter: false,
    pro: false,
    team: false,
    business: false,
    enterprise: true,
  },
  'custom_domain': {
    free: false,
    starter: false,
    pro: false,
    team: false,
    business: false,
    enterprise: true,
  },
  'custom_logo': {
    free: false,
    starter: false,
    pro: false,
    team: false,
    business: true,
    enterprise: true,
  },

  // ========================================
  // SUPPORT
  // ========================================
  'priority_support': {
    free: false,
    starter: true,
    pro: true,
    team: true,
    business: true,
    enterprise: true,
  },
  'dedicated_csm': {
    free: false,
    starter: false,
    pro: false,
    team: true,
    business: true,
    enterprise: true,
  },
  'phone_support': {
    free: false,
    starter: false,
    pro: false,
    team: false,
    business: true,
    enterprise: true,
  },
  'support_24_7': {
    free: false,
    starter: false,
    pro: false,
    team: false,
    business: false,
    enterprise: true,
  },
};

/**
 * Get feature access for a specific plan
 */
export function getFeatureForPlan(
  featureSlug: string,
  plan: PlanType
): boolean | number {
  const feature = FEATURE_MATRIX[featureSlug];
  if (!feature) return false;
  return feature[plan];
}

/**
 * Check if feature is available for a plan
 */
export function isFeatureAvailable(
  featureSlug: string,
  plan: PlanType
): boolean {
  const access = getFeatureForPlan(featureSlug, plan);
  if (typeof access === 'boolean') return access;
  if (typeof access === 'number') return access !== 0;
  return false;
}

/**
 * Get the feature limit for a plan (-1 = unlimited, 0 = none)
 */
export function getFeatureLimit(
  featureSlug: string,
  plan: PlanType
): number {
  const access = getFeatureForPlan(featureSlug, plan);
  if (typeof access === 'number') return access;
  if (access === true) return -1;
  return 0;
}

/**
 * Get minimum plan required for a feature
 */
export function getMinimumPlanForFeature(featureSlug: string): PlanType {
  const feature = FEATURE_MATRIX[featureSlug];
  if (!feature) return 'enterprise';

  const plans: PlanType[] = ['free', 'starter', 'pro', 'team', 'business', 'enterprise'];

  for (const plan of plans) {
    const access = feature[plan];
    if (access === true || (typeof access === 'number' && access !== 0)) {
      return plan;
    }
  }

  return 'enterprise';
}

/**
 * Get all features available for a plan
 */
export function getFeaturesForPlan(plan: PlanType): string[] {
  return Object.entries(FEATURE_MATRIX)
    .filter(([_, limits]) => {
      const access = limits[plan];
      return access === true || (typeof access === 'number' && access !== 0);
    })
    .map(([slug]) => slug);
}

/**
 * Get features that require upgrade from current plan
 */
export function getUpgradeFeatures(currentPlan: PlanType): string[] {
  const currentFeatures = new Set(getFeaturesForPlan(currentPlan));

  return Object.keys(FEATURE_MATRIX).filter(
    (slug) => !currentFeatures.has(slug)
  );
}

/**
 * Compare two plans and get additional features
 */
export function getAdditionalFeatures(
  fromPlan: PlanType,
  toPlan: PlanType
): string[] {
  const fromFeatures = new Set(getFeaturesForPlan(fromPlan));
  const toFeatures = getFeaturesForPlan(toPlan);

  return toFeatures.filter((f) => !fromFeatures.has(f));
}

/**
 * Feature categories for UI grouping
 */
export const FEATURE_CATEGORIES = {
  ai: {
    name: 'AI Features',
    description: 'AI models, agents, and training',
    features: ['basic_ai_models', 'premium_ai_models', 'ai_agents', 'custom_training'],
  },
  integrations: {
    name: 'Integrations',
    description: 'Connect with external tools and services',
    features: ['custom_bots', 'api_access', 'webhooks', 'email_integration', 'calendar_integration', 'whatsapp', 'slack_integration'],
  },
  team: {
    name: 'Team & Security',
    description: 'Team management and security features',
    features: ['team_members', 'sso_saml', 'rbac', 'audit_logs'],
  },
  storage: {
    name: 'Storage & Documents',
    description: 'Document management and storage',
    features: ['document_storage_gb', 'document_upload'],
  },
  automation: {
    name: 'Automation',
    description: 'Workflow automation tools',
    features: ['workflows'],
  },
  branding: {
    name: 'Branding',
    description: 'White-label and customization',
    features: ['white_label', 'custom_domain', 'custom_logo'],
  },
  support: {
    name: 'Support',
    description: 'Customer support options',
    features: ['priority_support', 'dedicated_csm', 'phone_support', 'support_24_7'],
  },
};
