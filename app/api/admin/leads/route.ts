import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/leads - Get all consultation bookings and enterprise demo requests
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Check if user is super admin or admin
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("is_super_admin, is_admin")
      .eq("id", user.id)
      .single();

    if (!userProfile?.is_super_admin && !userProfile?.is_admin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get consultation bookings
    const { data: consultations, error: consultError } = await supabase
      .from("consultation_bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (consultError) {
      console.error("Error fetching consultation bookings:", consultError);
    }

    // Get enterprise demo requests
    const { data: demos, error: demoError } = await supabase
      .from("enterprise_demo_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (demoError) {
      console.error("Error fetching enterprise demo requests:", demoError);
    }

    // Calculate summary stats
    const totalLeads = (consultations?.length || 0) + (demos?.length || 0);
    const pendingConsultations = consultations?.filter((c) => c.status === "pending").length || 0;
    const pendingDemos = demos?.filter((d) => d.status === "pending").length || 0;
    const scheduledConsultations = consultations?.filter((c) => c.status === "scheduled").length || 0;
    const demoScheduled = demos?.filter((d) => d.status === "demo_scheduled").length || 0;

    return Response.json({
      summary: {
        total_leads: totalLeads,
        pending: pendingConsultations + pendingDemos,
        scheduled: scheduledConsultations + demoScheduled,
        consultations_count: consultations?.length || 0,
        demos_count: demos?.length || 0,
      },
      consultations: consultations || [],
      demos: demos || [],
    });
  } catch (error: any) {
    console.error("Error in GET /api/admin/leads:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * PATCH /api/admin/leads - Update lead status
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("is_super_admin, is_admin")
      .eq("id", user.id)
      .single();

    if (!userProfile?.is_super_admin && !userProfile?.is_admin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body = await req.json();
    const { lead_id, lead_type, status, notes } = body;

    if (!lead_id || !lead_type || !status) {
      return new Response(
        JSON.stringify({ error: "lead_id, lead_type, and status are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const table = lead_type === "consultation" ? "consultation_bookings" : "enterprise_demo_requests";

    const updateData: any = { status };
    if (notes !== undefined) {
      updateData.admin_notes = notes;
    }

    const { error } = await supabase
      .from(table)
      .update(updateData)
      .eq("id", lead_id);

    if (error) {
      console.error(`Error updating ${table}:`, error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Error in PATCH /api/admin/leads:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
