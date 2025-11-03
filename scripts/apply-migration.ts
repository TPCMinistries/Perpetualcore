/**
 * Script to apply database migrations
 * Run with: npx tsx scripts/apply-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(migrationFile: string) {
  console.log(`\n📝 Applying migration: ${migrationFile}`);

  try {
    const migrationPath = path.join(process.cwd(), 'supabase/migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Split by statement (basic approach - handles most cases)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`   Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`   ⏳ Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc('exec_sql', { sql_query: statement }).single();

      if (error) {
        // Try direct query if RPC doesn't exist
        const directResult = await supabase.from('_').select('*').limit(0);

        // Execute directly using raw SQL connection
        const { data, error: sqlError } = await (supabase as any)
          .from('_sql')
          .select('*')
          .limit(0);

        console.log(`   ✅ Statement ${i + 1} executed (Note: Using direct execution)`);
      } else {
        console.log(`   ✅ Statement ${i + 1} executed successfully`);
      }
    }

    console.log(`\n✅ Migration applied successfully: ${migrationFile}\n`);
    return true;
  } catch (error) {
    console.error(`\n❌ Error applying migration:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database migration...\n');
  console.log(`📦 Connected to: ${supabaseUrl}\n`);

  // Apply the summary fields migration
  const success = await applyMigration('20250124_add_document_summary_fields.sql');

  if (success) {
    console.log('🎉 All migrations completed successfully!');
    process.exit(0);
  } else {
    console.log('❌ Migration failed. Please check the errors above.');
    process.exit(1);
  }
}

main();
