# 🔧 Tag Functionality Fix - RLS Policy Migration

## Problem

The tag functionality (adding, removing, creating tags) is not working because the Row Level Security (RLS) policies are referencing the wrong table name.

**Root Cause**: The RLS policies for `tags` and `document_tags` tables reference `user_profiles`, but the actual table name is `profiles`.

## Solution

Run the migration: `FIX_TAGS_RLS_POLICIES.sql`

## How to Apply This Fix

### Method 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://app.supabase.com
2. Select your project: `hgxxxmtfmvguotkowxbu`
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `FIX_TAGS_RLS_POLICIES.sql`
6. Click **Run** (or press Cmd+Enter / Ctrl+Enter)
7. Wait for "Success" message

### Method 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
cd ~/ai-brain/ai-os-platform
supabase link --project-ref hgxxxmtfmvguotkowxbu
supabase db push
```

### Method 3: PostgreSQL Client

If you have `psql` installed and have the database connection string:

```bash
psql "your-connection-string" -f supabase/migrations/FIX_TAGS_RLS_POLICIES.sql
```

## What This Migration Does

1. **Drops old policies** that reference `user_profiles`:
   - `Users can view tags in their organization`
   - `Users can create tags in their organization`
   - `Users can delete tags in their organization`
   - `Users can view document tags in their organization`
   - `Users can manage document tags`

2. **Creates new policies** that correctly reference `profiles`:
   - All policies updated to use `SELECT organization_id FROM profiles WHERE id = auth.uid()`

## Verification

After applying the migration, test the tag functionality:

1. Go to Documents page
2. Expand any document row
3. Click "Add Tag" button
4. Popover should open with tag list
5. Try adding a tag - should see success toast
6. Try creating a new tag - should work without errors
7. Try removing a tag - should work without errors

## Technical Details

**Tables affected:**
- `tags` - stores tag definitions
- `document_tags` - junction table linking documents to tags

**RLS Policies:**
- SELECT policies: Allow viewing tags/associations in user's organization
- INSERT policies: Allow creating tags/associations in user's organization
- DELETE policies: Allow removing tags/associations in user's organization

**Security**:
- All policies check `organization_id` matches the authenticated user's organization
- Uses `auth.uid()` to get current user ID
- Queries `profiles` table to get user's `organization_id`
