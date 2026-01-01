import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAuthUrl,
  listSpreadsheets,
  getSpreadsheetInfo,
  readSheetData,
  writeSheetData,
  appendSheetData,
  createSpreadsheet,
  exportToSheet,
  sheetDataToRecords,
  refreshAccessToken,
} from "@/lib/integrations/google-sheets";

// Helper to get valid access token
async function getValidAccessToken(
  supabase: any,
  userId: string
): Promise<{ accessToken: string; error?: string }> {
  const { data: integration } = await supabase
    .from("integrations")
    .select("credentials, expires_at")
    .eq("user_id", userId)
    .eq("provider", "google_sheets")
    .single();

  if (!integration) {
    return { accessToken: "", error: "not_connected" };
  }

  const credentials = integration.credentials;
  const expiresAt = new Date(integration.expires_at).getTime();

  // Check if token is expired
  if (Date.now() > expiresAt - 60000) {
    // Refresh if less than 1 minute left
    if (!credentials.refresh_token) {
      return { accessToken: "", error: "refresh_required" };
    }

    try {
      const { access_token, expiry_date } = await refreshAccessToken(
        credentials.refresh_token
      );

      // Update stored token
      await supabase
        .from("integrations")
        .update({
          credentials: { ...credentials, access_token },
          expires_at: new Date(expiry_date).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("provider", "google_sheets");

      return { accessToken: access_token };
    } catch (error) {
      console.error("Failed to refresh token:", error);
      return { accessToken: "", error: "refresh_failed" };
    }
  }

  return { accessToken: credentials.access_token };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "status";

    // Check connection status
    if (action === "status") {
      const { data: integration } = await supabase
        .from("integrations")
        .select("id, created_at, expires_at")
        .eq("user_id", user.id)
        .eq("provider", "google_sheets")
        .single();

      return NextResponse.json({
        connected: !!integration,
        connectedAt: integration?.created_at,
        expiresAt: integration?.expires_at,
      });
    }

    // Generate OAuth URL
    if (action === "auth_url") {
      const state = Buffer.from(
        JSON.stringify({ userId: user.id, returnUrl: searchParams.get("returnUrl") || "/dashboard/integrations" })
      ).toString("base64");

      const authUrl = getAuthUrl(state);
      return NextResponse.json({ authUrl });
    }

    // All other actions require valid token
    const { accessToken, error } = await getValidAccessToken(supabase, user.id);
    if (error) {
      return NextResponse.json(
        { error, message: error === "not_connected" ? "Google Sheets not connected" : "Token refresh required" },
        { status: error === "not_connected" ? 404 : 401 }
      );
    }

    // List spreadsheets
    if (action === "list") {
      const spreadsheets = await listSpreadsheets(accessToken);
      return NextResponse.json({ spreadsheets });
    }

    // Get spreadsheet info
    if (action === "info") {
      const spreadsheetId = searchParams.get("spreadsheetId");
      if (!spreadsheetId) {
        return NextResponse.json({ error: "Missing spreadsheetId" }, { status: 400 });
      }

      const info = await getSpreadsheetInfo(accessToken, spreadsheetId);
      return NextResponse.json(info);
    }

    // Read sheet data
    if (action === "read") {
      const spreadsheetId = searchParams.get("spreadsheetId");
      const sheetName = searchParams.get("sheetName") || "Sheet1";
      const range = searchParams.get("range");

      if (!spreadsheetId) {
        return NextResponse.json({ error: "Missing spreadsheetId" }, { status: 400 });
      }

      const data = await readSheetData(accessToken, spreadsheetId, sheetName, range || undefined);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Google Sheets API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Get valid access token
    const { accessToken, error } = await getValidAccessToken(supabase, user.id);
    if (error) {
      return NextResponse.json(
        { error, message: "Token error" },
        { status: 401 }
      );
    }

    // Create new spreadsheet
    if (action === "create") {
      const { title, sheetNames } = body;
      if (!title) {
        return NextResponse.json({ error: "Missing title" }, { status: 400 });
      }

      const result = await createSpreadsheet(accessToken, title, sheetNames);
      return NextResponse.json(result);
    }

    // Write data to sheet
    if (action === "write") {
      const { spreadsheetId, range, values } = body;
      if (!spreadsheetId || !range || !values) {
        return NextResponse.json(
          { error: "Missing spreadsheetId, range, or values" },
          { status: 400 }
        );
      }

      const result = await writeSheetData(accessToken, spreadsheetId, range, values);
      return NextResponse.json(result);
    }

    // Append data to sheet
    if (action === "append") {
      const { spreadsheetId, range, values } = body;
      if (!spreadsheetId || !range || !values) {
        return NextResponse.json(
          { error: "Missing spreadsheetId, range, or values" },
          { status: 400 }
        );
      }

      const result = await appendSheetData(accessToken, spreadsheetId, range, values);
      return NextResponse.json(result);
    }

    // Export to new sheet
    if (action === "export") {
      const { title, headers, rows } = body;
      if (!title || !headers || !rows) {
        return NextResponse.json(
          { error: "Missing title, headers, or rows" },
          { status: 400 }
        );
      }

      const result = await exportToSheet(accessToken, title, headers, rows);
      return NextResponse.json(result);
    }

    // Import from sheet to specified table
    if (action === "import") {
      const { spreadsheetId, sheetName, targetTable, columnMapping } = body;
      if (!spreadsheetId || !targetTable) {
        return NextResponse.json(
          { error: "Missing spreadsheetId or targetTable" },
          { status: 400 }
        );
      }

      // Read sheet data
      const data = await readSheetData(
        accessToken,
        spreadsheetId,
        sheetName || "Sheet1"
      );

      // Convert to records
      const records = sheetDataToRecords(data, columnMapping);

      // Add user_id to each record
      const recordsWithUser = records.map((r) => ({
        ...r,
        user_id: user.id,
      }));

      // Insert into target table
      const { data: inserted, error: insertError } = await supabase
        .from(targetTable)
        .insert(recordsWithUser)
        .select();

      if (insertError) {
        return NextResponse.json(
          { error: "Import failed", details: insertError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        imported: inserted?.length || 0,
        records: inserted,
      });
    }

    // Disconnect
    if (action === "disconnect") {
      await supabase
        .from("integrations")
        .delete()
        .eq("user_id", user.id)
        .eq("provider", "google_sheets");

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Google Sheets POST error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
