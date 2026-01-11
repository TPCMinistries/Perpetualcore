import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - List all blocked senders
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: blockedSenders, error } = await supabase
      .from("blocked_senders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ blocked_senders: [], needs_setup: true });
      }
      throw error;
    }

    // Get stats
    const emailBlocks = blockedSenders?.filter(b => b.block_type === "email").length || 0;
    const domainBlocks = blockedSenders?.filter(b => b.block_type === "domain").length || 0;
    const totalBlocked = blockedSenders?.reduce((sum, b) => sum + (b.blocked_count || 0), 0) || 0;

    return NextResponse.json({
      blocked_senders: blockedSenders || [],
      stats: {
        email_blocks: emailBlocks,
        domain_blocks: domainBlocks,
        total_emails_blocked: totalBlocked,
      },
    });
  } catch (error) {
    console.error("Error fetching blocked senders:", error);
    return NextResponse.json(
      { error: "Failed to fetch blocked senders" },
      { status: 500 }
    );
  }
}

// POST - Add a blocked sender
export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    const body = await request.json();
    const { block_type, value, reason } = body;

    if (!value?.trim()) {
      return NextResponse.json({ error: "Value is required" }, { status: 400 });
    }

    if (!["email", "domain"].includes(block_type)) {
      return NextResponse.json({ error: "Invalid block_type" }, { status: 400 });
    }

    // Normalize the value
    let normalizedValue = value.trim().toLowerCase();

    // If blocking an email, extract domain option
    if (block_type === "domain" && normalizedValue.includes("@")) {
      normalizedValue = normalizedValue.split("@")[1];
    }

    const { data: blocked, error } = await supabase
      .from("blocked_senders")
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        block_type,
        value: normalizedValue,
        reason: reason || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already blocked" }, { status: 400 });
      }
      throw error;
    }

    // Mark existing emails from this sender as spam
    if (block_type === "email") {
      await supabase
        .from("emails")
        .update({ is_spam: true })
        .eq("user_id", user.id)
        .ilike("from_email", normalizedValue);
    } else if (block_type === "domain") {
      await supabase
        .from("emails")
        .update({ is_spam: true })
        .eq("user_id", user.id)
        .ilike("from_email", `%@${normalizedValue}`);
    }

    return NextResponse.json({ blocked }, { status: 201 });
  } catch (error) {
    console.error("Error blocking sender:", error);
    return NextResponse.json(
      { error: "Failed to block sender" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a blocked sender
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("blocked_senders")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unblocking sender:", error);
    return NextResponse.json(
      { error: "Failed to unblock sender" },
      { status: 500 }
    );
  }
}
