import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ contactId: string }>;
}

// GET - Fetch opportunities/deals linked to a contact
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { contactId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify contact belongs to user
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Try to fetch linked opportunities via contact_opportunities junction table
    const { data: linkedOpps, error } = await supabase
      .from("contact_opportunities")
      .select(`
        id,
        role,
        created_at,
        work_item:work_items(
          id,
          title,
          deal_value,
          status,
          created_at
        )
      `)
      .eq("contact_id", contactId);

    if (error) {
      // If table doesn't exist or column error, return empty
      if (error.code === "42P01" || error.code === "42703") {
        return NextResponse.json({ opportunities: [] });
      }
      throw error;
    }

    // Flatten the response
    const opportunities = (linkedOpps || []).map((link) => ({
      id: link.work_item?.id,
      title: link.work_item?.title,
      name: link.work_item?.title,
      value: link.work_item?.deal_value,
      status: link.work_item?.status,
      role: link.role,
      link_id: link.id,
    })).filter((o) => o.id);

    return NextResponse.json({ opportunities });
  } catch (error) {
    console.error("Error fetching contact opportunities:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}

// POST - Link an opportunity to a contact
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { contactId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify contact belongs to user
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const body = await req.json();
    const { work_item_id, role } = body;

    if (!work_item_id) {
      return NextResponse.json({ error: "work_item_id is required" }, { status: 400 });
    }

    // Create link
    const { data: link, error } = await supabase
      .from("contact_opportunities")
      .insert({
        contact_id: contactId,
        work_item_id,
        role: role || "contact",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Opportunity already linked" }, { status: 400 });
      }
      if (error.code === "42P01") {
        return NextResponse.json(
          { error: "Opportunities linking table not set up. Please run migrations." },
          { status: 500 }
        );
      }
      throw error;
    }

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error("Error linking opportunity to contact:", error);
    return NextResponse.json(
      { error: "Failed to link opportunity" },
      { status: 500 }
    );
  }
}
