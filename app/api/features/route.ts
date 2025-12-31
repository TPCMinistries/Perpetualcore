import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import {
  getOrganizationFeatures,
  checkFeatureAccess,
  getAllFeatureFlags,
} from "@/lib/features/flags";
import { getFeatureGateData } from "@/lib/features/gate";
import {
  FEATURE_MATRIX,
  FEATURE_CATEGORIES,
  getFeaturesForPlan,
  getUpgradeFeatures,
} from "@/lib/features/matrix";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/features
 * Get feature access for the authenticated user's organization
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization and plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return Response.json({ error: "No organization found" }, { status: 404 });
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("organization_id", profile.organization_id)
      .single();

    const plan = subscription?.plan || "free";
    const organizationId = profile.organization_id;

    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") || "summary";

    // Different response views
    if (view === "full") {
      // Full feature list with access status
      const features = await getOrganizationFeatures(organizationId);
      return Response.json({
        plan,
        features,
        categories: FEATURE_CATEGORIES,
      });
    }

    if (view === "matrix") {
      // Full feature matrix for comparison
      return Response.json({
        plan,
        currentFeatures: getFeaturesForPlan(plan),
        upgradeFeatures: getUpgradeFeatures(plan),
        matrix: FEATURE_MATRIX,
        categories: FEATURE_CATEGORIES,
      });
    }

    if (view === "check") {
      // Check specific features
      const featuresParam = searchParams.get("features");
      if (!featuresParam) {
        return Response.json(
          { error: "features parameter required" },
          { status: 400 }
        );
      }

      const featureList = featuresParam.split(",");
      const gateData = await getFeatureGateData(featureList, organizationId);

      return Response.json({
        plan: gateData.plan,
        features: gateData.features,
      });
    }

    // Default: summary view
    const features = await getOrganizationFeatures(organizationId);

    // Group by category
    const byCategory: Record<string, typeof features> = {};
    for (const feature of features) {
      if (!byCategory[feature.category]) {
        byCategory[feature.category] = [];
      }
      byCategory[feature.category].push(feature);
    }

    // Count enabled features
    const enabledCount = features.filter((f) => f.allowed).length;
    const totalCount = features.length;

    return Response.json({
      plan,
      summary: {
        enabled: enabledCount,
        total: totalCount,
        percentage: Math.round((enabledCount / totalCount) * 100),
      },
      byCategory,
      upgradeAvailable: plan !== "enterprise",
    });
  } catch (error) {
    console.error("Features API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/features/check
 * Check access to a specific feature
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { feature, features } = body;

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return Response.json({ error: "No organization found" }, { status: 404 });
    }

    // Check single feature
    if (feature) {
      const access = await checkFeatureAccess(profile.organization_id, feature);
      return Response.json({
        feature,
        ...access,
      });
    }

    // Check multiple features
    if (features && Array.isArray(features)) {
      const results: Record<string, any> = {};

      for (const f of features) {
        results[f] = await checkFeatureAccess(profile.organization_id, f);
      }

      return Response.json({ features: results });
    }

    return Response.json(
      { error: "feature or features parameter required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Features check error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
