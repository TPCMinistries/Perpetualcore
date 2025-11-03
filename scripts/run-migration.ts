/**
 * Migration Runner Script
 *
 * This script adds onboarding fields to the profiles table.
 *
 * To run this migration, you have two options:
 *
 * 1. Using Supabase Studio (Recommended):
 *    - Go to your Supabase project dashboard
 *    - Navigate to SQL Editor
 *    - Run the contents of supabase/migrations/002_add_onboarding.sql
 *
 * 2. Using the PostgreSQL connection string:
 *    - Get your connection string from Supabase project settings
 *    - Run: psql "your-connection-string" -f supabase/migrations/002_add_onboarding.sql
 */

console.log(`
==================================================
ONBOARDING MIGRATION REQUIRED
==================================================

To add onboarding functionality, please run this migration:

File: supabase/migrations/002_add_onboarding.sql

Migration SQL:
----------------------------------------------
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);
----------------------------------------------

How to run:
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the above SQL
4. Click "Run"

Or use psql with your database connection string.
==================================================
`);

process.exit(0);
