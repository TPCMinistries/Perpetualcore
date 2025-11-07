#!/usr/bin/env node
/**
 * Deploy RAG Search Fix to Supabase
 * This script deploys the simplified search function directly
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deploySQLFile(filename, description) {
  console.log(`\n📄 ${description}...`);

  const sqlPath = path.join(__dirname, '..', 'supabase', filename);
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Remove RAISE NOTICE statements as they don't work via RPC
  const cleanSql = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('RAISE NOTICE'))
    .join('\n');

  console.log(`   Reading: ${filename}`);
  console.log(`   Size: ${cleanSql.length} characters`);

  try {
    // Execute via RPC doesn't work for DDL, so we'll use the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: cleanSql })
    });

    // If that doesn't work, try using a different approach
    console.log('   Attempting to execute SQL...');

    // For DDL statements, we need to use Supabase's query method
    const { data, error } = await supabase.rpc('exec', { sql: cleanSql }).catch(() => ({
      error: 'RPC method not available - please run SQL manually in Supabase dashboard'
    }));

    if (error) {
      console.log('   ⚠️  Cannot execute DDL via API');
      console.log('   📋 Please copy and paste the SQL from:');
      console.log(`   ${sqlPath}`);
      console.log('   Into Supabase Dashboard → SQL Editor');
      return false;
    }

    console.log('   ✅ Deployed successfully');
    return true;
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    console.log('   📋 Please manually run this file in Supabase SQL Editor:');
    console.log(`   ${sqlPath}`);
    return false;
  }
}

async function testFunction() {
  console.log('\n🧪 Testing search function...');

  try {
    // Check if function exists
    const { data: functions, error: fnError } = await supabase
      .rpc('exec', {
        sql: "SELECT proname FROM pg_proc WHERE proname = 'search_document_chunks'"
      })
      .catch(() => ({ data: null, error: 'Cannot query functions' }));

    console.log('   Checking if function exists...');

    // Try to get a sample document chunk
    const { data: chunks, error: chunkError } = await supabase
      .from('document_chunks')
      .select('id, document_id')
      .not('embedding', 'is', null)
      .limit(1);

    if (chunkError) {
      console.log('   ⚠️  Cannot access document_chunks table:', chunkError.message);
      return;
    }

    if (!chunks || chunks.length === 0) {
      console.log('   ⚠️  No document chunks with embeddings found');
      console.log('   Upload a document first to test RAG');
      return;
    }

    console.log(`   ✅ Found ${chunks.length} chunk(s) with embeddings`);
    console.log('   Next: Test in chat interface');

  } catch (error) {
    console.error('   ❌ Error testing:', error.message);
  }
}

async function main() {
  console.log('🚀 RAG Search Fix Deployment');
  console.log('================================');
  console.log(`📡 Supabase URL: ${supabaseUrl}`);

  // Since we can't execute DDL via API, provide manual instructions
  console.log('\n⚠️  NOTE: Supabase requires DDL statements (CREATE FUNCTION, etc.)');
  console.log('to be run manually in the SQL Editor.');
  console.log('\n📋 Manual Deployment Steps:');
  console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to: SQL Editor');
  console.log('4. Open the file:');
  console.log('   supabase/FIX_RAG_SEARCH_SIMPLE.sql');
  console.log('5. Copy the entire contents');
  console.log('6. Paste into SQL Editor');
  console.log('7. Click "Run"');
  console.log('\n8. Then run the test file:');
  console.log('   supabase/TEST_RAG_SIMPLE.sql');
  console.log('\n✅ After running both files, the RAG search should work!');

  // Still check database state
  await testFunction();
}

main();
