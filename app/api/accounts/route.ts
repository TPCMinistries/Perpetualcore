import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAccountByLead,
  getEngagementByLead,
  getPcClient,
  getPermanentAccountName,
  syncPermanentAccount,
} from "@/lib/accounts/permanent-account-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeadRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  status: string | null;
  stage: string | null;
  estimated_value: number | null;
  notes: string | null;
  next_follow_up_at: string | null;
  ai_insights: unknown;
  created_at: string;
  updated_at: string;
};

async function getOwnedLead(supabase: Awaited<ReturnType<typeof createClient>>, leadId: string, userId: string) {
  return supabase
    .from("leads")
    .select("id,name,email,phone,company,title,status,stage,estimated_value,notes,next_follow_up_at,ai_insights,created_at,updated_at")
    .eq("id", leadId)
    .eq("user_id", userId)
    .single();
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");
    const pc = getPcClient();

    if (leadId) {
      const account = await getAccountByLead(pc, leadId, user.id);
      const engagement = await getEngagementByLead(pc, leadId, user.id);
      return NextResponse.json({ account, engagement });
    }

    const [accountsResult, engagementsResult] = await Promise.all([
      pc
        .from("pc_accounts")
        .select("*")
        .eq("created_by", user.id)
        .order("updated_at", { ascending: false })
        .limit(50),
      pc
        .from("pc_engagements")
        .select("*")
        .eq("created_by", user.id)
        .order("updated_at", { ascending: false })
        .limit(100),
    ]);

    if (accountsResult.error) throw accountsResult.error;
    if (engagementsResult.error) throw engagementsResult.error;

    return NextResponse.json({
      accounts: accountsResult.data || [],
      engagements: engagementsResult.data || [],
    });
  } catch (error) {
    console.error("Accounts GET error:", error);
    return NextResponse.json({ error: "Could not load accounts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { leadId?: unknown };
    if (typeof body.leadId !== "string" || body.leadId.trim().length === 0) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const leadId = body.leadId.trim();
    const { data: lead, error: leadError } = await getOwnedLead(supabase, leadId, user.id);

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const accountSync = await syncPermanentAccount({
      lead,
      userId: user.id,
      createdFrom: "sales_command_center",
    });
    const accountName = getPermanentAccountName(lead);
    const existingNotes = lead.notes?.trim() || "";
    const nextNotes = existingNotes.includes(accountSync.account.id)
      ? existingNotes
      : existingNotes
        ? `${existingNotes}\n\n---\n${accountSync.handoffBlock}`
        : accountSync.handoffBlock;

    const { data: updatedLead, error: updateLeadError } = await supabase
      .from("leads")
      .update({
        status: "won",
        stage: "delivery_handoff",
        notes: nextNotes,
        ai_insights: accountSync.nextInsights,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateLeadError) {
      console.error("Lead account sync error:", updateLeadError);
      return NextResponse.json({ error: "Account created, but lead sync failed" }, { status: 500 });
    }

    await supabase.from("lead_activities").insert({
      lead_id: lead.id,
      user_id: user.id,
      activity_type: "account_synced",
      title: "Permanent account synced",
      description: `${accountName} is now stored in pc_accounts with a ${accountSync.lane.offerName} engagement.`,
    });

    return NextResponse.json({
      account: accountSync.account,
      engagement: accountSync.engagement,
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Accounts POST error:", error);
    return NextResponse.json({ error: "Could not sync account" }, { status: 500 });
  }
}
