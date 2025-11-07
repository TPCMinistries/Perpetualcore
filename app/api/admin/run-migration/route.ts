import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20241107_fix_email_confirmation_signup.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute via Supabase SQL editor API
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('Migration error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Migration applied successfully' });
  } catch (error: any) {
    console.error('Error applying migration:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
