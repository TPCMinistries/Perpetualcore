import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = createAdminClient();

    // Add the onboarding columns to the profiles table
    const migrationSQL = `
      -- Add onboarding fields to profiles table
      ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE;

      -- Add index for better query performance
      CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);
    `;

    // Execute the migration using raw SQL
    const { error } = await supabase.rpc('exec', { sql: migrationSQL });

    if (error) {
      console.error("Migration error:", error);

      // Return detailed instructions for manual migration
      return NextResponse.json(
        {
          error: "Could not apply migration automatically",
          message:
            "Please apply this migration manually via Supabase SQL Editor",
          instructions: [
            "1. Go to https://hgxxxmtfmvguotkowxbu.supabase.co",
            "2. Navigate to SQL Editor",
            "3. Run the SQL from supabase/migrations/002_add_onboarding.sql",
          ],
          sql: migrationSQL,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding migration applied successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Please apply migration manually via Supabase SQL Editor",
      },
      { status: 500 }
    );
  }
}
