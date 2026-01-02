import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORY_OPTIONS = [
  "food",
  "transport",
  "utilities",
  "entertainment",
  "business",
  "personal",
  "health",
  "shopping",
  "travel",
  "other",
];

/**
 * GET /api/expenses
 * Fetch expenses for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const source = searchParams.get("source");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("expenses")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (startDate) {
      query = query.gte("date", startDate);
    }

    if (endDate) {
      query = query.lte("date", endDate);
    }

    if (source) {
      query = query.eq("source", source);
    }

    const { data: expenses, error, count } = await query;

    if (error) {
      console.error("Error fetching expenses:", error);
      return Response.json({ error: "Failed to fetch expenses" }, { status: 500 });
    }

    // Calculate stats
    const { data: allExpenses } = await supabase
      .from("expenses")
      .select("amount, category, date")
      .eq("user_id", user.id);

    const stats = {
      total: (allExpenses || []).reduce((sum, e) => sum + parseFloat(e.amount), 0),
      thisMonth: 0,
      lastMonth: 0,
      byCategory: {} as Record<string, number>,
    };

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    (allExpenses || []).forEach((expense) => {
      const date = new Date(expense.date);
      const amount = parseFloat(expense.amount);

      // This month
      if (date >= thisMonthStart) {
        stats.thisMonth += amount;
      }

      // Last month
      if (date >= lastMonthStart && date <= lastMonthEnd) {
        stats.lastMonth += amount;
      }

      // By category
      stats.byCategory[expense.category] = (stats.byCategory[expense.category] || 0) + amount;
    });

    return Response.json({
      expenses: expenses || [],
      total: count || 0,
      limit,
      offset,
      stats,
    });
  } catch (error) {
    console.error("Expenses GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/expenses
 * Create a new expense
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      amount,
      currency = "USD",
      category,
      description,
      merchant,
      date,
      receipt_url,
      source = "manual",
      source_message_id,
      tags,
      is_recurring,
      recurring_frequency,
    } = body;

    if (!amount || amount <= 0) {
      return Response.json({ error: "Valid amount is required" }, { status: 400 });
    }

    if (!category || !CATEGORY_OPTIONS.includes(category)) {
      return Response.json({ error: "Valid category is required" }, { status: 400 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        user_id: user.id,
        organization_id: profile?.organization_id,
        amount,
        currency,
        category,
        description,
        merchant,
        date: date || new Date().toISOString().split("T")[0],
        receipt_url,
        source,
        source_message_id,
        tags: tags || [],
        is_recurring: is_recurring || false,
        recurring_frequency,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating expense:", error);
      return Response.json({ error: "Failed to create expense" }, { status: 500 });
    }

    return Response.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Expenses POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/expenses
 * Update an expense
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return Response.json({ error: "Expense ID is required" }, { status: 400 });
    }

    const { data: expense, error } = await supabase
      .from("expenses")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating expense:", error);
      return Response.json({ error: "Failed to update expense" }, { status: 500 });
    }

    return Response.json({ expense });
  } catch (error) {
    console.error("Expenses PATCH error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/expenses
 * Delete an expense
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Expense ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting expense:", error);
      return Response.json({ error: "Failed to delete expense" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Expenses DELETE error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
