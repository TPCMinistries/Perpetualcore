import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Json } from "@/lib/accounts/permanent-account-sync";
import { getPcClient } from "@/lib/accounts/permanent-account-sync";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = {
  params: {
    accountId: string;
  };
};

type JsonRecord = Record<string, Json | undefined>;

const accountUpdateSchema = z.object({
  summary: z.string().trim().min(2, "Summary is required").max(1200),
  decision: z.string().trim().max(1200).optional().default(""),
  risk: z.string().trim().max(1200).optional().default(""),
  nextAction: z.string().trim().max(1200).optional().default(""),
});

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readUpdateList(metadata: JsonRecord) {
  const updates = metadata.account_updates;
  return Array.isArray(updates) ? updates.filter(isJsonRecord) : [];
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = params.accountId?.trim();
    if (!accountId) {
      return NextResponse.json({ error: "accountId is required" }, { status: 400 });
    }

    const parsed = accountUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid update" }, { status: 400 });
    }

    const pc = getPcClient();
    const { data: account, error: accountError } = await pc
      .from("pc_accounts")
      .select("*")
      .eq("id", accountId)
      .eq("created_by", user.id)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const metadata = isJsonRecord(account.metadata) ? account.metadata : {};
    const now = new Date().toISOString();
    const update: JsonRecord = {
      id: crypto.randomUUID(),
      summary: parsed.data.summary,
      decision: parsed.data.decision,
      risk: parsed.data.risk,
      nextAction: parsed.data.nextAction,
      createdAt: now,
      createdBy: user.id,
    };
    const nextMetadata: JsonRecord = {
      ...metadata,
      account_updates: [update, ...readUpdateList(metadata)].slice(0, 50),
      last_account_update_at: now,
      last_account_next_action: parsed.data.nextAction || parsed.data.summary,
    };

    const { data: updatedAccount, error: updateError } = await pc
      .from("pc_accounts")
      .update({
        metadata: nextMetadata,
        updated_at: now,
      })
      .eq("id", accountId)
      .eq("created_by", user.id)
      .select("*")
      .single();

    if (updateError || !updatedAccount) throw updateError;

    return NextResponse.json({ account: updatedAccount, update });
  } catch (error) {
    console.error("Permanent account update POST error:", error);
    return NextResponse.json({ error: "Could not save account update" }, { status: 500 });
  }
}
