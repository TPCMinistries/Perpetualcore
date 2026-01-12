import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAllEmployees, personaToAdvisorSeed } from "@/lib/ai/personas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/assistants/seed-employees
 * Seeds the 6 AI Employee personas (Atlas, Echo, Sage, Scout, Iris, Cipher)
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    console.log(`🤖 Seeding AI Employees for organization: ${profile.organization_id}`);

    // Check if employees already exist
    const { data: existing } = await supabase
      .from("ai_assistants")
      .select("name")
      .eq("organization_id", profile.organization_id);

    const existingNames = new Set((existing || []).map(a => a.name));
    console.log(`📊 Found ${existingNames.size} existing assistants`);

    // Get all AI employees
    const employees = getAllEmployees();

    // Convert to advisor format and filter existing
    const employeeAdvisors = employees
      .filter(emp => !existingNames.has(emp.name))
      .map(emp => ({
        ...personaToAdvisorSeed(emp, user.id, profile.organization_id),
        // Add category for display
        category: "AI Employees",
      }));

    if (employeeAdvisors.length === 0) {
      console.log(`✅ All AI Employees already exist`);
      return NextResponse.json({
        message: "All AI Employees already exist",
        count: employees.length,
        employees: employees.map(e => e.name),
      });
    }

    console.log(`➕ Adding ${employeeAdvisors.length} new AI Employees:`, employeeAdvisors.map(a => a.name));

    // Insert new employees
    const { data: assistants, error: insertError } = await supabase
      .from("ai_assistants")
      .insert(employeeAdvisors)
      .select();

    if (insertError) {
      console.error("Error seeding AI Employees:", insertError);
      return NextResponse.json(
        { error: "Failed to seed AI Employees", details: insertError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully seeded ${assistants?.length || 0} AI Employees`);

    return NextResponse.json({
      message: "Successfully seeded AI Employees",
      assistants: assistants || [],
      count: assistants?.length || 0,
      employees: employees.map(e => ({
        name: e.name,
        title: e.title,
        avatar: e.avatar,
        shortDescription: e.shortDescription,
      })),
    }, { status: 201 });
  } catch (error: any) {
    console.error("Seed AI Employees error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/assistants/seed-employees
 * Returns the AI Employee personas without seeding
 */
export async function GET() {
  try {
    const employees = getAllEmployees();

    return NextResponse.json({
      employees: employees.map(e => ({
        id: e.id,
        name: e.name,
        title: e.title,
        avatar: e.avatar,
        color: e.color,
        description: e.description,
        shortDescription: e.shortDescription,
        benefits: e.benefits,
        capabilities: e.capabilities,
      })),
      count: employees.length,
    });
  } catch (error: any) {
    console.error("Get AI Employees error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
