import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

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

const handoffContextSchema = z.object({
  token: z.string().min(1, "Missing handoff token"),
  workflowOwner: z.string().trim().max(300).optional().nullable(),
  toolsAndData: z.string().trim().max(1500).optional().nullable(),
  realExamples: z.string().trim().max(1500).optional().nullable(),
  rulesAndEscalations: z.string().trim().max(1500).optional().nullable(),
  successMetric: z.string().trim().max(800).optional().nullable(),
  notes: z.string().trim().max(1200).optional().nullable(),
});

function isRecord(value: unknown): value is InsightRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getTokenIsValid(lead: LeadRecord, token: string) {
  if (!isRecord(lead.ai_insights)) return false;
  return token === lead.ai_insights.accountId || token === lead.ai_insights.engagementId;
}

function getAccountName(lead: LeadRecord) {
  return lead.company || lead.name || lead.email || "Client account";
}

function sanitizeOptional(value?: string | null) {
  const cleaned = (value || "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> },
) {
  try {
    const { leadId } = await params;
    const parsed = handoffContextSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid handoff context" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const { data: lead, error } = await supabase
      .from("leads")
      .select("id,user_id,name,company,email,ai_insights")
      .eq("id", leadId)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: "Handoff link not found" }, { status: 404 });
    }

    const leadRecord = lead as LeadRecord;
    if (!getTokenIsValid(leadRecord, parsed.data.token)) {
      return NextResponse.json({ error: "Handoff token is not valid" }, { status: 403 });
    }

    const submittedAt = new Date().toISOString();
    const insights = isRecord(leadRecord.ai_insights) ? leadRecord.ai_insights : {};
    const context = {
      workflowOwner: sanitizeOptional(parsed.data.workflowOwner),
      toolsAndData: sanitizeOptional(parsed.data.toolsAndData),
      realExamples: sanitizeOptional(parsed.data.realExamples),
      rulesAndEscalations: sanitizeOptional(parsed.data.rulesAndEscalations),
      successMetric: sanitizeOptional(parsed.data.successMetric),
      notes: sanitizeOptional(parsed.data.notes),
      submittedAt,
    };

    const nextInsights = {
      ...insights,
      accountHandoffContext: {
        ...(isRecord(insights.accountHandoffContext) ? insights.accountHandoffContext : {}),
        ...context,
      },
    };

    const { error: updateError } = await supabase
      .from("leads")
      .update({
        ai_insights: nextInsights,
        stage: "delivery_handoff",
        updated_at: submittedAt,
      })
      .eq("id", leadId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save handoff context" }, { status: 500 });
    }

    if (leadRecord.user_id) {
      await supabase.from("lead_activities").insert({
        lead_id: leadId,
        user_id: leadRecord.user_id,
        activity_type: "client_handoff_context",
        title: "Client handoff context submitted",
        description: `${getAccountName(leadRecord)} sent workflow owner, tools, examples, rules, and success metric context for kickoff.`,
      });
    }

    return NextResponse.json({ success: true, context });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save handoff context";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
