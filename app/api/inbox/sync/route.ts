import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncGmailMessages } from "@/lib/email/gmail";

// POST /api/inbox/sync
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile for organization_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    // Get ALL connected Gmail accounts
    const { data: emailAccounts } = await supabase
      .from("email_accounts")
      .select("id, provider, email_address")
      .eq("user_id", user.id)
      .eq("provider", "gmail");

    const accounts = emailAccounts || [];
    console.log("[Sync] Found", accounts.length, "Gmail accounts");

    // Sync all accounts
    const syncResults: Array<{
      email: string;
      success: boolean;
      emailsCount: number;
      skippedSpam: number;
      skippedFiltered: number;
      error?: string;
    }> = [];

    let totalEmails = 0;
    let totalSkippedSpam = 0;
    let totalSkippedFiltered = 0;

    for (const account of accounts) {
      console.log("[Sync] Starting Gmail sync for:", account.email_address);
      const result = await syncGmailMessages(
        user.id,
        profile.organization_id,
        50, // Sync last 50 emails per account
        account.id // Pass specific account ID
      );
      console.log("[Sync] Gmail sync result for", account.email_address, ":", result);

      syncResults.push({
        email: account.email_address,
        success: result.success,
        emailsCount: result.emailsCount,
        skippedSpam: result.skippedSpam || 0,
        skippedFiltered: result.skippedFiltered || 0,
        error: result.error,
      });

      totalEmails += result.emailsCount;
      totalSkippedSpam += result.skippedSpam || 0;
      totalSkippedFiltered += result.skippedFiltered || 0;
    }

    // TODO: Add WhatsApp sync when implemented

    return NextResponse.json({
      success: true,
      message: syncResults.every(r => r.success) ? "Sync completed" : "Sync completed with some errors",
      synced: {
        emails: totalEmails,
        whatsapp: 0,
        skipped_spam: totalSkippedSpam,
        skipped_filtered: totalSkippedFiltered,
      },
      accounts: syncResults,
      gmail: {
        connected: accounts.length > 0,
        accountCount: accounts.length,
        emails: accounts.map(a => a.email_address),
      },
    });
  } catch (error) {
    console.error("Sync API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
