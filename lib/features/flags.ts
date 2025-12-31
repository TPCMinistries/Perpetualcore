import { createClient } from "@/lib/supabase/server";

export type PlanType = 'free' | 'starter' | 'pro' | 'team' | 'business' | 'enterprise';

export interface FeatureFlag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  tier_access: Record<PlanType, boolean | number>;
  is_enabled: boolean;
  is_beta: boolean;
  is_deprecated: boolean;
  rollout_percentage: number;
}

export interface FeatureAccess {
  allowed: boolean;
  limit: number; // -1 = unlimited, 0 = none, positive = limit
  source: 'plan' | 'override' | 'beta';
  reason?: string;
  expiresAt?: string;
}

export interface OrganizationFeature {
  feature_slug: string;
  feature_name: string;
  category: string;
  allowed: boolean;
  feature_limit: number;
  source: string;
  expires_at: string | null;
}

/**
 * Check if an organization has access to a specific feature
 */
export async function checkFeatureAccess(
  organizationId: string,
  featureSlug: string
): Promise<FeatureAccess> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('check_feature_access', {
    p_org_id: organizationId,
    p_feature_slug: featureSlug,
  });

  if (error) {
    console.error('[Features] Error checking feature access:', error);
    return { allowed: false, limit: 0, source: 'plan', reason: 'Error checking access' };
  }

  return {
    allowed: data.allowed || false,
    limit: data.limit ?? 0,
    source: data.source || 'plan',
    reason: data.reason,
    expiresAt: data.expires_at,
  };
}

/**
 * Get all features with access status for an organization
 */
export async function getOrganizationFeatures(
  organizationId: string
): Promise<OrganizationFeature[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_organization_features', {
    p_org_id: organizationId,
  });

  if (error) {
    console.error('[Features] Error getting org features:', error);
    return [];
  }

  return data as OrganizationFeature[];
}

/**
 * Get all feature flags
 */
export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('is_enabled', true)
    .order('category')
    .order('name');

  if (error) {
    console.error('[Features] Error fetching flags:', error);
    return [];
  }

  return data as FeatureFlag[];
}

/**
 * Get features by category
 */
export async function getFeaturesByCategory(
  category: string
): Promise<FeatureFlag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('category', category)
    .eq('is_enabled', true)
    .order('name');

  if (error) {
    console.error('[Features] Error fetching category flags:', error);
    return [];
  }

  return data as FeatureFlag[];
}

/**
 * Check if user is within feature limit
 */
export async function checkFeatureLimit(
  organizationId: string,
  featureSlug: string,
  currentUsage: number
): Promise<{
  withinLimit: boolean;
  limit: number;
  remaining: number;
  percentUsed: number;
}> {
  const access = await checkFeatureAccess(organizationId, featureSlug);

  if (!access.allowed) {
    return { withinLimit: false, limit: 0, remaining: 0, percentUsed: 100 };
  }

  // -1 means unlimited
  if (access.limit === -1) {
    return { withinLimit: true, limit: -1, remaining: -1, percentUsed: 0 };
  }

  const remaining = Math.max(access.limit - currentUsage, 0);
  const percentUsed = access.limit > 0 ? (currentUsage / access.limit) * 100 : 0;

  return {
    withinLimit: currentUsage < access.limit,
    limit: access.limit,
    remaining,
    percentUsed,
  };
}

/**
 * Grant feature override to an organization
 */
export async function grantFeatureOverride(
  organizationId: string,
  featureSlug: string,
  options: {
    isEnabled?: boolean;
    limitOverride?: number;
    expiresAt?: Date;
    reason?: string;
    grantedBy?: string;
  }
): Promise<boolean> {
  const supabase = await createClient();

  // Get feature ID
  const { data: feature } = await supabase
    .from('feature_flags')
    .select('id')
    .eq('slug', featureSlug)
    .single();

  if (!feature) {
    console.error('[Features] Feature not found:', featureSlug);
    return false;
  }

  const { error } = await supabase
    .from('organization_feature_overrides')
    .upsert({
      organization_id: organizationId,
      feature_id: feature.id,
      is_enabled: options.isEnabled,
      limit_override: options.limitOverride,
      expires_at: options.expiresAt?.toISOString(),
      reason: options.reason,
      granted_by: options.grantedBy,
    }, {
      onConflict: 'organization_id,feature_id',
    });

  if (error) {
    console.error('[Features] Error granting override:', error);
    return false;
  }

  return true;
}

/**
 * Revoke feature override
 */
export async function revokeFeatureOverride(
  organizationId: string,
  featureSlug: string
): Promise<boolean> {
  const supabase = await createClient();

  // Get feature ID
  const { data: feature } = await supabase
    .from('feature_flags')
    .select('id')
    .eq('slug', featureSlug)
    .single();

  if (!feature) {
    return false;
  }

  const { error } = await supabase
    .from('organization_feature_overrides')
    .delete()
    .eq('organization_id', organizationId)
    .eq('feature_id', feature.id);

  if (error) {
    console.error('[Features] Error revoking override:', error);
    return false;
  }

  return true;
}

/**
 * Get beta features for organization
 */
export async function getBetaFeatures(
  organizationId: string
): Promise<FeatureFlag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('beta_access')
    .select(`
      feature:feature_flags(*)
    `)
    .eq('organization_id', organizationId)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (error) {
    console.error('[Features] Error getting beta features:', error);
    return [];
  }

  return data
    .map((d: any) => d.feature)
    .filter(Boolean) as FeatureFlag[];
}
