import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSubscription } from "@/lib/stripe/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

/**
 * GET - Get current subscription
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 400 });
    }

    const subscription = await getSubscription(profile.organization_id);

    // If no subscription exists, return free plan
    if (!subscription) {
      return NextResponse.json({
        subscription: {
          plan: "free",
          status: "active",
        },
      });
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    if (isDev) console.error("Subscription fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
