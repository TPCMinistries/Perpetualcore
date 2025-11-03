// Script to sync tags from 'tags' table to 'document_tags_master' table
// This fixes the foreign key constraint issue

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncTags() {
  console.log('🔄 Starting tag sync...');

  // Get all tags from the 'tags' table
  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('id, organization_id, name');

  if (tagsError) {
    console.error('❌ Error fetching tags:', tagsError);
    return;
  }

  console.log(`🏷️  Found ${tags?.length || 0} tags to sync`);

  if (!tags || tags.length === 0) {
    console.log('✅ No tags to sync');
    return;
  }

  // Get existing entries in document_tags_master
  const { data: existingDocTags } = await supabase
    .from('document_tags_master')
    .select('id');

  const existingIds = new Set(existingDocTags?.map(t => t.id) || []);

  // Insert tags into document_tags_master that don't already exist
  const tagsToInsert = tags.filter(t => !existingIds.has(t.id));

  console.log(`➕ Inserting ${tagsToInsert.length} new tags into document_tags_master`);

  if (tagsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('document_tags_master')
      .insert(
        tagsToInsert.map(t => ({
          id: t.id,
          organization_id: t.organization_id,
          name: t.name,
        }))
      );

    if (insertError) {
      console.error('❌ Error inserting tags:', insertError);
      return;
    }
  }

  console.log('✅ Tag sync complete!');
}

syncTags().catch(console.error);
