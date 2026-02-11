import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/revenue - Revenue analytics for admin dashboard
 * Returns MRR, ARR, conversion rates, churn, growth metrics
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

    // Check if user is super admin
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

    // Get all subscriptions
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select(`
        *,
        user_profiles!inner(
          id,
          email,
          full_name,
          created_at
        )
      `)
      .order("created_at", { ascending: false });

    // Get all invoices
    const { data: invoices } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    // Calculate MRR and ARR
    let mrr = 0;
    let arr = 0;
    const planPrices: Record<string, { monthly: number; annual: number }> = {
      free: { monthly: 0, annual: 0 },
      starter: { monthly: 49, annual: 490 }, // Assuming 2 months free on annual
      pro: { monthly: 99, annual: 990 },
      team: { monthly: 499, annual: 4990 },
      business: { monthly: 1999, annual: 19990 },
      enterprise: { monthly: 9999, annual: 99990 },
    };

    const activeSubscriptions = subscriptions?.filter(
      (sub) => sub.status === "active" || sub.status === "trialing"
    ) || [];

    activeSubscriptions.forEach((sub) => {
      const pricing = planPrices[sub.plan] || { monthly: 0, annual: 0 };

      if (sub.billing_interval === "year") {
        // Annual subscribers contribute monthly amount to MRR
        const monthlyEquivalent = pricing.annual / 12;
        mrr += monthlyEquivalent;
        arr += pricing.annual;
      } else {
        // Monthly subscribers
        mrr += pricing.monthly;
        arr += pricing.monthly * 12;
      }
    });

    // Plan distribution
    const planDistribution: Record<string, number> = {};
    subscriptions?.forEach((sub) => {
      if (sub.status === "active" || sub.status === "trialing") {
        planDistribution[sub.plan] = (planDistribution[sub.plan] || 0) + 1;
      }
    });

    // Trial conversion rate
    const trialingUsers = subscriptions?.filter((sub) => sub.status === "trialing") || [];
    const convertedFromTrial = subscriptions?.filter((sub) =>
      sub.status === "active" && sub.trial_end && new Date(sub.trial_end) < new Date()
    ) || [];

    const totalTrialsStarted = trialingUsers.length + convertedFromTrial.length;
    const trialConversionRate = totalTrialsStarted > 0
      ? (convertedFromTrial.length / totalTrialsStarted) * 100
      : 0;

    // Churn rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const churnedLast30Days = subscriptions?.filter((sub) =>
      sub.status === "canceled" &&
      sub.canceled_at &&
      new Date(sub.canceled_at) >= thirtyDaysAgo
    ) || [];

    const activeAtStartOfPeriod = activeSubscriptions.length + churnedLast30Days.length;
    const churnRate = activeAtStartOfPeriod > 0
      ? (churnedLast30Days.length / activeAtStartOfPeriod) * 100
      : 0;

    // New signups by plan (last 30 days)
    const newSignups = subscriptions?.filter((sub) =>
      new Date(sub.created_at) >= thirtyDaysAgo
    ) || [];

    const newSignupsByPlan: Record<string, number> = {};
    newSignups.forEach((sub) => {
      newSignupsByPlan[sub.plan] = (newSignupsByPlan[sub.plan] || 0) + 1;
    });

    // Revenue by plan
    const revenueByPlan: Record<string, number> = {};
    activeSubscriptions.forEach((sub) => {
      const pricing = planPrices[sub.plan] || { monthly: 0, annual: 0 };
      const monthlyRevenue = sub.billing_interval === "year"
        ? pricing.annual / 12
        : pricing.monthly;

      revenueByPlan[sub.plan] = (revenueByPlan[sub.plan] || 0) + monthlyRevenue;
    });

    // Growth metrics (compare to previous month)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const subscriptionsLastMonth = subscriptions?.filter((sub) => {
      const createdAt = new Date(sub.created_at);
      return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
    }) || [];

    const subscriptionsThisMonth = newSignups;
    const growthRate = subscriptionsLastMonth.length > 0
      ? ((subscriptionsThisMonth.length - subscriptionsLastMonth.length) / subscriptionsLastMonth.length) * 100
      : subscriptionsThisMonth.length > 0 ? 100 : 0;

    // Customer lifetime value (simple average)
    const paidSubscriptions = subscriptions?.filter((sub) => sub.plan !== "free") || [];
    const avgSubscriptionAge = paidSubscriptions.length > 0
      ? paidSubscriptions.reduce((sum, sub) => {
          const ageInDays = (new Date().getTime() - new Date(sub.created_at).getTime()) / (1000 * 60 * 60 * 24);
          return sum + ageInDays;
        }, 0) / paidSubscriptions.length
      : 0;

    const avgMonthlyRevenue = paidSubscriptions.length > 0 ? mrr / paidSubscriptions.length : 0;
    const estimatedLTV = (avgSubscriptionAge / 30) * avgMonthlyRevenue;

    // Recent subscription activity
    const recentActivity = subscriptions?.slice(0, 10).map((sub) => ({
      id: sub.id,
      user_email: sub.user_profiles?.email,
      user_name: sub.user_profiles?.full_name,
      plan: sub.plan,
      status: sub.status,
      billing_interval: sub.billing_interval,
      created_at: sub.created_at,
      trial_end: sub.trial_end,
      current_period_end: sub.current_period_end,
    })) || [];

    // Top customers by revenue
    const customerRevenue = activeSubscriptions.map((sub) => {
      const pricing = planPrices[sub.plan] || { monthly: 0, annual: 0 };
      const monthlyRevenue = sub.billing_interval === "year"
        ? pricing.annual / 12
        : pricing.monthly;

      return {
        user_email: sub.user_profiles?.email,
        user_name: sub.user_profiles?.full_name,
        plan: sub.plan,
        billing_interval: sub.billing_interval,
        monthly_revenue: monthlyRevenue,
        annual_revenue: monthlyRevenue * 12,
      };
    }).sort((a, b) => b.monthly_revenue - a.monthly_revenue).slice(0, 10);

    return Response.json({
      summary: {
        mrr: parseFloat(mrr.toFixed(2)),
        arr: parseFloat(arr.toFixed(2)),
        total_customers: activeSubscriptions.length,
        paid_customers: activeSubscriptions.filter((sub) => sub.plan !== "free").length,
        trial_customers: trialingUsers.length,
        trial_conversion_rate: parseFloat(trialConversionRate.toFixed(2)),
        churn_rate: parseFloat(churnRate.toFixed(2)),
        growth_rate: parseFloat(growthRate.toFixed(2)),
        estimated_ltv: parseFloat(estimatedLTV.toFixed(2)),
        avg_subscription_age_days: parseFloat(avgSubscriptionAge.toFixed(0)),
      },
      plan_distribution: planDistribution,
      revenue_by_plan: Object.entries(revenueByPlan).map(([plan, revenue]) => ({
        plan,
        monthly_revenue: parseFloat(revenue.toFixed(2)),
        annual_revenue: parseFloat((revenue * 12).toFixed(2)),
        customer_count: planDistribution[plan] || 0,
      })).sort((a, b) => b.monthly_revenue - a.monthly_revenue),
      new_signups_by_plan: Object.entries(newSignupsByPlan).map(([plan, count]) => ({
        plan,
        count,
      })),
      recent_activity: recentActivity,
      top_customers: customerRevenue,
      invoices: {
        total_invoices: invoices?.length || 0,
        paid_invoices: invoices?.filter((inv) => inv.status === "paid").length || 0,
        open_invoices: invoices?.filter((inv) => inv.status === "open").length || 0,
        total_revenue: invoices?.filter((inv) => inv.status === "paid")
          .reduce((sum, inv) => sum + (inv.amount_paid || 0), 0) / 100 || 0, // Convert from cents
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/admin/revenue:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
