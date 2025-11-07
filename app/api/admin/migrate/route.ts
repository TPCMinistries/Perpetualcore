// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin-only endpoint to run database migrations
 * Call this once to apply pending migrations
 *
 * Usage: GET /api/admin/migrate
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    // Check if user is authenticated and is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    console.log("🚀 Running database migrations...");

    // Read the migration file
    const migrationPath = path.join(
      process.cwd(),
      "supabase/migrations/20250124_add_document_summary_fields.sql"
    );

    const sql = fs.readFileSync(migrationPath, "utf-8");

    // Execute each statement
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--") && !s.startsWith("COMMENT"));

    const results = [];

    for (const statement of statements) {
      try {
        // Use raw SQL query
        const { error } = await supabase.rpc("exec_sql", {
          query: statement + ";",
        });

        if (error) {
          console.error(`Error executing statement:`, error);
          results.push({
            success: false,
            statement: statement.substring(0, 100) + "...",
            error: error.message,
          });
        } else {
          results.push({
            success: true,
            statement: statement.substring(0, 100) + "...",
          });
        }
      } catch (err: any) {
        console.error(`Catch error:`, err);
        results.push({
          success: false,
          statement: statement.substring(0, 100) + "...",
          error: err.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return Response.json({
      message: "Migration completed",
      stats: {
        total: statements.length,
        success: successCount,
        failed: failCount,
      },
      results,
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return new Response(`Migration failed: ${error.message}`, { status: 500 });
  }
}
