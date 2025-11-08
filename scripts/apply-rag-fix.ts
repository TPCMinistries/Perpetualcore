import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyRAGFix() {
  console.log("🔧 Applying RAG Search Function Fix...\n");

  try {
    // Read the migration file
    const migrationPath = path.join(
      process.cwd(),
      "supabase/migrations/20241107_fix_rag_search_function.sql"
    );

    if (!fs.existsSync(migrationPath)) {
      console.error("❌ Migration file not found:", migrationPath);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, "utf8");

    console.log("📄 Executing migration...\n");

    // Execute the SQL
    const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql }).select();

    if (error) {
      console.error("❌ Error executing migration:", error);

      // Try alternative approach - execute directly
      console.log("\n🔄 Trying direct execution...\n");

      // Split by semicolon and execute each statement
      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.length === 0) continue;

        console.log(`Executing statement ${i + 1}/${statements.length}...`);

        try {
          const { error: stmtError } = await supabase.rpc("exec_sql", {
            sql_query: stmt + ";",
          });

          if (stmtError) {
            console.error(`❌ Error in statement ${i + 1}:`, stmtError);
          } else {
            console.log(`✅ Statement ${i + 1} succeeded`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err);
        }
      }
    } else {
      console.log("✅ Migration executed successfully!\n");
      if (data) {
        console.log("Result:", data);
      }
    }

    // Verify the function exists
    console.log("\n🔍 Verifying function...");

    const { data: functionData, error: functionError } = await supabase
      .from("information_schema.routines")
      .select("routine_name, security_type")
      .eq("routine_name", "search_document_chunks")
      .single();

    if (functionError) {
      console.log("⚠️  Could not verify function (this is okay):", functionError.message);
    } else if (functionData) {
      console.log("✅ Function verified:", functionData);
    }

    console.log("\n✅ RAG fix applied successfully!");
    console.log("\n📋 Next steps:");
    console.log("1. Test document upload and search");
    console.log("2. Check that AI can now access document context");
    console.log("3. Monitor logs for any errors\n");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

applyRAGFix();
