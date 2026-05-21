/**
 * One-off migration applier for Phase 05-01 Task 1.
 *
 * Reads supabase/migrations/20260510_rfp_opportunities_extensions.sql,
 * applies it to LDC Brain AI (project hgxxxmtfmvguotkowxbu) via the
 * Supabase Management API /database/query endpoint, then runs a verification
 * SELECT against information_schema.columns to confirm all 6 new columns landed.
 *
 * NOT a long-lived script — this is the executor's stand-in for the supabase
 * MCP `apply_migration` tool when running in environments where the MCP isn't
 * directly accessible. The migration file itself is the source of truth and
 * is committed to git; this script just shuttles it across.
 *
 * Usage:
 *   tsx scripts/apply-rfp-opportunities-extensions.ts
 *
 * Requires SUPABASE_ACCESS_TOKEN in env (the personal access token from
 * https://supabase.com/dashboard/account/tokens — same value as the MCP
 * --access-token flag in ~/.claude/mcp.json).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: resolve(process.cwd(), ".env.local") });

const PROJECT_REF = "hgxxxmtfmvguotkowxbu";
const MIGRATION_PATH = "supabase/migrations/20260510_rfp_opportunities_extensions.sql";
const MGMT_BASE = "https://api.supabase.com";

interface QueryResponse<T = unknown> {
  // The Management API returns an array of rows for SELECT, or [] for DDL.
  result?: T[];
  // On error:
  message?: string;
  error?: string;
}

async function runQuery(sql: string, accessToken: string): Promise<unknown[]> {
  const res = await fetch(
    `${MGMT_BASE}/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (status ${res.status}): ${text.slice(0, 500)}`);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`);
  }
  // Management API returns the rows directly as an array.
  if (Array.isArray(json)) return json;
  const obj = json as QueryResponse;
  if (obj.result) return obj.result;
  return [];
}

async function main() {
  const token =
    process.env.SUPABASE_ACCESS_TOKEN ?? "";
  if (!token) {
    console.error("[apply] SUPABASE_ACCESS_TOKEN not set");
    process.exit(1);
  }

  const sql = readFileSync(resolve(process.cwd(), MIGRATION_PATH), "utf8");
  console.log(`[apply] Applying ${MIGRATION_PATH} to project ${PROJECT_REF}…`);
  await runQuery(sql, token);
  console.log("[apply] Migration applied (no error from DDL).");

  // Verify columns exist with correct types/defaults
  const verifySql = `
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'rfp_opportunities'
      AND column_name IN ('brief', 'keywords', 'geo', 'url', 'needs_review', 'last_seen_at')
    ORDER BY column_name;
  `;
  const rows = await runQuery(verifySql, token);
  console.log("[verify] Columns present:");
  console.table(rows);

  const expected = ["brief", "geo", "keywords", "last_seen_at", "needs_review", "url"];
  const got = (rows as Array<{ column_name: string }>)
    .map((r) => r.column_name)
    .sort();
  const missing = expected.filter((c) => !got.includes(c));
  if (missing.length > 0) {
    console.error("[verify] MISSING columns:", missing);
    process.exit(2);
  }
  console.log("[verify] All 6 new columns confirmed.");

  // Sample insert + cleanup, per plan task 1 verify step
  const insertSql = `
    INSERT INTO rfp_opportunities
      (source, source_id, title, brief, keywords, geo, url, needs_review)
    VALUES
      ('grants_gov', 'TEST-EXT-001', 'Test', 'A brief',
       ARRAY['workforce','youth']::text[], 'NY', 'https://example.gov/x', false)
    RETURNING id;
  `;
  const inserted = (await runQuery(insertSql, token)) as Array<{ id: string }>;
  if (inserted.length !== 1) {
    console.error("[verify] Insert returned unexpected row count:", inserted.length);
    process.exit(3);
  }
  const newId = inserted[0].id;
  console.log("[verify] Sample insert OK, id =", newId);

  await runQuery(`DELETE FROM rfp_opportunities WHERE id = '${newId}';`, token);
  console.log("[verify] Cleanup deletion OK.");

  console.log("[apply] DONE.");
}

main().catch((err) => {
  console.error("[apply] FAILED:", err);
  process.exit(1);
});
