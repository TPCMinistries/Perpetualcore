import { NextRequest, NextResponse } from "next/server";
import { createMissingHandoffTasks, AccountHandoffContext } from "@/lib/accounts/handoff-tasks";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InsightRecord = Record<string, unknown>;

type LeadRecord = {
  id: string;
  user_id: string | null;
  name: string | null;
  company: string | null;
  email: string | null;
  ai_insights: unknown;
};

function isRecord(value: unknown): value is InsightRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readHandoffContext(lead: LeadRecord): AccountHandoffContext | null {
  if (!isRecord(lead.ai_insights) || !isRecord(lead.ai_insights.accountHandoffContext)) {
    return null;
  }

  const context = lead.ai_insights.accountHandoffContext;
  return {
    workflowOwner: typeof context.workflowOwner === "string" ? context.workflowOwner : null,
    toolsAndData: typeof context.toolsAndData === "string" ? context.toolsAndData : null,
    realExamples: typeof context.realExamples === "string" ? context.realExamples : null,
    rulesAndEscalations: typeof context.rulesAndEscalations === "string" ? context.rulesAndEscalations : null,
    successMetric: typeof context.successMetric === "string" ? context.successMetric : null,
    notes: typeof context.notes === "string" ? context.notes : null,
    submittedAt: typeof context.submittedAt === "string" ? context.submittedAt : null,
  };
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
) {
  try {
    const { leadId } = await params;
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: lead, error } = await supabase
      .from("leads")
      .select("id,user_id,name,company,email,ai_insights")
      .eq("id", leadId)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const leadRecord = lead as LeadRecord;
    if (leadRecord.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const context = readHandoffContext(leadRecord);
    if (!context) {
      return NextResponse.json({ error: "No client handoff context has been submitted yet" }, { status: 400 });
    }

    const taskSync = await createMissingHandoffTasks(supabase, leadRecord, context);
    return NextResponse.json({ success: !taskSync.error, taskSync });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not sync handoff tasks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
