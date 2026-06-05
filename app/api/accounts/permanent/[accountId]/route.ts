import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPcClient } from "@/lib/accounts/permanent-account-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = {
  params: {
    accountId: string;
  };
};

export async function GET(_req: NextRequest, { params }: RouteParams) {
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

    const pc = getPcClient();
    const [accountResult, engagementsResult] = await Promise.all([
      pc
        .from("pc_accounts")
        .select("*")
        .eq("id", accountId)
        .eq("created_by", user.id)
        .single(),
      pc
        .from("pc_engagements")
        .select("*")
        .eq("account_id", accountId)
        .eq("created_by", user.id)
        .order("updated_at", { ascending: false }),
    ]);

    if (accountResult.error || !accountResult.data) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (engagementsResult.error) {
      throw engagementsResult.error;
    }

    return NextResponse.json({
      account: accountResult.data,
      engagements: engagementsResult.data || [],
    });
  } catch (error) {
    console.error("Permanent account GET error:", error);
    return NextResponse.json({ error: "Could not load permanent account" }, { status: 500 });
  }
}
