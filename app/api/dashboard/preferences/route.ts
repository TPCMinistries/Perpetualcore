import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Default dashboard configuration
const DEFAULT_PREFERENCES = {
  layout: "default",
  widgets: {
    metrics: { visible: true, order: 0 },
    suggestions: { visible: true, order: 1 },
    insights: { visible: true, order: 2 },
    quickActions: { visible: true, order: 3 },
    activity: { visible: true, order: 4 },
    weeklyReview: { visible: true, order: 5 },
  },
  quickLinks: [
    { label: "Outreach", href: "/dashboard/outreach", icon: "mail" },
    { label: "Leads", href: "/dashboard/leads", icon: "users" },
    { label: "Ideas", href: "/dashboard/ideas", icon: "lightbulb" },
    { label: "Ministry", href: "/dashboard/ministry", icon: "church" },
    { label: "Coaching", href: "/dashboard/coaching", icon: "graduation-cap" },
  ],
  theme: {
    accentColor: "blue",
    compactMode: false,
  },
};

/**
 * GET /api/dashboard/preferences
 * Get user's dashboard preferences
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get preferences from profile or user_settings
    const { data: profile } = await supabase
      .from("profiles")
      .select("dashboard_preferences")
      .eq("id", user.id)
      .single();

    // Return stored preferences or defaults
    const preferences = profile?.dashboard_preferences || DEFAULT_PREFERENCES;

    return Response.json({ preferences });
  } catch (error) {
    console.error("Dashboard preferences GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/dashboard/preferences
 * Update user's dashboard preferences
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Get current preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("dashboard_preferences")
      .eq("id", user.id)
      .single();

    const currentPreferences = profile?.dashboard_preferences || DEFAULT_PREFERENCES;

    // Merge with updates
    const updatedPreferences = {
      ...currentPreferences,
      ...body,
      widgets: {
        ...currentPreferences.widgets,
        ...(body.widgets || {}),
      },
      theme: {
        ...currentPreferences.theme,
        ...(body.theme || {}),
      },
    };

    // Save to profile
    const { error } = await supabase
      .from("profiles")
      .update({
        dashboard_preferences: updatedPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating preferences:", error);
      return Response.json({ error: "Failed to update preferences" }, { status: 500 });
    }

    return Response.json({ preferences: updatedPreferences });
  } catch (error) {
    console.error("Dashboard preferences PATCH error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/dashboard/preferences
 * Reset dashboard preferences to defaults
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reset to defaults
    const { error } = await supabase
      .from("profiles")
      .update({
        dashboard_preferences: DEFAULT_PREFERENCES,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error resetting preferences:", error);
      return Response.json({ error: "Failed to reset preferences" }, { status: 500 });
    }

    return Response.json({ preferences: DEFAULT_PREFERENCES });
  } catch (error) {
    console.error("Dashboard preferences PUT error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
