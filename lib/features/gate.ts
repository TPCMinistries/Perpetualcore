import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkFeatureAccess, checkFeatureLimit, FeatureAccess } from "./flags";

export interface GateResult {
  allowed: boolean;
  reason?: string;
  feature?: string;
  limit?: number;
  upgrade?: {
    requiredPlan: string;
    currentPlan: string;
  };
}

/**
 * Feature gate for API routes
 * Use in API route handlers to check feature access
 */
export async function gateFeature(
  feature: string,
  organizationId?: string
): Promise<GateResult> {
  const supabase = await createClient();

  // Get org ID if not provided
  let orgId = organizationId;
  if (!orgId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { allowed: false, reason: 'Not authenticated' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return { allowed: false, reason: 'No organization found' };
    }
    orgId = profile.organization_id;
  }

  const access = await checkFeatureAccess(orgId, feature);

  if (!access.allowed) {
    // Get current plan for upgrade suggestion
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('organization_id', orgId)
      .single();

    return {
      allowed: false,
      reason: access.reason || `Feature '${feature}' not available`,
      feature,
      upgrade: {
        currentPlan: subscription?.plan || 'free',
        requiredPlan: getRequiredPlanForFeature(feature),
      },
    };
  }

  return {
    allowed: true,
    feature,
    limit: access.limit,
  };
}

/**
 * Feature gate with usage limit check
 */
export async function gateFeatureWithLimit(
  feature: string,
  currentUsage: number,
  organizationId?: string
): Promise<GateResult & { remaining?: number; percentUsed?: number }> {
  const supabase = await createClient();

  // Get org ID if not provided
  let orgId = organizationId;
  if (!orgId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { allowed: false, reason: 'Not authenticated' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return { allowed: false, reason: 'No organization found' };
    }
    orgId = profile.organization_id;
  }

  const limitCheck = await checkFeatureLimit(orgId, feature, currentUsage);

  if (!limitCheck.withinLimit) {
    return {
      allowed: false,
      reason: `${feature} limit reached (${currentUsage}/${limitCheck.limit})`,
      feature,
      limit: limitCheck.limit,
      remaining: 0,
      percentUsed: 100,
    };
  }

  return {
    allowed: true,
    feature,
    limit: limitCheck.limit,
    remaining: limitCheck.remaining,
    percentUsed: limitCheck.percentUsed,
  };
}

/**
 * Create a gated API response
 */
export function createGatedResponse(
  gateResult: GateResult,
  successResponse: () => Response | Promise<Response>
): Response | Promise<Response> {
  if (!gateResult.allowed) {
    return NextResponse.json(
      {
        error: 'Feature not available',
        code: 'FEATURE_GATED',
        message: gateResult.reason,
        feature: gateResult.feature,
        upgrade: gateResult.upgrade,
      },
      { status: 403 }
    );
  }

  return successResponse();
}

/**
 * HOF for gating API route handlers
 */
export function withFeatureGate(
  feature: string,
  handler: (req: NextRequest, context: any) => Promise<Response>
) {
  return async (req: NextRequest, context: any): Promise<Response> => {
    const gate = await gateFeature(feature);

    if (!gate.allowed) {
      return NextResponse.json(
        {
          error: 'Feature not available',
          code: 'FEATURE_GATED',
          message: gate.reason,
          feature: gate.feature,
          upgrade: gate.upgrade,
        },
        { status: 403 }
      );
    }

    return handler(req, context);
  };
}

/**
 * Check multiple features at once
 */
export async function gateMultipleFeatures(
  features: string[],
  organizationId?: string
): Promise<Map<string, GateResult>> {
  const results = new Map<string, GateResult>();

  // Run checks in parallel
  const checks = await Promise.all(
    features.map(async (feature) => ({
      feature,
      result: await gateFeature(feature, organizationId),
    }))
  );

  for (const { feature, result } of checks) {
    results.set(feature, result);
  }

  return results;
}

/**
 * Helper to get required plan for a feature
 * Based on feature matrix configuration
 */
function getRequiredPlanForFeature(featureSlug: string): string {
  // Map features to minimum required plan
  const featurePlanMap: Record<string, string> = {
    // AI
    'basic_ai_models': 'free',
    'premium_ai_models': 'starter',
    'ai_agents': 'starter',
    'custom_training': 'business',

    // Integrations
    'custom_bots': 'pro',
    'api_access': 'pro',
    'webhooks': 'pro',
    'email_integration': 'starter',
    'calendar_integration': 'starter',
    'whatsapp': 'business',
    'slack_integration': 'team',

    // Team
    'team_members': 'team',
    'sso_saml': 'team',
    'rbac': 'team',
    'audit_logs': 'business',

    // Branding
    'white_label': 'enterprise',
    'custom_domain': 'enterprise',
    'custom_logo': 'business',

    // Support
    'priority_support': 'starter',
    'dedicated_csm': 'team',
    'phone_support': 'business',
    'support_24_7': 'enterprise',
  };

  return featurePlanMap[featureSlug] || 'pro';
}

/**
 * React hook-friendly feature check
 * Returns data for client-side feature gating
 */
export async function getFeatureGateData(
  features: string[],
  organizationId?: string
): Promise<{
  features: Record<string, { allowed: boolean; limit: number }>;
  plan: string;
}> {
  const supabase = await createClient();

  // Get org ID if not provided
  let orgId = organizationId;
  if (!orgId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      orgId = profile?.organization_id;
    }
  }

  if (!orgId) {
    return { features: {}, plan: 'free' };
  }

  // Get plan
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('organization_id', orgId)
    .single();

  // Check all features
  const gates = await gateMultipleFeatures(features, orgId);

  const featuresData: Record<string, { allowed: boolean; limit: number }> = {};
  for (const [feature, result] of gates) {
    featuresData[feature] = {
      allowed: result.allowed,
      limit: result.limit || 0,
    };
  }

  return {
    features: featuresData,
    plan: subscription?.plan || 'free',
  };
}
