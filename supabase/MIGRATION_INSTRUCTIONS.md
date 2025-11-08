# Running Database Migrations

## Option 1: Using the Migration Script (Local psql)

```bash
# Make sure you have psql installed
# Add your DATABASE_URL to .env.local
# DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# Run the migration
./scripts/run-migration.sh supabase/migrations/20251108_create_document_many_to_many_relationships.sql
```

## Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `supabase/migrations/20251108_create_document_many_to_many_relationships.sql`
5. Click "Run" to execute the migration

## Option 3: Using Supabase CLI

```bash
# Link your project (if not already linked)
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

## What This Migration Does

This migration enables many-to-many relationships for documents:

1. **Creates Junction Tables**:
   - `document_projects` - Documents can belong to multiple projects
   - `document_folders` - Documents can be in multiple folders
   - `document_knowledge_spaces` - Documents can be in multiple knowledge spaces

2. **Migrates Existing Data**:
   - Automatically migrates existing single relationships to junction tables
   - Preserves all existing folder/project/space assignments

3. **Adds Helper Functions**:
   - `add_document_to_projects()` - Add document to multiple projects at once
   - `add_document_to_folders()` - Add document to multiple folders at once
   - `add_document_to_spaces()` - Add document to multiple spaces at once

4. **Contextual Intelligence**:
   - `find_related_documents_by_context()` - Find documents that share projects/folders/tags
   - `get_document_overlap_stats()` - Get analytics on document overlap

5. **Row Level Security (RLS)**:
   - Proper RLS policies for all junction tables
   - Users can only see/modify links for documents in their organization

## Verification

After running the migration, verify it worked:

```sql
-- Check junction tables were created
SELECT COUNT(*) FROM document_projects;
SELECT COUNT(*) FROM document_folders;
SELECT COUNT(*) FROM document_knowledge_spaces;

-- Test the overlap detection function (replace with actual doc ID)
SELECT * FROM find_related_documents_by_context('your-document-id-here');

-- Get overlap statistics (replace with actual org ID)
SELECT * FROM get_document_overlap_stats('your-org-id-here');
```

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Drop junction tables
DROP TABLE IF EXISTS document_projects CASCADE;
DROP TABLE IF EXISTS document_folders CASCADE;
DROP TABLE IF EXISTS document_knowledge_spaces CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS add_document_to_projects;
DROP FUNCTION IF EXISTS add_document_to_folders;
DROP FUNCTION IF EXISTS add_document_to_spaces;
DROP FUNCTION IF EXISTS find_related_documents_by_context;
DROP FUNCTION IF EXISTS get_document_overlap_stats;
DROP FUNCTION IF EXISTS update_project_document_count;
DROP FUNCTION IF EXISTS update_space_document_count;
```

## Notes

- This migration is **safe to run multiple times** (uses `IF NOT EXISTS` and `ON CONFLICT DO NOTHING`)
- Existing single relationships (folder_id, project_id, knowledge_space_id columns) are preserved for backwards compatibility
- The migration automatically migrates existing relationships to the new junction tables
