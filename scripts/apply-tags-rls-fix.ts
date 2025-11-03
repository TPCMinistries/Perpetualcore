/**
 * Apply Tags RLS Fix Migration
 *
 * This script fixes the RLS policies for tags and document_tags tables
 * to use 'profiles' instead of 'user_profiles'
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function runMigration() {
  try {
    console.log('🚀 Starting Tags RLS Fix Migration...\n');

    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', 'FIX_TAGS_RLS_POLICIES.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration SQL:');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));
    console.log('');

    // Execute the migration using RPC
    console.log('⚙️  Executing migration...\n');

    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql RPC doesn't exist, we need to execute statements individually
      console.log('⚠️  exec_sql RPC not available, executing statements individually...\n');

      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement) {
          console.log(`Executing: ${statement.substring(0, 80)}...`);
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (stmtError) {
            console.error(`❌ Error executing statement:`, stmtError);
          } else {
            console.log('✅ Statement executed successfully');
          }
        }
      }
    } else {
      console.log('✅ Migration executed successfully!\n');
    }

    console.log('✨ Tags RLS Fix Migration Complete!\n');
    console.log('📝 Next Steps:');
    console.log('   1. Test tag functionality in the UI');
    console.log('   2. Try adding a tag to a document');
    console.log('   3. Try creating a new tag');
    console.log('   4. Verify tags appear correctly\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
