import { google, sheets_v4 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "https://perpetualcore.com/api/integrations/google-sheets/callback";

// Scopes needed for Google Sheets
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
];

/**
 * Create an OAuth2 client
 */
export function createOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthUrl(state: string): string {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state,
    prompt: "consent", // Force consent to always get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expiry_date: number;
}> {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date || Date.now() + 3600000,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expiry_date: number;
}> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return {
    access_token: credentials.access_token!,
    expiry_date: credentials.expiry_date || Date.now() + 3600000,
  };
}

/**
 * Create authenticated Sheets client
 */
export function getSheetsClient(accessToken: string): sheets_v4.Sheets {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.sheets({ version: "v4", auth: oauth2Client });
}

/**
 * Create authenticated Drive client (for listing spreadsheets)
 */
export function getDriveClient(accessToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth: oauth2Client });
}

export interface SpreadsheetInfo {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
}

export interface SheetInfo {
  sheetId: number;
  title: string;
  rowCount: number;
  columnCount: number;
}

export interface SheetData {
  headers: string[];
  rows: any[][];
  rowCount: number;
}

/**
 * List user's spreadsheets
 */
export async function listSpreadsheets(accessToken: string): Promise<SpreadsheetInfo[]> {
  const drive = getDriveClient(accessToken);

  const response = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
    fields: "files(id, name, webViewLink, modifiedTime)",
    orderBy: "modifiedTime desc",
    pageSize: 50,
  });

  return (response.data.files || []).map((file) => ({
    id: file.id!,
    name: file.name!,
    webViewLink: file.webViewLink || undefined,
    modifiedTime: file.modifiedTime || undefined,
  }));
}

/**
 * Get spreadsheet metadata (list of sheets)
 */
export async function getSpreadsheetInfo(
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; sheets: SheetInfo[] }> {
  const sheets = getSheetsClient(accessToken);

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "properties.title,sheets.properties",
  });

  return {
    title: response.data.properties?.title || "Untitled",
    sheets: (response.data.sheets || []).map((sheet) => ({
      sheetId: sheet.properties?.sheetId || 0,
      title: sheet.properties?.title || "Sheet",
      rowCount: sheet.properties?.gridProperties?.rowCount || 0,
      columnCount: sheet.properties?.gridProperties?.columnCount || 0,
    })),
  };
}

/**
 * Read sheet data
 */
export async function readSheetData(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  range?: string
): Promise<SheetData> {
  const sheets = getSheetsClient(accessToken);
  const fullRange = range || `${sheetName}`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: fullRange,
    valueRenderOption: "FORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });

  const values = response.data.values || [];
  const headers = values.length > 0 ? values[0].map(String) : [];
  const rows = values.slice(1);

  return {
    headers,
    rows,
    rowCount: rows.length,
  };
}

/**
 * Write data to a sheet
 */
export async function writeSheetData(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<{ updatedRows: number; updatedColumns: number }> {
  const sheets = getSheetsClient(accessToken);

  const response = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });

  return {
    updatedRows: response.data.updatedRows || 0,
    updatedColumns: response.data.updatedColumns || 0,
  };
}

/**
 * Append data to a sheet
 */
export async function appendSheetData(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<{ updatedRows: number }> {
  const sheets = getSheetsClient(accessToken);

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });

  return {
    updatedRows: response.data.updates?.updatedRows || 0,
  };
}

/**
 * Create a new spreadsheet
 */
export async function createSpreadsheet(
  accessToken: string,
  title: string,
  sheetNames?: string[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const sheets = getSheetsClient(accessToken);

  const requestBody: sheets_v4.Schema$Spreadsheet = {
    properties: { title },
    sheets: sheetNames?.map((name) => ({
      properties: { title: name },
    })) || [{ properties: { title: "Sheet1" } }],
  };

  const response = await sheets.spreadsheets.create({
    requestBody,
  });

  return {
    spreadsheetId: response.data.spreadsheetId!,
    spreadsheetUrl: response.data.spreadsheetUrl!,
  };
}

/**
 * Export data to a new Google Sheet
 */
export async function exportToSheet(
  accessToken: string,
  title: string,
  headers: string[],
  rows: any[][]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // Create the spreadsheet
  const { spreadsheetId, spreadsheetUrl } = await createSpreadsheet(
    accessToken,
    title
  );

  // Write data with headers
  const values = [headers, ...rows];
  await writeSheetData(accessToken, spreadsheetId, "Sheet1!A1", values);

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Transform sheet data to records
 */
export function sheetDataToRecords(
  data: SheetData,
  columnMapping?: Record<string, string>
): Record<string, any>[] {
  const { headers, rows } = data;

  return rows.map((row) => {
    const record: Record<string, any> = {};
    headers.forEach((header, index) => {
      const key = columnMapping?.[header] || header;
      record[key] = row[index] ?? null;
    });
    return record;
  });
}

/**
 * Transform records to sheet values
 */
export function recordsToSheetValues(
  records: Record<string, any>[],
  columns: string[]
): { headers: string[]; values: any[][] } {
  const headers = columns;
  const values = records.map((record) =>
    columns.map((col) => {
      const value = record[col];
      if (value === null || value === undefined) return "";
      if (typeof value === "object") return JSON.stringify(value);
      return value;
    })
  );

  return { headers, values };
}
