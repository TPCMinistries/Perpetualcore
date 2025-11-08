#!/usr/bin/env tsx
/**
 * Apply onboarding migration to production database
 * Run with: npx tsx scripts/apply-onboarding-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

async function applyMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables:');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'MISSING');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'set' : 'MISSING');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Applying onboarding migration...');

  // Read the migration file
  const migrationPath = join(
    process.cwd(),
    'supabase',
    'migrations',
    '002_add_onboarding.sql'
  );
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  try {
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Try direct execution if exec_sql doesn't exist
      const statements = migrationSQL
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);

      for (const statement of statements) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        const { error: execError } = await supabase.rpc('exec', {
          query: statement,
        });

        if (execError) {
          // If this fails too, we need to apply manually via Supabase dashboard
          console.error('Error executing statement:', execError);
          console.log('\n⚠️  Could not apply migration automatically.');
          console.log('\nPlease apply this migration manually via Supabase SQL Editor:');
          console.log('1. Go to your Supabase project dashboard');
          console.log('2. Navigate to SQL Editor');
          console.log('3. Run the following SQL:\n');
          console.log(migrationSQL);
          process.exit(1);
        }
      }
    }

    console.log('✅ Migration applied successfully!');

    // Verify the columns exist
    const { data, error: verifyError } = await supabase
      .from('profiles')
      .select('onboarding_completed, onboarding_step, onboarding_skipped')
      .limit(1);

    if (verifyError) {
      console.log('\n⚠️  Columns might not be added yet. Please verify in Supabase dashboard.');
    } else {
      console.log('✅ Verified: Onboarding columns exist in profiles table');
    }
  } catch (error) {
    console.error('Error applying migration:', error);
    console.log('\n⚠️  Could not apply migration automatically.');
    console.log('\nPlease apply this migration manually via Supabase SQL Editor:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the following SQL:\n');
    console.log(migrationSQL);
    process.exit(1);
  }
}

applyMigration();
