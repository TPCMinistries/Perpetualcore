// Script to sync folders from 'folders' table to 'document_folders' table
// This fixes the foreign key constraint issue

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncFolders() {
  console.log('🔄 Starting folder sync...');

  // Get all folders from the 'folders' table
  const { data: folders, error: foldersError } = await supabase
    .from('folders')
    .select('id, organization_id, name');

  if (foldersError) {
    console.error('❌ Error fetching folders:', foldersError);
    return;
  }

  console.log(`📁 Found ${folders?.length || 0} folders to sync`);

  if (!folders || folders.length === 0) {
    console.log('✅ No folders to sync');
    return;
  }

  // Get existing entries in document_folders
  const { data: existingDocFolders } = await supabase
    .from('document_folders')
    .select('id');

  const existingIds = new Set(existingDocFolders?.map(f => f.id) || []);

  // Insert folders into document_folders that don't already exist
  const foldersToInsert = folders.filter(f => !existingIds.has(f.id));

  console.log(`➕ Inserting ${foldersToInsert.length} new folders into document_folders`);

  if (foldersToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('document_folders')
      .insert(
        foldersToInsert.map(f => ({
          id: f.id,
          organization_id: f.organization_id,
          name: f.name,
        }))
      );

    if (insertError) {
      console.error('❌ Error inserting folders:', insertError);
      return;
    }
  }

  console.log('✅ Folder sync complete!');
}

syncFolders().catch(console.error);
